// classes.service.ts - النسخة المُحدثة مع إصلاح أخطاء TypeScript
import { Injectable } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from './../../../../environments/environment';

export interface Class {
  id?: number;
  grade: string;
  section: string;
  subjects: { name: string; hoursPerWeek: number }[];
  teacherNames?: string[];
  totalHours: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

interface CustomError extends Error {
  message: string;
  status?: number;
  statusText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  private apiUrl = `${environment.apiUrl}/api/Class`;
  
  private dataUpdated$ = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {
    console.log('ClassesService initialized with API URL:', this.apiUrl);
  }

  get dataUpdated(): Observable<void> {
    return this.dataUpdated$.asObservable();
  }

  private notifyDataUpdate(): void {
    this.dataUpdated$.next();
  }

  private createCustomError(error: HttpErrorResponse, customMessage: string): CustomError {
    const customError: CustomError = new Error(customMessage) as CustomError;
    customError.status = error.status;
    customError.statusText = error.statusText;
    return customError;
  }

getClasses(params?: PaginationParams): Observable<PaginatedResponse<Class>> {
  console.log('طلب الفصول مع المعاملات:', params);

  let httpParams = new HttpParams();

  const pageNumber = params?.pageNumber || 1;
  const pageSize = params?.pageSize || 10;

  httpParams = httpParams.set('pageNumber', pageNumber.toString());
  httpParams = httpParams.set('pageSize', pageSize.toString());

  const url = `${this.apiUrl}/paged`;

  console.log('إرسال طلب HTTP إلى:', url);
  console.log('معاملات الاستعلام:', httpParams.toString());
  
  return this.http.get<PagedResult<Class>>(url, { params: httpParams }).pipe(
    tap(raw => {
      console.log('الاستجابة الخام من الباك اند:', raw);
    }),
    map(backendResponse => {
      console.log('تحويل استجابة الباك اند...');

      const totalPages = Math.ceil(backendResponse.totalCount / pageSize);
      const hasNextPage = pageNumber < totalPages;
      const hasPreviousPage = pageNumber > 1;

      const response: PaginatedResponse<Class> = {
        items: backendResponse.items || [],
        totalCount: backendResponse.totalCount || 0,
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      };

      console.log('الاستجابة المحولة:', response);
      return response;
    }),
    tap(response => {
      console.log('الاستجابة النهائية بعد التحويل:', response);
      console.log('عدد العناصر:', response.items?.length || 0);
      console.log('العدد الإجمالي:', response.totalCount);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('خطأ في API getClasses:', error);
      console.error('تفاصيل الخطأ:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: error.message,
        errorBody: error.error
      });

      let errorMessage = 'خطأ غير معروف';

      if (error.status === 0) {
        errorMessage = 'لا يمكن الوصول إلى الخادم. تأكد من تشغيل API على https://localhost:7089';
        console.error('نصائح الإصلاح:');
        console.error('   1. تأكد من تشغيل API Server');
        console.error('   2. تحقق من إعدادات CORS في Backend');
        console.error('   3. تأكد من صلاحية شهادة SSL');
      } else if (error.status === 404) {
        errorMessage = 'API endpoint غير موجود. تحقق من رابط API';
      } else if (error.status === 500) {
        errorMessage = 'خطأ داخلي في الخادم';
      } else if (error.status >= 400 && error.status < 500) {
        errorMessage = `خطأ في الطلب: ${error.status}`;
      }

      return throwError(() => this.createCustomError(error, errorMessage));
    })
  );
}


  addClass(classData: Class): Observable<Class> {
    console.log('إضافة فصل جديد:', classData);

    return this.http.post<Class>(this.apiUrl, classData).pipe(
      tap(response => {
        console.log('تم إضافة الفصل بنجاح:', response);
        this.notifyDataUpdate(); // إشعار بالتحديث
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في إضافة الفصل:', error);
        console.error('تفاصيل خطأ الإضافة:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          errorBody: error.error
        });

        let customMessage = 'خطأ غير محدد في إضافة الفصل';

        // تحسين رسائل الخطأ
        if (error.status === 400) {
          const errorBody = error.error;
          if (typeof errorBody === 'string' && errorBody.includes('already exists')) {
            customMessage = 'الفصل موجود بالفعل';
          } else if (errorBody?.message) {
            customMessage = errorBody.message;
          } else {
            customMessage = 'بيانات الفصل غير صالحة';
          }
        } else if (error.status === 500) {
          customMessage = 'خطأ في الخادم أثناء إضافة الفصل';
        }

        return throwError(() => this.createCustomError(error, customMessage));
      })
    );
  }

  updateClass(id: number, classData: Class): Observable<Class> {
    console.log('تحديث الفصل:', id, classData);

    const updateDto = {
      id: id,
      grade: classData.grade,
      section: classData.section,
      subjects: classData.subjects,
      teacherNames: classData.teacherNames,
      totalHours: classData.totalHours,
    };

    return this.http.put<Class>(`${this.apiUrl}/${id}`, updateDto).pipe(
      tap(response => {
        console.log('تم تحديث الفصل بنجاح:', response);
        this.notifyDataUpdate(); // إشعار بالتحديث
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في تحديث الفصل:', error);
        console.error('تفاصيل خطأ التحديث:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          errorBody: error.error
        });

        let customMessage = 'خطأ غير محدد في تحديث الفصل';

        // تحسين رسائل الخطأ
        if (error.status === 404) {
          customMessage = 'الفصل غير موجود';
        } else if (error.status === 400) {
          const errorBody = error.error;
          if (errorBody?.message) {
            customMessage = errorBody.message;
          } else {
            customMessage = 'بيانات التحديث غير صالحة';
          }
        } else if (error.status === 500) {
          customMessage = 'خطأ في الخادم أثناء تحديث الفصل';
        }

        return throwError(() => this.createCustomError(error, customMessage));
      })
    );
  }

  deleteClass(id: number): Observable<any> {
    console.log('حذف الفصل بالمعرف:', id);

    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('تم حذف الفصل بنجاح');
        this.notifyDataUpdate(); // إشعار بالتحديث
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في حذف الفصل:', error);
        console.error('تفاصيل خطأ الحذف:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          errorBody: error.error
        });

        let customMessage = 'خطأ غير محدد في حذف الفصل';

        // تحسين رسائل الخطأ للحذف
        if (error.status === 404) {
          customMessage = 'الفصل غير موجود أو تم حذفه مسبقا';
        } else if (error.status === 400) {
          const errorBody = error.error;
          if (errorBody?.message && errorBody.message.includes('constraint')) {
            customMessage = 'لا يمكن حذف الفصل لأنه مرتبط ببيانات أخرى';
          } else {
            customMessage = errorBody?.message || 'لا يمكن حذف الفصل';
          }
        } else if (error.status === 500) {
          customMessage = 'خطأ في الخادم أثناء حذف الفصل';
        }

        return throwError(() => this.createCustomError(error, customMessage));
      })
    );
  }

  // دالة اختبار الاتصال
  testConnection(): Observable<any> {
    console.log('اختبار اتصال API...');
    return this.http.get(`${this.apiUrl.replace('/Class', '/health')}`).pipe(
      tap(() => console.log('اتصال API سليم')),
      catchError((error) => {
        console.error('فشل اتصال API:', error);
        return throwError(() => error);
      })
    );
  }

  // دالة للحصول على فصل واحد بالمعرف
  getClassById(id: number): Observable<Class> {
    console.log('جلب الفصل بالمعرف:', id);
    return this.http.get<Class>(`${this.apiUrl}/${id}`).pipe(
      tap(classData => console.log('تم جلب الفصل:', classData)),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب الفصل:', error);
        
        let customMessage = 'خطأ في جلب الفصل';
        if (error.status === 404) {
          customMessage = 'الفصل غير موجود';
        }
        
        return throwError(() => this.createCustomError(error, customMessage));
      })
    );
  }

  // دالة للحصول على جميع الفصول بدون تصفح
  getAllClasses(): Observable<Class[]> {
    console.log('جلب جميع الفصول...');
    return this.http.get<Class[]>(`${this.apiUrl}/all`).pipe(
      tap(classes => console.log('تم جلب جميع الفصول:', classes)),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب جميع الفصول:', error);
        return throwError(() => this.createCustomError(error, 'خطأ في جلب جميع الفصول'));
      })
    );
  }

  // دالة للبحث في الفصول
  searchClasses(searchTerm: string): Observable<Class[]> {
    console.log('البحث في الفصول:', searchTerm);
    
    const params = new HttpParams().set('search', searchTerm);
    
    return this.http.get<Class[]>(`${this.apiUrl}/search`, { params }).pipe(
      tap(results => console.log('نتائج البحث:', results)),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في البحث:', error);
        return throwError(() => this.createCustomError(error, 'خطأ في البحث'));
      })
    );
  }
}