import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth/auth';
import { EventsService } from '../../events/events';
import { QrScannerDialog, ScanResult } from '../../shared/qr-scanner-dialog/qr-scanner-dialog';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly eventsService = inject(EventsService);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
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
        this.snackBar.open(`¡Código escaneado! Abriendo evento #${res.eventId}`, 'Cerrar', {
          duration: 3500,
        });
        this.router.navigate(['/eventos', res.eventId]);
      } else if (res.qrCode) {
        this.eventsService.getEventByQr(res.qrCode).subscribe({
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
}
