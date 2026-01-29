import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ajustes',
  imports: [ReactiveFormsModule],
  template: `
    <div class="p-6 lg:p-8 max-w-3xl mx-auto">
      <!-- Header -->
      <header class="mb-8">
        <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 text-center">Ajustes</h1>
      </header>

      <!-- Cambiar Contrasena Section -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">Cambiar contrasena</h2>
        
        <form 
          [formGroup]="passwordForm" 
          (ngSubmit)="onSubmit()"
          class="bg-white border-2 border-slate-200 rounded-2xl p-6"
        >
          <!-- Contrasena Actual -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
            <label 
              for="passwordActual" 
              class="sm:w-48 sm:text-right font-medium text-slate-900"
            >
              Contrasena Actual
            </label>
            <div class="flex-1 relative">
              <input
                id="passwordActual"
                [type]="showCurrentPassword() ? 'text' : 'password'"
                formControlName="passwordActual"
                class="w-full px-4 py-2 pr-12 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 transition"
              />
              <button
                type="button"
                (click)="showCurrentPassword.set(!showCurrentPassword())"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
              >
                @if (showCurrentPassword()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <!-- Nueva Contrasena -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
            <label 
              for="newPassword" 
              class="sm:w-48 sm:text-right font-medium text-slate-900"
            >
              Nueva Contrasena
            </label>
            <div class="flex-1 relative">
              <input
                id="newPassword"
                [type]="showNewPassword() ? 'text' : 'password'"
                formControlName="newPassword"
                class="w-full px-4 py-2 pr-12 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 transition"
              />
              <button
                type="button"
                (click)="showNewPassword.set(!showNewPassword())"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
              >
                @if (showNewPassword()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <!-- Confirmar Contrasena -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
            <label 
              for="confirmNewPass" 
              class="sm:w-48 sm:text-right font-medium text-slate-900"
            >
              Confirmar Contrasena
            </label>
            <div class="flex-1 relative">
              <input
                id="confirmNewPass"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmNewPass"
                class="w-full px-4 py-2 pr-12 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 transition"
              />
              <button
                type="button"
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
              >
                @if (showConfirmPassword()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
              {{ errorMessage() }}
            </div>
          }

          <!-- Success Message -->
          @if (successMessage()) {
            <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
              {{ successMessage() }}
            </div>
          }

          <!-- Submit Button -->
          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="loading() || passwordForm.invalid"
              class="px-6 py-2 border-2 border-slate-900 rounded-lg font-medium text-slate-900 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (loading()) {
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Guardando...
                </span>
              } @else {
                Guardar
              }
            </button>
          </div>
        </form>
      </section>

      <!-- Cuenta Section -->
      <section>
        <h2 class="text-lg font-semibold text-slate-900 mb-4">Cuenta</h2>
        
        <button
          type="button"
          (click)="logout()"
          class="px-6 py-2 border-2 border-slate-900 rounded-lg font-medium text-slate-900 hover:bg-slate-100 transition"
        >
          Cerrar Sesion
        </button>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjustesComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Toggle visibility for each password field
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly passwordForm = this.fb.nonNullable.group({
    passwordActual: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPass: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    if (this.passwordForm.invalid) return;

    const { passwordActual, newPassword, confirmNewPass } = this.passwordForm.getRawValue();

    // Validar que las contrasenas coincidan
    if (newPassword !== confirmNewPass) {
      this.errorMessage.set('Las contrasenas nuevas no coinciden');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const response = await this.authService.changePassword({
        passwordActual,
        newPassword,
        confirmNewPass,
      });

      this.successMessage.set(response.message || 'Contrasena actualizada correctamente');
      this.passwordForm.reset();
    } catch (error: unknown) {
      const err = error as { error?: { message?: string } };
      this.errorMessage.set(err.error?.message || 'Error al cambiar la contrasena');
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
