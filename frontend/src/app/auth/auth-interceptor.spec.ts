import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

describe('authInterceptor', () => {
  const logout = vi.fn();
  beforeEach(() => {
    logout.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: signal('jwt-prueba'), logout } },
      ],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('agrega JWT a la API y cierra sesión ante un 401', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(HttpClient)
      .get(environment.apiUrl + '/events')
      .subscribe({ error: () => {} });
    const request = TestBed.inject(HttpTestingController).expectOne(environment.apiUrl + '/events');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-prueba');
    request.flush({ detail: 'No autenticado' }, { status: 401, statusText: 'Unauthorized' });
    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('no envía el token a otros servidores', () => {
    TestBed.inject(HttpClient).get('https://example.org/data').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('https://example.org/data');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
