import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth/auth';
import { EventsService } from '../events/events';
import { EmptyState } from '../shared/empty-state/empty-state';
import { apiError } from '../shared/api-error';

@Component({
  selector: 'app-profile',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    EmptyState,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  readonly auth = inject(AuthService);
  readonly attendances = inject(EventsService).myAttendancesResource();
  readonly error = computed(() => apiError(this.attendances.error(), 'Intenta nuevamente.'));
}
