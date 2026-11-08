import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { EventsService } from '../events';
import { EventForm } from '../event-form/event-form';
import { EventCard } from '../event-card/event-card';
import { EmptyState } from '../../shared/empty-state/empty-state';
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
