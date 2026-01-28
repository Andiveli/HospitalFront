import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly errorMessage = signal<string>('');
  readonly loading = this.authService.loading;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');

    try {
      const credentials = this.loginForm.getRawValue();
      console.log('🔐 Intentando login con:', credentials);
      await this.authService.login(credentials);
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error.error:', error?.error);
      
      // Manejar diferentes tipos de errores
      let message = 'Error al iniciar sesión. Intentá de nuevo.';
      
      if (error?.error?.message) {
        // Mensaje del backend
        message = Array.isArray(error.error.message) 
          ? error.error.message.join(', ')
          : error.error.message;
      } else if (error?.message) {
        // Mensaje de error de red
        message = error.message;
      } else if (error?.status === 0) {
        // Error de conexión
        message = 'No se puede conectar al servidor. Verificá que el backend esté corriendo.';
      }
      
      this.errorMessage.set(message);
    }
  }

  // Getters para validación en el template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
