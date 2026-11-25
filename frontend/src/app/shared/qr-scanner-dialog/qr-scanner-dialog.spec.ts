import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { QrScannerDialog } from './qr-scanner-dialog';

describe('QrScannerDialog', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogRefMock = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [QrScannerDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        provideNoopAnimations(),
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(QrScannerDialog);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('procesa y cierra el diálogo con el eventId cuando se ingresa un ID numérico manual', () => {
    const fixture = TestBed.createComponent(QrScannerDialog);
    const component = fixture.componentInstance;

    component.codigoManual = '15';
    component.confirmarManual();

    expect(dialogRefMock.close).toHaveBeenCalledWith({
      eventId: 15,
      rawText: '15',
    });
  });

  it('procesa y cierra el diálogo con eventId y qrCode cuando el código escaneado es JSON', () => {
    const fixture = TestBed.createComponent(QrScannerDialog);
    const component = fixture.componentInstance;

    component.codigoManual = JSON.stringify({
      event_id: 42,
      qr_code: 'token_evento_42',
      title: 'Taller Capacitor',
    });
    component.confirmarManual();

    expect(dialogRefMock.close).toHaveBeenCalledWith({
      eventId: 42,
      qrCode: 'token_evento_42',
      rawText: component.codigoManual,
    });
  });

  it('cierra el diálogo con null al invocar cerrar()', () => {
    const fixture = TestBed.createComponent(QrScannerDialog);
    const component = fixture.componentInstance;

    component.cerrar();
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });
});
