// teachers.component.ts - النسخة المُحدثة بإزالة الفصول الثابتة والاعتماد على قاعدة البيانات فقط
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Teacher, TeacherService, Subject } from '../../core/services/teacher';
import { Observable, Subscription, BehaviorSubject, of } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { switchMap, tap, catchError, shareReplay } from 'rxjs/operators';
import Swal from 'sweetalert2';

export enum DrawerMode {
  DETAILS = 'details',
  ADD = 'add',
  EDIT = 'edit'
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
export interface ClassDto {
  id: number;
  grade: string;
  section: string;
  totalHours: number;
}


@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule,
    MatBadgeModule,
    MatSidenavModule,
    MatPaginatorModule,
  ],
  templateUrl: './teachers.html',
  styleUrls: ['./teachers.css'],
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
export class Teachers implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  
  teachersPagedResult$: Observable<PagedResult<Teacher>>;
  teachers: Teacher[] = [];
  totalCount: number = 0;
  displayedColumns: string[] = ['name', 'subject', 'classNames', 'weeklyQuota', 'restrictedPeriods', 'actions'];
  pageSize = 5;
  pageIndex = 0;

  subjects: Subject[] = [];


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

private mapSubjectsToArabic(subjects: { name: string; hoursPerWeek: number }[]): { name: string; hoursPerWeek: number }[] {
  return subjects.map(sub => ({
    name: this.translateSubject(sub.name), // الاسم بالعربي
    hoursPerWeek: sub.hoursPerWeek
  }));
}

translateSubject(subject: string): string {
  return this.subjectTranslations[subject] || subject;
}

  isDrawerOpen = false;
  drawerMode: DrawerMode = DrawerMode.DETAILS;
  selectedTeacher: Teacher | null = null;
  editingTeacherId: number | null = null;

  DrawerMode = DrawerMode;

  periods = [
    'Sun-1', 'Sun-2', 'Sun-3', 'Sun-4', 'Sun-5', 'Sun-6', 'Sun-7', 'Sun-8',
    'Mon-1', 'Mon-2', 'Mon-3', 'Mon-4', 'Mon-5', 'Mon-6', 'Mon-7', 'Mon-8',
    'Tue-1', 'Tue-2', 'Tue-3', 'Tue-4', 'Tue-5', 'Tue-6', 'Tue-7', 'Tue-8',
    'Wed-1', 'Wed-2', 'Wed-3', 'Wed-4', 'Wed-5', 'Wed-6', 'Wed-7', 'Wed-8',
    'Thu-1', 'Thu-2', 'Thu-3', 'Thu-4', 'Thu-5', 'Thu-6', 'Thu-7', 'Thu-8',
  ];

  groupedPeriods = [
    { day: 'الأحد', periods: ['Sun-1', 'Sun-2', 'Sun-3', 'Sun-4', 'Sun-5', 'Sun-6', 'Sun-7', 'Sun-8'] },
    { day: 'الاثنين', periods: ['Mon-1', 'Mon-2', 'Mon-3', 'Mon-4', 'Mon-5', 'Mon-6', 'Mon-7', 'Mon-8'] },
    { day: 'الثلاثاء', periods: ['Tue-1', 'Tue-2', 'Tue-3', 'Tue-4', 'Tue-5', 'Tue-6', 'Tue-7', 'Tue-8'] },
    { day: 'الأربعاء', periods: ['Wed-1', 'Wed-2', 'Wed-3', 'Wed-4', 'Wed-5', 'Wed-6', 'Wed-7', 'Wed-8'] },
    { day: 'الخميس', periods: ['Thu-1', 'Thu-2', 'Thu-3', 'Thu-4', 'Thu-5', 'Thu-6', 'Thu-7', 'Thu-8'] },
  ];

  form: FormGroup;
  selectedPeriods: string[] = [];
  availableClasses: ClassDto[] = [];

  isLoading = false;
  isLoadingClasses = false;
  isLoadingAvailableClasses = false;
  classesLoadError = false;
  classesInitialized = false;

  stats = {
    totalTeachers: 0,
    totalSubjects: 0,
    averageQuota: 0
  };

  constructor(
    private teacherService: TeacherService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.initForm();
    
    this.teachersPagedResult$ = this.refreshTrigger$.pipe(
      switchMap(() => {
        console.log(`تحميل المعلمين - الصفحة: ${this.pageIndex + 1}, الحجم: ${this.pageSize}`);
        this.isLoading = true;
        return this.teacherService.getTeachers(this.pageIndex + 1, this.pageSize);
      }),
      tap(result => {
        console.log('نتيجة تحميل المعلمين:', result);
        this.teachers = Array.isArray(result.items) ? result.items : [];
        this.totalCount = result.totalCount || 0;
        this.updateStats(this.teachers);
        this.isLoading = false;
        this.cdr.detectChanges();
      }),
      catchError(error => {
        console.error('خطأ في تحميل المعلمين:', error);
        this.showErrorAlert('فشل في تحميل المعلمين', 'يرجى التحقق من الاتصال والمحاولة مرة أخرى');
        this.isLoading = false;
        this.teachers = [];
        this.totalCount = 0;
        this.cdr.detectChanges();
        return of({ items: [], totalCount: 0 });
      }),
      shareReplay(1)
    );
  }

  ngOnInit(): void {
    console.log('تهيئة مكون المعلمين...');
    this.loadSubjects();
    this.initializeClasses();
    
    const teachersSubscription = this.teachersPagedResult$.subscribe();
    this.subscriptions.add(teachersSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.refreshTrigger$.complete();
  }

  private refreshData(): void {
    this.refreshTrigger$.next();
  }

  private initializeClasses(): void {
    this.loadAvailableClasses()
      .then(() => {
        this.classesInitialized = true;
        console.log('تم تهيئة الفصول بنجاح');
      })
      .catch((error) => {
        console.error('فشل في تهيئة الفصول:', error);
        this.classesInitialized = false;
      });
  }

  onPageChange(event: PageEvent): void {
    console.log('تغيير الصفحة:', event);
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.refreshData();
  }

  private loadSubjects(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.subjects.length > 0) {
        resolve();
        return;
      }

      console.log('تحميل المواد...');
      const subjectsSubscription = this.teacherService.getSubjects().subscribe({
        next: (subjects) => {
          console.log('تم تحميل المواد:', subjects);
          this.subjects = Array.isArray(subjects) ? subjects : [];
          this.cdr.detectChanges();
          resolve();
        },
        error: (error) => {
          console.error('خطأ في تحميل المواد:', error);
          this.showErrorAlert('فشل في تحميل المواد', 'يرجى إعادة تحديث الصفحة');
          this.subjects = [];
          reject(error);
        }
      });
      
      this.subscriptions.add(subjectsSubscription);
    });
  }

  private initForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      subject: ['', Validators.required],
      subjectIds: [[], Validators.required],
      classNames: [[], Validators.required],
      weeklyQuota: [1, [Validators.required, Validators.min(1), Validators.max(40)]],
      restrictedPeriods: [[]]
    });
  }

  // ✅ الدالة المُحدثة - جلب الفصول من قاعدة البيانات فقط بدون فصول ثابتة
  private loadAvailableClasses(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔄 تحميل الفصول من قاعدة البيانات...');
      this.isLoadingAvailableClasses = true;
      this.classesLoadError = false;

      const classesSubscription = this.teacherService.getAvailableClasses().subscribe({
        next: (classes) => {
          console.log('📦 الفصول المُحملة من قاعدة البيانات:', classes);
          
          const classesArray = Array.isArray(classes) ? classes : [];
          
          if (classesArray.length === 0) {
            console.warn('⚠️ لا توجد فصول في قاعدة البيانات');
            this.availableClasses = [];
            this.showWarningAlert('تنبيه', 'لا توجد فصول في قاعدة البيانات. يرجى إضافة فصول أولاً.');
          } else {
            // تنظيف البيانات وإزالة التكرارات
            const cleanClasses = classesArray
              .map(c => String(c).trim())
              .filter(c => c && c.length > 0);
            
            // لو cleanClasses جاي من API كـ string زي "1/2"
            this.availableClasses = cleanClasses.map((c, idx) => {
              const [grade, section] = c.split('/');
              return {
                id: idx, // أو قيمة حقيقية من الـ API
                grade,
                section,
                totalHours: 0
              } as ClassDto;
            });
            console.log(`✅ تم تحميل ${this.availableClasses.length} فصل من قاعدة البيانات`);
          }
          
          this.isLoadingAvailableClasses = false;
          this.classesLoadError = false;
          this.cdr.detectChanges();
          resolve();
        },
        error: (error) => {
          console.error('❌ خطأ في تحميل الفصول من قاعدة البيانات:', error);
          this.classesLoadError = true;
          this.isLoadingAvailableClasses = false;
          this.availableClasses = [];
          
          this.showErrorAlert(
            'خطأ في تحميل الفصول', 
            'تعذر تحميل الفصول من قاعدة البيانات. يرجى التحقق من الاتصال أو إضافة فصول في النظام.'
          );
          this.cdr.detectChanges();
          reject(error);
        }
      });
      
      this.subscriptions.add(classesSubscription);
    });
  }

  private ensureClassesLoaded(): Promise<void> {
    return new Promise((resolve) => {
      if (this.availableClasses.length > 0 && !this.isLoadingAvailableClasses) {
        console.log('الفصول محملة ومتوفرة');
        resolve();
        return;
      }

      if (this.isLoadingAvailableClasses) {
        console.log('انتظار تحميل الفصول...');
        const checkInterval = setInterval(() => {
          if (!this.isLoadingAvailableClasses) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      console.log('تحميل الفصول مطلوب...');
      this.loadAvailableClasses()
        .then(() => resolve())
        .catch(() => resolve());
    });
  }

  private updateStats(teachers: Teacher[]): void {
    console.log('تحديث الإحصائيات للمعلمين:', teachers);
    const teachersArray = Array.isArray(teachers) ? teachers : [];
    
    this.stats.totalTeachers = this.totalCount;
    this.stats.totalSubjects = new Set(teachersArray.map(t => t.subject)).size;
    this.stats.averageQuota = teachersArray.length > 0
      ? Math.round(teachersArray.reduce((sum, t) => sum + (t.weeklyQuota || 0), 0) / teachersArray.length)
      : 0;
    console.log('الإحصائيات الجديدة:', this.stats);
  }

  // ✅ دالة عرض الفصول مع الحد الأقصى
  getDisplayedClasses(classNames: string[] | undefined): string[] {
    const classes = Array.isArray(classNames) ? classNames : [];
    return classes.slice(0, 3);
  }

  // ✅ دالة حساب عدد الفصول المتبقية
  getRemainingClassesCount(classNames: string[] | undefined): number {
    const classes = Array.isArray(classNames) ? classNames : [];
    return Math.max(0, classes.length - 3);
  }

  // ✅ دالة عرض الحصص المحظورة مع الحد الأقصى
  getDisplayedPeriods(restrictedPeriods: string[] | undefined): string[] {
    const periods = Array.isArray(restrictedPeriods) ? restrictedPeriods : [];
    return periods.slice(0, 2);
  }

  // ✅ دالة حساب عدد الحصص المحظورة المتبقية
  getRemainingPeriodsCount(restrictedPeriods: string[] | undefined): number {
    const periods = Array.isArray(restrictedPeriods) ? restrictedPeriods : [];
    return Math.max(0, periods.length - 2);
  }

  openDrawer(mode: DrawerMode, teacher: Teacher | null = null): void {
    console.log(`فتح الدرج - الوضع: ${mode}`, teacher);
    this.drawerMode = mode;
    this.selectedTeacher = teacher;

    const proceedWithDrawer = () => {
      switch (mode) {
        case DrawerMode.DETAILS:
          this.isDrawerOpen = true;
          break;

        case DrawerMode.ADD:
          this.ensureClassesLoaded().then(() => {
            this.resetForm();
            this.setFormForAdd();
            this.isDrawerOpen = true;
            console.log('تم فتح درج الإضافة مع الفصول المحملة');
          });
          return;

        case DrawerMode.EDIT:
          if (teacher) {
            this.editingTeacherId = teacher.id ? Number(teacher.id) : null;
            this.ensureClassesLoaded().then(() => {
              this.setFormForEdit(teacher);
              this.isDrawerOpen = true;
              console.log('تم فتح درج التعديل مع الفصول المحملة');
            });
            return;
          }
          break;
      }

      console.log('تم فتح الدرج');
    };

    if (this.subjects.length === 0) {
      this.loadSubjects().then(() => {
        proceedWithDrawer();
      }).catch(() => {
        proceedWithDrawer();
      });
    } else {
      proceedWithDrawer();
    }
  }

  closeDrawer(): void {
    if (this.form.dirty && (this.drawerMode === DrawerMode.ADD || this.drawerMode === DrawerMode.EDIT)) {
      this.showConfirmDialog(
        'تغييرات غير محفوظة',
        'لديك تغييرات غير محفوظة. هل أنت متأكد من الإغلاق؟',
        'warning'
      ).then((result) => {
        if (result.isConfirmed) {
          this.performCloseDrawer();
        }
      });
    } else {
      this.performCloseDrawer();
    }
  }

  private performCloseDrawer(): void {
    this.isDrawerOpen = false;
    this.drawerMode = DrawerMode.DETAILS;
    this.selectedTeacher = null;
    this.editingTeacherId = null;
    this.resetForm();
    console.log('تم إغلاق الدرج');
  }

  switchToEditMode(): void {
    if (this.selectedTeacher) {
      this.drawerMode = DrawerMode.EDIT;
      this.editingTeacherId = this.selectedTeacher.id ? Number(this.selectedTeacher.id) : null;
      this.ensureClassesLoaded().then(() => {
        this.setFormForEdit(this.selectedTeacher!);
      });
    }
  }

  switchToDetailsMode(): void {
    if (this.form.dirty) {
      this.showConfirmDialog(
        'تغييرات غير محفوظة',
        'لديك تغييرات غير محفوظة. هل أنت متأكد من العودة للتفاصيل؟',
        'warning'
      ).then((result) => {
        if (result.isConfirmed) {
          this.drawerMode = DrawerMode.DETAILS;
          this.resetForm();
        }
      });
    } else {
      this.drawerMode = DrawerMode.DETAILS;
      this.resetForm();
    }
  }

  private setFormForAdd(): void {
    console.log('إعداد النموذج للإضافة');
    console.log('الفصول المتاحة للإضافة:', this.availableClasses);
    
    this.selectedPeriods = [];
    
    this.form.patchValue({
      name: '',
      subject: '',
      subjectIds: [],
      classNames: [],
      weeklyQuota: 1,
      restrictedPeriods: []
    });
    
    this.cdr.detectChanges();
    console.log('تم إعداد النموذج للإضافة بنجاح');
  }

  private setFormForEdit(teacher: Teacher): void {
    console.log('=== إعداد النموذج للتعديل ===');
    console.log('بيانات المعلم:', teacher);
    console.log('المواد المتاحة:', this.subjects);
    console.log('الفصول المتاحة:', this.availableClasses);
    
    this.selectedPeriods = Array.isArray(teacher.restrictedPeriods) ? [...teacher.restrictedPeriods] : [];
    const teacherClasses = Array.isArray(teacher.classNames) ? [...teacher.classNames] : [];

    let subjectId = '';
    const subjectsArray = Array.isArray(this.subjects) ? this.subjects : [];
    
    if (!isNaN(Number(teacher.subject))) {
      const subjectById = subjectsArray.find(s => s.id === Number(teacher.subject));
      if (subjectById) {
        subjectId = teacher.subject;
        console.log('تم العثور على المادة بالمعرف:', subjectId);
      }
    }
    
    if (!subjectId) {
      const subjectByName = subjectsArray.find(s => s.name === teacher.subject);
      if (subjectByName) {
        subjectId = subjectByName.id.toString();
        console.log('تم العثور على المادة بالاسم:', subjectByName.name, 'المعرف:', subjectId);
      }
    }
    
    if (!subjectId) {
      const subjectByCaseInsensitive = subjectsArray.find(s => 
        s.name.toLowerCase() === teacher.subject.toLowerCase()
      );
      if (subjectByCaseInsensitive) {
        subjectId = subjectByCaseInsensitive.id.toString();
        console.log('تم العثور على المادة (غير حساس للأحرف):', subjectByCaseInsensitive.name, 'المعرف:', subjectId);
      }
    }

    // التأكد من توفر فصول المعلم في القائمة المتاحة - فقط للفصول الموجودة في قاعدة البيانات
    const missingClasses = teacherClasses.filter(cls => cls && !this.availableClasses.some(c => `${c.grade}/${c.section}` === cls));
    if (missingClasses.length > 0) {
      console.warn('فصول غير موجودة في قاعدة البيانات:', missingClasses);
      this.showWarningAlert(
        'تحذير',
        `الفصول التالية مرتبطة بالمعلم لكنها غير موجودة في قاعدة البيانات: ${missingClasses.join(', ')}`
      );
    }

    // استخدام الفصول الموجودة في قاعدة البيانات فقط
    const validClasses = teacherClasses.filter(cls => this.availableClasses.some(c => `${c.grade}/${c.section}` === cls));

    console.log('إعداد النموذج بالقيم التالية:');
    console.log('- الاسم:', teacher.name);
    console.log('- معرف المادة:', subjectId);
    console.log('- الفصول الصحيحة:', validClasses);
    console.log('- النصاب:', teacher.weeklyQuota);
    console.log('- الحصص المحظورة:', this.selectedPeriods);

    this.form.patchValue({
      name: teacher.name || '',
      subject: teacher.subject ,  // الاسم اللي جاي من الـ API زي "Physics"
      subjectIds: subjectId ? [Number(subjectId)] : [],
      classNames: validClasses,
      weeklyQuota: teacher.weeklyQuota || 1,
      restrictedPeriods: this.selectedPeriods
    });

    this.form.get('classNames')?.updateValueAndValidity();
    this.cdr.detectChanges();
    
    console.log('تم إعداد النموذج للتعديل بنجاح');
    console.log('قيمة classNames في النموذج:', this.form.get('classNames')?.value);
  }

  onSubjectChange(subjectId: string): void {
    this.form.patchValue({
      subjectIds: subjectId ? [Number(subjectId)] : []
    });
  }

  compareSubjects(option: string, value: string): boolean {
    return option === value || option?.toString() === value?.toString();
  }

  getDrawerTitle(): string {
    switch (this.drawerMode) {
      case DrawerMode.DETAILS:
        return 'تفاصيل المعلم';
      case DrawerMode.ADD:
        return 'إضافة معلم جديد';
      case DrawerMode.EDIT:
        return 'تعديل المعلم';
      default:
        return 'المعلم';
    }
  }

  getDrawerIcon(): string {
    switch (this.drawerMode) {
      case DrawerMode.DETAILS:
        return this.selectedTeacher ? this.getSubjectIcon(this.selectedTeacher.subject) : 'person';
      case DrawerMode.ADD:
        return 'add';
      case DrawerMode.EDIT:
        return 'edit';
      default:
        return 'person';
    }
  }

  onTeacherDetailsClick(teacher: Teacher, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.openDrawer(DrawerMode.DETAILS, teacher);
  }

  onAddTeacherClick(): void {
    console.log('النقر على زر إضافة معلم');
    this.openDrawer(DrawerMode.ADD);
  }

  onEditTeacherClick(teacher: Teacher, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.openDrawer(DrawerMode.EDIT, teacher);
  }

  onDeleteTeacherClick(teacher: Teacher, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.showDeleteConfirmDialog(teacher.name).then((result) => {
      if (result.isConfirmed) {
        this.deleteTeacher(teacher.id!);
      }
    });
  }

  togglePeriod(period: string): void {
    const index = this.selectedPeriods.indexOf(period);
    if (index > -1) {
      this.selectedPeriods.splice(index, 1);
    } else {
      this.selectedPeriods.push(period);
    }
    this.form.patchValue({ restrictedPeriods: this.selectedPeriods });
  }

  selectAllPeriodsForDay(dayPeriods: string[]): void {
    const allSelected = dayPeriods.every(p => this.selectedPeriods.includes(p));

    if (allSelected) {
      dayPeriods.forEach(p => {
        const index = this.selectedPeriods.indexOf(p);
        if (index > -1) this.selectedPeriods.splice(index, 1);
      });
    } else {
      dayPeriods.forEach(p => {
        if (!this.selectedPeriods.includes(p)) {
          this.selectedPeriods.push(p);
        }
      });
    }

    this.form.patchValue({ restrictedPeriods: this.selectedPeriods });
  }

  isDayFullySelected(dayPeriods: string[]): boolean {
    return dayPeriods.every(p => this.selectedPeriods.includes(p));
  }

  isDayPartiallySelected(dayPeriods: string[]): boolean {
    return dayPeriods.some(p => this.selectedPeriods.includes(p)) &&
      !this.isDayFullySelected(dayPeriods);
  }

  removeSelectedClass(className: string): void {
    const currentClasses = this.form.get('classNames')?.value || [];
    const updatedClasses = currentClasses.filter((c: string) => c !== className);
    this.form.patchValue({ classNames: updatedClasses });
  }

  onSubmit(): void {
    console.log('إرسال النموذج...');
    console.log('صحة النموذج:', this.form.valid);
    console.log('قيم النموذج:', this.form.value);
    
    if (this.form.valid) {
      // التحقق من وجود فصول متاحة
      if (this.availableClasses.length === 0) {
        this.showErrorAlert(
          'لا توجد فصول متاحة', 
          'لا يمكن إضافة معلم بدون فصول. يرجى إضافة فصول في النظام أولاً.'
        );
        return;
      }

      this.isLoading = true;
      const teacherData: Teacher = {
        name: this.form.value.name,
        subject: this.form.value.subject,
        classNames: Array.isArray(this.form.value.classNames) ? this.form.value.classNames : [],
        weeklyQuota: this.form.value.weeklyQuota,
        restrictedPeriods: Array.isArray(this.selectedPeriods) ? this.selectedPeriods : []
      };

      console.log('بيانات المعلم للإرسال:', teacherData);

      if (this.drawerMode === DrawerMode.EDIT && this.editingTeacherId !== null) {
        this.updateTeacher(teacherData);
      } else if (this.drawerMode === DrawerMode.ADD) {
        this.addTeacher(teacherData);
      }
    } else {
      this.markFormGroupTouched();
      this.showErrorAlert('خطأ في التحقق من النموذج', 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
    }
  }

private addTeacher(teacher: Teacher): void {
  // تحويل اسم المادة للعربي قبل الإرسال
  const arabicTeacher: Teacher = {
    ...teacher,
    subject: this.translateSubject(teacher.subject)
  };

  console.log('إضافة معلم جديد بالعربي:', arabicTeacher);

  const addSubscription = this.teacherService.addTeacher(arabicTeacher).subscribe({
    next: (response) => {
      console.log('استجابة إضافة المعلم:', response);
      this.showSuccessAlert('نجح!', `تم إضافة المعلم ${arabicTeacher.name} بنجاح!`);
      this.performCloseDrawer();
      this.refreshData();
      this.isLoading = false;
    },
    error: (error) => {
      console.error('فشل في إضافة المعلم:', error);
      this.showErrorAlert('فشل في إضافة المعلم', 'يرجى التحقق من البيانات والمحاولة مرة أخرى');
      this.isLoading = false;
    }
  });

  this.subscriptions.add(addSubscription);
}

private updateTeacher(teacher: Teacher): void {
  // تحويل اسم المادة للعربي قبل التحديث
  const arabicTeacher: Teacher = {
    ...teacher,
    subject: this.translateSubject(teacher.subject)
  };

  console.log('تحديث المعلم بالعربي:', arabicTeacher);
  this.isLoading = true;

  const updateSubscription = this.teacherService.updateTeacher(this.editingTeacherId!, arabicTeacher).subscribe({
    next: (response) => {
      console.log('نجح التحديث:', response);
      this.showSuccessAlert('تم التحديث!', `تم تحديث المعلم ${arabicTeacher.name} بنجاح!`);
      this.performCloseDrawer();
      this.refreshData();
      this.isLoading = false;
    },
    error: (error) => {
      console.error('فشل التحديث:', error);
      this.showErrorAlert('فشل التحديث', error.error?.message || error.message || 'يرجى المحاولة مرة أخرى');
      this.isLoading = false;
    }
  });

  this.subscriptions.add(updateSubscription);
}





  deleteTeacher(id: number): void {
    console.log('حذف المعلم بالمعرف:', id);
    this.isLoading = true;
    
    const deleteSubscription = this.teacherService.deleteTeacher(id).subscribe({
      next: () => {
        this.showSuccessAlert('تم الحذف!', 'تم حذف المعلم بنجاح!');
        this.performCloseDrawer();
        this.refreshData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('فشل الحذف:', error);
        let errorMessage = 'غير قادر على حذف المعلم. يرجى المحاولة مرة أخرى.';
        
        if (error.status === 404) {
          errorMessage = 'المعلم غير موجود أو تم حذفه مسبقاً.';
        } else if (error.status === 400) {
          errorMessage = 'لا يمكن حذف المعلم لأنه مرتبط ببيانات أخرى.';
        } else if (error.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
        }
        
        this.showErrorAlert('فشل الحذف', errorMessage);
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(deleteSubscription);
  }

  resetForm(): void {
    this.selectedPeriods = [];
    this.form.reset();
    this.form = this.initForm();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  private showSuccessAlert(title: string, text: string): void {
    Swal.fire({
      title: title,
      text: text,
      icon: 'success',
      confirmButtonText: 'رائع!',
      timer: 3000,
      timerProgressBar: true
    });
  }

  private showErrorAlert(title: string, text: string): void {
    Swal.fire({
      title: title,
      text: text,
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#d33'
    });
  }

  // دالة جديدة لعرض التحذيرات
  private showWarningAlert(title: string, text: string): void {
    Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#ff9800'
    });
  }

  private showConfirmDialog(title: string, text: string, icon: any = 'question'): Promise<any> {
    return Swal.fire({
      title: title,
      text: text,
      icon: icon,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'نعم',
      cancelButtonText: 'لا'
    });
  }

  private showDeleteConfirmDialog(teacherName: string): Promise<any> {
    return Swal.fire({
      title: 'هل أنت متأكد؟',
      html: `أنت على وشك حذف <strong>${teacherName}</strong>.<br>هذا الإجراء لا يمكن التراجع عنه!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف!',
      cancelButtonText: 'إلغاء',
      focusCancel: true
    });
  }

  getFormError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control?.touched) {
      if (control.errors['required']) {
        const fieldNames: { [key: string]: string } = {
          'name': 'الاسم',
          'subject': 'المادة',
          'classNames': 'الفصول',
          'weeklyQuota': 'النصاب الأسبوعي'
        };
        return `${fieldNames[fieldName] || fieldName} مطلوب`;
      }
      if (control.errors['minlength']) return `${fieldName} قصير جداً`;
      if (control.errors['min']) return `${fieldName} يجب أن يكون على الأقل ${control.errors['min'].min}`;
      if (control.errors['max']) return `${fieldName} لا يمكن أن يتجاوز ${control.errors['max'].max}`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control?.errors && control?.touched);
  }

  getPeriodDisplay(period: unknown): string {
    if (typeof period !== 'string') return '';
    const [day, periodNum] = period.split('-');
    return `ح${periodNum}`;
  }

  getDayFromPeriod(period: unknown): string {
    if (typeof period !== 'string') return '';
    const [day] = period.split('-');
    const dayNames: { [key: string]: string } = {
      'Sun': 'أحد',
      'Mon': 'اثنين',
      'Tue': 'ثلاثاء',
      'Wed': 'أربعاء',
      'Thu': 'خميس'
    };
    return dayNames[day] || day;
  }

  getFullPeriodName(period: string): string {
    if (typeof period !== 'string') return '';
    const [day, periodNum] = period.split('-');
    const dayNames: { [key: string]: string } = {
      'Sun': 'الأحد',
      'Mon': 'الاثنين',
      'Tue': 'الثلاثاء',
      'Wed': 'الأربعاء',
      'Thu': 'الخميس'
    };
    return `${dayNames[day] || day} - الحصة ${periodNum}`;
  }

  getSubjectIcon(subject: string): string {
    const icons: { [key: string]: string } = {
      'الرياضيات': 'calculate',
      'Mathematics': 'calculate',
      'العلوم': 'science',
      'Science': 'science',
      'اللغة الإنجليزية': 'language',
      'English': 'language',
      'الكيمياء': 'biotech',
      'Chemistry': 'biotech',
      'الفيزياء': 'psychology',
      'Physics': 'psychology',
      'الأحياء': 'local_florist',
      'Biology': 'local_florist',
      'التاريخ': 'history_edu',
      'History': 'history_edu',
      'الجغرافيا': 'public',
      'Geography': 'public'
    };
    return icons[subject] || 'book';
  }

  trackByClassName(index: number, cls: ClassDto): string {
    return `${cls.grade}/${cls.section}`;
  }

  // دالة محدثة لإعادة تحميل الفصول
  refreshAvailableClasses(): void {
    console.log('إعادة تحميل الفصول من قاعدة البيانات...');
    this.loadAvailableClasses().then(() => {
      if (this.availableClasses.length > 0) {
        this.showSuccessAlert('تم التحديث', `تم تحديث قائمة الفصول بنجاح. تم العثور على ${this.availableClasses.length} فصل.`);
      } else {
        this.showWarningAlert('لا توجد فصول', 'لا توجد فصول في قاعدة البيانات. يرجى إضافة فصول أولاً.');
      }
    }).catch(() => {
      this.showErrorAlert('خطأ', 'فشل في تحديث قائمة الفصول من قاعدة البيانات');
    });
  }

  // إضافة دالة جديدة لعرض جميع الحصص المحظورة
  showAllRestrictedPeriods(teacher: Teacher, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const periodsArray = Array.isArray(teacher.restrictedPeriods) ? teacher.restrictedPeriods : [];
    const periodsHtml = periodsArray.map(period => 
      `<span class="period-badge">${this.getFullPeriodName(period)}</span>`
    ).join('') || '';

    Swal.fire({
      title: `الحصص المحظورة للمعلم ${teacher.name}`,
      html: `
        <div class="periods-container">
          ${periodsHtml}
        </div>
        <hr>
        <small class="text-muted">المجموع: ${periodsArray.length} حصة محظورة</small>
      `,
      icon: 'info',
      confirmButtonText: 'عرض التفاصيل',
      showCancelButton: true,
      cancelButtonText: 'إغلاق',
      customClass: {
        htmlContainer: 'periods-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.openDrawer(DrawerMode.DETAILS, teacher);
      }
    });
  }

  // الدالة المحدثة لعرض الفصول مع تحديد الخصائص للتمييز
  showAllClasses(teacher: Teacher, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const classesArray = Array.isArray(teacher.classNames) ? teacher.classNames : [];
    const classesHtml = classesArray.map(className => 
      `<span class="class-badge">(${className})</span>`
    ).join('') || '';

    Swal.fire({
      title: `فصول ${teacher.name}`,
      html: `
        <div class="classes-container">
          ${classesHtml}
        </div>
        <hr>
        <small class="text-muted">المجموع: ${classesArray.length} فصل</small>
      `,
      icon: 'info',
      confirmButtonText: 'عرض التفاصيل',
      showCancelButton: true,
      cancelButtonText: 'إغلاق',
      customClass: {
        htmlContainer: 'classes-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.openDrawer(DrawerMode.DETAILS, teacher);
      }
    });
  }
}