import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import type { MedicoDataDto } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Perfil Profesional del Médico
 *
 * Datos de /auth/perfil -> data.perfiles.medico = { message, data: MedicoDataDto }
 */
@Component({
  selector: 'app-perfil-profesional',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil-profesional.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PerfilProfesionalComponent {
  readonly authService = inject(AuthService);

  // Estado
  readonly mostrarModalExcepcion = signal(false);

  // Extraer datos del médico desde el wrapper { message, data }
  readonly medico = computed<MedicoDataDto | null>(() => {
    const raw = this.authService.medicoProfile();
    if (!raw) return null;
    return (raw as { data?: MedicoDataDto }).data || null;
  });

  readonly loading = computed(() => this.authService.loading());
  readonly edad = computed(() => this.authService.user()?.edad || 0);

  readonly especialidadPrincipal = computed(() => {
    const m = this.medico();
    if (!m?.especialidades?.length) return 'No especificada';
    const principal = m.especialidades.find((e) => e.principal);
    return principal?.nombre || m.especialidades[0].nombre;
  });

  formatearHora(hora: string): string {
    return hora?.substring(0, 5) || '--:--';
  }

  recargar(): void {
    window.location.reload();
  }
}
