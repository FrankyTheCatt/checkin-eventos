import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EventDetail } from './event-detail';
import { AuthService } from '../../auth/auth';

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,test-qr') },
}));

describe('EventDetail', () => {
  let currentUser: ReturnType<typeof signal<{ id: number } | null>>;
  const event = {
    id: 1,
    owner_id: 2,
    title: 'Taller',
    starts_at: '2026-11-20T15:00:00Z',
    ends_at: '2026-11-20T17:00:00Z',
    attendance_count: 0,
    latitude: null,
  };
  beforeEach(() => {
    currentUser = signal({ id: 9 });
    TestBed.configureTestingModule({
      imports: [EventDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
        { provide: AuthService, useValue: { usuario: currentUser } },
      ],
    });
  });
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

  it('muestra el código QR al dueño del evento', async () => {
    currentUser.set({ id: 2 });
    const fixture = TestBed.createComponent(EventDetail);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne((req) => req.url.endsWith('/events/1')).flush(event);
    http.expectOne((req) => req.url.endsWith('/attendances/me')).flush([]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.componentInstance.isOwner()).toBe(true);
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      const qrRequests = http.match((req) => req.url.endsWith('/events/1/qr'));
      qrRequests.forEach((request) => request.flush({ qr_code: 'evento-secreto' }));
      http
        .match((req) => req.url.endsWith('/events/1/attendances'))
        .forEach((request) => request.flush([]));
      expect(qrRequests).toHaveLength(1);
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img[alt="Código QR del evento"]')?.src).toBe(
        'data:image/png;base64,test-qr',
      );
    });
  });
});
