// classes.component.ts - النسخة المُحدثة مع إصلاح التحديث الفوري
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, combineLatest, BehaviorSubject, Subscription, of } from 'rxjs';
import { map, startWith, switchMap, tap, catchError, finalize, shareReplay, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { animate, style, transition, trigger } from '@angular/animations';
import Swal from 'sweetalert2';

import { Class, ClassesService, PaginatedResponse, PaginationParams } from '../../core/services/classes';
import { Teacher, TeacherService } from '../../core/services/teacher';
import { BasePage } from '../../layout/base-page/base-page';

// Interfaces
interface Subject {
  id?: number;
  name: string;
  hoursPerWeek: number;
}

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule,
    MatBadgeModule,
    MatSidenavModule,
    MatToolbarModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    BasePage
  ],
  templateUrl: './classes.html',
  styleUrls: ['./classes.css'],
  providers: [ClassesService, TeacherService],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideInFromRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class Classes implements OnInit, OnDestroy {
  // Subscription management
  private subscriptions = new Subscription();
  
  // إضافة trigger للتحديث التلقائي
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  private paginationParams$ = new BehaviorSubject<PaginationParams>({ pageNumber: 1, pageSize: 10 });
  
  classes$!: Observable<Class[]>;
  paginatedResponse$!: Observable<PaginatedResponse<Class>>;
  teachers$!: Observable<Teacher[]>;
  filteredTeachers$!: Observable<Teacher[]>;
  
  displayedColumns: string[] = ['grade', 'section', 'subjects', 'teacherNames', 'totalHours', 'actions'];
  
  form: FormGroup;
  isLoading = false;
  isEditMode = false;
  editingClassId: number | null = null;
  isDrawerOpen = false;
  drawerMode: 'add' | 'edit' | 'details' = 'add';
  selectedClass: Class | null = null;
  
  // Error handling properties
  hasError = false;
  errorMessage = '';

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  hasNextPage = false;
  hasPreviousPage = false;

  grades = ['1', '2', '3'];
  sections = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
availableSubjects = [
  'Mathematics', 'Science', 'English', 'Arabic', 'Chemistry', 
  'Physics', 'Biology', 'History', 'Geography', 'Art', 'Music', 'German', 'French'
];

subjectTranslations: { [key: string]: string } = {
  "Mathematics": "رياضيات",
  "Science": "علوم",
  "English": "إنجليزي",
  "Arabic": "عربي",
  "Chemistry": "كيمياء",
  "Physics": "فيزياء",
  "Biology": "أحياء",
  "History": "تاريخ",
  "Geography": "جغرافيا",
  "Art": "فن",
  "Music": "موسيقى",
  "German": "ألماني",
  "French": "فرنسي"
};

// دالة تساعدك تجيب الترجمة
translateSubject(subject: string): string {
  return this.subjectTranslations[subject] || subject;
}
private subjectTranslationsReverse: { [key: string]: string } = {
  "رياضيات": "Mathematics",
  "علوم": "Science",
  "إنجليزي": "English",
  "عربي": "Arabic",
  "كيمياء": "Chemistry",
  "فيزياء": "Physics",
  "أحياء": "Biology",
  "تاريخ": "History",
  "جغرافيا": "Geography",
  "فن": "Art",
  "موسيقى": "Music",
  "ألماني": "German",
  "فرنسي": "French"
};

private translateSubjectToEnglish(arabic: string): string {
  return this.subjectTranslationsReverse[arabic] || arabic;
}

private mapSubjectsToArabic(subjects: { name: string; hoursPerWeek: number }[]): { name: string; hoursPerWeek: number }[] {
  return subjects.map(sub => ({
    name: this.translateSubject(sub.name), // ترجم الاسم
    hoursPerWeek: sub.hoursPerWeek // خلي عدد الساعات كما هو
  }));
}



  stats = {
    totalClasses: 0,
    totalSubjects: 0,
    averageHours: 0,
    totalTeachers: 0
  };

  constructor(
    private fb: FormBuilder,
    private classService: ClassesService,
    private teacherService: TeacherService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.form = this.initForm();
  }

  ngOnInit(): void {
    console.log('Classes component initialized');
    this.loadTeachers();
    this.setupPaginatedClasses();
    this.setupTeacherFilter();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.refreshTrigger$.complete();
    this.paginationParams$.complete();
  }

  // حل مشكلة Math.min في التمبليت
  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  // دالة التحديث اليدوي للصفحة الحالية
  refreshCurrentPage(): void {
    console.log('🔄 تحديث الصفحة الحالية يدوياً...');
    this.triggerRefresh();
  }

  // إضافة دالة للتحديث التلقائي
  private triggerRefresh(): void {
    console.log('🔄 تشغيل التحديث التلقائي...');
    this.refreshTrigger$.next();
  }

private setupPaginatedClasses(): void {
  console.log('⚙️ إعداد الفصول مع التحديث التلقائي...');

  this.paginatedResponse$ = combineLatest([
    this.refreshTrigger$.pipe(startWith(null)), 
this.paginationParams$.pipe(startWith(this.paginationParams$.value))
  ]).pipe(
    debounceTime(100), 
    tap(([_, params]) => {
      console.log('🚀 بدء تحميل الفصول:', params);
      this.isLoading = true;
      this.hasError = false;
      this.errorMessage = '';
    }),
    switchMap(([_, params]) => {
      console.log('📤 إرسال طلب الفصول:', params);
      return this.classService.getClasses(params).pipe(
        tap(res => console.log('📥 استلام الاستجابة:', res)),
        catchError(error => {
          console.error('❌ خطأ في تحميل الفصول:', error);
          this.hasError = true;
          this.errorMessage = error.message || 'فشل في تحميل البيانات';
          return of({
            items: [],
            totalCount: 0,
            pageNumber: params?.pageNumber || 1,
            pageSize: params?.pageSize || 10,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          } as PaginatedResponse<Class>);
        }),
        finalize(() => {
          console.log('🏁 انتهاء التحميل');
          this.isLoading = false;
        })
      );
    }),
    shareReplay(1)
  );

  this.classes$ = this.paginatedResponse$.pipe(
    tap(r => console.log('🔎 معالجة استجابة الفصول:', r)),
    map(response => {
      console.log('📝 استخراج عناصر الفصول:', response.items);
      return response.items || [];
    })
  );

  const paginationSub = this.paginatedResponse$.subscribe({
    next: (response) => {
      console.log('✅ تحديث معلومات الصفحة:', response);
      this.updatePaginationInfo(response);
      this.updateStats(response.items || []);
      this.hasError = false;
    },
    error: (error) => {
      console.error('❌ خطأ في الاشتراك:', error);
      this.hasError = true;
      this.errorMessage = 'فشل في تحميل الفصول';
      this.isLoading = false;
    }
  });

  this.subscriptions.add(paginationSub);
}


  private updatePaginationInfo(response: PaginatedResponse<Class>): void {
    this.currentPage = response.pageNumber;
    this.pageSize = response.pageSize;
    this.totalCount = response.totalCount;
    this.totalPages = response.totalPages;
    this.hasNextPage = response.hasNextPage;
    this.hasPreviousPage = response.hasPreviousPage;
  }

  onPageChange(event: PageEvent): void {
    const pageNumber = event.pageIndex + 1;
    const pageSize = event.pageSize;
    
    console.log('تغيير الصفحة إلى:', pageNumber, 'بحجم:', pageSize);
    
    this.paginationParams$.next({
      pageNumber: pageNumber,
      pageSize: pageSize
    });
  }

  private initForm(): FormGroup {
    return this.fb.group({
      grade: ['', Validators.required],
      section: ['', Validators.required],
      teacherNames: [''],
      subjects: this.fb.array([])
    });
  }

  getSubjectControl(index: number, field: string) {
    return this.subjects.at(index).get(field);
  }

  private loadTeachers(): void {
    console.log('تحميل المعلمين...');
    this.teachers$ = this.teacherService.getTeachers().pipe(
      map(result => {
        console.log('تم تحميل المعلمين:', result);
        return result.items || [];
      }),
      catchError(error => {
        console.error('خطأ في تحميل المعلمين:', error);
        this.showErrorAlert('فشل في تحميل قائمة المعلمين');
        return of([]);
      })
    );

    const teachersSub = this.teachers$.subscribe({
      next: (teachers) => {
        console.log('معالجة المعلمين:', teachers);
        this.stats.totalTeachers = teachers.length;
      },
      error: (error) => {
        console.error('خطأ في اشتراك المعلمين:', error);
        this.stats.totalTeachers = 0;
      }
    });

    this.subscriptions.add(teachersSub);
  }

  private setupTeacherFilter(): void {
    const teacherControl = this.form.get('teacherNames');
    if (teacherControl) {
      this.filteredTeachers$ = combineLatest([
        this.teachers$,
        teacherControl.valueChanges.pipe(startWith(''))
      ]).pipe(
        map(([teachers, filterValue]) => {
          const filterStr = typeof filterValue === 'string' ? filterValue.toLowerCase() : '';
          return (teachers || []).filter(teacher => 
            teacher.name.toLowerCase().includes(filterStr)
          );
        }),
        catchError(error => {
          console.error('خطأ في فلتر المعلمين:', error);
          return of([]);
        })
      );
    }
  }

  private updateStats(classes: Class[]): void {
    console.log('تحديث الإحصائيات للفصول:', classes);

    this.stats.totalClasses = this.totalCount;

    if (classes && classes.length > 0) {
      const allSubjects = new Set<string>();
      let totalHours = 0;

      classes.forEach(cls => {
        if (cls.subjects) {
          cls.subjects.forEach(subject => allSubjects.add(subject.name));
          totalHours += cls.totalHours || 0;
        }
      });

      this.stats.totalSubjects = allSubjects.size;
      this.stats.averageHours = classes.length > 0 ? Math.round(totalHours / classes.length) : 0;
    } else {
      this.stats.totalSubjects = 0;
      this.stats.averageHours = 0;
    }

    console.log('الإحصائيات المحدثة:', this.stats);
  }

  get subjects(): FormArray {
    return this.form.get('subjects') as FormArray;
  }

  addSubject(): void {
    console.log('إضافة مادة...');
    console.log('عدد المواد الحالي:', this.subjects.length);
    
    const subjectGroup = this.fb.group({
      name: ['', Validators.required],
      hoursPerWeek: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
    
    this.subjects.push(subjectGroup);
    console.log('تم إضافة المادة. العدد الجديد:', this.subjects.length);
    console.log('صحة النموذج:', this.form.valid);
  }

  removeSubject(index: number): void {
    if (this.subjects.length > 1) {
      this.subjects.removeAt(index);
    }
  }

  openAddClassDrawer(): void {
    console.log('فتح درج إضافة فصل');
    this.drawerMode = 'add';
    this.resetForm();
    
    setTimeout(() => {
      if (this.subjects.length === 0) {
        console.log('إضافة مادة أولية');
        this.addSubject();
      }
    }, 0);
    
    this.isDrawerOpen = true;
  }

  openEditClassDrawer(schoolClass: Class): void {
    this.drawerMode = 'edit';
    this.editClass(schoolClass);
    this.isDrawerOpen = true;
  }

  openDetailsDrawer(schoolClass: Class): void {
    this.drawerMode = 'details';
    this.selectedClass = schoolClass;
    this.isDrawerOpen = true;
  }

  switchToEditMode(): void {
    if (this.selectedClass) {
      this.drawerMode = 'edit';
      this.editClass(this.selectedClass);
    }
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedClass = null;
    this.resetForm();
  }

  private editClass(schoolClass: Class): void {
    this.isEditMode = true;
    this.editingClassId = schoolClass.id || null;
    
    this.form.patchValue({
      grade: schoolClass.grade,
      section: schoolClass.section,
      teacherNames: schoolClass.teacherNames || ''
    });
    
    while (this.subjects.length) {
      this.subjects.removeAt(0);
    }
    
if (schoolClass.subjects) {
  schoolClass.subjects.forEach(subject => {
    const subjectGroup = this.fb.group({
      name: [this.translateSubjectToEnglish(subject.name), Validators.required],
      hoursPerWeek: [subject.hoursPerWeek, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
    this.subjects.push(subjectGroup);
  });
}

  }

  onSubmit(): void {
    console.log('إرسال النموذج');
    console.log('صحة النموذج:', this.form.valid);
    console.log('عدد المواد:', this.subjects.length);
    console.log('قيمة النموذج:', this.form.value);
    console.log('قيمة المواد:', this.subjects.value);
    
    if (this.form.valid && this.subjects.length > 0) {
      if (!this.isEditMode && this.isDuplicateClass()) {
        this.showErrorAlert('فصل بنفس الدرجة والقسم موجود بالفعل');
        return;
      }

      console.log('المتابعة مع الإرسال...');
      this.isLoading = true;
      
      const subjectsValue = this.subjects.value as Subject[];
      const totalHours = subjectsValue.reduce((sum, subject) => sum + subject.hoursPerWeek, 0);
      
      const classData: Class = {
        grade: this.form.value.grade,
        section: this.form.value.section,
        subjects: subjectsValue,
        teacherNames: this.form.value.teacherNames || undefined,
        totalHours
      };

      console.log('بيانات الفصل للإرسال:', classData);

      if (this.isEditMode && this.editingClassId !== null) {
        this.updateClass(classData);
      } else {
        this.addClass(classData);
      }
    } else {
      console.log('فشل التحقق من النموذج');
      console.log('أخطاء النموذج:', this.form.errors);
      
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control && control.errors) {
          console.log(`أخطاء الحقل ${key}:`, control.errors);
        }
      });

      this.subjects.controls.forEach((control, index) => {
        console.log(`أخطاء المادة ${index}:`, control.errors);
        Object.keys(control.value).forEach(subKey => {
          const subControl = control.get(subKey);
          if (subControl && subControl.errors) {
            console.log(`أخطاء المادة ${index} حقل ${subKey}:`, subControl.errors);
          }
        });
      });

      this.markFormGroupTouched();
      
      if (this.subjects.length === 0) {
        this.showErrorAlert('يرجى إضافة مادة واحدة على الأقل');
      } else {
        this.showErrorAlert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      }
    }
  }

  private isDuplicateClass(): boolean {
    const grade = this.form.value.grade;
    const section = this.form.value.section;
    
    let isDuplicate = false;
    const classesSubscription = this.classes$.subscribe(classes => {
      isDuplicate = classes.some(cls => 
        cls.grade === grade && 
        cls.section === section && 
        cls.id !== this.editingClassId
      );
    });
    
    this.subscriptions.add(classesSubscription);
    return isDuplicate;
  }

private addClass(schoolClass: Class): void {
  const arabicClass: Class = {
    ...schoolClass,
    subjects: this.mapSubjectsToArabic(schoolClass.subjects)
  };

  const addSubscription = this.classService.addClass(arabicClass).subscribe({
    next: (response) => {
      console.log('تم إضافة الفصل بالعربي:', response);
      this.showSuccessAlert('تم إضافة الفصل بنجاح!');
      this.closeDrawer();
      this.triggerRefresh(); 
      this.isLoading = false;
    },
    error: (error) => {
      console.error('فشل إضافة الفصل:', error);
      this.isLoading = false;

      if (error.status === 400 && error.error?.message?.includes('already exists')) {
        this.showErrorAlert(`الفصل ${schoolClass.grade}/${schoolClass.section} موجود بالفعل!`);
      } else {
        this.showErrorAlert('فشل في إضافة الفصل');
      }
    }
  });

  this.subscriptions.add(addSubscription);
}

// تحديث فصل
private updateClass(schoolClass: Class): void {
  const arabicClass: Class = {
    ...schoolClass,
    subjects: this.mapSubjectsToArabic(schoolClass.subjects)
  };

  const updateSubscription = this.classService.updateClass(this.editingClassId!, arabicClass).subscribe({
    next: (response) => {
      console.log('تم تحديث الفصل بالعربي:', response);
      this.showSuccessAlert('تم تحديث الفصل بنجاح!');
      this.closeDrawer();
      this.triggerRefresh(); 
      this.isLoading = false;
    },
    error: (error) => {
      console.error('فشل تحديث الفصل:', error);
      this.showErrorAlert('فشل في تحديث الفصل');
      this.isLoading = false;
    }
  });

  this.subscriptions.add(updateSubscription);
}

  deleteClass(id: number): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن هذا الإجراء!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف!',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSubscription = this.classService.deleteClass(id).subscribe({
          next: () => {
            console.log('تم حذف الفصل بنجاح');
            this.showSuccessAlert('تم حذف الفصل بنجاح!');
            this.triggerRefresh(); 
          },
          error: (error) => {
            console.error('فشل حذف الفصل:', error);
            let errorMessage = 'فشل في حذف الفصل';
            
            if (error.status === 404) {
              errorMessage = 'الفصل غير موجود أو تم حذفه مسبقاً';
            } else if (error.status === 400) {
              errorMessage = 'لا يمكن حذف الفصل لأنه مرتبط ببيانات أخرى';
            } else if (error.status === 500) {
              errorMessage = 'خطأ في الخادم أثناء حذف الفصل';
            }
            
            this.showErrorAlert(errorMessage);
          }
        });
        
        this.subscriptions.add(deleteSubscription);
      }
    });
  }

  resetForm(): void {
    console.log('إعادة تعيين النموذج');
    
    this.isEditMode = false;
    this.editingClassId = null;
    
    while (this.subjects.length) {
      this.subjects.removeAt(0);
    }
    
    this.form.reset();
    this.form = this.initForm();
    
    console.log('تم إعادة تعيين النموذج');
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
    
    this.subjects.controls.forEach(control => {
      Object.keys(control.value).forEach(subKey => {
        control.get(subKey)?.markAsTouched();
      });
    });
  }

  private showSuccessAlert(message: string): void {
    Swal.fire({
      title: 'نجح!',
      text: message,
      icon: 'success',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#4caf50',
      timer: 3000,
      timerProgressBar: true
    });
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      title: 'خطأ!',
      text: message,
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#f44336'
    });
  }

  private showLoadingAlert(): void {
    Swal.fire({
      title: 'يرجى الانتظار...',
      html: 'جاري المعالجة...',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  getFormError(fieldName: string, index?: number): string {
    let control;
    if (index !== undefined) {
      control = this.subjects.at(index).get(fieldName);
    } else {
      control = this.form.get(fieldName);
    }
    
    if (control?.errors && control?.touched) {
      if (control.errors['required']) return `${fieldName} مطلوب`;
      if (control.errors['min']) return `${fieldName} يجب أن يكون على الأقل ${control.errors['min'].min}`;
      if (control.errors['max']) return `${fieldName} لا يمكن أن يتجاوز ${control.errors['max'].max}`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string, index?: number): boolean {
    let control;
    if (index !== undefined) {
      control = this.subjects.at(index).get(fieldName);
    } else {
      control = this.form.get(fieldName);
    }
    return !!(control?.errors && control?.touched);
  }

  displayTeacherName(teacher: string): string {
    return teacher;
  }

  getTotalHours(): number {
    return this.subjects.value.reduce((sum: number, subject: Subject) => sum + (subject.hoursPerWeek || 0), 0);
  }

  navigateToTeacherForm(): void {
    this.router.navigate(['/teachers/add']);
  }

  getDisplayedSubjects(subjects: Subject[], maxCount: number = 2): Subject[] {
    return subjects.slice(0, maxCount);
  }

  getRemainingSubjectsCount(subjects: Subject[], maxCount: number = 2): number {
    return Math.max(0, subjects.length - maxCount);
  }
// إضافة هذه الفنكشنز للـ Classes Component

// إضافة هذه الفنكشنز للـ Classes Component

/**
 * عرض عدد معين من المعلمين
 */
getDisplayedTeachers(teachers: string[], maxCount: number = 2): string[] {
  if (!teachers || teachers.length === 0) return [];
  return teachers.slice(0, maxCount);
}

/**
 * حساب عدد المعلمين المتبقيين الغير معروضين
 */
getRemainingTeachersCount(teachers: string[], maxCount: number = 2): number {
  if (!teachers || teachers.length === 0) return 0;
  return Math.max(0, teachers.length - maxCount);
}

/**
 * فتح نافذة منبثقة لعرض جميع المعلمين
 */
openTeachersDialog(schoolClass: Class): void {
  if (!schoolClass.teacherNames || schoolClass.teacherNames.length === 0) {
    this.showInfoAlert('لا يوجد معلمين مخصصين لهذا الفصل');
    return;
  }

  // استخدام SweetAlert2 لعرض قائمة المعلمين بشكل جميل
  const teachersList = schoolClass.teacherNames
    .map((teacher, index) => `<div class="teacher-item">
      <i class="material-icons" style="vertical-align: middle; margin-left: 8px; color: #4caf50;">person</i>
      <span style="vertical-align: middle;">${teacher}</span>
    </div>`)
    .join('');

  Swal.fire({
    title: `<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
      <i class="material-icons" style="color: #2196f3;">group</i>
      معلمين الصف ${schoolClass.grade} - ${schoolClass.section}
    </div>`,
    html: `
      <div style="text-align: right; direction: rtl;">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 14px;">
          <strong>إجمالي المعلمين: ${schoolClass.teacherNames.length}</strong>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
          ${teachersList}
        </div>
      </div>
      <style>
        .teacher-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          margin: 4px 0;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        .teacher-item:hover {
          background: #f8f9fa;
        }
        .material-icons {
          font-family: 'Material Icons';
          font-weight: normal;
          font-style: normal;
          font-size: 18px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
        }
      </style>
    `,
    confirmButtonText: 'إغلاق',
    confirmButtonColor: '#2196f3',
    width: '400px',
    customClass: {
      popup: 'teachers-dialog'
    }
  });
}

/**
 * فتح نافذة منبثقة لعرض جميع المواد
 */
openSubjectsDialog(schoolClass: Class): void {
  if (!schoolClass.subjects || schoolClass.subjects.length === 0) {
    this.showInfoAlert('لا توجد مواد مخصصة لهذا الفصل');
    return;
  }

  // استخدام SweetAlert2 لعرض قائمة المواد بشكل جميل
  const subjectsList = schoolClass.subjects
    .map((subject, index) => `<div class="subject-item">
      <i class="material-icons" style="vertical-align: middle; margin-left: 8px; color: #ff9800;">book</i>
      <span style="vertical-align: middle; flex: 1;">${subject.name}</span>
      <span class="hours-badge" style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
        ${subject.hoursPerWeek} حصة/أسبوع
      </span>
    </div>`)
    .join('');

  const totalHours = schoolClass.subjects.reduce((sum, subject) => sum + subject.hoursPerWeek, 0);

  Swal.fire({
    title: `<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
      <i class="material-icons" style="color: #ff9800;">subject</i>
      مواد الصف ${schoolClass.grade} - ${schoolClass.section}
    </div>`,
    html: `
      <div style="text-align: right; direction: rtl;">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 14px;">
          <strong>إجمالي المواد: ${schoolClass.subjects.length}</strong> • 
          <strong>إجمالي الساعات: ${totalHours} حصة/أسبوع</strong>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
          ${subjectsList}
        </div>
      </div>
      <style>
        .subject-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          margin: 4px 0;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          transition: background-color 0.2s;
          gap: 8px;
        }
        .subject-item:hover {
          background: #f8f9fa;
        }
        .material-icons {
          font-family: 'Material Icons';
          font-weight: normal;
          font-style: normal;
          font-size: 18px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
        }
      </style>
    `,
    confirmButtonText: 'إغلاق',
    confirmButtonColor: '#ff9800',
    width: '450px',
    customClass: {
      popup: 'subjects-dialog'
    }
  });
}

/**
 * عرض رسالة معلومات
 */
private showInfoAlert(message: string): void {
  Swal.fire({
    title: 'معلومات',
    text: message,
    icon: 'info',
    confirmButtonText: 'موافق',
    confirmButtonColor: '#2196f3',
    timer: 3000,
    timerProgressBar: true
  });
}
}
