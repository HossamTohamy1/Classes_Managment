// app.component.ts - مُحدث
import { Component, signal, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './layout/sidebar/sidebar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SidebarService } from './services/sidebar';
import { MatPaginatorIntl } from '@angular/material/paginator';

export function getArabicPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = 'عدد العناصر في الصفحة';
  paginatorIntl.nextPageLabel = 'الصفحة التالية';
  paginatorIntl.previousPageLabel = 'الصفحة السابقة';
  paginatorIntl.firstPageLabel = 'الصفحة الأولى';
  paginatorIntl.lastPageLabel = 'الصفحة الأخيرة';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 من ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length
      ? Math.min(startIndex + pageSize, length)
      : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} من ${length}`;
  };

  return paginatorIntl;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, MatSidenavModule, MatListModule,
    MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  protected readonly title = signal('school-timetable');
  
  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(private sidebarService: SidebarService) {}

  ngAfterViewInit() {
    // تسجيل الـ sidenav في الـ service بعد تهيئة الـ view
    this.sidebarService.setSidenav(this.sidenav);
  }

  // طريقة للحصول على حالة الـ sidebar
  getSidebarState() {
    return this.sidebarService.isOpen();
  }
}