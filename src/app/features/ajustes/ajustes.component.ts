import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ajustes',
  imports: [ReactiveFormsModule],
  templateUrl: './ajustes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjustesComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Toggle visibility for each password field
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  // Computed properties for role switching
  readonly isDoctor = this.authService.isDoctor;
  readonly isPatient = this.authService.isPatient;
  readonly hasBothRoles = this.authService.hasBothRoles;
  readonly currentRoute = computed(() => this.router.url);

  // Detectar el layout actual basado en la URL actual
  readonly isInDoctorLayout = computed(() => {
    const url = this.router.url;
    return url.includes('/doctor/') || url === '/doctor' || url.startsWith('/doctor');
  });

  readonly isInPatientLayout = computed(() => {
    const url = this.router.url;
    return !this.isInDoctorLayout();
  });

  readonly passwordForm = this.fb.nonNullable.group({
    passwordActual: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPass: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    if (this.passwordForm.invalid) return;

    const { passwordActual, newPassword, confirmNewPass } =
      this.passwordForm.getRawValue();

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

      this.successMessage.set(
        response.message || 'Contrasena actualizada correctamente',
      );
      this.passwordForm.reset();
    } catch (error: unknown) {
      const err = error as { error?: { message?: string } };
      this.errorMessage.set(
        err.error?.message || 'Error al cambiar la contrasena',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  /**
   * Switch between doctor and patient layouts
   * Now uses current layout detection instead of role detection
   */
  async switchLayout(): Promise<void> {
    if (this.isInDoctorLayout()) {
      // Currently in doctor layout, switch to patient layout
      await this.router.navigate(['/dashboard']);
    } else {
      // Currently in patient layout, switch to doctor layout
      await this.router.navigate(['/doctor/dashboard']);
    }
  }

  /**
   * Get label for switch button based on CURRENT LAYOUT (not role)
   */
  readonly switchLabel = computed(() => {
    if (this.isInDoctorLayout()) {
      return 'Ver como Paciente';
    }
    return 'Ver como Médico';
  });

  /**
   * Get icon for switch button based on CURRENT LAYOUT (not role)
   */
  readonly currentLayoutIcon = computed(() => {
    if (this.isInDoctorLayout()) {
      return 'user'; // Show patient icon when in doctor layout
    }
    return 'stethoscope'; // Show doctor icon when in patient layout
  });

  /**
   * Get icon for the switch button
   */
  readonly switchIcon = computed(() => {
    if (this.isDoctor()) {
      return 'user'; // Patient icon
    }
    return 'stethoscope'; // Doctor icon (fallback)
  });
}
