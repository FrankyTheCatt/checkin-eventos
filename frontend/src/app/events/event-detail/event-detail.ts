import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventsService } from '../events';
import { AuthService } from '../../auth/auth';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss'
})
export class EventDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsService = inject(EventsService);
  public authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  evento = signal<any>(null);
  cargando = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(Number(id));
    }
  }

  cargarDetalle(id: number) {
    this.eventsService.getEvent(id).subscribe({
      next: (data) => {
        this.evento.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar el evento', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/eventos']);
      }
    });
  }

  registrarAsistencia() {
    const id = this.evento()?.id;
    if (!id) return;

    // Aquí le quitamos el {} extra
    this.eventsService.attendEvent(id).subscribe({
      next: () => {
        this.snackBar.open('¡Asistencia registrada!', 'Cerrar', { duration: 3000 });
        this.cargarDetalle(id); // Recarga para actualizar el contador
      },
      error: (err) => {
        const msg = err.error?.detail || 'Error al registrar asistencia';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
      }
    });
  }
}