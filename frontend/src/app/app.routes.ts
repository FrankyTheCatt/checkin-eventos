import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'eventos',
    canActivate: [authGuard],
    loadComponent: () => import('./events/event-list/event-list').then((m) => m.EventList),
  },
  {
    path: 'eventos/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./events/event-detail/event-detail').then((m) => m.EventDetail),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile').then((m) => m.Profile),
  },
  { path: '', redirectTo: 'eventos', pathMatch: 'full' },
  { path: '**', redirectTo: 'eventos' },
];
