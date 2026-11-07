import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventsService } from '../events';
import { EventForm } from '../event-form/event-form';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatInputModule, MatButtonModule, 
    MatProgressSpinnerModule, MatCardModule, MatIconModule,
    MatDialogModule, MatSnackBarModule
  ],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss'
})
export class EventList {
  private eventsService = inject(EventsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  searchQuery = signal('');
  events = signal<any[]>([]);
  cargando = signal(false);
  
  columnas = ['title', 'location_name', 'starts_at', 'actions'];

  constructor() {
    effect(() => {
      this.cargarEventos(this.searchQuery());
    });
  }

  cargarEventos(search: string) {
    this.cargando.set(true);
    this.eventsService.getEvents(search).subscribe({
      next: (data) => {
        this.events.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  actualizarBusqueda(texto: string) {
    this.searchQuery.set(texto);
  }

  abrirModalCrear() {
    // Abrimos el componente del formulario
    const dialogRef = this.dialog.open(EventForm, {
      width: '500px'
    });

    // Cuando el modal se cierra, verificamos si mandó datos
    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        // Enviar al backend
        this.eventsService.createEvent(resultado).subscribe({
          next: () => {
            this.snackBar.open('¡Evento creado con éxito!', 'Cerrar', { duration: 3000 });
            this.cargarEventos(this.searchQuery()); // Recargamos la tabla
          },
          error: (err) => {
            const msg = err.error?.detail || 'Error al crear el evento (revisa las fechas)';
            this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
          }
        });
      }
    });
  }
}