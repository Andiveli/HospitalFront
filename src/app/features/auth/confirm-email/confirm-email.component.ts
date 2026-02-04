import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type ConfirmationState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [],
  templateUrl: './confirm-email.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmailComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Route param from URL: /auth/confirmar/:token
  token = input.required<string>();

  // State
  state = signal<ConfirmationState>('loading');
  message = signal<string>('');

  constructor() {
    // Confirm email when token is available
    effect(() => {
      const tokenValue = this.token();
      if (tokenValue) {
        this.confirmEmail(tokenValue);
      }
    });
  }

  private async confirmEmail(token: string): Promise<void> {
    this.state.set('loading');

    try {
      const response = await this.authService.confirmEmail(token);
      this.message.set(response.message || 'Tu cuenta ha sido confirmada exitosamente.');
      this.state.set('success');

      // Auto-redirect to login after 4 seconds
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 4000);
    } catch (error: unknown) {
      let errorMessage = 'No se pudo confirmar tu cuenta. El enlace puede haber expirado.';

      if (typeof error === 'object' && error !== null) {
        const httpError = error as { error?: { message?: string }; status?: number };

        if (httpError.status === 400) {
          errorMessage = 'El token de confirmación es inválido o ya fue utilizado.';
        } else if (httpError.status === 404) {
          errorMessage = 'El enlace de confirmación no existe o ya expiró.';
        } else if (httpError.error?.message) {
          errorMessage = httpError.error.message;
        }
      }

      this.message.set(errorMessage);
      this.state.set('error');
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
