import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('carga el perfil después del login y limpia la sesión al salir', () => {
    const service = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    service.login({ email: 'ana@correo.cl', password: 'clave-segura' }).subscribe();
    http.expectOne(environment.apiUrl + '/auth/login').flush({ access_token: 'token-de-prueba' });
    expect(service.token()).toBe('token-de-prueba');
    http
      .expectOne(environment.apiUrl + '/auth/me')
      .flush({ id: 1, full_name: 'Ana', email: 'ana@correo.cl' });
    expect(service.usuario()?.id).toBe(1);
    service.logout();
    expect(service.autenticado()).toBe(false);
    expect(service.usuario()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
