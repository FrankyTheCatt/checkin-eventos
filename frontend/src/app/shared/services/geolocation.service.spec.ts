import { TestBed } from '@angular/core/testing';
import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeolocationService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('calcula la distancia de Haversine correctamente entre dos puntos', () => {
    // Distancia entre Plaza Colón Antofagasta (-23.6464, -70.3980) y UCN Antofagasta (-23.6800, -70.4117)
    // Aproximadamente 4.0 km (3900 - 4100 metros)
    const distance = service.calculateDistance(-23.6464, -70.398, -23.68, -70.4117);
    expect(distance).toBeGreaterThan(3500);
    expect(distance).toBeLessThan(4500);
  });

  it('calcula 0 metros si las coordenadas son idénticas', () => {
    const distance = service.calculateDistance(-23.68, -70.4117, -23.68, -70.4117);
    expect(distance).toBe(0);
  });

  it('valida correctamente si el usuario está dentro o fuera del radio del evento', () => {
    // Mismo punto con radio de 50 metros -> dentro
    const within = service.validateDistanceToEvent(-23.68, -70.4117, -23.68, -70.4117, 50);
    expect(within).not.toBeNull();
    expect(within?.withinRadius).toBe(true);
    expect(within?.distanceMeters).toBe(0);

    // Punto lejano (a ~4000m) con radio de 100 metros -> fuera
    const outside = service.validateDistanceToEvent(-23.6464, -70.398, -23.68, -70.4117, 100);
    expect(outside).not.toBeNull();
    expect(outside?.withinRadius).toBe(false);
    expect(outside?.distanceMeters).toBeGreaterThan(100);
  });

  it('retorna null si el evento no tiene coordenadas configuradas', () => {
    const res = service.validateDistanceToEvent(-23.68, -70.4117, null, null, 100);
    expect(res).toBeNull();
  });

  it('formatea la distancia en metros o kilómetros apropiadamente', () => {
    expect(service.formatDistance(45)).toBe('45 m');
    expect(service.formatDistance(999)).toBe('999 m');
    expect(service.formatDistance(1500)).toBe('1.5 km');
    expect(service.formatDistance(4000)).toBe('4.0 km');
  });
});
