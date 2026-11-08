import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventForm, localDate } from './event-form';

describe('EventForm', () => {
  const close = vi.fn();
  beforeEach(() => {
    close.mockReset();
    TestBed.configureTestingModule({
      imports: [EventForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('rechaza títulos vacíos y fechas invertidas', () => {
    const component = TestBed.createComponent(EventForm).componentInstance;
    component.form.patchValue({
      title: '   ',
      starts_at: '2026-11-20T15:00',
      ends_at: '2026-11-20T14:00',
    });
    expect(component.form.invalid).toBe(true);
    expect(component.form.hasError('dateOrder')).toBe(true);
    component.guardar();
    expect(close).not.toHaveBeenCalled();
  });

  it('conserva el formulario cuando la API falla y permite reintentar', () => {
    const component = TestBed.createComponent(EventForm).componentInstance;
    component.form.patchValue({
      title: 'Taller',
      starts_at: '2026-11-20T15:00',
      ends_at: '2026-11-20T17:00',
    });
    component.guardar();
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne((req) => req.method === 'POST' && req.url.endsWith('/events'));
    expect(request.request.body.starts_at).toBe(new Date('2026-11-20T15:00').toISOString());
    request.flush({ detail: 'Sin permiso' }, { status: 403, statusText: 'Forbidden' });
    expect(close).not.toHaveBeenCalled();
    expect(component.error()).toBe('Sin permiso');
    expect(component.saving()).toBe(false);
    expect(component.form.controls.title.value).toBe('Taller');
  });

  it('adapta las fechas del servidor a datetime-local', () => {
    const iso = '2026-11-20T15:30:00Z';
    const local = localDate(iso);
    expect(local).toMatch(/^2026-11-20T\d{2}:30$/);
    expect(new Date(local).getTime()).toBe(new Date(iso).getTime());
  });

  it('carga un evento y guarda sus cambios mediante PUT', () => {
    const event = {
      id: 8,
      title: 'Original',
      starts_at: '2026-11-20T15:00:00Z',
      ends_at: '2026-11-20T17:00:00Z',
    };
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: event });
    const component = TestBed.createComponent(EventForm).componentInstance;
    expect(component.form.controls.title.value).toBe('Original');
    component.form.controls.title.setValue('Modificado');
    component.guardar();
    const request = TestBed.inject(HttpTestingController).expectOne(
      (req) => req.method === 'PUT' && req.url.endsWith('/events/8'),
    );
    expect(request.request.body.title).toBe('Modificado');
    request.flush({ ...event, title: 'Modificado' });
    expect(close).toHaveBeenCalledWith({ ...event, title: 'Modificado' });
  });
});
