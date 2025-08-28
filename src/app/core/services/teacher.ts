// teacher.service.ts - النسخة المُحدثة مع جلب الفصول الفعلية من قاعدة البيانات
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Teacher {
  id?: number;
  name: string;
  subject: string;
  weeklyQuota: number;
  classNames?: string[];
  restrictedPeriods: string[];
}

export interface Subject {
  id: number;
  name: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface ClassDto {
  id: number;
  grade: string;
  section: string;
}

export interface AssignedTeacherDto {
  id: number;
  name: string;
  subject: string;
  email?: string;
  phone?: string;
  restrictedPeriods?: string[];
}

export interface ClassTeacherDto {
  id: number;
  classId: number;
  teacherId: number;
  subjectId: number;
  className: string;
  teacherName: string;
  subjectName: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private apiUrl = `${environment.apiUrl}/api/Teacher`;
  private classesUrl = `${environment.apiUrl}/api/Class`;
  private subjectsUrl = `${environment.apiUrl}/api/Subjects`;
  private classTeacherUrl = `${environment.apiUrl}/api/ClassTeacher`;

  constructor(private http: HttpClient) {}

  getTeachers(pageNumber: number = 1, pageSize: number = 5): Observable<PagedResult<Teacher>> {
    console.log(`طلب المعلمين - الصفحة: ${pageNumber}, الحجم: ${pageSize}`);
    
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PagedResult<Teacher>>(`${this.apiUrl}/paged`, { params }).pipe(
      map(response => {
        console.log('استجابة getTeachers:', response);
        return {
          items: response.items || [],
          totalCount: response.totalCount || 0
        };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في getTeachers:', error);
        console.error('تفاصيل الخطأ:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        return of({
          items: [],
          totalCount: 0
        });
      })
    );
  }

  getTeacherById(id: number): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.apiUrl}/${id}`).pipe(
      tap(teacher => console.log(`تم جلب المعلم ${id}:`, teacher)),
      catchError((error: HttpErrorResponse) => {
        console.error(`خطأ في جلب المعلم ${id}:`, error);
        throw error;
      })
    );
  }

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.subjectsUrl).pipe(
      map(response => {
        console.log('المواد المجلبة:', response);
        return Array.isArray(response) ? response : [];
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب المواد:', error);
        return of([]);
      })
    );
  }

  // ✅ الدالة المُحدثة - جلب الفصول الحقيقية من قاعدة البيانات بدلاً من الفصول الثابتة
  getAvailableClasses(): Observable<string[]> {
    console.log('🔄 جلب الفصول الحقيقية من قاعدة البيانات...');
    
    return this.http.get<ClassDto[]>(this.classesUrl).pipe(
      map(classes => {
        console.log('📦 الفصول المجلبة من قاعدة البيانات:', classes);
        
        if (!Array.isArray(classes) || classes.length === 0) {
          console.warn('⚠️ لا توجد فصول في قاعدة البيانات');
          return [];
        }

        // تحويل الفصول إلى التنسيق المطلوب: grade/section
        const formattedClasses = classes
          .filter(c => c && c.grade && c.section) // التأكد من صحة البيانات
          .map(c => `${c.grade}/${c.section}`)
          .filter((value, index, self) => self.indexOf(value) === index); // إزالة التكرارات

        console.log('✅ الفصول المنسقة:', formattedClasses);
        console.log(`📊 تم معالجة ${classes.length} فصل خام إلى ${formattedClasses.length} فصل فريد`);
        
        return formattedClasses.sort(); // ترتيب الفصول أبجدياً
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ خطأ في جلب الفصول من قاعدة البيانات:', error);
        console.error('📍 تفاصيل الخطأ:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        
        // إرجاع مصفوفة فارغة بدلاً من الفصول الثابتة
        return of([]);
      })
    );
  }

addTeacher(teacherData: Teacher): Observable<any> {
  console.log('إرسال طلب إضافة معلم:', teacherData);

  return new Observable(observer => {
    Promise.all([
      this.http.get<Subject[]>(this.subjectsUrl).toPromise(),
      this.http.get<ClassDto[]>(this.classesUrl).toPromise()
    ]).then(([subjects, allClasses]) => {
      console.log('المواد والفصول المجلبة:', { subjects, allClasses });

      const subjectsArray = Array.isArray(subjects) ? subjects : [];

      // ✅ البحث عن المادة بالاسم (teacherData.subject = "Physics") وجلب الـ id
      const subject = subjectsArray.find(s =>
        s.name.toLowerCase() === String(teacherData.subject).toLowerCase()
      );

      const subjectName = subject ? subject.name : String(teacherData.subject);
      const subjectId = subject ? subject.id : null;
      const subjectIds = subjectId ? [subjectId] : [];

      console.log('اسم المادة المحدد:', subjectName);
      console.log('معرف المادة المحدد:', subjectId);

      let classIds: number[] = [];
      if (teacherData.classNames?.length && Array.isArray(allClasses) && allClasses.length > 0) {
        classIds = allClasses
          .filter(cls => teacherData.classNames!.includes(`${cls.grade}/${cls.section}`))
          .map(cls => cls.id);
      }
      console.log('معرفات الفصول:', classIds);

      const addDto = {
        name: teacherData.name,
        subject: subjectName,
        weeklyQuota: teacherData.weeklyQuota,
        restrictedPeriods: teacherData.restrictedPeriods || [],
        subjectIds: subjectIds,
        classIds: classIds
      };

      console.log('بيانات الإضافة النهائية:', addDto);

      this.http.post<any>(this.apiUrl, addDto).subscribe({
        next: response => {
          console.log('استجابة إضافة المعلم:', response);
          observer.next(response);
          observer.complete();
        },
        error: err => {
          console.error('خطأ في إضافة المعلم:', err);
          observer.error(err);
        }
      });

    }).catch(error => {
      console.error('خطأ في جلب المواد/الفصول:', error);
      observer.error(error);
    });
  });
}



updateTeacher(id: number, teacherData: Teacher): Observable<any> {
  console.log('تحديث المعلم:', id, teacherData);
  
  return new Observable(observer => {
    Promise.all([
      this.http.get<Subject[]>(this.subjectsUrl).toPromise(),
      this.http.get<ClassDto[]>(this.classesUrl).toPromise()
    ]).then(([subjects, allClasses]) => {
      console.log('المواد والفصول للتحديث:', { subjects, allClasses });
      
      const subjectsArray = Array.isArray(subjects) ? subjects : [];

      // ✅ البحث عن المادة بالاسم وجلب الـ id
      const subject = subjectsArray.find(s =>
        s.name.toLowerCase() === String(teacherData.subject).toLowerCase()
      );

      const subjectName = subject ? subject.name : String(teacherData.subject);
      const subjectId = subject ? subject.id : null;
      const subjectIds = subjectId ? [subjectId] : [];

      console.log('اسم المادة للتحديث:', subjectName);
      console.log('معرف المادة للتحديث:', subjectId);

      let classIds: number[] = [];
      if (teacherData.classNames?.length && Array.isArray(allClasses) && allClasses.length > 0) {
        classIds = allClasses
          .filter(cls => teacherData.classNames!.includes(`${cls.grade}/${cls.section}`))
          .map(cls => cls.id);
      }
      console.log('معرفات الفصول للتحديث:', classIds);

      const updateDto = {
        id: id,
        name: teacherData.name,
        subject: subjectName,
        weeklyQuota: teacherData.weeklyQuota,
        restrictedPeriods: teacherData.restrictedPeriods || [],
        subjectIds: subjectIds,
        classIds: classIds
      };

      console.log('بيانات التحديث النهائية:', updateDto);

      this.http.put<any>(`${this.apiUrl}/${id}`, updateDto).subscribe({
        next: response => {
          console.log('استجابة تحديث المعلم:', response);
          observer.next(response);
          observer.complete();
        },
        error: err => {
          console.error('خطأ في تحديث المعلم:', err);
          observer.error(err);
        }
      });

    }).catch(error => {
      console.error('خطأ في جلب المواد/الفصول للتحديث:', error);
      observer.error(error);
    });
  });
}


  deleteTeacher(id: number): Observable<any> {
    console.log('حذف المعلم:', id);
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`تم حذف المعلم ${id} بنجاح`)),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في حذف المعلم:', error);
        console.error('تفاصيل خطأ الحذف:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          errorBody: error.error
        });
        
        throw {
          ...error,
          customMessage: this.getDeleteErrorMessage(error.status)
        };
      })
    );
  }

  private getDeleteErrorMessage(status: number): string {
    switch (status) {
      case 404:
        return 'المعلم غير موجود أو تم حذفه مسبقاً';
      case 400:
        return 'لا يمكن حذف المعلم لأنه مرتبط ببيانات أخرى';
      case 500:
        return 'خطأ في الخادم أثناء عملية الحذف';
      default:
        return 'حدث خطأ أثناء حذف المعلم';
    }
  }

  getClassTeacherDetails(): Observable<ClassTeacherDto[]> {
    console.log('📋 جلب تفاصيل ClassTeacher...');
    return this.http.get<ClassTeacherDto[]>(this.classTeacherUrl).pipe(
      tap(data => console.log('📦 تفاصيل ClassTeacher:', data)),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ خطأ في جلب تفاصيل ClassTeacher:', error);
        return of([]);
      })
    );
  }

  createClassTeacherAssignment(classId: number, teacherId: number, subjectId: number): Observable<any> {
    console.log('🔗 إنشاء ربط جديد ClassTeacher:', { classId, teacherId, subjectId });
    
    const assignmentData = {
      classId: classId,
      teacherId: teacherId,
      subjectId: subjectId
    };

    return this.http.post<any>(this.classTeacherUrl, assignmentData).pipe(
      tap(response => console.log('✅ تم إنشاء ربط ClassTeacher:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ خطأ في إنشاء ربط ClassTeacher:', error);
        throw error;
      })
    );
  }

  deleteClassTeacherAssignment(id: number): Observable<any> {
    console.log('🗑️ حذف ربط ClassTeacher:', id);
    return this.http.delete(`${this.classTeacherUrl}/${id}`).pipe(
      tap(() => console.log('✅ تم حذف ربط ClassTeacher')),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ خطأ في حذف ربط ClassTeacher:', error);
        throw error;
      })
    );
  }
}