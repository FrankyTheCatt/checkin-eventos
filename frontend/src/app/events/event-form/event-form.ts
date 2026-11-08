import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { EventsService } from '../events';
import { EventPayload, EventRecord } from '../event.models';
import { apiError } from '../../shared/api-error';

export function localDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return [
    date.getFullYear(),
    '-',
    String(date.getMonth() + 1).padStart(2, '0'),
    '-',
    String(date.getDate()).padStart(2, '0'),
    'T',
    String(date.getHours()).padStart(2, '0'),
    ':',
    String(date.getMinutes()).padStart(2, '0'),
  ].join('');
}

export const eventDates: ValidatorFn = (control: AbstractControl) => {
  const start = control.get('starts_at')?.value;
  const end = control.get('ends_at')?.value;
  if (!start || !end) return null;
  return Number.isFinite(Date.parse(start)) && Date.parse(end) > Date.parse(start)
    ? null
    : { dateOrder: true };
};

@Component({
  selector: 'app-event-form',
  imports: [ReactiveFormsModule, MatDialogModule, MatInputModule, MatButtonModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss',
})
export class EventForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EventsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly dialogRef = inject(MatDialogRef<EventForm>);
  readonly data = inject<EventRecord | null>(MAT_DIALOG_DATA, { optional: true });
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group(
    {
      title: this.fb.nonNullable.control(this.data?.title ?? '', [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(150),
      ]),
      description: this.fb.nonNullable.control(
        this.data?.description ?? '',
        Validators.maxLength(2000),
      ),
      location_name: this.fb.nonNullable.control(
        this.data?.location_name ?? '',
        Validators.maxLength(200),
      ),
      starts_at: this.fb.nonNullable.control(localDate(this.data?.starts_at), Validators.required),
      ends_at: this.fb.nonNullable.control(localDate(this.data?.ends_at), Validators.required),
      latitude: this.fb.control<number | null>(this.data?.latitude ?? null, [
        Validators.min(-90),
        Validators.max(90),
      ]),
      longitude: this.fb.control<number | null>(this.data?.longitude ?? null, [
        Validators.min(-180),
        Validators.max(180),
      ]),
      radius_m: this.fb.nonNullable.control(this.data?.radius_m ?? 100, [
        Validators.required,
        Validators.min(1),
        Validators.max(100000),
        Validators.pattern(/^\d+$/),
      ]),
    },
    {
      validators: [
        eventDates,
        (control) =>
          (control.get('latitude')?.value === null) === (control.get('longitude')?.value === null)
            ? null
            : { coordinates: true },
      ],
    },
  );

  guardar() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const value = this.form.getRawValue();
    const payload: EventPayload = {
      ...value,
      title: value.title.trim(),
      description: value.description.trim(),
      location_name: value.location_name.trim(),
      starts_at: new Date(value.starts_at).toISOString(),
      ends_at: new Date(value.ends_at).toISOString(),
    };
    this.saving.set(true);
    this.error.set('');
    const request = this.data
      ? this.service.updateEvent(this.data.id, payload)
      : this.service.createEvent(payload);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (event) => {
          this.snackBar.open(this.data ? 'Evento actualizado' : 'Evento creado', 'Cerrar', {
            duration: 3500,
          });
          this.dialogRef.close(event);
        },
        error: (error) => {
          const message = apiError(error, 'No se pudo guardar el evento.');
          this.error.set(message);
          this.snackBar.open(message, 'Cerrar', { duration: 6000 });
        },
      });
  }
}
