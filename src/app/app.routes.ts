import { Routes } from '@angular/router';
import { Teachers } from './pages/teachers/teachers';

export const routes: Routes = [
  { path: '', redirectTo: 'teachers', pathMatch: 'full' },  
  {
    path: 'teachers',
    loadComponent: () => import('./pages/teachers/teachers').then(m => m.Teachers),
  },
  {
    path: 'classes',
    loadComponent: () => import('./pages/classes/classes').then(m => m.Classes),
  },
  {
    path: 'timetable',
    loadComponent: () => import('./pages/timetable/timetable').then(m => m.Timetable),
  },

];