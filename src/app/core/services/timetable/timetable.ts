import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface TimeTableDto {
  id: number;
  classId: number;
  className: string;
  scheduleId: string;
  generatedAt: string;
  createdAt?: string;
  isActive: boolean;
  constraints: string;
  timetableSlots: TimetableSlotDto[];
}

export interface TimetableSlotDto {
  id: number;
  period: number;
  dayOfWeek: DayOfWeek;
  subjectId?: number;
  subjectName?: string;
  teacherId?: number;
  teacherName?: string;
  createdAt: string;
}

export interface AddTimeTableDto {
  classId: number;
  scheduleId: string;
  constraints?: string;
  timetableSlots: AddTimetableSlotDto[];
}

export interface AddTimetableSlotDto {
  period: number;
  dayOfWeek: DayOfWeek;
  subjectId?: number;
  teacherId?: number;
}

export interface UpdateTimeTableDto {
  id: number;
  classId: number;
  scheduleId: string;
  constraints?: string;
  isActive: boolean;
  timetableSlots: UpdateTimetableSlotDto[];
}

export interface UpdateTimetableSlotDto {
  id: number;
  period: number;
  dayOfWeek: DayOfWeek;
  subjectId?: number;
  teacherId?: number;
}

export interface SmartTimetableRequest {
  maxPeriodsPerDay?: number;
  constraints?: TimetableConstraints;
}

export interface TimetableConstraints {
  avoidDoubleBooking?: boolean;
  spreadSubjectsEvenly?: boolean;
  respectRestrictedPeriods?: boolean;
  balanceWorkload?: boolean;
  allowConsecutiveClasses?: boolean;
}

export interface ConflictDto {
  type: string;
  conflictType?: string; // Add this property
  description: string;
  slotId: number;
  DayOfWeek: DayOfWeek;
  period: number;
  severity?: 'low' | 'medium' | 'high' | 'critical'; // Optional local property
  resolved?: boolean; // Add this property for tracking resolution status
  timestamp?: string;    // Optional timestamp when conflict was detected

}

export interface TimetableStatisticsDto {
  timetableId: number;
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
  subjectDistribution: { [key: string]: number };
  teacherWorkload: { [key: string]: number };
  dailyDistribution: { [key: string]: number };
}

export interface SwapSlotsRequest {
  slot1: SlotPosition;
  slot2: SlotPosition;
}

export interface SlotPosition {
  dayOfWeek: DayOfWeek;
  period: number;
}

export interface UpdateStatusRequest {
  isActive: boolean;
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

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface ClassSubjectWithTeacherDto {
  subjectId: number;
  subjectName: string;
  teacherId?: number;
  teacherName: string;
  hoursPerWeek: number;
  isAssigned: boolean;
  subjectColor: string;
}

export interface AssignedTeacherDto {
  id: number;
  name: string;
  subject: string;
  email?: string;
  phone?: string;
  subjectNames?: string[];
  subjectCount?: number;
  restrictedPeriods?: string[];
}

export interface TeacherConflictResult {
  isAvailable: boolean;
    resolved?: boolean; 
  conflictingClassId?: number;
  conflictingClassName?: string;
  conflictingSubjectName?: string;
  conflictMessage?: string;
}

export interface CheckTeacherConflictDto {
  teacherId: number;
  dayOfWeek: DayOfWeek;
  period: number;
  classId: number;
}

// Additional interfaces for missing functionality
export interface BulkOperationResult {
  successCount: number;
  failedCount: number;
  errors?: string[];
}

export interface TimetableValidationResult {
  timetableId: number;
  conflictCount: number;
  conflicts: ConflictDto[];
}
export interface TeacherDayAvailability {
  teacherId: number;
  dayOfWeek: DayOfWeek;
  availablePeriods: number[];
  restrictedPeriods: number[];
  conflictingPeriods: Array<{
    period: number;
    conflictingClassId: number;
    conflictingClassName: string;
    conflictingSubjectName: string;
  }>;
}

export interface ConflictResolutionResult {
  success: boolean;
  message: string;
  resolvedCount: number;
  unresolvedCount: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface TimetableSearchCriteria {
  searchTerm?: string;
  classId?: number;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimetableService {
  private readonly apiUrl = `${environment.apiUrl}/api/TimeTable`;
  
  // State management
  private currentTimetableSubject = new BehaviorSubject<TimeTableDto | null>(null);
  public currentTimetable$ = this.currentTimetableSubject.asObservable();
  
  private timetablesSubject = new BehaviorSubject<TimeTableDto[]>([]);
  public timetables$ = this.timetablesSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Change notifications
  private timetableChangesSubject = new Subject<any>();
  public timetableChanges$ = this.timetableChangesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // GET: Get all timetables with optional filtering
  getAllTimetables(classId?: number, isActive?: boolean): Observable<TimeTableDto[]> {
    this.setLoading(true);
    
    let params = new HttpParams();
    if (classId !== undefined) params = params.set('classId', classId.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.get<TimeTableDto[]>(`${this.apiUrl}`, { params })
      .pipe(
        map(response => {
          this.timetablesSubject.next(response);
          this.setLoading(false);
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Get timetable by ID
  getTimetableById(id: number): Observable<TimeTableDto> {
    this.setLoading(true);
    
    return this.http.get<TimeTableDto>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          this.currentTimetableSubject.next(response);
          this.setLoading(false);
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Create new timetable
  createTimetable(timetable: AddTimeTableDto): Observable<TimeTableDto> {
    this.setLoading(true);
    
    return this.http.post<TimeTableDto>(`${this.apiUrl}`, timetable)
      .pipe(
        map(response => {
          this.currentTimetableSubject.next(response);
          this.refreshTimetables();
          this.setLoading(false);
          this.notifyTimetableChange('created', response);
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          return throwError(() => this.handleError(error));
        })
      );
  }

  // PUT: Update existing timetable
  updateTimetable(id: number, timetable: UpdateTimeTableDto): Observable<TimeTableDto> {
    this.setLoading(true);
    
    return this.http.put<TimeTableDto>(`${this.apiUrl}/${id}`, timetable)
      .pipe(
        map(response => {
          this.currentTimetableSubject.next(response);
          this.refreshTimetables();
          this.setLoading(false);
          this.notifyTimetableChange('updated', response);
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          return throwError(() => this.handleError(error));
        })
      );
  }

  // DELETE: Delete timetable
  deleteTimetable(id: number): Observable<boolean> {
    this.setLoading(true);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => {
          this.refreshTimetables();
          this.setLoading(false);
          this.notifyTimetableChange('deleted', { id });
          return true;
        }),
        catchError(error => {
          this.setLoading(false);
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Generate smart timetable
  generateSmartTimetable(classId: number, request: SmartTimetableRequest): Observable<TimeTableDto> {
    this.setLoading(true);
    
    return this.http.post<TimeTableDto>(`${this.apiUrl}/generate/${classId}`, request)
      .pipe(
        map(response => {
          this.currentTimetableSubject.next(response);
          this.refreshTimetables();
          this.setLoading(false);
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Validate timetable for conflicts
  validateTimetable(id: number): Observable<ConflictDto[]> {
    return this.http.get<ConflictDto[]>(`${this.apiUrl}/${id}/validate`)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Get timetable statistics
  getTimetableStatistics(id: number): Observable<TimetableStatisticsDto> {
    return this.http.get<TimetableStatisticsDto>(`${this.apiUrl}/${id}/statistics`)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // PUT: Swap two time slots
  swapTimeSlots(id: number, request: SwapSlotsRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/swap-slots`, request)
      .pipe(
        map(response => {
          this.refreshCurrentTimetable(id);
          return response;
        }),
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // PUT: Update timetable status (activate/deactivate)
  updateTimetableStatus(id: number, request: UpdateStatusRequest): Observable<TimeTableDto> {
    return this.http.put<TimeTableDto>(`${this.apiUrl}/${id}/status`, request)
      .pipe(
        map(response => {
          this.currentTimetableSubject.next(response);
          this.refreshTimetables();
          return response;
        }),
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Get timetables for specific class
  getTimetablesByClass(classId: number): Observable<TimeTableDto[]> {
    return this.http.get<TimeTableDto[]>(`${this.apiUrl}/class/${classId}`)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Get active timetable for specific class
  getActiveTimetableByClass(classId: number): Observable<TimeTableDto> {
    return this.http.get<TimeTableDto>(`${this.apiUrl}/class/${classId}/active`)
      .pipe(
        map(response => {
          this.currentTimetableSubject.next(response);
          return response;
        }),
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Get subjects with teachers for class
  getSubjectsWithTeachersForClass(classId: number): Observable<ClassSubjectWithTeacherDto[]> {
    return this.http.get<ClassSubjectWithTeacherDto[]>(`${this.apiUrl}/class/${classId}/subjects-with-teachers`)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Get assigned teachers for class
  getAssignedTeachersForClass(classId: number): Observable<AssignedTeacherDto[]> {
    return this.http.get<AssignedTeacherDto[]>(`${this.apiUrl}/class/${classId}/assigned-teachers`)
      .pipe(
        catchError(error => {
          console.error('Error fetching assigned teachers:', error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Check teacher conflict across classes
  checkTeacherConflict(dto: CheckTeacherConflictDto): Observable<TeacherConflictResult> {
    return this.http.post<TeacherConflictResult>(`${this.apiUrl}/check-teacher-conflict`, dto)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }
   batchCheckTeacherConflicts(conflictChecks: CheckTeacherConflictDto[]): Observable<TeacherConflictResult[]> {
    return this.http.post<TeacherConflictResult[]>(`${this.apiUrl}/batch-check-teacher-conflicts`, conflictChecks);
  }
   getTeacherAvailabilityForDay(teacherId: number, dayOfWeek: DayOfWeek, classId: number): Observable<TeacherDayAvailability> {
    const params = {
      teacherId: teacherId.toString(),
      dayOfWeek: dayOfWeek.toString(),
      classId: classId.toString()
    };
    return this.http.get<TeacherDayAvailability>(`${this.apiUrl}/teacher-day-availability`, { params });
  }
 validateTimetableConflicts(timetableId: number): Observable<ConflictDto[]> {
    return this.http.get<ConflictDto[]>(`${this.apiUrl}/${timetableId}/validate`);
  }

  // POST: Resolve conflicts
  resolveConflicts(timetableId: number, conflicts: ConflictDto[]): Observable<ConflictResolutionResult> {
    return this.http.post<ConflictResolutionResult>(`${this.apiUrl}/${timetableId}/resolve-conflicts`, conflicts)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Generate bulk timetables
  generateBulkTimetables(classIds: number[], constraints: TimetableConstraints): Observable<BulkOperationResult> {
    const request = { classIds, constraints };
    return this.http.post<BulkOperationResult>(`${this.apiUrl}/bulk/generate`, request)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Validate bulk timetables
  validateBulkTimetables(timetableIds: number[]): Observable<TimetableValidationResult[]> {
    return this.http.post<TimetableValidationResult[]>(`${this.apiUrl}/bulk/validate`, { timetableIds })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // DELETE: Delete bulk timetables
  deleteBulkTimetables(timetableIds: number[]): Observable<BulkOperationResult> {
    return this.http.post<BulkOperationResult>(`${this.apiUrl}/bulk/delete`, { timetableIds })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Search timetables
  searchTimetables(criteria: TimetableSearchCriteria): Observable<TimeTableDto[]> {
    let params = new HttpParams();
    if (criteria.searchTerm) params = params.set('searchTerm', criteria.searchTerm);
    if (criteria.classId !== undefined) params = params.set('classId', criteria.classId.toString());
    if (criteria.isActive !== undefined) params = params.set('isActive', criteria.isActive.toString());
    if (criteria.dateFrom) params = params.set('dateFrom', criteria.dateFrom);
    if (criteria.dateTo) params = params.set('dateTo', criteria.dateTo);

    return this.http.get<TimeTableDto[]>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // GET: Get timetables paginated
  getTimetablesPaginated(page: number = 1, pageSize: number = 20): Observable<PaginatedResult<TimeTableDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResult<TimeTableDto>>(`${this.apiUrl}/paginated`, { params })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Clone timetable
  cloneTimetable(sourceClassId: number, targetClassId: number): Observable<TimeTableDto> {
    const request = { sourceClassId, targetClassId };
    return this.http.post<TimeTableDto>(`${this.apiUrl}/clone`, request)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Generate timetable template
  generateTimetableTemplate(classId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${classId}/template`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // PUT: Optimize timetable
  optimizeTimetable(timetableId: number): Observable<TimeTableDto> {
    return this.http.put<TimeTableDto>(`${this.apiUrl}/${timetableId}/optimize`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // PUT: Auto-fill empty slots
  autoFillEmptySlots(timetableId: number): Observable<TimeTableDto> {
    return this.http.put<TimeTableDto>(`${this.apiUrl}/${timetableId}/auto-fill`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // PUT: Balance teacher workload
  balanceTeacherWorkload(timetableId: number): Observable<TimeTableDto> {
    return this.http.put<TimeTableDto>(`${this.apiUrl}/${timetableId}/balance-workload`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // PUT: Redistribute subjects
  redistributeSubjects(timetableId: number): Observable<TimeTableDto> {
    return this.http.put<TimeTableDto>(`${this.apiUrl}/${timetableId}/redistribute`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Generate timetable report
  generateTimetableReport(timetableId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${timetableId}/report`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // POST: Compare timetables
  compareTimetables(timetableIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/compare`, { timetableIds })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // Export methods
  downloadTimetableAsPDF(timetableId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${timetableId}/export/pdf`, { responseType: 'blob' })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  downloadTimetableAsExcel(timetableId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${timetableId}/export/excel`, { responseType: 'blob' })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  exportMultipleTimetables(timetableIds: number[], format: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export/multiple`, 
      { timetableIds, format }, 
      { responseType: 'blob' }
    ).pipe(
      catchError(error => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  // Import methods
  importTimetableFromFile(formData: FormData): Observable<TimeTableDto> {
    return this.http.post<TimeTableDto>(`${this.apiUrl}/import`, formData)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // Backup and restore methods
  createTimetableBackup(timetableId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${timetableId}/backup`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }
  

  restoreTimetableFromBackup(backupId: string): Observable<TimeTableDto> {
    return this.http.post<TimeTableDto>(`${this.apiUrl}/restore/${backupId}`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // Collaboration methods
  shareTimetable(timetableId: number, userIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${timetableId}/share`, { userIds })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  addTimetableComment(timetableId: number, comment: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${timetableId}/comment`, { comment })
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  lockTimetable(timetableId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${timetableId}/lock`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  unlockTimetable(timetableId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${timetableId}/unlock`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // History methods
  getTimetableHistory(timetableId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${timetableId}/history`)
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  revertTimetableToVersion(timetableId: number, versionId: string): Observable<TimeTableDto> {
    return this.http.post<TimeTableDto>(`${this.apiUrl}/${timetableId}/revert/${versionId}`, {})
      .pipe(
        catchError(error => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  // Utility Methods
  getDayOfWeekName(dayOfWeek: DayOfWeek): string {
    return DayOfWeek[dayOfWeek];
  }

  getDayOfWeekFromString(dayString: string): DayOfWeek {
    return DayOfWeek[dayString as keyof typeof DayOfWeek];
  }

  formatPeriodTime(period: number): string {
    const times = [
      '08:00-08:45', '08:50-09:35', '09:40-10:25', '10:45-11:30',
      '11:35-12:20', '12:25-13:10', '14:00-14:45', '14:50-15:35'
    ];
    return times[period - 1] || `Period ${period}`;
  }

  // State management helpers
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private refreshTimetables(): void {
    this.http.get<TimeTableDto[]>(`${this.apiUrl}`)
      .subscribe(timetables => {
        this.timetablesSubject.next(timetables);
      });
  }

  private refreshCurrentTimetable(id: number): void {
    this.getTimetableById(id).subscribe();
  }

  private notifyTimetableChange(type: string, data: any): void {
    this.timetableChangesSubject.next({ type, data });
  }

  // Error handling
  private handleError(error: any): any {
    console.error('API Error:', error);
    
    if (error.status === 0) {
      return { message: 'Network error. Please check your connection.' };
    }
    
    if (error.status === 404) {
      return { message: 'Resource not found.' };
    }
    
    if (error.status === 400) {
      return { 
        message: 'Bad request. Please check your input.', 
        errors: error.error?.errors || []
      };
    }
    
    if (error.status === 500) {
      return { message: 'Server error. Please try again later.' };
    }
    
    return { 
      message: error.error?.message || 'An unexpected error occurred.',
      errors: error.error?.errors || []
    };
  }

  // Helper methods for frontend
  createEmptyTimetableSlot(period: number, dayOfWeek: DayOfWeek): AddTimetableSlotDto {
    return {
      period,
      dayOfWeek,
      subjectId: undefined,
      teacherId: undefined
    };
  }

  createDefaultConstraints(): TimetableConstraints {
    return {
      avoidDoubleBooking: true,
      spreadSubjectsEvenly: true,
      respectRestrictedPeriods: true,
      balanceWorkload: false,
      allowConsecutiveClasses: false
    };
  }

  generateScheduleId(): string {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
    const random = Math.random().toString(36).substr(2, 5);
    return `SCHEDULE_${timestamp}_${random}`.toUpperCase();
  }

  // Validation helpers
  validateTimetableData(timetable: AddTimeTableDto): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!timetable.classId) {
      errors.push('Class ID is required');
    }
    
    if (!timetable.scheduleId?.trim()) {
      errors.push('Schedule ID is required');
    }
    
    if (timetable.scheduleId && timetable.scheduleId.length > 100) {
      errors.push('Schedule ID cannot exceed 100 characters');
    }
    
    // Check for duplicate slots
    const slotKeys = new Set<string>();
    for (const slot of timetable.timetableSlots || []) {
      const key = `${slot.dayOfWeek}-${slot.period}`;
      if (slotKeys.has(key)) {
        errors.push(`Duplicate slot found for ${DayOfWeek[slot.dayOfWeek]} Period ${slot.period}`);
      }
      slotKeys.add(key);
      
      if (slot.period < 1 || slot.period > 8) {
        errors.push('Period must be between 1 and 8');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Export functionality
  exportTimetableAsJson(timetable: TimeTableDto): string {
    return JSON.stringify(timetable, null, 2);
  }

  downloadTimetableAsJson(timetable: TimeTableDto): void {
    const dataStr = this.exportTimetableAsJson(timetable);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timetable-${timetable.className}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
    findAlternativeSlots(timetableId: number, slotId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${timetableId}/slots/${slotId}/alternatives`)
    .pipe(
      catchError(error => {
        return throwError(() => this.handleError(error));
      })
    );
}
// DELETE: remove timetable slot
removeSlot(slotId: number): Observable<boolean> {
  return this.http.delete<void>(`${this.apiUrl}/slots/${slotId}`)
    .pipe(
      map(() => true),
      catchError(error => {
        return throwError(() => this.handleError(error));
      })
    );
}
// timetable.service.ts
addSlot(slot: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/add-slot`, slot);
}



}