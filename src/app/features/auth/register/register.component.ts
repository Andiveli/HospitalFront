import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const GENEROS = [
  { value: 1, label: 'Masculino' },
  { value: 2, label: 'Femenino' },
  { value: 3, label: 'Otro' },
] as const;

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');
  readonly loading = this.authService.loading;
  readonly generos = GENEROS;

  registerForm = this.fb.nonNullable.group({
    cedula: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    primerNombre: ['', [Validators.required, Validators.minLength(2)]],
    segundoNombre: [''],
    primerApellido: ['', [Validators.required, Validators.minLength(2)]],
    segundoApellido: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required]],
    genero: [0, [Validators.required, Validators.min(1)]],
  });

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Validar que las contraseñas coincidan
    const password = this.registerForm.value.password;
    const confirmarPassword = this.registerForm.value.confirmarPassword;

    if (password !== confirmarPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const formData = this.registerForm.getRawValue();
      const signupData: any = {
        cedula: formData.cedula,
        primerNombre: formData.primerNombre,
        primerApellido: formData.primerApellido,
        email: formData.email,
        password: formData.password,
        confirmarPassword: formData.confirmarPassword,
        genero: formData.genero,
      };

      // Solo añadir campos opcionales si tienen valor
      if (formData.segundoNombre) {
        signupData.segundoNombre = formData.segundoNombre;
      }
      if (formData.segundoApellido) {
        signupData.segundoApellido = formData.segundoApellido;
      }

      const response = await this.authService.signup(signupData);

      this.successMessage.set(response.message);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
    } catch (error: any) {
      const message = error?.error?.message || 'Error al registrarse. Intentá de nuevo.';
      this.errorMessage.set(message);
    }
  }

  get cedula() {
    return this.registerForm.get('cedula');
  }
  get primerNombre() {
    return this.registerForm.get('primerNombre');
  }
  get segundoNombre() {
    return this.registerForm.get('segundoNombre');
  }
  get primerApellido() {
    return this.registerForm.get('primerApellido');
  }
  get segundoApellido() {
    return this.registerForm.get('segundoApellido');
  }
  get email() {
    return this.registerForm.get('email');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmarPassword() {
    return this.registerForm.get('confirmarPassword');
  }
  get genero() {
    return this.registerForm.get('genero');
  }
}
