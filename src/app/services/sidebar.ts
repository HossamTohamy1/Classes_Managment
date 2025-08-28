// services/sidebar.service.ts
import { Injectable, signal } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private _isOpen = signal(true); // حالة افتراضية مفتوحة
  private sidenav: MatSidenav | null = null;

  // تسجيل الـ MatSidenav من app component
  setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
    // تطبيق الحالة الحالية على الـ sidenav
    if (this._isOpen()) {
      this.sidenav.open();
    } else {
      this.sidenav.close();
    }
  }

  // الحصول على حالة الـ sidebar
  isOpen() {
    return this._isOpen();
  }

  // تبديل حالة الـ sidebar
  toggle() {
    if (this.sidenav) {
      if (this._isOpen()) {
        this.sidenav.close();
        this._isOpen.set(false);
      } else {
        this.sidenav.open();
        this._isOpen.set(true);
      }
    }
  }

  // فتح الـ sidebar
  open() {
    if (this.sidenav) {
      this.sidenav.open();
      this._isOpen.set(true);
    }
  }

  // إغلاق الـ sidebar
  close() {
    if (this.sidenav) {
      this.sidenav.close();
      this._isOpen.set(false);
    }
  }
}