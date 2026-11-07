import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatInputModule, MatButtonModule, MatCardModule, MatSnackBarModule
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class Registro {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  registroForm = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  cargando = signal(false);

  onSubmit() {
    if (this.registroForm.invalid) return;
    
    this.cargando.set(true);
    this.authService.registrar(this.registroForm.value).subscribe({
      next: () => {
        this.snackBar.open('Registro exitoso. Por favor inicia sesión.', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje = err.error?.detail || 'Error al registrar cuenta';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
      }
    });
  }
}