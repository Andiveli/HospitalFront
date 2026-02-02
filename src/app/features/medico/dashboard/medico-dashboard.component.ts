import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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

  // Fecha hoy (usando timezone local)
  readonly hoy = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Citas ordenadas por fecha (solo las que no han expirado)
  readonly citasOrdenadas = computed(() => {
    const ahora = Date.now();

    // Filtrar citas que no han expirado (hasta 5 min después de la hora)
    const citasValidas = this.citas().filter((cita) => {
      const horaCita = new Date(cita.fechaHoraInicio).getTime();
      // La cita es válida si aún no han pasado 5 minutos desde su hora
      return ahora <= horaCita + 5 * 60 * 1000;
    });

    // Ordenar por fecha más próxima primero
    return citasValidas.sort(
      (a, b) => new Date(a.fechaHoraInicio).getTime() - new Date(b.fechaHoraInicio).getTime()
    );
  });

  // Próxima consulta
  readonly proximaConsulta = computed(() => {
    const ordenadas = this.citasOrdenadas();
    return ordenadas.length > 0 ? ordenadas[0] : null;
  });

  // Consultas de hoy (solo las que no han expirado)
  readonly consultasHoy = computed(() => {
    const hoyStr = this.hoy();
    const ahora = Date.now();

    return this.citas().filter((c) => {
      const horaCita = new Date(c.fechaHoraInicio).getTime();
      // Es de hoy Y no ha expirado (hasta 5 min después)
      return c.fechaHoraInicio.startsWith(hoyStr) && ahora <= horaCita + 5 * 60 * 1000;
    });
  });

  readonly tieneConsultasHoy = computed(() => this.consultasHoy().length > 0);

  // Indica si estamos mostrando 'Próximas Consultas' (no hay de hoy)
  readonly mostrandoProximasConsultas = computed(() => !this.tieneConsultasHoy());

  // Para mostrar
  readonly consultasParaMostrar = computed(() => {
    if (this.tieneConsultasHoy()) {
      return this.consultasHoy().sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio));
    }
    return this.citasOrdenadas();
  });

  constructor() {
    // Recargar citas cuando cambia el usuario (para evitar caché al cambiar de cuenta)
    effect(() => {
      const user = this.authService.user();
      if (user && this.authService.isDoctor()) {
        // Usuario médico autenticado - cargar sus citas
        this.cargarCitas();
      } else if (!user) {
        // No hay usuario (logout) - limpiar datos
        this.citas.set([]);
      }
    });
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
    // Puede ingresar 10 minutos antes hasta 5 minutos después
    return ahora >= consulta - 10 * 60 * 1000 && ahora <= consulta + 5 * 60 * 1000;
  }

  citaExpirada(cita: CitaResponseDto): boolean {
    const ahora = Date.now();
    const consulta = new Date(cita.fechaHoraInicio).getTime();
    // La cita expiró si pasaron más de 5 minutos después de la hora
    return ahora > consulta + 5 * 60 * 1000;
  }
}
