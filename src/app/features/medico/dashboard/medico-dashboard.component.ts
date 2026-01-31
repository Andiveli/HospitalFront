import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CitaResponseDto } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { CitasService } from '../../../core/services/citas.service';

/**
 * Dashboard del Médico
 */
@Component({
  selector: 'app-medico-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './medico-dashboard.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class MedicoDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly citasService = inject(CitasService);

  // Estado
  readonly loading = signal(true);
  readonly citas = signal<CitaResponseDto[]>([]);

  // Datos del médico
  readonly nombreDoctor = computed(() => {
    const wrapper = this.authService.medicoProfile() as {
      data?: { nombreCompleto?: string };
    };
    const nombre = wrapper.data?.nombreCompleto || 'Doctor';
    return nombre.split(' ')[0];
  });

  readonly citasAtendidas = computed(() => {
    const wrapper = this.authService.medicoProfile() as {
      data?: { citasAtendidas?: number };
    };
    return wrapper.data?.citasAtendidas || 0;
  });

  // Fecha hoy
  readonly hoy = computed(() => new Date().toISOString().split('T')[0]);

  // Citas ordenadas por fecha
  readonly citasOrdenadas = computed(() => {
    return [...this.citas()].sort(
      (a, b) =>
        new Date(a.fechaHoraInicio).getTime() -
        new Date(b.fechaHoraInicio).getTime(),
    );
  });

  // Próxima consulta
  readonly proximaConsulta = computed(() => {
    const ordenadas = this.citasOrdenadas();
    return ordenadas.length > 0 ? ordenadas[0] : null;
  });

  // Consultas de hoy
  readonly consultasHoy = computed(() => {
    const hoyStr = this.hoy();
    return this.citas().filter((c) => c.fechaHoraInicio.startsWith(hoyStr));
  });

  readonly tieneConsultasHoy = computed(() => this.consultasHoy().length > 0);

  // Indica si estamos mostrando 'Próximas Consultas' (no hay de hoy)
  readonly mostrandoProximasConsultas = computed(
    () => !this.tieneConsultasHoy(),
  );

  // Para mostrar
  readonly consultasParaMostrar = computed(() => {
    if (this.tieneConsultasHoy()) {
      return this.consultasHoy().sort((a, b) =>
        a.fechaHoraInicio.localeCompare(b.fechaHoraInicio),
      );
    }
    return this.citasOrdenadas();
  });

  constructor() {
    this.cargarCitas();
  }

  private async cargarCitas(): Promise<void> {
    try {
      this.loading.set(true);
      const citas = await this.citasService.getProximasCitasMedico();
      this.citas.set(citas);
    } catch {
      // Error silencioso
    } finally {
      this.loading.set(false);
    }
  }

  // Helpers
  nombrePaciente(cita: CitaResponseDto): string {
    return `${cita.paciente.nombre} ${cita.paciente.apellido}`;
  }

  formatearFecha(fechaHora: string): string {
    return new Date(fechaHora).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Fecha corta para la tabla (ej: "31 ene")
  formatearFechaCorta(fechaHora: string): string {
    return new Date(fechaHora).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }

  formatearHora(fechaHora: string): string {
    return new Date(fechaHora).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  puedeIngresar(cita: CitaResponseDto): boolean {
    const ahora = Date.now();
    const consulta = new Date(cita.fechaHoraInicio).getTime();
    return (
      ahora >= consulta - 10 * 60 * 1000 && ahora <= consulta + 5 * 60 * 1000
    );
  }
}
