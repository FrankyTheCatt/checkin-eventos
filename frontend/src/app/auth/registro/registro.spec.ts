import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Registro } from './registro';

describe('Registro', () => {
  it('bloquea el envío de un formulario vacío', () => {
    TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideRouter([]), provideHttpClient()],
    });
    const component = TestBed.createComponent(Registro).componentInstance;
    expect(component.registroForm.invalid).toBe(true);
    component.onSubmit();
    expect(component.cargando()).toBe(false);
  });
});
