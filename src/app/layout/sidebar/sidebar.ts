import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule, RouterModule],
  template: `
    <mat-nav-list>
     
      <a mat-list-item routerLink="/teachers">👩‍🏫 المدرسون</a>
      <a mat-list-item routerLink="/classes">🏫 الفصول</a>
      <a mat-list-item routerLink="/timetable">📅 جدول التوزيع</a>
    </mat-nav-list>
  `
})
export class Sidebar {}
