// base-page.ts - مُصحح
import { Component, Input } from '@angular/core';
import { Navbar} from '../navbar/navbar';

@Component({
  selector: 'app-base-page',
  standalone: true,
  imports: [Navbar],
  templateUrl: './base-page.html',
  styleUrls: ['./base-page.css']
})
export class BasePage {
  @Input() pageTitle: string = 'صفحة جديدة';
}