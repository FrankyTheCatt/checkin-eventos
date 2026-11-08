import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventList } from './event-list';

describe('EventList', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [EventList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('distingue un error del estado sin resultados y permite reintentar', async () => {
    const fixture = TestBed.createComponent(EventList);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((req) => req.url.endsWith('/events'))
      .flush({ detail: 'Error de prueba' }, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar los eventos');
    expect(fixture.nativeElement.textContent).not.toContain('No hay eventos para mostrar');
    fixture.componentInstance.resource.reload();
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/events')).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay eventos para mostrar');
  });
});
