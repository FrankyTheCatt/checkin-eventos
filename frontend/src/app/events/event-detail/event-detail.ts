import { DatePipe } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, map } from 'rxjs';
import { EventsService } from '../events';
import { AuthService } from '../../auth/auth';
import { EventForm } from '../event-form/event-form';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { GeolocationService } from '../../shared/services/geolocation.service';
import { MotionService } from '../../shared/services/motion.service';
import { QrScannerDialog, ScanResult } from '../../shared/qr-scanner-dialog/qr-scanner-dialog';
import { apiError } from '../../shared/api-error';

@Component({
  selector: 'app-event-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EmptyState,
  ],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EventsService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly id = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = Number(params.get('id'));
        return Number.isSafeInteger(id) && id > 0 ? id : undefined;
      }),
    ),
  );
  readonly resource = this.service.detailResource(() => this.id());
  readonly evento = computed(() => (this.resource.hasValue() ? this.resource.value() : undefined));
  readonly isOwner = computed(
    () => !!this.evento() && this.evento()?.owner_id === this.auth.usuario()?.id,
  );
  readonly qrResource = this.service.qrResource(() => (this.isOwner() ? this.id() : undefined));
  readonly attendees = this.service.attendeesResource(() =>
    this.isOwner() ? this.id() : undefined,
  );
  readonly myAttendance = this.service.myAttendancesResource();
  readonly registered = computed(
    () =>
      this.myAttendance.hasValue() &&
      this.myAttendance.value().some((item) => item.event_id === this.id()),
  );
  readonly busy = signal(false);
  readonly qrImage = signal<string | null>(null);
  readonly qrImageError = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  readonly geoService = inject(GeolocationService);
  readonly motionService = inject(MotionService);

  readonly distanceInfo = computed(() => {
    const event = this.evento();
    const userCoords = this.geoService.currentCoordinates();
    if (!event || !userCoords || event.latitude === null || event.longitude === null) {
      return null;
    }
    return this.geoService.validateDistanceToEvent(
      userCoords.latitude,
      userCoords.longitude,
      event.latitude,
      event.longitude,
      event.radius_m,
    );
  });

  readonly errorMessage = computed(() =>
    apiError(this.resource.error(), 'El evento no está disponible.'),
  );
  readonly qrErrorMessage = computed(() =>
    apiError(this.qrResource.error(), 'No se pudo cargar el código QR.'),
  );
  readonly attendeesError = computed(() =>
    apiError(this.attendees.error(), 'No se pudieron cargar los asistentes.'),
  );

  constructor() {
    // Sensor: Al agitar el dispositivo, recarga el evento y asistentes
    this.motionService.shake$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.snackBar.open('📱 ¡Dispositivo agitado! Recargando datos del evento...', 'Cerrar', {
        duration: 2500,
      });
      this.resource.reload();
      this.attendees.reload();
      this.myAttendance.reload();
    });

    effect((onCleanup) => {
      const code = this.qrResource.hasValue() ? this.qrResource.value().qr_code : undefined;
      if (!code || !isPlatformBrowser(this.platformId)) {
        this.qrImage.set(null);
        this.qrImageError.set(false);
        return;
      }

      let active = true;
      this.qrImageError.set(false);
      const qrPayload = JSON.stringify({
        event_id: this.id(),
        qr_code: code,
        title: this.evento()?.title,
      });

      void import('qrcode')
        .then(({ default: QRCode }) =>
          QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M', margin: 2, width: 256 }),
        )
        .then((image) => {
          if (active) this.qrImage.set(image);
        })
        .catch(() => {
          if (active) {
            this.qrImage.set(null);
            this.qrImageError.set(true);
          }
        });

      onCleanup(() => {
        active = false;
      });
    });
  }

  editar() {
    const event = this.evento();
    if (!event || !this.isOwner() || this.busy()) return;
    this.dialog
      .open(EventForm, { data: event, width: '720px', maxWidth: '95vw', disableClose: true })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) this.resource.reload();
      });
  }

  eliminar() {
    const event = this.evento();
    if (!event || !this.isOwner() || this.busy()) return;
    this.dialog
      .open(ConfirmDialog, { data: { title: event.title }, width: '460px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed || this.busy()) return;
        this.busy.set(true);
        this.service
          .deleteEvent(event.id)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.busy.set(false)),
          )
          .subscribe({
            next: () => {
              this.snackBar.open('Evento eliminado', 'Cerrar', { duration: 3500 });
              this.router.navigate(['/eventos']);
            },
            error: (error) =>
              this.snackBar.open(apiError(error, 'No se pudo eliminar el evento.'), 'Cerrar', {
                duration: 6000,
              }),
          });
      });
  }

  async registrarAsistencia() {
    const event = this.evento();
    if (!event || this.busy() || this.registered()) return;
    this.busy.set(true);

    let coords: { latitude: number; longitude: number } | undefined;
    try {
      const pos = await this.geoService.getCurrentPosition();
      coords = { latitude: pos.latitude, longitude: pos.longitude };
    } catch {
      // Fallback: Si no hay GPS disponible o fue denegado, se registra igualmente
    }

    if (coords && event.latitude !== null && event.longitude !== null) {
      const val = this.geoService.validateDistanceToEvent(
        coords.latitude,
        coords.longitude,
        event.latitude,
        event.longitude,
        event.radius_m,
      );
      if (val && !val.withinRadius) {
        this.snackBar.open(
          `⚠️ Estás a ${val.formattedDistance} del evento (radio: ${event.radius_m}m). Registrando...`,
          'Entendido',
          { duration: 4500 },
        );
      }
    }

    this.service
      .attendEvent(event.id, coords)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (attendance) => {
          const locText = attendance.latitude
            ? ` con GPS (${attendance.latitude}, ${attendance.longitude})`
            : '';
          this.snackBar.open(`¡Asistencia registrada con éxito${locText}!`, 'Cerrar', {
            duration: 4000,
          });
          this.resource.reload();
          this.attendees.reload();
          this.myAttendance.reload();
        },
        error: (error) => {
          this.snackBar.open(apiError(error, 'No se pudo registrar la asistencia.'), 'Cerrar', {
            duration: 6000,
          });
          if (error.status === 409) this.myAttendance.reload();
        },
      });
  }

  escanearQR() {
    const ref = this.dialog.open(QrScannerDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: false,
    });

    ref.afterClosed().subscribe((res: ScanResult | null) => {
      if (!res) return;

      if (res.eventId && res.eventId !== this.id()) {
        this.snackBar
          .open(`El código QR corresponde a otro evento (#${res.eventId})`, 'Ver evento', {
            duration: 5000,
          })
          .onAction()
          .subscribe(() => {
            this.router.navigate(['/eventos', res.eventId]);
          });
      } else {
        this.snackBar.open('¡Código QR validado para este evento!', 'Cerrar', { duration: 3000 });
        if (!this.registered()) {
          void this.registrarAsistencia();
        }
      }
    });
  }
}
