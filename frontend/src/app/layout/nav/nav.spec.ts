import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Nav } from './nav';
import { AuthService } from '../../auth/auth';

describe('Nav', () => {
  it('cierra sesión y vuelve al login', () => {
    const logout = vi.fn();
    TestBed.configureTestingModule({
      imports: [Nav],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { autenticado: signal(true), logout } },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    TestBed.createComponent(Nav).componentInstance.logout();
    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
