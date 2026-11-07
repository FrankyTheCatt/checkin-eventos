import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatButtonModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss'
})
export class EventForm {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<EventForm>);
  public data = inject(MAT_DIALOG_DATA, { optional: true });

  form = this.fb.group({
    title: [this.data?.title || '', [Validators.required, Validators.maxLength(150)]],
    description: [this.data?.description || '', [Validators.maxLength(2000)]],
    location_name: [this.data?.location_name || '', [Validators.maxLength(200)]],
    starts_at: [this.data?.starts_at || '', Validators.required],
    ends_at: [this.data?.ends_at || '', Validators.required]
  });

  guardar() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}