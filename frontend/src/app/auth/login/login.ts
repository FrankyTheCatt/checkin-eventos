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
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatInputModule, MatButtonModule, MatCardModule, MatSnackBarModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  cargando = signal(false);

  onSubmit() {
    if (this.loginForm.invalid) return;
    
    this.cargando.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/eventos']);
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje = err.error?.detail || 'Correo o contraseña incorrectos';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
      }
    });
  }
}