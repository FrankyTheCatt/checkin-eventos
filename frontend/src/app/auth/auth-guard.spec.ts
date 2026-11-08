import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth-guard';
import { AuthService } from './auth';

describe('guards de sesión', () => {
  const autenticado = signal(false);
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { autenticado } }],
    }),
  );
  it('protege eventos y permite login sin sesión', () => {
    autenticado.set(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    ) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBe(true);
  });
  it('redirige a eventos cuando ya existe una sesión', () => {
    autenticado.set(true);
    expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toBe(true);
    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as never, {} as never),
    ) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/eventos');
  });
});
