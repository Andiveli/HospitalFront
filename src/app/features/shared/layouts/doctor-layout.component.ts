import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-doctor-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './doctor-layout.component.html',
  styleUrl: './doctor-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.authService.user;

  readonly menuItems = [
    { icon: 'grid', label: 'Inicio', route: '/doctor/dashboard' },
    { icon: 'calendar', label: 'Mis Consultas', route: '/doctor/consultas' },
    { icon: 'user', label: 'Perfil Profesional', route: '/doctor/profile' },
    { icon: 'settings', label: 'Ajustes', route: '/doctor/ajustes' },
  ];


}