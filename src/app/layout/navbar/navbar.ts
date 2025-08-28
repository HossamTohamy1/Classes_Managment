// navbar.component.ts - مُحدث
import { Component, Input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SidebarService } from '../../services/sidebar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  @Input() pageTitle: string = 'My App';

  constructor(private sidebarService: SidebarService) {}

  // دالة تبديل حالة الـ sidebar
  toggleSidebar() {
    this.sidebarService.toggle();
  }

  // دالة للحصول على حالة الـ sidebar
  isSidebarOpen() {
    return this.sidebarService.isOpen();
  }
}