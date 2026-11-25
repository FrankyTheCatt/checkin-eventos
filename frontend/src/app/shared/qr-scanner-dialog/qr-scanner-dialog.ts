import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';

export interface ScanResult {
  eventId?: number;
  qrCode?: string;
  rawText: string;
}

@Component({
  selector: 'app-qr-scanner-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './qr-scanner-dialog.html',
  styleUrl: './qr-scanner-dialog.scss',
})
export class QrScannerDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<QrScannerDialog>);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly camaraActiva = signal<boolean>(false);
  readonly iniciandoCamara = signal<boolean>(false);
  readonly procesando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  codigoManual = '';

  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private scanning = false;

  ngOnInit(): void {
    void this.iniciarCamaraEnVivo();
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }

  async iniciarCamaraEnVivo(): Promise<void> {
    this.iniciandoCamara.set(true);
    this.errorMensaje.set(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('La cámara en vivo no está soportada en este navegador o dispositivo.');
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = this.videoElement?.nativeElement;
      if (video) {
        video.srcObject = this.mediaStream;
        await video.play();
        this.camaraActiva.set(true);
        this.scanning = true;
        this.escanearFrames();
      }
    } catch (err: unknown) {
      console.warn('No se pudo iniciar la cámara en vivo:', err);
      this.errorMensaje.set(
        'Permiso de cámara no disponible o denegado. Puedes usar "Tomar foto" o ingresar el código.',
      );
      this.camaraActiva.set(false);
    } finally {
      this.iniciandoCamara.set(false);
    }
  }

  private escanearFrames(): void {
    if (!this.scanning) return;

    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data.trim()) {
          this.scanning = false;
          this.detenerCamara();
          this.procesarCodigoDetectado(code.data.trim());
          return;
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.escanearFrames());
  }

  /**
   * Fallback nativo: Abre la cámara o selector mediante el plugin Capacitor Camera
   */
  async usarCapacitorCamera(): Promise<void> {
    this.procesando.set(true);
    this.errorMensaje.set(null);

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Pregunta entre Cámara y Galería
      });

      if (photo.dataUrl) {
        await this.decodificarImagenDataUrl(photo.dataUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al capturar la imagen';
      if (!msg.toLowerCase().includes('cancelled') && !msg.toLowerCase().includes('cancelado')) {
        this.errorMensaje.set(`No se pudo leer la cámara: ${msg}`);
      }
    } finally {
      this.procesando.set(false);
    }
  }

  cargarDesdeArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        void this.decodificarImagenDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  private decodificarImagenDataUrl(dataUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          this.errorMensaje.set('Error al procesar el contexto de imagen.');
          resolve();
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data.trim()) {
          this.procesarCodigoDetectado(code.data.trim());
        } else {
          this.errorMensaje.set('No se detectó ningún código QR en la imagen seleccionada.');
        }
        resolve();
      };
      img.onerror = () => {
        this.errorMensaje.set('No se pudo cargar la imagen seleccionada.');
        resolve();
      };
      img.src = dataUrl;
    });
  }

  private procesarCodigoDetectado(raw: string): void {
    let result: ScanResult = { rawText: raw };

    // Si es un número directo
    if (/^\d+$/.test(raw)) {
      result.eventId = Number(raw);
      this.dialogRef.close(result);
      return;
    }

    // 1. Verificar si es JSON con datos estructurados
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        const eventId = Number(parsed.event_id || parsed.eventId || parsed.id);
        const qrCode = String(parsed.qr_code || parsed.qrCode || parsed.code || '');
        result = {
          eventId: Number.isSafeInteger(eventId) && eventId > 0 ? eventId : undefined,
          qrCode: qrCode || undefined,
          rawText: raw,
        };
      }
    } catch {
      // No es JSON, intentar detectar formatos como id en URL
      const matchId = raw.match(/(?:eventos?\/|id=)(\d+)/i);
      if (matchId) {
        result.eventId = Number(matchId[1]);
      } else {
        result.qrCode = raw;
      }
    }

    this.dialogRef.close(result);
  }

  confirmarManual(): void {
    if (!this.codigoManual.trim()) return;
    this.procesarCodigoDetectado(this.codigoManual.trim());
  }

  detenerCamara(): void {
    this.scanning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.camaraActiva.set(false);
  }

  cerrar(): void {
    this.detenerCamara();
    this.dialogRef.close(null);
  }
}
