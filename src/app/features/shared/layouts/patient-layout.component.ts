import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-patient-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './patient-layout.component.html',
  styleUrl: './patient-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  readonly user = this.authService.user;
  
  readonly menuItems = [
    { icon: 'grid', label: 'Inicio', route: '/dashboard' },
    { icon: 'calendar', label: 'Mis citas', route: '/citas' },
    { icon: 'user', label: 'Mi Perfil', route: '/profile' },
    { icon: 'settings', label: 'Ajustes', route: '/ajustes' }
  ];
  
  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
