import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventsService } from '../events';
import { EventForm } from '../event-form/event-form';
import { EventCard } from '../event-card/event-card';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { MotionService } from '../../shared/services/motion.service';
import { GeolocationService } from '../../shared/services/geolocation.service';
import { QrScannerDialog, ScanResult } from '../../shared/qr-scanner-dialog/qr-scanner-dialog';
import { apiError } from '../../shared/api-error';

@Component({
  selector: 'app-event-list',
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatIconModule,
    EventCard,
    EmptyState,
  ],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss',
})
export class EventList {
  private readonly service = inject(EventsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly motionService = inject(MotionService);
  readonly geoService = inject(GeolocationService);

  readonly searchQuery = signal('');
  readonly page = signal(0);
  readonly pageSize = signal(6);
  readonly resource = this.service.listResource(() => ({
    search: this.searchQuery(),
    skip: this.page() * this.pageSize(),
    limit: this.pageSize() + 1,
  }));
  readonly events = computed(() =>
    this.resource.hasValue() ? this.resource.value().slice(0, this.pageSize()) : [],
  );
  readonly hasNext = computed(
    () => this.resource.hasValue() && this.resource.value().length > this.pageSize(),
  );
  readonly error = computed(() =>
    apiError(this.resource.error(), 'No se pudieron cargar los eventos.'),
  );

  constructor() {
    // Sensor: agitar el dispositivo para recargar eventos
    this.motionService.shake$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.snackBar.open('📱 ¡Dispositivo agitado! Recargando eventos...', 'Cerrar', {
        duration: 2500,
      });
      this.resource.reload();
    });
  }

  abrirEscaner() {
    const ref = this.dialog.open(QrScannerDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: false,
    });

    ref.afterClosed().subscribe((res: ScanResult | null) => {
      if (!res) return;

      if (res.eventId) {
        this.snackBar.open(`¡QR escaneado! Abriendo evento #${res.eventId}`, 'Cerrar', {
          duration: 3500,
        });
        this.router.navigate(['/eventos', res.eventId]);
      } else if (res.qrCode) {
        this.service.getEventByQr(res.qrCode).subscribe({
          next: (event) => {
            this.snackBar.open(`¡Evento encontrado: ${event.title}!`, 'Cerrar', {
              duration: 3500,
            });
            this.router.navigate(['/eventos', event.id]);
          },
          error: () => {
            this.snackBar.open('No se encontró ningún evento con ese código QR.', 'Cerrar', {
              duration: 4000,
            });
          },
        });
      }
    });
  }

  actualizarBusqueda(value: string) {
    this.searchQuery.set(value.trim());
    this.page.set(0);
  }

  changePageSize(value: number) {
    this.pageSize.set(value);
    this.page.set(0);
  }

  previousPage() {
    if (this.page() > 0) this.page.update((value) => value - 1);
  }

  nextPage() {
    if (this.hasNext()) this.page.update((value) => value + 1);
  }

  abrirModalCrear() {
    this.dialog
      .open(EventForm, { width: '720px', maxWidth: '95vw', disableClose: true })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.page.set(0);
          this.resource.reload();
        }
      });
  }
}
