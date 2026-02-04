import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ResetPasswordDto } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

type PageState = 'validating' | 'form' | 'success' | 'invalid-token';

// Password pattern: min 8 chars, uppercase, lowercase, number, special char
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Route param from URL: /auth/reset-password/:token
  token = input.required<string>();

  // State
  state = signal<PageState>('validating');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  loading = signal(false);

  // Form
  resetForm = this.fb.nonNullable.group({
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_PATTERN)],
    ],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    // Validate token when available
    effect(() => {
      const tokenValue = this.token();
      if (tokenValue) {
        this.validateToken(tokenValue);
      }
    });
  }

  private async validateToken(token: string): Promise<void> {
    this.state.set('validating');

    try {
      await this.authService.validateResetToken(token);
      this.state.set('form');
    } catch (error: unknown) {
      let errorMsg = 'El enlace de recuperación es inválido o ha expirado.';

      if (typeof error === 'object' && error !== null) {
        const httpError = error as { error?: { message?: string }; status?: number };
        if (httpError.error?.message) {
          errorMsg = httpError.error.message;
        }
      }

      this.errorMessage.set(errorMsg);
      this.state.set('invalid-token');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.resetForm.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const data: ResetPasswordDto = { password, confirmPassword };
      const response = await this.authService.resetPassword(this.token(), data);

      this.successMessage.set(response.message || 'Contraseña restablecida exitosamente.');
      this.state.set('success');

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    } catch (error: unknown) {
      let errorMsg = 'Error al restablecer la contraseña. Intentá de nuevo.';

      if (typeof error === 'object' && error !== null) {
        const httpError = error as { error?: { message?: string } };
        if (httpError.error?.message) {
          errorMsg = httpError.error.message;
        }
      }

      this.errorMessage.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }
}
