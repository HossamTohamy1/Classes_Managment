import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject as RxSubject, takeUntil, finalize, forkJoin, switchMap, map, Observable, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { MatExpansionModule } from '@angular/material/expansion';
import Swal from 'sweetalert2';

import { 
  TimetableService, 
  TimeTableDto, 
  TimetableSlotDto, 
  AddTimeTableDto,
  UpdateTimeTableDto,
  SmartTimetableRequest,
  TimetableConstraints,
  ConflictDto,
  TimetableStatisticsDto,
  SwapSlotsRequest,
  SlotPosition,
  AddTimetableSlotDto,
  UpdateTimetableSlotDto,
  CheckTeacherConflictDto,
  TeacherConflictResult,
  
} from '../../core/services/timetable/timetable';

import { ClassesService, Class } from '../../core/services/classes';
import { TeacherService, Teacher } from '../../core/services/teacher';


const ARABIC_MESSAGES = {
  // Validation and Conflict Messages
  'Please select teacher, day, and period': 'يرجى اختيار المدرس واليوم والحصة',
  'No timetable to export': 'لا يوجد جدول زمني للتصدير',
  'Timetable exported as PDF successfully': 'تم تصدير الجدول الزمني بصيغة PDF بنجاح',
  'Failed to export timetable as PDF': 'فشل في تصدير الجدول الزمني بصيغة PDF',
  'No active timetable to find alternatives': 'لا يوجد جدول زمني نشط للعثور على البدائل',
  'No conflict selected to resolve': 'لم يتم اختيار تعارض لحله',
  'Found {} alternative slots': 'تم العثور على {} بدائل للحصص',
  'No alternative slots available for this conflict': 'لا توجد بدائل متاحة لهذا التعارض',
  'Failed to find alternative slots': 'فشل في العثور على بدائل للحصص',
  'No conflicts to export': 'لا توجد تعارضات للتصدير',
  
  // Teacher Availability Messages
  '{} is available on {} period {}': '{} متاح يوم {} الحصة {}',
  '{} is not available: {}': '{} غير متاح: {}',
  'Failed to check teacher availability': 'فشل في فحص توفر المدرس',
  'Teacher {} is not available on {} period {} (restricted)': 'المدرس {} غير متاح يوم {} الحصة {} (مقيد)',
  
  // Timetable Operations
  'Timetable cloned successfully to target class': 'تم نسخ الجدول الزمني بنجاح إلى الفصل المستهدف',
  'Failed to clone timetable': 'فشل في نسخ الجدول الزمني',
  'Timetable template generated successfully': 'تم إنشاء قالب الجدول الزمني بنجاح',
  'Failed to generate timetable template': 'فشل في إنشاء قالب الجدول الزمني',
  'No active timetable to optimize': 'لا يوجد جدول زمني نشط للتحسين',
  'Timetable optimized successfully': 'تم تحسين الجدول الزمني بنجاح',
  'Failed to optimize timetable': 'فشل في تحسين الجدول الزمني',
  'No active timetable to auto-fill': 'لا يوجد جدول زمني نشط للملء التلقائي',
  'Empty slots filled automatically': 'تم ملء الحصص الفارغة تلقائياً',
  'Failed to auto-fill empty slots': 'فشل في ملء الحصص الفارغة تلقائياً',
  'No active timetable to balance': 'لا يوجد جدول زمني نشط للموازنة',
  'Teacher workload balanced successfully': 'تم توازن عبء العمل للمدرسين بنجاح',
  'Failed to balance teacher workload': 'فشل في توازن عبء العمل للمدرسين',
  'No active timetable to redistribute': 'لا يوجد جدول زمني نشط لإعادة التوزيع',
  'Subjects redistributed evenly': 'تم إعادة توزيع المواد بالتساوي',
  'Failed to redistribute subjects': 'فشل في إعادة توزيع المواد',
  
  // Bulk Operations
  'Please select classes to generate timetables': 'يرجى اختيار الفصول لإنشاء الجداول الزمنية',
  'Generated {} timetables successfully': 'تم إنشاء {} جدول زمني بنجاح',
  'Failed to generate {} timetables': 'فشل في إنشاء {} جدول زمني',
  'Failed to generate bulk timetables': 'فشل في إنشاء الجداول الزمنية المجمعة',
  'Please select timetables to validate': 'يرجى اختيار الجداول الزمنية للتحقق منها',
  'All selected timetables are valid': 'جميع الجداول الزمنية المختارة صحيحة',
  'Found {} conflicts across {} timetables': 'تم العثور على {} تعارض عبر {} جدول زمني',
  'Failed to validate timetables': 'فشل في التحقق من الجداول الزمنية',
  'Please select timetables to delete': 'يرجى اختيار الجداول الزمنية للحذف',
  'Are you sure you want to delete {} timetable(s)?': 'هل أنت متأكد من حذف {} جدول زمني؟',
  'Deleted {} timetables successfully': 'تم حذف {} جدول زمني بنجاح',
  'Failed to delete {} timetables': 'فشل في حذف {} جدول زمني',
  'Failed to delete timetables': 'فشل في حذف الجداول الزمنية',
  
  // Search and Filter
  'Found {} timetables matching criteria': 'تم العثور على {} جدول زمني يطابق المعايير',
  'Failed to search timetables': 'فشل في البحث عن الجداول الزمنية',
  
  // Reports and Analytics
  'No timetable selected for report generation': 'لم يتم اختيار جدول زمني لإنشاء التقرير',
  'Timetable report generated successfully': 'تم إنشاء تقرير الجدول الزمني بنجاح',
  'Failed to generate timetable report': 'فشل في إنشاء تقرير الجدول الزمني',
  'Please select at least 2 timetables to compare': 'يرجى اختيار جدولين زمنيين على الأقل للمقارنة',
  'Timetables compared successfully': 'تم مقارنة الجداول الزمنية بنجاح',
  'Failed to compare timetables': 'فشل في مقارنة الجداول الزمنية',
  
  // Backup and Restore
  'No timetable selected for backup': 'لم يتم اختيار جدول زمني للنسخ الاحتياطي',
  'Timetable backup created successfully': 'تم إنشاء النسخة الاحتياطية للجدول الزمني بنجاح',
  'Failed to create timetable backup': 'فشل في إنشاء النسخة الاحتياطية للجدول الزمني',
  'Timetable restored successfully': 'تم استعادة الجدول الزمني بنجاح',
  'Failed to restore timetable': 'فشل في استعادة الجدول الزمني',
  
  // Import/Export
  'Please select a file to import': 'يرجى اختيار ملف للاستيراد',
  'Timetable imported successfully': 'تم استيراد الجدول الزمني بنجاح',
  'Failed to import timetable': 'فشل في استيراد الجدول الزمني',
  'Please select timetables to export': 'يرجى اختيار الجداول الزمنية للتصدير',
  'Timetables exported successfully': 'تم تصدير الجداول الزمنية بنجاح',
  'Failed to export timetables': 'فشل في تصدير الجداول الزمنية',
  'No timetable to print': 'لا يوجد جدول زمني للطباعة',
  
  // Collaboration
  'Timetable shared successfully': 'تم مشاركة الجدول الزمني بنجاح',
  'Failed to share timetable': 'فشل في مشاركة الجدول الزمني',
  'Comment added successfully': 'تم إضافة التعليق بنجاح',
  'Failed to add comment': 'فشل في إضافة التعليق',
  'Timetable locked for editing': 'تم قفل الجدول الزمني للتحرير',
  'Failed to lock timetable': 'فشل في قفل الجدول الزمني',
  'Timetable unlocked': 'تم إلغاء قفل الجدول الزمني',
  'Failed to unlock timetable': 'فشل في إلغاء قفل الجدول الزمني',
  
  // Notification Messages
  'New timetable created for class {}': 'تم إنشاء جدول زمني جديد للفصل {}',
  'Timetable updated for class {}': 'تم تحديث الجدول الزمني للفصل {}',
  'Timetable deleted for class {}': 'تم حذف الجدول الزمني للفصل {}',
  'Conflict detected in timetable for class {}': 'تم اكتشاف تعارض في الجدول الزمني للفصل {}',
  
  // Validation Messages
  'No active timetable to validate': 'لا يوجد جدول زمني نشط للتحقق منه',
  'No timetable selected for validation': 'لم يتم اختيار جدول زمني للتحقق منه',
  'Found {} conflict(s) in the timetable': 'تم العثور على {} تعارض في الجدول الزمني',
  'No conflicts found in the timetable': 'لم يتم العثور على تعارضات في الجدول الزمني',
  'No conflicts to resolve': 'لا توجد تعارضات لحلها',
  'Resolved {} conflicts automatically': 'تم حل {} تعارض تلقائياً',
  'Could only resolve {} out of {} conflicts': 'تم حل {} فقط من أصل {} تعارض',
  'Failed to resolve conflicts automatically': 'فشل في حل التعارضات تلقائياً',
  'Timetable validation passed - No conflicts detected!': 'نجح التحقق من الجدول الزمني - لم يتم اكتشاف تعارضات!',
  'Failed to validate timetable': 'فشل في التحقق من الجدول الزمني',
  
  // Priority Resolution Messages
  'Resolved {} critical conflicts': 'تم حل {} تعارض حرج',
  'Resolved {} high priority conflicts': 'تم حل {} تعارض عالي الأولوية',
  'Failed to resolve conflicts by priority': 'فشل في حل التعارضات حسب الأولوية',
  'Found {} conflicts ({} require immediate attention)': 'تم العثور على {} تعارض ({} يتطلب انتباهاً فورياً)',
  'Found {} conflicts (low to medium priority)': 'تم العثور على {} تعارض (أولوية منخفضة إلى متوسطة)',
  
  // Conflict Resolution Messages
  'Conflict marked as resolved: {}': 'تم تعيين التعارض كمحلول: {}',
  'All conflicts reset to unresolved status': 'تم إعادة تعيين جميع التعارضات كغير محلولة',
  'Conflicts exported successfully': 'تم تصدير التعارضات بنجاح',
  
  // Drag and Drop Messages
  'Invalid slot move operation': 'عملية نقل خانة غير صالحة',
  'Invalid subject add operation': 'عملية إضافة مادة غير صالحة',
  'No teacher found for {} in this class': 'لم يتم العثور على مدرس لمادة {} في هذا الفصل',
  '{} moved to {} period {}': 'تم نقل {} إلى {} الحصة {}',
  '{} added to {} period {}': 'تم إضافة {} إلى {} الحصة {}',
  'Failed to process drop operation': 'فشل في معالجة عملية الإسقاط',
  
  // General Error Messages
  'Resource not found': 'المصدر غير موجود',
  'Server error occurred': 'حدث خطأ في الخادم',
  'An error occurred': 'حدث خطأ',
  'Failed to load current timetable': 'فشل في تحميل الجدول الزمني الحالي',
  'Failed to load timetable data': 'فشل في تحميل بيانات الجدول الزمني',
  
  // UI Labels and Tooltips
  'Has conflicts': 'يحتوي على تعارضات',
  'Restricted period': 'حصة مقيدة',
  'No conflicts detected': 'لم يتم اكتشاف تعارضات',
  'Empty slot': 'حصة فارغة',
  'Close': 'إغلاق'
};

// Conflict Type Labels (تسميات أنواع التعارضات)


// Updated AssignedTeacherDto interface with restrictedPeriods
export interface AssignedTeacherDto {
  id: number;
  name: string;
  subject: string;
  email?: string;
  phone?: string;
  subjectNames?: string[];
  subjectCount?: number;
  restrictedPeriods?: string[]; // Fixed name
}
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6
}



interface WeekDay {
  key: string;
  label: string;
  value: DayOfWeek;
}

interface TimeSlotView {
  period: number;
  time: string;
  slots: { [dayKey: string]: TimetableSlotDto | null };
}

interface ConstraintOption {
  value: keyof TimetableConstraints;
  label: string;
  description: string;
}

// Updated Subject interface with new fields
interface Subject {
  id: number;
  name: string;
  teacher: string;
  color: string;
  hoursPerWeek: number;
  teacherId?: number;
  isAssigned: boolean;
}

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    CdkDrag,
    CdkDropList,
    MatExpansionModule,
    
    
  ],
  templateUrl: './timetable.html',
  styleUrls: ['./timetable.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0px)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0px)' }))
      ])
    ]),
    trigger('slideInFromRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('staggerFadeIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0px)' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class Timetable implements OnInit, OnDestroy {
  private destroy$ = new RxSubject<void>();
 private teacherConflicts: Map<string, TeacherConflictResult> = new Map();
  private isValidatingConflicts = false;
  // Form and UI State
  timetableForm!: FormGroup;
  constraintsForm!: FormGroup;
  isDrawerOpen = false;
  isLoading = false;
  selectedClassId: number | null = null;
  selectedClass: string = '';
  maxperiodsPerDay = 8;
  maxHoursPerDay = 8;
  selectedConstraints: (keyof TimetableConstraints)[] = ['avoidDoubleBooking', 'spreadSubjectsEvenly'];

  
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
translateSubject(subject: string): string {
  return this.subjectTranslations[subject] || subject;
}
  // Data
  currentTimetable: TimeTableDto | null = null;
  timetables: TimeTableDto[] = [];
  conflicts: ConflictDto[] = [];
  statistics: TimetableStatisticsDto | null = null;
  conflictDialogData: any = null;

  // API Data
  classes: Class[] = [];
  teachers: Teacher[] = [];
  subjects: Subject[] = [];
  
  // View Models
  timeSlots: TimeSlotView[] = [];
  hasConflicts = false;
  assignedTeachers: AssignedTeacherDto[] = [];
  
  // Caching
  private classSubjectsCache = new Map<number, Subject[]>();
  private classTeachersCache = new Map<number, AssignedTeacherDto[]>();

  // إضافة متغيرات جديدة للفحص اليدوي
selectedTeacherForCheck: AssignedTeacherDto | null = null;
selectedDayForCheck: WeekDay | null = null;
selectedPeriodForCheck: number | null = null; // Fixed: selectedperiodForCheck -> selectedPeriodForCheck
lastAvailabilityCheck: TeacherConflictResult | null = null;

  
  // Constants
weekDays: WeekDay[] = [
  { key: 'sunday', label: 'Sun', value: DayOfWeek.Sunday },
  { key: 'monday', label: 'Mon', value: DayOfWeek.Monday },
  { key: 'tuesday', label: 'Tue', value: DayOfWeek.Tuesday },
  { key: 'wednesday', label: 'Wed', value: DayOfWeek.Wednesday },
  { key: 'thursday', label: 'Thu', value: DayOfWeek.Thursday }
];

constraintOptions: ConstraintOption[] = [
  {
    value: 'avoidDoubleBooking',
    label: 'Avoid Double-booking',
    description: 'Prevent teachers from being assigned to multiple classes at the same time'
  },
  {
    value: 'spreadSubjectsEvenly',
    label: 'Spread Subjects Evenly',
    description: 'Distribute subjects across different days and periods'
  },
  {
    value: 'respectRestrictedPeriods',
    label: 'Respect Restricted Periods',
    description: 'Honor teacher availability and restricted time slots'
  },
  {
    value: 'balanceWorkload',
    label: 'Balance Workload',
    description: 'Ensure fair distribution of teaching hours per teacher'
  },
  {
    value: 'allowConsecutiveClasses',
    label: 'Allow Consecutive Classes',
    description: 'Permit same subject in consecutive periods when beneficial'
  }
];

  // Predefined color palette for better visual distinction
  private readonly subjectColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#FF9F43', '#6C5CE7', '#FD79A8', '#00B894', '#0984E3', '#00CEC9',
    '#E84393', '#FDCB6E', '#A29BFE', '#55A3FF', '#FF7675', '#74B9FF',
    '#81ECEC', '#00B894', '#FDCB6E', '#E17055', '#6C5CE7', '#FD79A8'
  ];

  constructor(
    private timetableService: TimetableService,
    private classesService: ClassesService,
    private teacherService: TeacherService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeForms();
    this.initializeTimeSlots();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.subscribeToTimetableUpdates();
    
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.timetableForm = this.fb.group({
      classId: ['', Validators.required],
      scheduleId: ['', [Validators.required, Validators.maxLength(100)]],
      constraints: ['{}']
    });

    this.constraintsForm = this.fb.group({
      maxperiodsPerDay: [8, [Validators.required, Validators.min(1), Validators.max(10)]],
      avoidDoubleBooking: [true],
      spreadSubjectsEvenly: [true],
      respectrestrictedPeriods: [true],
      balanceWorkload: [false],
      allowConsecutiveClasses: [false]
    });
  }

private initializeTimeSlots(): void {
  this.timeSlots = [];
  for (let period = 1; period <= this.maxperiodsPerDay; period++) { // Fixed: maxperiodsPerDay -> maxPeriodsPerDay
    const timeSlot: TimeSlotView = {
      period,
      time: this.timetableService.formatPeriodTime(period), // Fixed: formatperiodTime -> formatPeriodTime
      slots: {}
    };
    
    this.weekDays.forEach(day => {
      timeSlot.slots[day.key] = null;
    });
    
    this.timeSlots.push(timeSlot);
  }
}

  private loadInitialData(): void {
    this.isLoading = true;
    
    forkJoin({
      classes: this.classesService.getClasses(),
      teachers: this.teacherService.getTeachers(),
      timetables: this.timetableService.getAllTimetables()
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => {
        this.classes = data.classes.items;
        this.teachers = data.teachers.items;
        this.timetables = data.timetables;
        this.showSuccessMessage('تم تحميل البيانات بنجاح');
      },
      error: (error: any) => {
        this.handleApiError(error, 'فشل في تحميل البيانات');
      }
    });
  }

  private subscribeToTimetableUpdates(): void {
    this.timetableService.currentTimetable$
      .pipe(takeUntil(this.destroy$))
      .subscribe(timetable => {
        this.currentTimetable = timetable;
        this.updateTimeSlotView();
        if (timetable) {
          this.validateCurrentTimetable();
        }
      });

    this.timetableService.timetables$
      .pipe(takeUntil(this.destroy$))
      .subscribe(timetables => {
        this.timetables = timetables;
      });

    this.timetableService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  // ===============================
  // TEACHER CONFLICT CHECKING METHODS
  // ===============================

  /**
   * تحقق من تضارب المدرس قبل إضافته لحصة معينة
   */
  private async checkTeacherConflictBeforeAssignment(
  teacherId: number,
  dayOfWeek: DayOfWeek,
  period: number,
  currentClassId: number
): Promise<boolean> {
  try {
    const conflictCheck = {
      teacherId,
      dayOfWeek,
      period,
      classId: currentClassId
    };

    const result = await this.timetableService.checkTeacherConflict(conflictCheck).toPromise();
    return result?.isAvailable || false;
  } catch (error) {
    console.error('Error checking teacher conflict:', error);
    return false; // Return false if there's an error to be safe
  }
}

  /**
   * Resolve single conflict
   */
  async resolveConflict(conflict: ConflictDto): Promise<void> {
    if (!this.currentTimetable) {
      this.showErrorMessage('No active timetable to resolve conflicts');
      return;
    }

    try {
      const result = await this.timetableService.resolveConflicts(
        this.currentTimetable.id, 
        [conflict]
      ).toPromise();

      if (result?.success) {
        this.showSuccessMessage(`Conflict resolved: ${result.message}`);
        this.validateCurrentTimetable(); // Re-validate
        this.refreshCurrentTimetable(this.currentTimetable.id);
      } else {
        this.showWarningMessage(`Could not resolve conflict: ${result?.message || 'Unknown error'}`);
      }
    } catch (error) {
      this.handleApiError(error, 'Failed to resolve conflict');
    }
  }

  /**
   * Resolve all conflicts automatically
   */
  async resolveAllConflicts(): Promise<void> {
    if (!this.currentTimetable || this.conflicts.length === 0) {
      this.showErrorMessage('لا توجد تضاربات لحلها');
      return;
    }

    try {
      const result = await this.timetableService.resolveConflicts(
        this.currentTimetable.id,
        this.conflicts
      ).toPromise();

      if (result?.success) {
        this.showSuccessMessage(
          `تم حل ${result.resolvedCount} تضارب، ${result.unresolvedCount} باقية لم تحل`
        );
        this.validateCurrentTimetable(); // Re-validate
        this.refreshCurrentTimetable(this.currentTimetable.id);
      } else {
        this.showWarningMessage(`فشل الحل التلقائي: ${result?.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      this.handleApiError(error, 'فشل في حل التضاربات تلقائياً');
    }
  }

  /**
   * Enhanced drag over handler
   */
 onDragOverEnhanced(event: DragEvent, targetperiod: number, targetDay: string): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    // Add visual feedback
    const cell = event.currentTarget as HTMLElement;
    cell.classList.add('drag-over');
  }
  /**
   * Enhanced drag leave handler
   */
 onDragLeave(event: DragEvent): void {
    const cell = event.currentTarget as HTMLElement;
    cell.classList.remove('drag-over');
  }
async onRemoveSlot(period: number, day: string): Promise<void> {
  const timeSlot = this.timeSlots.find(ts => ts.period === period);
  if (!timeSlot || !timeSlot.slots[day]) return;

  const removedSlot = timeSlot.slots[day];

  // SweetAlert confirmation
  const result = await Swal.fire({
    title: 'هل أنت متأكد؟',
    text: `هل تريد حقاً حذف ${removedSlot.subjectName} من ${day} الحصة ${period}؟`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذفها!',
    cancelButtonText: 'إلغاء',
  });

  if (result.isConfirmed) {
    try {
      // شيل من الـ UI
      delete timeSlot.slots[day];

      // نادِ على السيرفيس
      await this.timetableService.removeSlot(removedSlot.id).toPromise();

      this.showSuccessMessage(
        `تم حذف ${removedSlot.subjectName} من ${day} الحصة ${period}`
      );

      Swal.fire('تم الحذف!', 'تم حذف الحصة.', 'success');
    } catch (error) {
      console.error('Error removing slot:', error);
      this.showErrorMessage('فشل في حذف الحصة');
      Swal.fire('خطأ', 'فشل في حذف الحصة.', 'error');
    }
  }
}
  /**
   * تحديث فانكشن onDrop لتشمل فحص التضارب
   */
// النسخة المُحدثة مع فحص التضارب في كل الكلاسات

// النسخة المُحدثة مع فحص التضارب في كل الكلاسات

async onDropWithConflictCheck(
  event: DragEvent, 
  classId: number, 
  timetableId: number, 
  targetPeriod: number, 
  targetDay: string
): Promise<void> {
  event.preventDefault();
  
  console.log('🚀 DROP EVENT STARTED');
  console.log('Parameters:', { classId, timetableId, targetPeriod, targetDay });
  
  // إزالة drag-over class
  const cell = event.currentTarget as HTMLElement;
  cell.classList.remove('drag-over');

  try {
    const dragData = JSON.parse(event.dataTransfer?.getData('application/json') || '{}');
    const subject = dragData.subject as Subject;
    console.log('📦 Drag data:', dragData);
    console.log('📚 Subject:', subject);

    if (!subject || !classId) {
      console.log('❌ Invalid drop operation');
      this.showErrorMessage('عملية إسقاط غير صحيحة');
      return;
    }

    // العثور على المدرس المناسب للمادة
    const classTeachers = this.getTeachersForClass(classId);
    console.log('👥 Class teachers:', classTeachers);
    
    const teacher = classTeachers.find((t: AssignedTeacherDto) => t.subject === subject.name);
    console.log('👨‍🏫 Found teacher:', teacher);

    if (!teacher) {
      console.log('❌ No teacher found');
      this.showErrorMessage(`لم يتم العثور على مدرس للمادة ${subject.name} في هذا الفصل`);
      return;
    }

    // البحث عن اليوم المناسب
    const targetDayObj = this.weekDays.find(d => d.key === targetDay);
    console.log('📅 Target day object:', targetDayObj);

    if (!targetDayObj) {
      console.log('❌ Invalid day');
      this.showErrorMessage(`يوم غير صحيح: ${targetDay}`);
      return;
    }

    // التحقق من restrictedPeriods
    console.log('🔒 Checking restricted periods...');
    const isTeacherAvailable = this.isTeacherAvailableForPeriod(teacher, targetDayObj, targetPeriod);
    console.log('🔒 Teacher available:', isTeacherAvailable);
    
    if (!isTeacherAvailable) {
      console.log('❌ Teacher not available (restricted)');
      
      // عرض alert للفترات المحظورة
      Swal.fire({
        title: 'المدرس غير متاح!',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0; color: #721c24; font-size: 14px;">
                <strong>${teacher.name}</strong> غير متاح خلال 
                <strong>${targetDayObj.label} الحصة ${targetPeriod}</strong>
              </p>
              <p style="margin: 8px 0 0 0; color: #721c24; font-size: 13px;">
                هذا الوقت <strong>محظور</strong> للمدرس.
              </p>
            </div>
            <p style="color: #666; font-size: 13px; margin-top: 15px;">
              يرجى اختيار وقت مختلف أو تعيين مدرس آخر.
            </p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'فهمت',
        confirmButtonColor: '#dc3545',
        width: '500px'
      });
      return;
    }

    // 🚨 فحص تضارب المدرس في كل الكلاسات - النسخة الجديدة
    console.log('🔍 Checking teacher schedule conflict across ALL classes...');
    
    const teacherConflict = await this.checkTeacherConflictAcrossAllClasses(teacher.id || 0, targetPeriod, targetDay, classId);
    console.log('🔍 Conflict result:', teacherConflict);
    
    if (teacherConflict) {
      console.log('⚠️ CONFLICT DETECTED! Teacher busy in another class');
      
      // عرض رسالة التضارب
      Swal.fire({
        title: 'تضارب في جدول المدرس!',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>${teacher.name}</strong> يدرّس بالفعل 
                <strong>"${teacherConflict.subjectName}"</strong> 
                في <strong>${teacherConflict.className}</strong>
                خلال <strong>${targetDayObj.label} الحصة ${targetPeriod}</strong>
              </p>
            </div>
            <p style="color: #666; font-size: 13px; margin-top: 15px;">
              يرجى اختيار وقت مختلف أو تعيين مدرس آخر.
            </p>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'فهمت',
        confirmButtonColor: '#f39c12',
        width: '500px'
      });
      return; // إيقاف العملية - مش هنضيف حاجة
    }

    console.log('✅ No conflict detected, proceeding...');

    // باقي الكود للإضافة...
    console.log('📝 Creating slot...');
    
    const newSlot = {
      classId: classId,
      timetableId: timetableId,
      period: targetPeriod,
      dayOfWeek: targetDayObj.value,
      subjectId: subject.id,
      teacherId: teacher.id || 0
    };

    console.log('📝 New slot data:', newSlot);

    // إرسال الطلب للباك إند
    this.timetableService.addSlot(newSlot).subscribe({
      next: (res) => {
        console.log('✅ Slot added successfully:', res);
        
        // تحديث الـ UI
        const timeSlot = this.timeSlots.find(ts => ts.period === targetPeriod);
        if (timeSlot) {
          timeSlot.slots[targetDay] = {
            id: res.id,
            period: targetPeriod,
            dayOfWeek: newSlot.dayOfWeek,
            subjectId: subject.id,
            subjectName: subject.name,
            teacherId: teacher.id || 0,
            teacherName: teacher.name,
            createdAt: new Date().toISOString()
          };
        }

        this.showSuccessMessage(`تم إضافة ${subject.name} إلى ${targetDayObj.label} الحصة ${targetPeriod}`);
      },
      error: (err) => {
        console.error('❌ Error saving slot:', err);
        this.showErrorMessage('فشل في حفظ الحصة');
      }
    });

  } catch (error) {
    console.error('❌ Error processing drop:', error);
    this.showErrorMessage('فشل في إضافة المادة');
  }
}

// 🆕 الطريقة الجديدة - فحص التضارب في كل الكلاسات (مُصححة)
private async checkTeacherConflictAcrossAllClasses(
  teacherId: number, 
  targetPeriod: number, 
  targetDay: string, 
  currentClassId: number  // ✅ Changed parameter name for clarity
): Promise<{subjectName: string, className: string} | null> {
  
  console.log('🔍 === CHECKING CONFLICTS ACROSS ALL CLASSES ===');
  console.log('🔍 Teacher ID:', teacherId);
  console.log('🔍 Target Period:', targetPeriod);
  console.log('🔍 Target Day:', targetDay);
  console.log('🔍 Current Class ID:', currentClassId);  // ✅ Updated log

  try {
    // استخدام checkTeacherConflict function الموجودة
    const conflictDto: CheckTeacherConflictDto = {
      teacherId: teacherId,
      dayOfWeek: this.getDayOfWeekFromString(targetDay),
      period: targetPeriod,
      classId: currentClassId  // ✅ Fixed: Using the correct parameter
    };
    
    const conflictResponse = await this.timetableService.checkTeacherConflict(conflictDto).toPromise();
    
    if (conflictResponse && !conflictResponse.isAvailable) {
      // المدرس مشغول في فصل تاني
      console.log('⚠️ CONFLICT FOUND:', conflictResponse);
      
      return {
        subjectName: conflictResponse.conflictingSubjectName || 'مادة غير معروفة',
        className: conflictResponse.conflictingClassName || 'فصل غير معروف'
      };
    }
    
    console.log('✅ No conflicts found');
    return null;
    
  } catch (error) {
    console.error('❌ Error checking teacher schedule:', error);
    
    // في حالة فشل API call، نستخدم الطريقة القديمة كـ fallback
    console.log('🔄 Falling back to local conflict check...');
    return this.checkTeacherScheduleConflictLocal(teacherId, targetPeriod, targetDay);
  }
}
// 🔄 الطريقة القديمة كـ fallback (في حالة فشل API)
private checkTeacherScheduleConflictLocal(
  teacherId: number, 
  targetPeriod: number, 
  targetDay: string
): {subjectName: string, className: string} | null {
  
  console.log('🔍 === LOCAL CONFLICT CHECK ===');
  
  // فحص في الـ timeSlots المحلية
  const timeSlot = this.timeSlots.find(ts => ts.period === targetPeriod);
  
  if (!timeSlot) {
    return null;
  }

  // شوف في كل أيام الأسبوع في نفس الفترة
  for (const [dayKey, slot] of Object.entries(timeSlot.slots)) {
    if (slot && slot.teacherId === teacherId && dayKey === targetDay) {
      return {
        subjectName: slot.subjectName || 'مادة غير معروفة',
        className: 'الفصل الحالي' // مش عارفين اسم الفصل من البيانات المحلية
      };
    }
  }

  return null;
}

// 🧪 طريقة للاختبار
testTeacherConflictCheck(teacherId: number = 1, period: number = 1, day: string = 'monday', classId: number = 1) {
  console.log('🧪 Testing teacher conflict check...');
  
  this.checkTeacherConflictAcrossAllClasses(teacherId, period, day, classId)
    .then(result => {
      if (result) {
        console.log('🧪 Test Result - CONFLICT:', result);
        Swal.fire('نتيجة الاختبار', `تم العثور على تضارب: ${result.subjectName} في ${result.className}`, 'warning');
      } else {
        console.log('🧪 Test Result - NO CONFLICT');
        Swal.fire('نتيجة الاختبار', 'لا توجد تضاربات', 'success');
      }
    })
    .catch(err => {
      console.error('🧪 Test Error:', err);
    });
}

// Helper function لتحويل string إلى DayOfWeek enum
private getDayOfWeekFromString(dayString: string): DayOfWeek {
  const dayMap: { [key: string]: DayOfWeek } = {
    'sunday': DayOfWeek.Sunday,
    'monday': DayOfWeek.Monday,
    'tuesday': DayOfWeek.Tuesday,
    'wednesday': DayOfWeek.Wednesday,
    'thursday': DayOfWeek.Thursday,
    'friday': DayOfWeek.Friday,
    'saturday': DayOfWeek.Saturday
  };
  
  return dayMap[dayString.toLowerCase()] || DayOfWeek.Sunday;
}

isTeacherAvailableForPeriod(teacher: AssignedTeacherDto, dayObj: WeekDay, period: number): boolean {
  if (!teacher.restrictedPeriods || teacher.restrictedPeriods.length === 0) {
    return true; // إذا مافيش قيود، المدرس متاح
  }

  // تكوين string للفحص - يمكن يكون التنسيق مختلف حسب الباك إند
  // جرب الأشكال دي:
  const formats = [
    `${dayObj.key}-${period}`,           // "sunday-1"
    `${dayObj.label}-${period}`,         // "Sun-1"  
    `${dayObj.value}-${period}`,         // "0-1"
    `${DayOfWeek[dayObj.value]}-${period}` // "Sunday-1"
  ];
  
  return !formats.some(format => teacher.restrictedPeriods!.includes(format));
}


  getTimetableHealthStatus(): 'healthy' | 'warning' | 'critical' {
    if (!this.currentTimetable) return 'critical';
    
    const conflictCount = this.conflicts.length;
    const utilizationRate = this.getTotalScheduledHours() / (5 * 8); // 5 days * 8 periods
    
    if (conflictCount === 0 && utilizationRate > 0.7) {
      return 'healthy';
    } else if (conflictCount <= 2 && utilizationRate > 0.5) {
      return 'warning';
    } else {
      return 'critical';
    }
  }

 
  /**
   * Get health status message
   */
  getHealthStatusColor(): string {
    const status = this.getTimetableHealthStatus();
    return {
      'healthy': '#4caf50',
      'warning': '#ff9800', 
      'critical': '#f44336'
    }[status] || '#666';
  }

  /**
   * Get health status message
   */
  getHealthStatusMessage(): string {
    const status = this.getTimetableHealthStatus();
    const messages = {
      'healthy': 'الجدول محسّن وخالي من التضاربات',
      'warning': 'الجدول يحتوي على مشاكل بسيطة لكنه قابل للاستخدام',
      'critical': 'الجدول يحتوي على تضاربات كبيرة تحتاج إلى انتباه'
    };
    return messages[status] || 'الحالة غير معروفة';
  }

  /**
   * Calculate timetable efficiency score
   */
  getEfficiencyScore(): number {
    if (!this.currentTimetable || !this.statistics) return 0;
    
    const utilizationScore = (this.statistics.filledSlots / (5 * 8)) * 40; // 40% weight
    const conflictPenalty = Math.min(this.conflicts.length * 5, 30); // max 30% penalty
    const distributionScore = this.calculateDistributionScore() * 30; // 30% weight
    
    return Math.max(0, Math.min(100, utilizationScore - conflictPenalty + distributionScore));
  }

  /**
   * Calculate how evenly subjects are distributed
   */
  private calculateDistributionScore(): number {
    if (!this.statistics?.dailyDistribution) return 0;
    
    const dailyCounts = Object.values(this.statistics.dailyDistribution);
    if (dailyCounts.length === 0) return 0;
    
    const average = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
    const variance = dailyCounts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / dailyCounts.length;
    
    // Lower variance = better distribution = higher score
    return Math.max(0, 1 - (variance / Math.pow(average, 2)));
  }


  /**
   * Get suggestions for improvement
   */
   getImprovementSuggestions(): string[] {
    const suggestions: string[] = [];
    
    if (this.conflicts.length > 0) {
      suggestions.push(`احلل ${this.conflicts.length} تضارب لتحسين جودة الجدول`);
    }
    
    const utilizationRate = this.getTotalScheduledHours() / (5 * 8);
    if (utilizationRate < 0.6) {
      suggestions.push('فكّر في إضافة مواد أكثر لاستغلال الأوقات المتاحة بشكل أفضل');
    }
    
    if (this.statistics?.dailyDistribution) {
      const dailyCounts = Object.values(this.statistics.dailyDistribution);
      const max = Math.max(...dailyCounts);
      const min = Math.min(...dailyCounts);
      
      if (max - min > 3) {
        suggestions.push('أعد توزيع المواد بشكل أكثر توازناً عبر أيام الأسبوع');
      }
    }
    
    if (this.hasUnassignedSubjects(this.selectedClassId!)) {
      suggestions.push('قم بتعيين مدرسين للمواد غير المعينة');
    }
    
    return suggestions;
  }

 
  getEfficiencyScoreDisplay(): string {
    const score = this.getEfficiencyScore();
    if (score >= 80) return `${score.toFixed(1)}% (ممتاز)`;
    if (score >= 60) return `${score.toFixed(1)}% (جيد)`;
    if (score >= 40) return `${score.toFixed(1)}% (مقبول)`;
    return `${score.toFixed(1)}% (ضعيف)`;
  }

  /**
   * Get CSS class for efficiency score
   */
  getEfficiencyScoreClass(): string {
    const score = this.getEfficiencyScore();
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  }

  // Updated method using API instead of local data generation
 getAvailableSubjectsForClass(classId: number): Subject[] {
    // Return cached data if available
    if (this.classSubjectsCache.has(classId)) {
      return this.classSubjectsCache.get(classId)!;
    }
    
    // Load from API if not cached
    this.loadSubjectsForClass(classId);
    return [];
  }

  // New API-based method to load subjects for a specific class
  loadSubjectsForClass(classId: number): void {
    this.timetableService.getSubjectsWithTeachersForClass(classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiSubjects) => {
          const subjects: Subject[] = apiSubjects.map(apiSubject => ({
            id: apiSubject.subjectId,
            name: apiSubject.subjectName,
            teacher: apiSubject.teacherName,
            color: apiSubject.subjectColor || this.generateSubjectColor(apiSubject.subjectName),
            hoursPerWeek: apiSubject.hoursPerWeek,
            teacherId: apiSubject.teacherId,
            isAssigned: apiSubject.isAssigned
          }));
          
          // Cache the results
          this.classSubjectsCache.set(classId, subjects);
          
          // Update the subjects property for template binding
          this.subjects = subjects;
          
          console.log(`Loaded ${subjects.length} subjects for class ${classId}:`, subjects);
        },
        error: (error) => {
          this.handleApiError(error, 'فشل في تحميل مواد هذا الفصل');
          this.classSubjectsCache.set(classId, []);
        }
      });
  }

  // Updated method using API-based data
  getTeachersForClass(classId: number): AssignedTeacherDto[] {
    // Return cached data if available
    if (this.classTeachersCache.has(classId)) {
      return this.classTeachersCache.get(classId)!;
    }
    
    // Load from API if not cached
    this.loadTeachersForClass(classId);
    return [];
  }

  // إضافة method جديد للحصول على بيانات المدرس مع الـ restricted periods
  private getTeacherWithrestrictedPeriods(teacherId: number): Observable<AssignedTeacherDto> { // Fixed: restrictedPeriods -> restrictedPeriods
  return this.teacherService.getTeacherById(teacherId).pipe(
    map((teacher: Teacher) => ({
      id: teacher.id || teacherId,
      name: teacher.name,
      subject: teacher.subject,
      email: undefined,
      phone: undefined,
      restrictedPeriods: teacher.restrictedPeriods || [] // Fixed: restrictedPeriods -> restrictedPeriods
    }))
  );
}

  // Also update the loadTeachersForClass method to handle the types properly:
  loadTeachersForClass(classId: number): void {
    this.timetableService.getAssignedTeachersForClass(classId)
      .pipe(
        switchMap((teachers: AssignedTeacherDto[]) => {
          // Get the restricted periods for each teacher
          const teacherDetailsRequests = teachers.map(teacher => 
            this.getTeacherWithrestrictedPeriods(teacher.id).pipe(
              map((fullTeacher: AssignedTeacherDto) => ({
                ...teacher,
                restrictedPeriods: fullTeacher.restrictedPeriods
              }))
            )
          );
          return forkJoin(teacherDetailsRequests);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (teachers: AssignedTeacherDto[]) => {
          this.classTeachersCache.set(classId, teachers);
          this.assignedTeachers = teachers;
          console.log(`Loaded ${teachers.length} teachers with restrictions for class ${classId}:`, teachers);
        },
        error: (error) => {
          console.error('Error fetching teachers for class:', error);
          this.classTeachersCache.set(classId, []);
          this.assignedTeachers = [];
        }
      });
  }

  // Updated onClassChange method
  onClassChange(event?: any): void {
    const classValue = event?.value || this.selectedClass;
    const selectedClassObj = this.classes.find(c => 
      `${c.grade}/${c.section}` === classValue || c.id?.toString() === classValue
    );
    
    if (selectedClassObj) {
      this.selectedClassId = selectedClassObj.id || null;
      this.selectedClass = `${selectedClassObj.grade}/${selectedClassObj.section}`;
      
      if (this.selectedClassId) {
        // Clear current timetable when switching classes
        this.currentTimetable = null;
        this.clearTimeSlots();
        
        // Load class-specific data from API
        this.loadSubjectsForClass(this.selectedClassId);
        this.loadTeachersForClass(this.selectedClassId);
        this.loadActiveTimetableForClass(this.selectedClassId);
        
        // Generate new schedule ID for potential new timetable
        this.timetableForm.patchValue({
          classId: this.selectedClassId,
          scheduleId: this.timetableService.generateScheduleId()
        });
      }
    }
  }

  // Helper methods for checking loaded data
  hasSubjectsLoaded(classId: number): boolean {
    return this.classSubjectsCache.has(classId) && 
           this.classSubjectsCache.get(classId)!.length > 0;
  }

  hasTeachersLoaded(classId: number): boolean {
    return this.classTeachersCache.has(classId) && 
           this.classTeachersCache.get(classId)!.length > 0;
  }

  // Updated template condition method
hasSubjects(classId: number): boolean {
  return this.subjects && this.subjects.length > 0;
}

  // Updated to check both subjects and teachers
  isClassDataLoaded(classId: number): boolean {
    return this.hasSubjectsLoaded(classId) && this.hasTeachersLoaded(classId);
  }

  private generateSubjectColor(subjectName: string): string {
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
      const char = subjectName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const index = Math.abs(hash) % this.subjectColors.length;
    return this.subjectColors[index];
  }

  // ===============================
  // UPDATED TIMETABLE GENERATION METHODS WITH RESTRICTED periodS
  // ===============================

  generateRandomTimetable(): void {
  if (!this.selectedClassId) {
    this.showErrorMessage('يرجى اختيار فصل أولاً');
    return;
  }

  if (!this.isClassDataLoaded(this.selectedClassId)) {
    this.showErrorMessage('لا تزال بيانات الفصل قيد التحميل. يرجى الانتظار...');
    return;
  }

  this.clearTimeSlots();
  this.isLoading = true;
  
  this.generateRandomTimetableAsync().then(() => {
    this.isLoading = false;
  }).catch((error) => {
    this.isLoading = false;
    this.handleApiError(error, 'فشل في إنشاء جدول عشوائي');
  });
}

private async generateRandomTimetableAsync(): Promise<void> {
  const timetableSlots: AddTimetableSlotDto[] = [];
  
  const classSubjects = this.subjects;
  const classTeachers = this.assignedTeachers;
  
  if (classSubjects.length === 0) {
    this.showErrorMessage('لم يتم العثور على مواد لهذا الفصل');
    return;
  }

  if (classTeachers.length === 0) {
    this.showErrorMessage('لا يوجد مدرسون معينون لهذا الفصل');
    return;
  }

  // Create subject pool with proper distribution
  const subjectPool: {subject: Subject, teacher: AssignedTeacherDto}[] = [];
  classSubjects.forEach(subject => {
    if (subject.isAssigned) {
      const teacher = classTeachers.find((t: AssignedTeacherDto) => t.subject === subject.name);
      if (teacher) {
        const hoursPerWeek = subject.hoursPerWeek || 1;
        for (let i = 0; i < hoursPerWeek; i++) {
          subjectPool.push({subject, teacher});
        }
      }
    }
  });

  const shuffledPool = this.shuffleArray([...subjectPool]);
  let poolIndex = 0;

  // Enhanced placement with comprehensive conflict checking
  for (const timeSlot of this.timeSlots) {
    for (const day of this.weekDays) {
      if (Math.random() > 0.3 && poolIndex < shuffledPool.length) {
        const poolItem = shuffledPool[poolIndex];
        
        // Check all constraints before assignment
        const isValidAssignment = await this.validateTeacherAssignment(
          poolItem.teacher,
          day,
          timeSlot.period,
          this.selectedClassId!
        );

        if (isValidAssignment) {
          const mockSlot: TimetableSlotDto = {
            id: Math.floor(Math.random() * 10000),
            period: timeSlot.period,
            dayOfWeek: day.value,
            subjectId: poolItem.subject.id,
            subjectName: poolItem.subject.name,
            teacherId: poolItem.teacher.id || 0,
            teacherName: poolItem.teacher.name,
            createdAt: new Date().toISOString()
          };
          
          timeSlot.slots[day.key] = mockSlot;
          
          timetableSlots.push({
            period: timeSlot.period,
            dayOfWeek: day.value,
            subjectId: mockSlot.subjectId,
            teacherId: mockSlot.teacherId
          });
          
          poolIndex++;
        }
      }
    }
  }

  // Create timetable via API
  const addTimetableDto: AddTimeTableDto = {
    classId: this.selectedClassId!,
    scheduleId: this.timetableService.generateScheduleId(),
    constraints: JSON.stringify(this.getConstraintsFromForm()),
    timetableSlots
  };

  try {
    const timetable = await this.timetableService.createTimetable(addTimetableDto).toPromise();
    this.showSuccessMessage('تم إنشاء جدول عشوائي بنجاح');
    this.loadStatistics(timetable!.id);
  } catch (error) {
    this.handleApiError(error, 'فشل في إنشاء جدول عشوائي');
  }
}

private async validateTeacherAssignment(
  teacher: AssignedTeacherDto,
  day: WeekDay,
  period: number,
  classId: number
): Promise<boolean> {
  // 1. Check restricted periods
  if (!this.isTeacherAvailableForperiod(teacher, day, period)) {
    return false;
  }

  // 2. Check conflict across all classes
  const isAvailableAcrossClasses = await this.checkTeacherConflictBeforeAssignment(
    teacher.id || 0,
    day.value,
    period,
    classId
  );

  if (!isAvailableAcrossClasses) {
    return false;
  }

  return true;
}







 

  // ===============================
  // UPDATED SMART DISTRIBUTION METHOD WITH RESTRICTED periodS
  // ===============================
 
  // إضافة فنكشن جديدة لفحص restrictedPeriods
    private isTeacherAvailableForperiod(teacher: AssignedTeacherDto, day: WeekDay, period: number): boolean {
    const currentDayKey = day.key.substring(0, 3).toLowerCase(); // sun, mon, tue, etc.
    
    // لو مافيش بيانات restricted periods، المدرس متاح
    if (!teacher.restrictedPeriods || teacher.restrictedPeriods.length === 0) {
      return true;
    }

    // فحص كل فترة محظورة
    for (const restrictedperiod of teacher.restrictedPeriods) {
      const parts = restrictedperiod.trim().toLowerCase().split('-');
      if (parts.length !== 2) continue;

      const restrictedDay = parts[0].trim();
      const restrictedperiodNumber = parseInt(parts[1].trim());

      if (restrictedDay === currentDayKey && restrictedperiodNumber === period) {
        return false; // المدرس غير متاح في هذه الفترة
      }
    }

    return true;
  }







  

  private getDayKeyFromEnum(dayOfWeek: DayOfWeek): string | null {
    const day = this.weekDays.find(d => d.value === dayOfWeek);
    return day ? day.key : null;
  }

  
  // Helper method to shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ===============================
  // API INTEGRATION METHODS
  // ===============================

  loadTimetables(): void {
    this.timetableService.getAllTimetables().subscribe({
      next: (timetables) => {
        this.showSuccessMessage('Timetables loaded successfully');
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to load timetables');
      }
    });
  }

  loadTimetablesByClass(classId: number): void {
    this.selectedClassId = classId;
    this.timetableService.getTimetablesByClass(classId).subscribe({
      next: (timetables) => {
        this.timetables = timetables;
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to load timetables for class');
      }
    });
  }

  loadActiveTimetableForClass(classId: number): void {
    this.timetableService.getActiveTimetableByClass(classId).subscribe({
      next: (timetable) => {
        this.currentTimetable = timetable;
        this.updateTimeSlotView();
        this.loadStatistics(timetable.id);
      },
      error: (error: any) => {
        this.currentTimetable = null;
        this.clearTimeSlots();
        console.log('No active timetable found for this class');
      }
    });
  }


  /**
   * تحديث createManualTimetable لتشمل الfvalidation
   */


  /**
   * إضافة validation قبل حفظ أي timetable
   */
  async validateBeforeSave(): Promise<boolean> {
    if (!this.selectedClassId) {
      return false;
    }

    let hasConflicts = false;
    const conflictMessages: string[] = [];

    // فحص كل slot في الجدول الحالي
    for (const timeSlot of this.timeSlots) {
      for (const day of this.weekDays) {
        const slot = timeSlot.slots[day.key];
        if (slot && slot.teacherId) {
          const isAvailable = await this.checkTeacherConflictBeforeAssignment(
            slot.teacherId,
            day.value,
            timeSlot.period,
            this.selectedClassId
          );
          
          if (!isAvailable) {
            hasConflicts = true;
            conflictMessages.push(
              `${slot.teacherName} has conflict on ${day.label} period ${timeSlot.period}`
            );
          }
        }
      }
    }

    if (hasConflicts) {
      const message = `Found conflicts:\n${conflictMessages.join('\n')}`;
      this.showErrorMessage(message);
      return false;
    }

    return true;
  }


 

  validateCurrentTimetable(): void {
    if (!this.currentTimetable) return;

    this.timetableService.validateTimetable(this.currentTimetable.id).subscribe({
      next: (conflicts) => {
        this.conflicts = conflicts;
        this.hasConflicts = conflicts.length > 0;
        if (this.hasConflicts) {
          this.showWarningMessage(`Found ${conflicts.length} conflict(s) in the timetable`);
        }
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to validate timetable');
      }
    });
  }

  loadStatistics(timetableId: number): void {
    this.timetableService.getTimetableStatistics(timetableId).subscribe({
      next: (statistics) => {
        this.statistics = statistics;
      },
      error: (error: any) => {
        console.error('Failed to load statistics:', error);
      }
    });
  }

  swapTimeSlots(slot1: SlotPosition, slot2: SlotPosition): void {
    if (!this.currentTimetable) return;

    const request: SwapSlotsRequest = { slot1, slot2 };

    this.timetableService.swapTimeSlots(this.currentTimetable.id, request).subscribe({
      next: (response) => {
        this.showSuccessMessage(response.message);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to swap slots');
      }
    });
  }

  toggleTimetableStatus(id: number, isActive: boolean): void {
    this.timetableService.updateTimetableStatus(id, { isActive }).subscribe({
      next: (timetable) => {
        this.showSuccessMessage(`Timetable ${isActive ? 'activated' : 'deactivated'} successfully`);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to update timetable status');
      }
    });
  }

  // ===============================
  // VIEW UPDATE METHODS
  // ===============================

  private updateTimeSlotView(): void {
    if (!this.currentTimetable) {
      this.clearTimeSlots();
      return;
    }

    // Clear existing slots
    this.initializeTimeSlots();

    // Populate slots with timetable data
    this.currentTimetable.timetableSlots.forEach(slot => {
      const timeSlot = this.timeSlots.find(ts => ts.period === slot.period);
      const dayKey = this.getDayKey(slot.dayOfWeek);
      
      if (timeSlot && dayKey) {
        timeSlot.slots[dayKey] = slot;
      }
    });
  }

  private clearTimeSlots(): void {
    this.timeSlots.forEach(timeSlot => {
      this.weekDays.forEach(day => {
        timeSlot.slots[day.key] = null;
      });
    });
  }

  private getDayKey(dayOfWeek: DayOfWeek): string | null {
    const day = this.weekDays.find(d => d.value === dayOfWeek);
    return day ? day.key : null;
  }

  // Helper method to reload/refresh timetable data
  refreshCurrentTimetable(timetableId: number): void {
    this.timetableService.getTimetableById(timetableId).subscribe({
      next: (timetable) => {
        this.currentTimetable = timetable;
        this.updateTimeSlotView();
        this.loadStatistics(timetable.id);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to refresh timetable');
      }
    });
  }

  // ===============================
  // FORM HELPER METHODS
  // ===============================

 private getConstraintsFromForm(): TimetableConstraints {
  const formValue = this.constraintsForm.value;
  return {
    avoidDoubleBooking: formValue.avoidDoubleBooking || false,
    spreadSubjectsEvenly: formValue.spreadSubjectsEvenly || false,
    respectRestrictedPeriods: formValue.respectrestrictedPeriods || false, // Fixed: respectrestrictedPeriods -> respectrestrictedPeriods
    balanceWorkload: formValue.balanceWorkload || false,
    allowConsecutiveClasses: formValue.allowConsecutiveClasses || false
  };
}

  // ===============================
  // UI EVENT HANDLERS
  // ===============================

 

  // ===============================
  // DRAG AND DROP METHODS (UPDATED)
  // ===============================

  onDragStart(subject: Subject, event: DragEvent, period?: number, day?: string): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({
        subject,
        sourceperiod: period,
        sourceDay: day
      }));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(): void {
    // Handle drag end if needed
  }

onDragOver(event: DragEvent): void {
  event.preventDefault();
}
  // Updated drag and drop method using API data
onDrop(event: DragEvent, classId: number, timetableId: number, targetPeriod: number, targetDay: string): void {
  // Remove visual feedback
  const cell = event.currentTarget as HTMLElement;
  cell.classList.remove('drag-over');

  // Call enhanced version with all required arguments
  this.onDropWithConflictCheck(event, classId, timetableId, targetPeriod, targetDay);
}


  // ===============================
  // CONSTRAINT HANDLING METHODS
  // ===============================

  onConstraintSelectionChange(): void {
    // Handle constraint selection change if needed
  }

  getConstraintLabel(constraint: keyof TimetableConstraints): string {
    const option = this.constraintOptions.find(opt => opt.value === constraint);
    return option ? option.label : constraint;
  }

  removeConstraint(constraint: keyof TimetableConstraints): void {
    this.selectedConstraints = this.selectedConstraints.filter(c => c !== constraint);
  }

  // ===============================
  // DRAWER AND MODAL METHODS
  // ===============================

  

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }



  // ===============================
  // UTILITY METHODS
  // ===============================

  removeSubject(period: number, day: string): void {
    const timeSlot = this.timeSlots.find(ts => ts.period === period);
    if (timeSlot) {
      const removedSubject = timeSlot.slots[day];
      timeSlot.slots[day] = null;
      if (removedSubject) {
        this.showSuccessMessage(`${removedSubject.subjectName} removed from ${day} period ${period}`);
      }
    }
  }

 getSubjectForSlot(timeSlot: TimeSlotView, dayKey: string): TimetableSlotDto | null {
  return timeSlot.slots[dayKey];
}

getSlotForPeriodAndDay(period: number, day: string): TimetableSlotDto | null { // Fixed: getSlotForperiodAndDay -> getSlotForPeriodAndDay
  const timeSlot = this.timeSlots.find(ts => ts.period === period);
  return timeSlot ? timeSlot.slots[day] : null;
}


 getPeriodTime(period: number): string { // Fixed: getperiodTime -> getPeriodTime
  return this.timetableService.formatPeriodTime(period); // Fixed: formatperiodTime -> formatPeriodTime
}

getSubjectStyle(slot: TimetableSlotDto | null): any {
  if (!slot) {
    return {
      'background-color': '#f5f5f5',
      'border': '2px dashed #ccc',
      'color': '#666'
    };
  }
  
  // Get subject color (you might need to implement this based on your Subject interface)
  const subject = this.subjects.find(s => s.name === slot.subjectName);
  const backgroundColor = subject?.color || '#e3f2fd';
  
  return {
    'background-color': backgroundColor,
    'border': this.isSlotInConflict(slot) ? '2px solid #f44336' : '1px solid #ddd',
    'color': '#333'
  };
}

isSlotInConflict(slot: TimetableSlotDto): boolean {
  if (!slot || !slot.id || !this.conflicts || this.conflicts.length === 0) {
    return false;
  }
  
  return this.conflicts.some(conflict => 
    conflict.slotId === slot.id || 
    (conflict.DayOfWeek === slot.dayOfWeek && conflict.period === slot.period)
  );
}

getConflictTooltip(slot: TimetableSlotDto): string {
  if (!slot || !this.conflicts || this.conflicts.length === 0) {
    return '';
  }
  
  const slotConflicts = this.conflicts.filter(conflict => 
    conflict.slotId === slot.id || 
    (conflict.DayOfWeek === slot.dayOfWeek && conflict.period === slot.period)
  );
  
  if (slotConflicts.length === 0) return '';
  
  return slotConflicts.map(conflict => {
    const severityIcon = this.getSeverityIcon(conflict.severity);
    const typeLabel = this.getConflictTypeLabel(conflict.type); // Fixed: getConflicttypeLabel -> getConflictTypeLabel
    return `${severityIcon} ${typeLabel}\n${conflict.description}`;
  }).join('\n\n');
}

  // ===============================
  // CONFLICT HELPER METHODS
  // ===============================

  /**
   * Get conflict type label for display
   */
private getConflictTypeLabel(type: string): string {
  const typeLabels: { [key: string]: string } = {
    'TeacherDoubleBooking': 'حجز مدرس مضاعف',
    'TeacherCrossClassDoubleBooking': 'حجز مدرس متعدد الفصول',
    'RestrictedPeriod': 'انتهاك الحصة المقيدة',
    'SubjectOverload': 'حمولة مادة زائدة',
    'WorkloadImbalance': 'عدم توازن عبء العمل'
  };
  
  return typeLabels[type] || type;
}

  /**
   * Get conflict icon based on type
   */
getConflictIcon(conflictType: string): string {
  const severity = this.determineConflictSeverity(conflictType);
  switch(severity) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'help';
    default: return 'help';
  }
}

  /**
   * Get conflict icon color
   */
  getConflictIconColor(type: string): string {
    const colors: { [key: string]: string } = {
      'TeacherDoubleBooking': 'warn',
      'TeacherCrossClassDoubleBooking': 'warn',
      'TeacherUnavailable': 'accent',
      'Restrictedperiod': 'primary',
      'InvalidTeacherSubjectAssignment': 'warn'
    };
    return colors[type] || 'warn';
  }

  /**
   * Get enhanced tooltip for slots
   */
getSlotTooltip(slot: TimetableSlotDto): string {
  if (!slot) return '';
  
  let tooltip = `${slot.subjectName}\n${slot.teacherName}\n`;
  tooltip += `${this.getDayOfWeekName(slot.dayOfWeek)} - الحصة ${slot.period}`;
  
  // Add conflict info if exists
  if (this.isSlotInConflict(slot)) {
    tooltip += '\nيحتوي على تعارضات ⚠️';
  }
  
  // Add restricted period info
  if (this.hasRestrictedPeriodConflict(slot)) {
    tooltip += '\nحصة مقيدة 🚫';
  }
  
  return tooltip;
}
  /**
   * Show detailed slot information
   */
showSlotDetails(slot: TimetableSlotDto): void {
  if (!slot) return;
  
  const conflicts = this.conflicts?.filter(c => 
    c.slotId === slot.id || 
    (c.DayOfWeek === slot.dayOfWeek && c.period === slot.period)
  ) || [];
  
  let message = `Subject: ${slot.subjectName}\nTeacher: ${slot.teacherName}\nDay: ${this.getDayOfWeekName(slot.dayOfWeek)}\nPeriod: ${slot.period}`; // Fixed: getdayOfWeekName -> getDayOfWeekName
  
  if (conflicts.length > 0) {
    message += `\n\n🚨 Conflicts (${conflicts.length}):\n`;
    message += conflicts.map(c => {
      const severityIcon = this.getSeverityIcon(c.severity);
      const typeLabel = this.getConflictTypeLabel(c.type); // Fixed: getConflicttypeLabel -> getConflictTypeLabel
      return `${severityIcon} ${typeLabel}: ${c.description}`;
    }).join('\n');
  } else {
    message += '\n\n✅ No conflicts detected';
  }
  
  alert(message);
}


  /**
   * Manual teacher availability check
   */
  async checkTeacherAvailabilityManual(): Promise<void> {
    if (!this.selectedTeacherForCheck || !this.selectedDayForCheck || 
        !this.selectedPeriodForCheck || !this.selectedClassId) {
      this.showErrorMessage('Please select teacher, day, and period');
      return;
    }

    try {
      const conflictDto: CheckTeacherConflictDto = {
        teacherId: this.selectedTeacherForCheck.id,
        dayOfWeek: this.selectedDayForCheck.value,
        period: this.selectedPeriodForCheck,
        classId: this.selectedClassId
      };

      const result = await this.timetableService.checkTeacherConflict(conflictDto).toPromise();
      this.lastAvailabilityCheck = result || null;
      
      if (result?.isAvailable) {
        this.showSuccessMessage(
          `${this.selectedTeacherForCheck.name} is available on ${this.selectedDayForCheck.label} period ${this.selectedPeriodForCheck}`
        );
      } else {
        this.showWarningMessage(
          `${this.selectedTeacherForCheck.name} is not available: ${result?.conflictMessage || 'Unknown conflict'}`
        );
      }
    } catch (error) {
      this.handleApiError(error, 'Failed to check teacher availability');
      this.lastAvailabilityCheck = null;
    }
  }

  /**
   * فانكشن مساعدة لإظهار تفاصيل التضارب
   */
  async showTeacherConflictDetails(teacherId: number, dayOfWeek: DayOfWeek, period: number, classId: number): Promise<void> {
    try {
      const conflictDto: CheckTeacherConflictDto = {
        teacherId,
        dayOfWeek,
        period,
        classId
      };

      const result = await this.timetableService.checkTeacherConflict(conflictDto).toPromise();
      
      if (!result?.isAvailable && result?.conflictMessage) {
        const teacher = this.assignedTeachers.find(t => t.id === teacherId);
        const message = `
          Teacher: ${teacher?.name || 'Unknown'}
          Conflict: ${result.conflictMessage}
          Conflicting Class: ${result.conflictingClassName}
          Subject: ${result.conflictingSubjectName}
        `;
        
        this.showWarningMessage(message);
      }
    } catch (error) {
      console.error('Error getting conflict details:', error);
    }
  }

  // ===============================
  // EXPORT METHODS
  // ===============================



  exportTimetableAsPDF(): void {
    if (this.currentTimetable) {
      this.timetableService.downloadTimetableAsPDF(this.currentTimetable.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `timetable-${this.currentTimetable!.scheduleId}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.showSuccessMessage('Timetable exported as PDF successfully');
        },
        error: (error: any) => {
          this.handleApiError(error, 'Failed to export timetable as PDF');
        }
      });
    } else {
      this.showErrorMessage('No timetable to export');
    }
  }



  // ===============================
  // STATISTICS METHODS
  // ===============================

  getTotalScheduledHours(): number {
    let total = 0;
    this.timeSlots.forEach(timeSlot => {
      this.weekDays.forEach(day => {
        if (timeSlot.slots[day.key]) {
          total++;
        }
      });
    });
    return total;
  }

  getSubjectHours(subjectName: string): number {
    return this.statistics?.subjectDistribution[subjectName] || 0;
  }

  getTeacherHours(teacherName: string): number {
    return this.statistics?.teacherWorkload[teacherName] || 0;
  }

  getUtilizationRate(): number {
    const totalSlots = this.weekDays.length * this.maxperiodsPerDay;
    const filledSlots = this.getTotalScheduledHours();
    return totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
  }

  getAverageHoursPerDay(): number {
    const totalHours = this.getTotalScheduledHours();
    return totalHours / this.weekDays.length;
  }

  getDailyDistribution(): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    this.weekDays.forEach(day => {
      distribution[day.label] = 0;
      this.timeSlots.forEach(timeSlot => {
        if (timeSlot.slots[day.key]) {
          distribution[day.label]++;
        }
      });
    });
    return distribution;
  }
  
 findAlternativeForConflict(conflict?: ConflictDto): void {
  if (!this.currentTimetable) {
    this.showErrorMessage('No active timetable to find alternatives');
    return;
  }

  const conflictToResolve = conflict || this.conflicts[0];
  if (!conflictToResolve) {
    this.showErrorMessage('No conflict selected to resolve');
    return;
  }

  // Find alternative time slots for the conflicting subject/teacher
  this.timetableService.findAlternativeSlots(
    this.currentTimetable.id,
    conflictToResolve.slotId
  ).subscribe({
    next: (alternatives) => {
      if (alternatives.length > 0) {
        this.showSuccessMessage(`Found ${alternatives.length} alternative slots`);
        // You could implement a dialog to show alternatives here
        this.displayAlternativeSlots(alternatives);
      } else {
        this.showWarningMessage('No alternative slots available for this conflict');
      }
    },
    error: (error: any) => {
      this.handleApiError(error, 'Failed to find alternative slots');
    }
  });
}
private displayAlternativeSlots(alternatives: any[]): void {
  // Implement logic to display alternative slots to user
  console.log('Alternative slots:', alternatives);
}

getSubjectDistribution(): { [key: string]: number } {
  const distribution: { [key: string]: number } = {};
  this.timeSlots.forEach(timeSlot => {
    this.weekDays.forEach(day => {
      const slot = timeSlot.slots[day.key];
      if (slot && slot.subjectName) {  // Added null check
        distribution[slot.subjectName] = (distribution[slot.subjectName] || 0) + 1;
      }
    });
  });
  return distribution;
}

getTeacherWorkload(): { [key: string]: number } {
  const workload: { [key: string]: number } = {};
  this.timeSlots.forEach(timeSlot => {
    this.weekDays.forEach(day => {
      const slot = timeSlot.slots[day.key];
      if (slot && slot.teacherName) {  // Added null check
        workload[slot.teacherName] = (workload[slot.teacherName] || 0) + 1;
      }
    });
  });
  return workload;
}

  // ===============================
  // MESSAGE METHODS
  // ===============================

private showSuccessMessage(message: string): void {
  this.snackBar.open(message, 'إغلاق', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });
}

private showErrorMessage(message: string): void {
  this.snackBar.open(message, 'إغلاق', {
    duration: 5000,
    panelClass: ['error-snackbar']
  });
}

private showWarningMessage(message: string): void {
  this.snackBar.open(message, 'إغلاق', {
    duration: 4000,
    panelClass: ['warning-snackbar']
  });
}

private showInfoMessage(message: string): void {
  this.snackBar.open(message, 'إغلاق', {
    duration: 3000,
    panelClass: ['info-snackbar']
  });
}
  // ===============================
  // VALIDATION METHODS
  // ===============================

  canCreateTimetable(): boolean {
    return this.timetableForm.valid && 
           this.selectedClassId !== null && 
           this.isClassDataLoaded(this.selectedClassId);
  }

  canUpdateTimetable(): boolean {
    return this.currentTimetable !== null;
  }

  canGenerateSmartTimetable(): boolean {
    return this.selectedClassId !== null && 
           this.constraintsForm.valid && 
           this.isClassDataLoaded(this.selectedClassId);
  }

  canGenerateRandomTimetable(): boolean {
    return this.selectedClassId !== null && 
           this.isClassDataLoaded(this.selectedClassId);
  }

  canExportTimetable(): boolean {
    return this.currentTimetable !== null;
  }

  canValidateTimetable(): boolean {
    return this.currentTimetable !== null;
  }

  canResolveConflicts(): boolean {
    return this.currentTimetable !== null && this.conflicts.length > 0;
  }

  // ===============================
  // TEMPLATE HELPER METHODS
  // ===============================

trackByPeriod(index: number, timeSlot: TimeSlotView): number {
  return timeSlot.period;
}

  trackByDay(index: number, day: WeekDay): string {
    return day.key;
  }

  trackByTimetable(index: number, timetable: TimeTableDto): number {
    return timetable.id;
  }

trackByConflict(index: number, conflict: ConflictDto): number {
  return conflict.slotId;
}

  trackBySubject(index: number, subject: Subject): number {
    return subject.id;
  }

  trackByClass(index: number, cls: Class): number {
    return cls.id || index;
  }

  trackByTeacher(index: number, teacher: AssignedTeacherDto): number {
    return teacher.id;
  }

private removeConflictFromList(conflictToRemove: ConflictDto): void {
  this.conflicts = this.conflicts.filter(c => 
    c.slotId !== conflictToRemove.slotId || 
    c.DayOfWeek !== conflictToRemove.DayOfWeek || 
    c.period !== conflictToRemove.period
  );
  this.hasConflicts = this.conflicts.length > 0;
}

  // ===============================
  // ADDITIONAL HELPER METHODS
  // ===============================

  getClassDisplayName(cls: Class): string {
    return `${cls.grade}/${cls.section}`;
  }

  

  // Get teacher by subject name for current class from API data
  getTeacherBySubject(subjectName: string): AssignedTeacherDto | null {
    if (!this.selectedClassId) return null;
    const classTeachers = this.getTeachersForClass(this.selectedClassId);
    return classTeachers.find((t: AssignedTeacherDto) => t.subject === subjectName) || null;
  }

  // Get subject by name for current class from API data
  getSubjectByName(subjectName: string): Subject | null {
    if (!this.selectedClassId) return null;
    const classSubjects = this.getAvailableSubjectsForClass(this.selectedClassId);
    return classSubjects.find(s => s.name === subjectName) || null;
  }

  // Get total hours for a class from API data
  getTotalHoursForClass(classId: number): number {
    const classSubjects = this.getAvailableSubjectsForClass(classId);
    return classSubjects.reduce((total, subject) => total + (subject.hoursPerWeek || 0), 0);
  }

  // Check if class has unassigned subjects
  hasUnassignedSubjects(classId: number): boolean {
    const classSubjects = this.getAvailableSubjectsForClass(classId);
    return classSubjects.some(subject => !subject.isAssigned);
  }

  // Get unassigned subjects for a class
  getUnassignedSubjects(classId: number): Subject[] {
    const classSubjects = this.getAvailableSubjectsForClass(classId);
    return classSubjects.filter(subject => !subject.isAssigned);
  }

  // Clear cache for specific class
  clearCacheForClass(classId: number): void {
    this.classSubjectsCache.delete(classId);
    this.classTeachersCache.delete(classId);
  }

  // Method to handle API errors gracefully
  private handleApiError(error: any, defaultMessage: string = 'An error occurred'): void {
    console.error('API Error:', error);
    
    let message = defaultMessage;
    if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    } else if (error?.status === 404) {
      message = 'Resource not found';
    } else if (error?.status === 500) {
      message = 'Server error occurred';
    }
    
    this.showErrorMessage(message);
  }

  // Method to reload data for current class
  reloadCurrentClassData(): void {
    if (this.selectedClassId) {
      this.clearCacheForClass(this.selectedClassId);
      this.loadSubjectsForClass(this.selectedClassId);
      this.loadTeachersForClass(this.selectedClassId);
    }
  }

  // Check if we're ready to perform operations
  isReady(): boolean {
    return !this.isLoading && 
           this.selectedClassId !== null && 
           this.isClassDataLoaded(this.selectedClassId);
  }

  // Get loading status for specific class
  isClassDataLoading(classId: number): boolean {
    return !this.classSubjectsCache.has(classId) || !this.classTeachersCache.has(classId);
  }

  // ===============================
  // ADVANCED TIMETABLE OPERATIONS
  // ===============================

  /**
   * Clone timetable to another class
   */
  cloneTimetableToClass(sourceClassId: number, targetClassId: number): void {
    this.timetableService.cloneTimetable(sourceClassId, targetClassId).subscribe({
      next: (newTimetable) => {
        this.showSuccessMessage(`Timetable cloned successfully to target class`);
        this.loadTimetables();
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to clone timetable');
      }
    });
  }

  /**
   * Generate timetable template for class
   */
  generateTimetableTemplate(classId: number): void {
    this.timetableService.generateTimetableTemplate(classId).subscribe({
      next: (template) => {
        this.showSuccessMessage('Timetable template generated successfully');
        // You can process the template as needed
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to generate timetable template');
      }
    });
  }

  /**
   * Optimize current timetable
   */
  optimizeTimetable(): void {
    if (!this.currentTimetable) {
      this.showErrorMessage('No active timetable to optimize');
      return;
    }

    this.timetableService.optimizeTimetable(this.currentTimetable.id).subscribe({
      next: (optimizedTimetable) => {
        this.showSuccessMessage('Timetable optimized successfully');
        this.currentTimetable = optimizedTimetable;
        this.updateTimeSlotView();
        this.validateCurrentTimetable();
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to optimize timetable');
      }
    });
  }

  /**
   * Auto-fill empty slots with available subjects
   */
  autoFillEmptySlots(): void {
    if (!this.currentTimetable || !this.selectedClassId) {
      this.showErrorMessage('No active timetable to auto-fill');
      return;
    }

    this.timetableService.autoFillEmptySlots(this.currentTimetable.id).subscribe({
      next: (updatedTimetable) => {
        this.showSuccessMessage('Empty slots filled automatically');
        this.currentTimetable = updatedTimetable;
        this.updateTimeSlotView();
        this.validateCurrentTimetable();
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to auto-fill empty slots');
      }
    });
  }

  /**
   * Balance teacher workload across timetable
   */
  balanceTeacherWorkload(): void {
    if (!this.currentTimetable) {
      this.showErrorMessage('No active timetable to balance');
      return;
    }

    this.timetableService.balanceTeacherWorkload(this.currentTimetable.id).subscribe({
      next: (balancedTimetable) => {
        this.showSuccessMessage('Teacher workload balanced successfully');
        this.currentTimetable = balancedTimetable;
        this.updateTimeSlotView();
        this.loadStatistics(balancedTimetable.id);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to balance teacher workload');
      }
    });
  }

  /**
   * Redistribute subjects evenly across days
   */
  redistributeSubjects(): void {
    if (!this.currentTimetable) {
      this.showErrorMessage('No active timetable to redistribute');
      return;
    }

    this.timetableService.redistributeSubjects(this.currentTimetable.id).subscribe({
      next: (redistributedTimetable) => {
        this.showSuccessMessage('Subjects redistributed evenly');
        this.currentTimetable = redistributedTimetable;
        this.updateTimeSlotView();
        this.loadStatistics(redistributedTimetable.id);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to redistribute subjects');
      }
    });
  }

  // ===============================
  // BULK OPERATIONS
  // ===============================

  /**
   * Generate timetables for multiple classes
   */
  generateBulkTimetables(classIds: number[]): void {
    if (classIds.length === 0) {
      this.showErrorMessage('Please select classes to generate timetables');
      return;
    }

    this.isLoading = true;
    this.timetableService.generateBulkTimetables(classIds, this.getConstraintsFromForm()).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.showSuccessMessage(`Generated ${result.successCount} timetables successfully`);
        if (result.failedCount > 0) {
          this.showWarningMessage(`Failed to generate ${result.failedCount} timetables`);
        }
        this.loadTimetables();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.handleApiError(error, 'Failed to generate bulk timetables');
      }
    });
  }

  /**
   * Validate multiple timetables
   */
  validateBulkTimetables(timetableIds: number[]): void {
    if (timetableIds.length === 0) {
      this.showErrorMessage('Please select timetables to validate');
      return;
    }

    this.isLoading = true;
    this.timetableService.validateBulkTimetables(timetableIds).subscribe({
      next: (validationResults) => {
        this.isLoading = false;
        const totalConflicts = validationResults.reduce((sum, result) => sum + result.conflictCount, 0);
        if (totalConflicts === 0) {
          this.showSuccessMessage('All selected timetables are valid');
        } else {
          this.showWarningMessage(`Found ${totalConflicts} conflicts across ${validationResults.length} timetables`);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.handleApiError(error, 'Failed to validate timetables');
      }
    });
  }

  /**
   * Delete multiple timetables
   */
deleteBulkTimetables(timetableIds: number[]): void {
  if (timetableIds.length === 0) {
    this.showErrorMessage('Please select timetables to delete');
    return;
  }

  if (confirm(`Are you sure you want to delete ${timetableIds.length} timetable(s)?`)) {
    this.timetableService.deleteBulkTimetables(timetableIds).subscribe({
      next: (result) => {
        // Use successCount instead of deletedCount
        this.showSuccessMessage(`Deleted ${result.successCount} timetables successfully`);
        if (result.failedCount > 0) {
          this.showWarningMessage(`Failed to delete ${result.failedCount} timetables`);
        }
        this.loadTimetables();
        
        // Clear current timetable if it was deleted
        if (this.currentTimetable && timetableIds.includes(this.currentTimetable.id)) {
          this.currentTimetable = null;
          this.clearTimeSlots();
        }
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to delete timetables');
      }
    });
  }
}

  // ===============================
  // ADVANCED SEARCH AND FILTERING
  // ===============================

  /**
   * Search timetables by criteria
   */
  searchTimetables(criteria: any): void {
    this.timetableService.searchTimetables(criteria).subscribe({
      next: (timetables) => {
        this.timetables = timetables;
        this.showInfoMessage(`Found ${timetables.length} timetables matching criteria`);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to search timetables');
      }
    });
  }

  /**
   * Filter timetables by class
   */
  filterTimetablesByClass(classId: number): void {
    this.timetables = this.timetables.filter(t => t.classId === classId);
  }

  /**
   * Filter timetables by status
   */
  filterTimetablesByStatus(isActive: boolean): void {
    this.timetables = this.timetables.filter(t => t.isActive === isActive);
  }

  /**
   * Sort timetables by creation date
   */
  sortTimetablesByDate(ascending: boolean = true): void {
    this.timetables.sort((a, b) => {
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  // ===============================
  // REPORTING AND ANALYTICS
  // ===============================

  /**
   * Generate comprehensive timetable report
   */
  generateTimetableReport(timetableId?: number): void {
    const id = timetableId || this.currentTimetable?.id;
    if (!id) {
      this.showErrorMessage('No timetable selected for report generation');
      return;
    }

    this.timetableService.generateTimetableReport(id).subscribe({
      next: (report) => {
        this.showSuccessMessage('Timetable report generated successfully');
        // Process and display the report
        this.displayTimetableReport(report);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to generate timetable report');
      }
    });
  }

  /**
   * Display timetable report
   */
  private displayTimetableReport(report: any): void {
    // You can implement a dialog or navigate to a report page
    console.log('Timetable Report:', report);
  }

  /**
   * Get timetable comparison data
   */
  compareTimetables(timetableIds: number[]): void {
    if (timetableIds.length < 2) {
      this.showErrorMessage('Please select at least 2 timetables to compare');
      return;
    }

    this.timetableService.compareTimetables(timetableIds).subscribe({
      next: (comparison) => {
        this.showSuccessMessage('Timetables compared successfully');
        // Display comparison results
        this.displayTimetableComparison(comparison);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to compare timetables');
      }
    });
  }

  /**
   * Display timetable comparison
   */
  private displayTimetableComparison(comparison: any): void {
    // Implement comparison display logic
    console.log('Timetable Comparison:', comparison);
  }

  // ===============================
  // BACKUP AND RESTORE
  // ===============================

  /**
   * Create timetable backup
   */
  createTimetableBackup(timetableId?: number): void {
    const id = timetableId || this.currentTimetable?.id;
    if (!id) {
      this.showErrorMessage('No timetable selected for backup');
      return;
    }

    this.timetableService.createTimetableBackup(id).subscribe({
      next: (backup) => {
        this.showSuccessMessage('Timetable backup created successfully');
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to create timetable backup');
      }
    });
  }

  /**
   * Restore timetable from backup
   */
  restoreTimetableFromBackup(backupId: string): void {
    this.timetableService.restoreTimetableFromBackup(backupId).subscribe({
      next: (restoredTimetable) => {
        this.showSuccessMessage('Timetable restored successfully');
        this.currentTimetable = restoredTimetable;
        this.updateTimeSlotView();
        this.loadStatistics(restoredTimetable.id);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to restore timetable');
      }
    });
  }

  // ===============================
  // IMPORT/EXPORT ADVANCED
  // ===============================

  /**
   * Import timetable from file
   */
  importTimetableFromFile(file: File): void {
    if (!file) {
      this.showErrorMessage('Please select a file to import');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.timetableService.importTimetableFromFile(formData).subscribe({
      next: (importedTimetable) => {
        this.showSuccessMessage('Timetable imported successfully');
        this.currentTimetable = importedTimetable;
        this.updateTimeSlotView();
        this.loadTimetables();
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to import timetable');
      }
    });
  }

  /**
   * Export multiple timetables as ZIP
   */
  exportMultipleTimetables(timetableIds: number[], format: string = 'json'): void {
    if (timetableIds.length === 0) {
      this.showErrorMessage('Please select timetables to export');
      return;
    }

    this.timetableService.exportMultipleTimetables(timetableIds, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timetables-export.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showSuccessMessage('Timetables exported successfully');
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to export timetables');
      }
    });
  }

  // ===============================
  // PRINT FUNCTIONALITY
  // ===============================

  /**
   * Print current timetable
   */
  printTimetable(): void {
    if (!this.currentTimetable) {
      this.showErrorMessage('No timetable to print');
      return;
    }

    // Generate printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(this.generatePrintableHTML());
      printWindow.document.close();
      printWindow.print();
    }
  }

  /**
   * Generate printable HTML
   */
  private generatePrintableHTML(): string {
    // Create a formatted HTML version of the timetable for printing
    let html = `
      <html>
        <head>
          <title>Timetable - ${this.selectedClass}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .subject-cell { min-height: 40px; vertical-align: middle; }
            .header { text-align: center; margin-bottom: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Class Timetable: ${this.selectedClass}</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>period</th>
    `;

    // Add day headers
    this.weekDays.forEach(day => {
      html += `<th>${day.label}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Add time slot rows
    this.timeSlots.forEach(timeSlot => {
      html += `<tr><td><strong>${timeSlot.period}</strong><br>${timeSlot.time}</td>`;
      
      this.weekDays.forEach(day => {
        const slot = timeSlot.slots[day.key];
        if (slot) {
          html += `<td class="subject-cell">
            <div><strong>${slot.subjectName}</strong></div>
            <div style="font-size: 0.8em;">${slot.teacherName}</div>
          </td>`;
        } else {
          html += `<td class="subject-cell">-</td>`;
        }
      });
      
      html += `</tr>`;
    });

    html += `</tbody></table></body></html>`;
    return html;
  }

  // ===============================
  // COLLABORATIVE FEATURES
  // ===============================

  /**
   * Share timetable with other users
   */
  shareTimetable(timetableId: number, userIds: number[]): void {
    this.timetableService.shareTimetable(timetableId, userIds).subscribe({
      next: () => {
        this.showSuccessMessage('Timetable shared successfully');
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to share timetable');
      }
    });
  }

  /**
   * Add comment to timetable
   */
  addTimetableComment(timetableId: number, comment: string): void {
    this.timetableService.addTimetableComment(timetableId, comment).subscribe({
      next: () => {
        this.showSuccessMessage('Comment added successfully');
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to add comment');
      }
    });
  }

  /**
   * Lock timetable for editing
   */
  lockTimetableForEditing(timetableId: number): void {
    this.timetableService.lockTimetable(timetableId).subscribe({
      next: () => {
        this.showSuccessMessage('Timetable locked for editing');
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to lock timetable');
      }
    });
  }

  /**
   * Unlock timetable
   */
  unlockTimetable(timetableId: number): void {
    this.timetableService.unlockTimetable(timetableId).subscribe({
      next: () => {
        this.showSuccessMessage('Timetable unlocked');
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to unlock timetable');
      }
    });
  }

  // ===============================
  // NOTIFICATION AND ALERTS
  // ===============================

  /**
   * Setup timetable change notifications
   */
  setupTimetableNotifications(): void {
    // Subscribe to timetable change events
    this.timetableService.timetableChanges$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(change => {
      this.handleTimetableChange(change);
    });
  }

  /**
   * Handle timetable change notifications
   */
  private handleTimetableChange(change: any): void {
    switch (change.type) {
      case 'created':
        this.showInfoMessage(`New timetable created for class ${change.className}`);
        break;
      case 'updated':
        this.showInfoMessage(`Timetable updated for class ${change.className}`);
        break;
      case 'deleted':
        this.showInfoMessage(`Timetable deleted for class ${change.className}`);
        break;
      case 'conflict_detected':
        this.showWarningMessage(`Conflict detected in timetable for class ${change.className}`);
        break;
    }
  }

  /**
   * Check for timetable conflicts periodically
   */
  startConflictMonitoring(): void {
    // Set up periodic conflict checking
    setInterval(() => {
      if (this.currentTimetable) {
        this.validateCurrentTimetable();
      }
    }, 300000); // Check every 5 minutes
  }

  // ===============================
  // ACCESSIBILITY FEATURES
  // ===============================

  /**
   * Announce timetable changes for screen readers
   */
  announceChange(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Get accessibility description for time slot
   */
  getSlotAccessibilitydescription(timeSlot: TimeSlotView, day: WeekDay): string {
    const slot = timeSlot.slots[day.key];
    if (slot) {
      return `${day.label} period ${timeSlot.period}: ${slot.subjectName} with ${slot.teacherName}`;
    }
    return `${day.label} period ${timeSlot.period}: Empty slot`;
  }

  /**
   * Handle keyboard navigation in timetable grid
   */
  handleKeyboardNavigation(event: KeyboardEvent, period: number, dayIndex: number): void {
    switch (event.key) {
      case 'ArrowRight':
        this.focusNextCell(period, dayIndex + 1);
        event.preventDefault();
        break;
      case 'ArrowLeft':
        this.focusNextCell(period, dayIndex - 1);
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.focusNextCell(period + 1, dayIndex);
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.focusNextCell(period - 1, dayIndex);
        event.preventDefault();
        break;
    }
  }

  /**
   * Focus next cell in timetable grid
   */
  private focusNextCell(period: number, dayIndex: number): void {
    if (period >= 1 && period <= this.maxperiodsPerDay && 
        dayIndex >= 0 && dayIndex < this.weekDays.length) {
      const cellId = `cell-${period}-${dayIndex}`;
      const cell = document.getElementById(cellId);
      if (cell) {
        cell.focus();
      }
    }
  }

  // ===============================
  // PERFORMANCE OPTIMIZATION
  // ===============================

  /**
   * Lazy load timetable data
   */
  lazyLoadTimetableData(page: number = 1, pageSize: number = 20): void {
    this.timetableService.getTimetablesPaginated(page, pageSize).subscribe({
      next: (paginatedResult) => {
        this.timetables = [...this.timetables, ...paginatedResult.items];
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to load timetable data');
      }
    });
  }

  /**
   * Debounced search for timetables
   */
  private searchSubject = new RxSubject<string>();

setupDebouncedSearch(): void {
  this.searchSubject.pipe(
    takeUntil(this.destroy$),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((searchTerm: string) => this.timetableService.searchTimetables({ searchTerm }))
  ).subscribe({
    next: (timetables) => {
      this.timetables = timetables;
    },
    error: (error: any) => {
      this.handleApiError(error, 'Failed to search timetables');
    }
  });
}

  onSearchInputChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Optimize rendering for large timetables
   */
  shouldRenderTimeSlot(index: number): boolean {
    // Implement virtual scrolling logic if needed
    return index < 50; // Render only first 50 slots initially
  }

  // ===============================
  // FINAL HELPER METHODS
  // ===============================

  /**
   * Check if current user can edit timetable
   */
  canEditTimetable(): boolean {
    // Implement permission logic
    return true; // Placeholder
  }

  /**
   * Get timetable modification history
   */
  getTimetableHistory(timetableId: number): void {
    this.timetableService.getTimetableHistory(timetableId).subscribe({
      next: (history) => {
        // Display history
        console.log('Timetable History:', history);
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to load timetable history');
      }
    });
  }

  /**
   * Revert timetable to previous version
   */
  revertTimetableToVersion(timetableId: number, versionId: string): void {
    this.timetableService.revertTimetableToVersion(timetableId, versionId).subscribe({
      next: (revertedTimetable) => {
        this.showSuccessMessage('Timetable reverted successfully');
        this.currentTimetable = revertedTimetable;
        this.updateTimeSlotView();
      },
      error: (error: any) => {
        this.handleApiError(error, 'Failed to revert timetable');
      }
    });
  }

  /**
   * Final cleanup method
   */
  cleanupComponent(): void {
    this.classSubjectsCache.clear();
    this.classTeachersCache.clear();
    this.conflicts = [];
    this.statistics = null;
    this.currentTimetable = null;
    this.clearTimeSlots();
  }
validateCurrentTimetableForConflicts(): void {
  if (!this.currentTimetable) {
    this.showWarningMessage('No timetable selected for validation');
    return;
  }

  this.isLoading = true;
  this.timetableService.validateTimetable(this.currentTimetable.id).subscribe({
    next: (conflicts) => {
      this.conflicts = conflicts;
      this.hasConflicts = conflicts.length > 0;
      
      if (this.hasConflicts) {
        this.showWarningMessage(`Found ${conflicts.length} conflict(s) in the timetable`);
      } else {
        this.showSuccessMessage('No conflicts found in the timetable');
      }
      
      this.isLoading = false;
    },
    error: (error: any) => {
      this.handleApiError(error, 'Failed to validate timetable');
      this.isLoading = false;
    }
  });
}

resolveConflictsAutomatically(): void {
  if (!this.currentTimetable || !this.hasConflicts) {
    this.showWarningMessage('No conflicts to resolve');
    return;
  }

  this.isLoading = true;
  this.timetableService.resolveConflicts(this.currentTimetable.id, this.conflicts).subscribe({
    next: (result) => {
      if (result.success) {
        this.showSuccessMessage(`Resolved ${result.resolvedCount} conflicts automatically`);
        this.loadCurrentTimetableData();
        this.validateCurrentTimetable();
      } else {
        this.showWarningMessage(`Could only resolve ${result.resolvedCount} out of ${this.conflicts.length} conflicts`);
      }
      this.isLoading = false;
    },
    error: (error: any) => {
      this.handleApiError(error, 'Failed to resolve conflicts automatically');
      this.isLoading = false;
    }
  });
}



getConflictSeverityColor(conflictType: string): string {
  const severity = this.determineConflictSeverity(conflictType);
  switch(severity) {
    case 'critical': return 'warn';
    case 'high': return 'warn'; 
    case 'medium': return 'accent';
    case 'low': return 'primary';
    default: return 'primary';
  }
}



getDayOfWeekName(dayOfWeek: any): string {
  if (typeof dayOfWeek === 'number') {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayOfWeek] || `يوم ${dayOfWeek}`;
  }
  return this.timetableService.getDayOfWeekName(dayOfWeek);
}

formatPeriodTime(period: number): string { // Fixed: formatperiodTime -> formatPeriodTime
  return this.timetableService.formatPeriodTime(period); // Fixed: formatperiodTime -> formatPeriodTime
}

hasRestrictedPeriodConflict(slot: TimetableSlotDto): boolean {
  if (!slot.teacherId) return false;
  
  const teacher = this.assignedTeachers.find(t => t.id === slot.teacherId);
  if (!teacher || !teacher.restrictedPeriods) return false;
  
  const dayName = this.getDayOfWeekName(slot.dayOfWeek).toLowerCase();
  const periodStr = `period${slot.period}`;
  
  return teacher.restrictedPeriods.some(restriction => 
    restriction.toLowerCase().includes(dayName) && 
    restriction.toLowerCase().includes(periodStr)
  );
}

optimizeTimetableLayout(): void {
  if (!this.currentTimetable) {
    this.showWarningMessage('No timetable selected for optimization');
    return;
  }

  this.isLoading = true;
  this.timetableService.optimizeTimetable(this.currentTimetable.id).subscribe({
    next: (optimizedTimetable) => {
      this.currentTimetable = optimizedTimetable;
      this.updateTimeSlotView();
      this.showSuccessMessage('Timetable optimized successfully');
      this.isLoading = false;
    },
    error: (error: any) => {
      this.handleApiError(error, 'Failed to optimize timetable');
      this.isLoading = false;
    }
  });
}

loadCurrentTimetableData(): void {
  if (!this.currentTimetable?.id) {
    return;
  }
  
  this.isLoading = true;
  this.timetableService.getTimetableById(this.currentTimetable.id).subscribe({
    next: (timetable) => {
      this.currentTimetable = timetable;
      this.updateTimeSlotView();
      this.validateCurrentTimetableForConflicts();
      this.isLoading = false;
    },
    error: (error: any) => {
      this.handleApiError(error, 'Failed to load current timetable');
      this.isLoading = false;
    }
  });
}
// Add this method to your Timetable component class

/**
 * Handle drag start for slots in the timetable grid
 */
onSlotDragStart(slot: TimetableSlotDto, event: DragEvent, period: number, dayKey: string): void {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      slot: slot,
      period: period,
      dayKey: dayKey
    }));
  }
}

/**
 * Handle drag start for subjects from the sidebar
 */
onSubjectDragStart(subject: Subject, event: DragEvent): void {
  if (event.dataTransfer) {
    const dragData = {
      subject: subject,
      type: 'new-subject'
    };
    
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
  }
}

/**
 * Enhanced drop handler that handles both existing slots and new subjects
 */
async onDropEnhanced(event: DragEvent, targetperiod: number, targetDay: string): Promise<void> {
  event.preventDefault();
  
  // Remove visual feedback
  const cell = event.currentTarget as HTMLElement;
  cell.classList.remove('drag-over');
  
  try {
    const dragData = JSON.parse(event.dataTransfer?.getData('application/json') || '{}');
    
    if (dragData.type === 'existing-slot') {
      // Moving an existing slot
      await this.handleSlotMove(dragData, targetperiod, targetDay);
    } else if (dragData.type === 'new-subject' || dragData.subject) {
      // Adding a new subject
      await this.handleSubjectAdd(dragData.subject, targetperiod, targetDay);
    }
  } catch (error) {
    console.error('Error processing drop:', error);
    this.showErrorMessage('Failed to process drop operation');
  }
}

/**
 * Handle moving an existing slot to a new position
 */
private async handleSlotMove(dragData: any, targetperiod: number, targetDay: string): Promise<void> {
  const sourceSlot = dragData.slot;
  const sourceperiod = dragData.sourceperiod;
  const sourceDay = dragData.sourceDay;
  
  if (!sourceSlot || !this.selectedClassId) {
    this.showErrorMessage('Invalid slot move operation');
    return;
  }
  
  // Check if moving to the same position
  if (sourceperiod === targetperiod && sourceDay === targetDay) {
    return;
  }
  
  // Check for conflicts at the target position
  const targetDayObj = this.weekDays.find(d => d.key === targetDay);
  if (targetDayObj) {
    const isAvailable = await this.checkTeacherConflictBeforeAssignment(
      sourceSlot.teacherId,
      targetDayObj.value,
      targetperiod,
      this.selectedClassId
    );
    
    if (!isAvailable) {
      return; // Error message will be shown by checkTeacherConflictBeforeAssignment
    }
  }
  
  // Update the UI by moving the slot
  const sourceTimeSlot = this.timeSlots.find(ts => ts.period === sourceperiod);
  const targetTimeSlot = this.timeSlots.find(ts => ts.period === targetperiod);
  
  if (sourceTimeSlot && targetTimeSlot) {
    // Clear source position
    sourceTimeSlot.slots[sourceDay] = null;
    
    // Update slot data for new position
    const updatedSlot: TimetableSlotDto = {
      ...sourceSlot,
      period: targetperiod,
      dayOfWeek: targetDayObj?.value || sourceSlot.dayOfWeek
    };
    
    // Set target position
    targetTimeSlot.slots[targetDay] = updatedSlot;
    
    this.showSuccessMessage(`${sourceSlot.subjectName} moved to ${targetDay} period ${targetperiod}`);
  }
}

/**
 * Handle adding a new subject to the timetable
 */
private async handleSubjectAdd(subject: Subject, targetperiod: number, targetDay: string): Promise<void> {
  if (!subject || !this.selectedClassId) {
    this.showErrorMessage('Invalid subject add operation');
    return;
  }

  // Find the teacher for this subject
  const classTeachers = this.getTeachersForClass(this.selectedClassId);
  const teacher = classTeachers.find((t: AssignedTeacherDto) => t.subject === subject.name);
  
  if (!teacher) {
    this.showErrorMessage(`No teacher found for ${subject.name} in this class`);
    return;
  }

  // Check teacher availability
  const targetDayObj = this.weekDays.find(d => d.key === targetDay);
  if (targetDayObj && !this.isTeacherAvailableForperiod(teacher, targetDayObj, targetperiod)) {
    this.showErrorMessage(`Teacher ${teacher.name} is not available on ${targetDay} period ${targetperiod} (restricted)`);
    return;
  }

  // Check for conflicts across all classes
  const isAvailable = await this.checkTeacherConflictBeforeAssignment(
    teacher.id || 0,
    targetDayObj?.value || DayOfWeek.Sunday,
    targetperiod,
    this.selectedClassId
  );

  if (!isAvailable) {
    return; // Error message will be shown by checkTeacherConflictBeforeAssignment
  }

  // Add the subject to the timetable
  const timeSlot = this.timeSlots.find(ts => ts.period === targetperiod);
  if (timeSlot) {
    const newSlot: TimetableSlotDto = {
      id: Math.floor(Math.random() * 10000),
      period: targetperiod,
      dayOfWeek: targetDayObj?.value || DayOfWeek.Monday,
      subjectId: subject.id,
      subjectName: subject.name,
      teacherId: teacher.id || 0,
      teacherName: teacher.name,
      createdAt: new Date().toISOString()
    };
    
    timeSlot.slots[targetDay] = newSlot;
    this.showSuccessMessage(`${subject.name} added to ${targetDay} period ${targetperiod}`);
  }
}

// Fix for the ConflictDto resolved property issue
getConflictStatistics(): { totalConflicts: number; unresolvedConflicts: number } {
  const totalConflicts = this.conflicts?.length || 0;
  
  // Since ConflictDto doesn't have a 'resolved' property, we'll assume all conflicts are unresolved
  // You might want to extend the ConflictDto interface to include this property if needed
  const unresolvedConflicts = totalConflicts;
  
  return {
    totalConflicts,
    unresolvedConflicts
  };
}


// Then use this implementation:
getConflictStatisticsWithResolved(): { totalConflicts: number; unresolvedConflicts: number } {
  const totalConflicts = this.conflicts?.length || 0;
  const unresolvedConflicts = this.conflicts?.filter(c => !c.resolved)?.length || totalConflicts;
  
  return {
    totalConflicts,
    unresolvedConflicts
  };
}

/**
 * Mark a conflict as resolved
 */
markConflictAsResolved(conflict: ConflictDto): void {
  if (!conflict) return;
  
  const conflictIndex = this.conflicts?.findIndex(c => 
    c.slotId === conflict.slotId && 
    c.DayOfWeek === conflict.DayOfWeek && 
    c.period === conflict.period &&
    c.type === conflict.type
  ) || -1;
  
  if (conflictIndex > -1 && this.conflicts) {
    // Either mark as resolved or remove from array
    this.conflicts[conflictIndex].resolved = true;
    
    // Or remove completely:
    // this.conflicts.splice(conflictIndex, 1);
    
    this.hasConflicts = this.conflicts.some(c => !c.resolved);
    this.showSuccessMessage(`Conflict marked as resolved: ${this.getConflictTypeLabel(conflict.type)}`);
  }
}
findConflictsForSlot(slot: TimetableSlotDto): ConflictDto[] {
  if (!slot || !this.conflicts) return [];
  
  return this.conflicts.filter(conflict => 
    conflict.slotId === slot.id || 
    (conflict.DayOfWeek === slot.dayOfWeek && 
     conflict.period === slot.period)
  );
}
getConflictSeverityClass(conflict: ConflictDto): string {
  const severity = conflict.severity || this.determineConflictSeverity(conflict.type);
  
  const severityClasses: { [key: string]: string } = { // Fixed: add type annotation
    'critical': 'conflict-critical',
    'high': 'conflict-high',
    'medium': 'conflict-medium', 
    'low': 'conflict-low'
  };
  
  return severityClasses[severity] || 'conflict-default';
}

formatConflictForList(conflict: ConflictDto, index: number): string {
  const severityIcon = this.getSeverityIcon(conflict.severity);
  const dayName = this.getDayOfWeekName(conflict.DayOfWeek); // Fixed: getdayOfWeekName -> getDayOfWeekName
  const typeLabel = this.getConflictTypeLabel(conflict.type); // Fixed: getConflicttypeLabel -> getConflictTypeLabel
  
  return `${index + 1}. ${severityIcon} ${typeLabel} - ${dayName}, period ${conflict.period}`;
}

exportConflictsToJSON(): void {
  if (!this.conflicts || this.conflicts.length === 0) {
    this.showWarningMessage('No conflicts to export');
    return;
  }

  const exportData = {
    metadata: {
      timetableId: this.currentTimetable?.id,
      className: this.selectedClass,
      exportDate: new Date().toISOString(),
      totalConflicts: this.conflicts.length
    },
    conflicts: this.conflicts.map(c => ({
      type: c.type,
      description: c.description,
      slotId: c.slotId,
      dayOfWeek: this.getDayOfWeekName(c.DayOfWeek), // Fixed: getdayOfWeekName -> getDayOfWeekName
      period: c.period,
      severity: c.severity || this.determineConflictSeverity(c.type),
      resolved: c.resolved || false,
      detectedAt: c.timestamp || new Date().toISOString()
    })),
    summary: this.getConflictSummary() // Fixed: getEnhancedConflictSummary -> getConflictSummary (use existing method)
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `conflicts-report-${this.selectedClass}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  window.URL.revokeObjectURL(url);

  this.showSuccessMessage('Conflicts exported successfully');
}
filterConflictsByDay(dayOfWeek: DayOfWeek): ConflictDto[] {
  if (!this.conflicts) return [];
  
  return this.conflicts.filter(c => c.DayOfWeek === dayOfWeek);
}
filterConflictsByperiod(period: number): ConflictDto[] {
  if (!this.conflicts) return [];
  
  return this.conflicts.filter(c => c.period === period);
}


getConflictsCountByDay(): { [key: string]: number } {
  if (!this.conflicts) return {};
  
  const countByDay: { [key: string]: number } = {};
  
  this.weekDays.forEach(day => {
    const dayConflicts = this.conflicts?.filter(c => c.DayOfWeek === day.value) || [];
    countByDay[day.label] = dayConflicts.length;
  });
  
  return countByDay;
}
getConflictsCountByperiod(): { [key: number]: number } {
  if (!this.conflicts) return {};
  
  const countByperiod: { [key: number]: number } = {};
  
  for (let period = 1; period <= this.maxperiodsPerDay; period++) {
    const periodConflicts = this.conflicts?.filter(c => c.period === period) || [];
    countByperiod[period] = periodConflicts.length;
  }
  
  return countByperiod;
}
getMostProblematicTimeSlots(): Array<{ day: string; period: number; conflictCount: number }> {
  if (!this.conflicts) return [];
  
  const slotConflicts = new Map<string, number>();
  
  this.conflicts.forEach(conflict => {
    const key = `${conflict.DayOfWeek}-${conflict.period}`;
    slotConflicts.set(key, (slotConflicts.get(key) || 0) + 1);
  });
  
  return Array.from(slotConflicts.entries())
    .map(([key, count]) => {
      const [dayOfWeek, period] = key.split('-').map(Number);
      return {
        day: this.getDayOfWeekName(dayOfWeek),
        period: period,
        conflictCount: count
      };
    })
    .sort((a, b) => b.conflictCount - a.conflictCount)
    .slice(0, 5); // Top 5 most problematic slots
}


/**
 * Reset all conflicts (mark them as unresolved)
 */
resetConflictStatus(): void {
  if (this.conflicts) {
    this.conflicts.forEach(conflict => {
      // If using extended ConflictDto with resolved property
      // conflict.resolved = false;
    });
    this.showInfoMessage('All conflicts reset to unresolved status');
  }
}

/**
 * Get conflicts by type
 */
getConflictsBytype(conflicttype: string): ConflictDto[] {
  if (!this.conflicts || this.conflicts.length === 0) return [];
  
  return this.conflicts.filter(c => c.type === conflicttype);
}

/**
 * Get the most critical conflicts (prioritized by type)
 */
getCriticalConflicts(): ConflictDto[] {
  const criticalTypes = ['TeacherDoubleBooking', 'TeacherCrossClassDoubleBooking']; // Fixed: criticaltypes -> criticalTypes
  return this.conflicts?.filter(c => 
    c.conflictType && criticalTypes.includes(c.conflictType) // Fixed: conflicttype -> conflictType
  ) || [];
}

/**
 * Enhanced conflict resolution with priority handling
 */
async resolveConflictsByPriority(): Promise<void> {
  if (!this.currentTimetable || !this.hasConflicts) {
    this.showWarningMessage('No conflicts to resolve');
    return;
  }

  this.isLoading = true;
  
  try {
    const sortedConflicts = this.getSortedConflicts();
    
    const criticalConflicts = sortedConflicts.filter((c: ConflictDto) => // Fixed: add type annotation
      c.severity === 'critical' || this.determineConflictSeverity(c.type) === 'critical'
    );
    
    if (criticalConflicts.length > 0) {
      const criticalResult = await this.timetableService.resolveConflicts(
        this.currentTimetable.id, 
        criticalConflicts
      ).toPromise();
      
      if (criticalResult?.success) {
        this.showSuccessMessage(`✅ Resolved ${criticalResult.resolvedCount} critical conflicts`);
        
        criticalConflicts.forEach((resolvedConflict: ConflictDto) => { // Fixed: add type annotation
          this.removeConflictFromList(resolvedConflict);
        });
      }
    }
    
    const highPriorityConflicts = this.conflicts?.filter((c: ConflictDto) => // Fixed: add type annotation
      c.severity === 'high' || this.determineConflictSeverity(c.type) === 'high'
    ) || [];
    
    if (highPriorityConflicts.length > 0) {
      const highResult = await this.timetableService.resolveConflicts(
        this.currentTimetable.id, 
        highPriorityConflicts
      ).toPromise();
      
      if (highResult?.success) {
        this.showSuccessMessage(`✅ Resolved ${highResult.resolvedCount} high priority conflicts`);
        
        highPriorityConflicts.forEach((resolvedConflict: ConflictDto) => { // Fixed: add type annotation
          this.removeConflictFromList(resolvedConflict);
        });
      }
    }

    // Re-validate after resolution
    this.validateCurrentTimetable();
    
  } catch (error) {
    this.handleApiError(error, 'Failed to resolve conflicts by priority');
  } finally {
    this.isLoading = false;
  }
}

private validateConflictsStructure(conflicts: any[]): ConflictDto[] {
  if (!Array.isArray(conflicts)) {
    console.warn('Conflicts response is not an array:', conflicts);
    return [];
  }
  
  return conflicts.map(conflict => {
    const validatedConflict: ConflictDto = {
      type: conflict.type || 'Unknown',
      description: conflict.description || 'No description',
      slotId: conflict.slotId || 0,
      DayOfWeek: conflict.dayOfWeek !== undefined ? conflict.dayOfWeek : DayOfWeek.Sunday, // Fixed: use DayOfWeek enum
      period: conflict.period || 0,
      resolved: false,
      severity: this.determineConflictSeverity(conflict.type),
      timestamp: new Date().toISOString(),
      conflictType: conflict.conflictType // Add missing property
    };
    
    return validatedConflict;
  }).filter(conflict => 
    conflict.type !== 'Unknown' && conflict.slotId > 0
  );
}

validateCurrentTimetableEnhanced(): void {
  if (!this.currentTimetable) {
    this.showWarningMessage('No active timetable to validate');
    return;
  }

  this.isLoading = true;
  this.timetableService.validateTimetable(this.currentTimetable.id)
    .pipe(
      takeUntil(this.destroy$),
      map((response: any) => { // Fixed: add type annotation
        if (Array.isArray(response)) {
          return this.validateConflictsStructure(response);
        } else if (response && Array.isArray(response.conflicts)) {
          return this.validateConflictsStructure(response.conflicts);
        } else {
          console.warn('Unexpected validation response format:', response);
          return [];
        }
      }),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (validatedConflicts: ConflictDto[]) => {
        this.conflicts = validatedConflicts;
        this.hasConflicts = this.conflicts.length > 0;
        
        if (this.hasConflicts) {
          const summary = this.getConflictSummary(); // Fixed: use existing method
          const urgentCount = summary.critical + (summary.high || 0);
          
          if (urgentCount > 0) {
            this.showWarningMessage(
              `🚨 Found ${this.conflicts.length} conflicts (${urgentCount} require immediate attention)`
            );
          } else {
            this.showWarningMessage(
              `⚠️ Found ${this.conflicts.length} conflicts (low to medium priority)`
            );
          }
          
          console.warn('Timetable validation results:', {
            totalConflicts: this.conflicts.length,
            summary: summary,
            conflicts: this.conflicts
          });
          
        } else {
          this.showSuccessMessage('✅ Timetable validation passed - No conflicts detected!');
        }
      },
      error: (error: any) => {
        console.error('Validation error:', error);
        this.handleApiError(error, 'Failed to validate timetable');
        this.conflicts = [];
        this.hasConflicts = false;
      }
    });
}

getTeacherConflicts(): ConflictDto[] {
  if (!this.conflicts || this.conflicts.length === 0) return [];
  
  const teacherConflicttypes = [
    'TeacherDoubleBooking', 
    'TeacherCrossClassDoubleBooking',
    'TeacherUnavailable'
  ];
  
  return this.conflicts.filter(c => 
    c.type && teacherConflicttypes.some(type => c.type.includes(type)) ||
    c.description?.toLowerCase().includes('teacher')
  );
}
getRestrictedperiodConflicts(): ConflictDto[] {
  if (!this.conflicts || this.conflicts.length === 0) return [];
  
  return this.conflicts.filter(c => 
    c.type === 'Restrictedperiod' ||
    c.description?.toLowerCase().includes('restricted') ||
    c.description?.toLowerCase().includes('not available')
  );
}
/**
 * Get conflict summary statistics
 */
getConflictSummary(): { total: number; critical: number; high: number; medium: number; low: number } {
  const summary = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
  
  this.conflicts.forEach(conflict => {
    summary.total++;
    const severity = conflict.severity || this.determineConflictSeverity(conflict.type);
    summary[severity as keyof typeof summary]++;
  });
  
  return summary;
}

/**
 * Check if conflict is critical based on description
 */
isConflictCritical(conflict: ConflictDto): boolean {
  if (!conflict.description) return false;
  
  const criticalPatterns = ['double booking', 'teacher conflict', 'cross-class'];
  return criticalPatterns.some(pattern => 
    conflict.description.toLowerCase().includes(pattern)
  );
}

/**
 * Get conflict priority level (1 = highest, 3 = lowest)
 */
getConflictPriority(conflict: ConflictDto): number {
  if (!conflict.description) return 3;
  
  const desc = conflict.description.toLowerCase();
  
  if (desc.includes('double booking') || desc.includes('cross-class')) {
    return 1; // Critical
  } else if (desc.includes('teacher') || desc.includes('restricted')) {
    return 2; // High
  } else {
    return 3; // Medium
  }
}

/**
 * Sort conflicts by priority
 */
sortConflictsByPriority(): ConflictDto[] {
  if (!this.conflicts) return [];
  
  return [...this.conflicts].sort((a, b) => {
    const priorityA = this.getConflictPriority(a);
    const priorityB = this.getConflictPriority(b);
    return priorityA - priorityB; 
  });
}
private getSeverityIcon(severity: string | undefined): string {
  switch(severity) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    case 'low': return 'ℹ️';
    default: return '❓';
  }
}

private determineConflictSeverity(type: string): 'critical' | 'high' | 'medium' | 'low' {
  const criticalTypes = ['TeacherDoubleBooking', 'TeacherCrossClassDoubleBooking'];
  const highTypes = ['RestrictedPeriod'];
  const mediumTypes = ['SubjectOverload'];
  
  if (criticalTypes.includes(type)) return 'critical';
  if (highTypes.includes(type)) return 'high';
  if (mediumTypes.includes(type)) return 'medium';
  return 'low';
}
private getSortedConflicts(): ConflictDto[] {
  return [...this.conflicts].sort((a, b) => {
    const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const aSeverity = a.severity || this.determineConflictSeverity(a.type);
    const bSeverity = b.severity || this.determineConflictSeverity(b.type);
    return severityOrder[bSeverity as keyof typeof severityOrder] - severityOrder[aSeverity as keyof typeof severityOrder];
  });
}

 
}