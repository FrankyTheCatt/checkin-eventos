import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';

describe('MotionService', () => {
  let service: MotionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MotionService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('emite el evento shake$ cuando se invoca simulateShake()', () => {
    let shakeEmitido = false;
    service.shake$.subscribe(() => {
      shakeEmitido = true;
    });

    service.simulateShake();
    expect(shakeEmitido).toBe(true);
    expect(service.shakeCount()).toBe(1);
  });

  it('incrementa el conteo de sacudidas en cada simulateShake()', () => {
    service.simulateShake();
    service.simulateShake();
    expect(service.shakeCount()).toBe(2);
  });
});
