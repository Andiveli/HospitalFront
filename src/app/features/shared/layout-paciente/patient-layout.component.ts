import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-patient-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './patient-layout.component.html',
  styleUrl: './patient-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.authService.user;
  readonly isSidebarOpen = signal(false);

  readonly menuItems = [
    { icon: 'grid', label: 'Inicio', route: '/dashboard' },
    { icon: 'calendar', label: 'Mis citas', route: '/citas' },
    { icon: 'user', label: 'Mi Perfil', route: '/profile' },
    { icon: 'settings', label: 'Ajustes', route: '/ajustes' },
  ];

  /**
   * Verifica si el perfil del paciente está incompleto
   */
  readonly perfilIncompleto = () => this.authService.perfilIncompleto();

  toggleSidebar(): void {
    this.isSidebarOpen.update((value) => !value);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
