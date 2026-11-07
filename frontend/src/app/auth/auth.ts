import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  
  // Validamos si estamos en el navegador (typeof window) antes de usar localStorage
  token = signal<string | null>(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  usuario = signal<any>(null);
  autenticado = computed(() => this.token() !== null);

  constructor() {
    if (this.token()) {
      this.cargarPerfil().subscribe();
    }
  }

  login(credenciales: any) {
    return this.http.post<{access_token: string}>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap(res => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', res.access_token);
        }
        this.token.set(res.access_token);
        this.cargarPerfil().subscribe();
      })
    );
  }

  registrar(datos: any) {
    return this.http.post(`${environment.apiUrl}/auth/register`, datos);
  }

  cargarPerfil() {
    return this.http.get(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => this.usuario.set(user))
    );
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.token.set(null);
    this.usuario.set(null);
  }
}