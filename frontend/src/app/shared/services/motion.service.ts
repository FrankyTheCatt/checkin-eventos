import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Motion } from '@capacitor/motion';
import { PluginListenerHandle } from '@capacitor/core';

export interface AccelData {
  x: number;
  y: number;
  z: number;
}

@Injectable({ providedIn: 'root' })
export class MotionService implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  readonly isSupported = signal<boolean>(false);
  readonly isListening = signal<boolean>(false);
  readonly currentAccel = signal<AccelData>({ x: 0, y: 0, z: 0 });
  readonly shakeCount = signal<number>(0);

  /** Subject emitido cada vez que se detecta el gesto de agitar (shake) */
  readonly shake$ = new Subject<void>();

  private listenerHandle: PluginListenerHandle | null = null;
  private lastX = 0;
  private lastY = 0;
  private lastZ = 0;
  private lastUpdate = 0;
  private lastShakeTime = 0;
  private readonly SHAKE_THRESHOLD = 14; // Umbral de aceleración m/s²
  private readonly SHAKE_COOLDOWN = 1200; // Cooldown en ms entre sacudidas para evitar múltiples triggers

  constructor() {
    this.initMotionListener();
  }

  async initMotionListener(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // 1. Intentar con Capacitor Motion
      this.listenerHandle = await Motion.addListener('accel', (event) => {
        this.ngZone.run(() => {
          this.isSupported.set(true);
          this.isListening.set(true);
          const x = Number(event.acceleration.x.toFixed(2));
          const y = Number(event.acceleration.y.toFixed(2));
          const z = Number(event.acceleration.z.toFixed(2));
          this.currentAccel.set({ x, y, z });
          this.detectShake(x, y, z);
        });
      });
      this.isSupported.set(true);
      this.isListening.set(true);
    } catch {
      // 2. Fallback a DeviceMotionEvent en navegador
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', this.onDeviceMotion);
        this.isSupported.set(true);
        this.isListening.set(true);
      }
    }
  }

  private readonly onDeviceMotion = (event: DeviceMotionEvent) => {
    this.ngZone.run(() => {
      const accel = event.acceleration || event.accelerationIncludingGravity;
      if (!accel) return;

      const x = Number((accel.x ?? 0).toFixed(2));
      const y = Number((accel.y ?? 0).toFixed(2));
      const z = Number((accel.z ?? 0).toFixed(2));
      this.currentAccel.set({ x, y, z });
      this.detectShake(x, y, z);
    });
  };

  private detectShake(x: number, y: number, z: number): void {
    const now = Date.now();
    if (now - this.lastUpdate < 100) return;

    const timeDiff = now - this.lastUpdate;
    this.lastUpdate = now;

    const speed = (Math.abs(x - this.lastX) + Math.abs(y - this.lastY) + Math.abs(z - this.lastZ)) / (timeDiff / 1000);

    this.lastX = x;
    this.lastY = y;
    this.lastZ = z;

    if (speed > this.SHAKE_THRESHOLD && now - this.lastShakeTime > this.SHAKE_COOLDOWN) {
      this.lastShakeTime = now;
      this.shakeCount.update((c) => c + 1);
      this.shake$.next();
    }
  }

  /**
   * Permite simular una sacudida manualmente para pruebas o entornos sin sensor de acelerómetro.
   */
  simulateShake(): void {
    this.shakeCount.update((c) => c + 1);
    this.shake$.next();
  }

  ngOnDestroy(): void {
    if (this.listenerHandle) {
      void this.listenerHandle.remove();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.onDeviceMotion);
    }
  }
}
