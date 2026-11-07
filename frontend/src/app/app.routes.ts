import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/login').then(m => m.Login) 
  },
  { 
    path: 'registro', 
    loadComponent: () => import('./auth/registro/registro').then(m => m.Registro) 
  },
  { 
    path: 'eventos', 
    canActivate: [authGuard],
    loadComponent: () => import('./events/event-list/event-list').then(m => m.EventList) 
  },
  { 
    path: 'eventos/:id', 
    canActivate: [authGuard],
    loadComponent: () => import('./events/event-detail/event-detail').then(m => m.EventDetail) 
  },
  { path: '', redirectTo: 'eventos', pathMatch: 'full' },
  { path: '**', redirectTo: 'eventos' }
];