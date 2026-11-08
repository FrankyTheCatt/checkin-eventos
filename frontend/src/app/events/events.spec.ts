import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventsService } from './events';
import { environment } from '../../environments/environment';

describe('EventsService', () => {
  let service: EventsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EventsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('reacciona a la búsqueda y a la página, cancelando la solicitud anterior', async () => {
    const query = signal({ search: '', skip: 0, limit: 7 });
    const resource = TestBed.runInInjectionContext(() => service.listResource(query));
    TestBed.tick();
    const first = http.expectOne(
      (request) => request.url.endsWith('/events') && request.params.get('skip') === '0',
    );
    query.set({ search: 'Angular', skip: 6, limit: 7 });
    TestBed.tick();
    expect(first.cancelled).toBe(true);
    http
      .expectOne(
        (request) =>
          request.params.get('search') === 'Angular' && request.params.get('skip') === '6',
      )
      .flush([]);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(resource.isLoading()).toBe(false);
  });

  it('envía cambios y eliminación a las rutas del contrato', () => {
    service.deleteEvent(8).subscribe();
    const deletion = http.expectOne(environment.apiUrl + '/events/8');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null, { status: 204, statusText: 'No Content' });
    service.attendEvent(8).subscribe();
    const attendance = http.expectOne(environment.apiUrl + '/events/8/attendances');
    expect(attendance.request.method).toBe('POST');
    expect(attendance.request.body).toEqual({});
    attendance.flush({ id: 1 });
  });
});
