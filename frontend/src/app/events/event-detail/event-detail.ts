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
    effect((onCleanup) => {
      const code = this.qrResource.hasValue() ? this.qrResource.value().qr_code : undefined;
      if (!code || !isPlatformBrowser(this.platformId)) {
        this.qrImage.set(null);
        this.qrImageError.set(false);
        return;
      }

      let active = true;
      this.qrImageError.set(false);
      void import('qrcode')
        .then(({ default: QRCode }) =>
          QRCode.toDataURL(code, { errorCorrectionLevel: 'M', margin: 2, width: 256 }),
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

  registrarAsistencia() {
    const event = this.evento();
    if (!event || this.busy() || this.registered()) return;
    this.busy.set(true);
    this.service
      .attendEvent(event.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Asistencia registrada', 'Cerrar', { duration: 3500 });
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
}
