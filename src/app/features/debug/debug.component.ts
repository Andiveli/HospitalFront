import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MedicosService } from '../../core/services/medicos.service';

@Component({
  selector: 'app-debug',
  imports: [CommonModule],
  templateUrl: './debug.html',
  standalone: true,
})
export default class DebugComponent {
  readonly authService = inject(AuthService);
  private readonly medicosService = inject(MedicosService);
  private readonly router = inject(Router);

  loadingMedicos = signal(false);
  medicosResult = signal<string | null>(null);

  loadingProfile = signal(false);
  profileResult = signal<string | null>(null);

  loadingReload = signal(false);
  reloadResult = signal<string | null>(null);

  getUserJson(): string {
    return JSON.stringify(this.authService.user(), null, 2);
  }

  async reloadProfile(): Promise<void> {
    this.loadingReload.set(true);
    this.reloadResult.set(null);
    try {
      await this.authService.loadUserProfile();
      this.reloadResult.set(
        '✅ Perfil recargado. isAuthenticated: ' +
          this.authService.isAuthenticated(),
      );
    } catch (error: any) {
      this.reloadResult.set('❌ Error: ' + (error?.message || 'Unknown'));
    } finally {
      this.loadingReload.set(false);
    }
  }

  async testMedicos(): Promise<void> {
    this.loadingMedicos.set(true);
    this.medicosResult.set(null);
    try {
      const result = await this.medicosService.getMedicos();
      this.medicosResult.set(JSON.stringify(result, null, 2));
    } catch (error: any) {
      this.medicosResult.set(`❌ ERROR:\n${JSON.stringify(error, null, 2)}`);
    } finally {
      this.loadingMedicos.set(false);
    }
  }

  async testProfile(): Promise<void> {
    this.loadingProfile.set(true);
    this.profileResult.set(null);
    try {
      await this.authService.loadUserProfile();
      this.profileResult.set('✅ Profile loaded successfully');
    } catch (error: any) {
      this.profileResult.set(`❌ ERROR:\n${JSON.stringify(error, null, 2)}`);
    } finally {
      this.loadingProfile.set(false);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToAgendarCita(): void {
    this.router.navigate(['/citas/agendar']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
