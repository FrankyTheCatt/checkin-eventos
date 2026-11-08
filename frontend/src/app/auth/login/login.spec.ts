import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Login } from './login';

describe('Login', () => {
  it('bloquea el envío de un formulario vacío', () => {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient()],
    });
    const component = TestBed.createComponent(Login).componentInstance;
    expect(component.loginForm.invalid).toBe(true);
    component.onSubmit();
    expect(component.cargando()).toBe(false);
  });
});
