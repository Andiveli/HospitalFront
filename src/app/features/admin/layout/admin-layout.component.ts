import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;

  readonly menuItems = [
    { icon: 'grid', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'users-medical', label: 'Médicos', route: '/admin/medicos' },
    { icon: 'users', label: 'Pacientes', route: '/admin/pacientes' },
    { icon: 'calendar', label: 'Citas', route: '/admin/citas' },
    { icon: 'pill', label: 'Medicamentos', route: '/admin/medicamentos' },
    { icon: 'dots', label: 'Otros', route: '/admin/otros' },
  ];

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
