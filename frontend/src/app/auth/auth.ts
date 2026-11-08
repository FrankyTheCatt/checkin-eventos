import { Injectable, afterNextRender, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly token = signal<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  );
  readonly usuario = signal<AuthUser | null>(null);
  readonly autenticado = computed(() => this.token() !== null);

  constructor() {
    afterNextRender(() => {
      if (this.token()) this.cargarPerfil().subscribe({ error: () => this.logout() });
    });
  }

  login(credenciales: { email: string; password: string }) {
    return this.http
      .post<{ access_token: string }>(environment.apiUrl + '/auth/login', credenciales)
      .pipe(
        tap((res) => {
          localStorage.setItem('token', res.access_token);
          this.token.set(res.access_token);
        }),
        switchMap(() => this.cargarPerfil()),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        }),
      );
  }

  registrar(datos: { email: string; full_name: string; password: string }) {
    return this.http.post<AuthUser>(environment.apiUrl + '/auth/register', datos);
  }

  cargarPerfil() {
    return this.http
      .get<AuthUser>(environment.apiUrl + '/auth/me')
      .pipe(tap((user) => this.usuario.set(user)));
  }

  logout() {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    this.token.set(null);
    this.usuario.set(null);
  }
}
