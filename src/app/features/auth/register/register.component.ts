import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { SignupDto } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

const GENEROS = [
  { value: 1, label: 'Masculino' },
  { value: 2, label: 'Femenino' },
  { value: 3, label: 'Otro' },
] as const;

// Password pattern: min 8 chars, uppercase, lowercase, number, special char
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(PASSWORD_PATTERN),
      ],
    ],
    confirmPassword: ['', [Validators.required]],
    genero: [0, [Validators.required, Validators.min(1)]],
  });

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Validar que las contraseñas coincidan
    const password = this.registerForm.value.password;
    const confirmPassword = this.registerForm.value.confirmPassword;

    if (password !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const formData = this.registerForm.getRawValue();

      // Build SignupDto with correct field names for backend
      // Note: genero comes as string from select, must convert to number
      const signupData: SignupDto = {
        cedula: formData.cedula,
        primerNombre: formData.primerNombre,
        primerApellido: formData.primerApellido,
        email: formData.email,
        passwordHash: formData.password, // Backend expects 'passwordHash'
        confirmPassword: formData.confirmPassword, // Backend expects 'confirmPassword'
        genero: Number(formData.genero), // Convert to number (select returns string)
      };

      // Solo añadir campos opcionales si tienen valor (no vacío)
      if (formData.segundoNombre && formData.segundoNombre.trim() !== '') {
        signupData.segundoNombre = formData.segundoNombre.trim();
      } else {
        signupData.segundoNombre = ' ';
      }
      if (formData.segundoApellido && formData.segundoApellido.trim() !== '') {
        signupData.segundoApellido = formData.segundoApellido.trim();
      } else {
        signupData.segundoApellido = ' ';
      }

      const response = await this.authService.signup(signupData);

      this.successMessage.set(
        response.message ||
          'Registro exitoso. Revisá tu email para confirmar tu cuenta.',
      );

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    } catch (error: unknown) {
      let message = 'Error al registrarse. Intentá de nuevo.';

      if (typeof error === 'object' && error !== null) {
        const httpError = error as { error?: { message?: string } };
        if (httpError.error?.message) {
          message = httpError.error.message;
        }
      }

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
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
  get genero() {
    return this.registerForm.get('genero');
  }
}
