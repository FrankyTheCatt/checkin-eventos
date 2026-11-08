import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EventDetail } from './event-detail';
import { AuthService } from '../../auth/auth';

describe('EventDetail', () => {
  const event = {
    id: 1,
    owner_id: 2,
    title: 'Taller',
    starts_at: '2026-11-20T15:00:00Z',
    ends_at: '2026-11-20T17:00:00Z',
    attendance_count: 0,
    latitude: null,
  };
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [EventDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
        { provide: AuthService, useValue: { usuario: signal({ id: 9 }) } },
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('oculta controles del dueño y no solicita su lista privada de asistentes', async () => {
    const fixture = TestBed.createComponent(EventDetail);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne((req) => req.url.endsWith('/events/1')).flush(event);
    http.expectOne((req) => req.url.endsWith('/attendances/me')).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar');
    expect(fixture.nativeElement.textContent).not.toContain('Asistentes de tu evento');
    expect(fixture.nativeElement.textContent).toContain('Registrar asistencia');
  });
});
