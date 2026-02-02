import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { CitaResponseDto } from '../../../core/models';
import { CitasService } from '../../../core/services/citas.service';

/**
 * Mis Consultas - Vista del Médico
 *
 * Muestra todas las consultas asignadas al médico con:
 * - Filtro por fecha o ver todas
 * - Tabla con hora inicio/fin, fecha, paciente, estado, acciones
 * - Botones según estado: Ver Detalles, Ingresar
 */
@Component({
  selector: 'app-mis-consultas',
  imports: [CommonModule, RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-consultas.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class MisConsultasComponent {
  private readonly citasService = inject(CitasService);

  // Estado
  readonly loading = signal(true);
  readonly citas = signal<CitaResponseDto[]>([]);
  readonly fechaSeleccionada = signal<string>(this.getFechaHoy());
  readonly verTodas = signal<boolean>(false);

  constructor() {
    // Por defecto, cargar citas de hoy
    this.cargarCitas();
  }

  private getFechaHoy(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async cargarCitas(): Promise<void> {
    try {
      this.loading.set(true);

      let citas: CitaResponseDto[];

      if (this.verTodas()) {
        // Cargar todas las citas
        citas = await this.citasService.getAllCitasMedico();
      } else {
        // Cargar citas de la fecha seleccionada
        citas = await this.citasService.getCitasMedicoPorFecha(this.fechaSeleccionada());
      }

      // Ordenar por fecha y hora
      this.citas.set(
        citas.sort(
          (a, b) => new Date(a.fechaHoraInicio).getTime() - new Date(b.fechaHoraInicio).getTime()
        )
      );
    } catch {
      // Error silencioso
    } finally {
      this.loading.set(false);
    }
  }

  toggleVerTodas(): void {
    this.verTodas.update((v) => !v);
    this.cargarCitas();
  }

  cambiarFecha(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.fechaSeleccionada.set(target.value);
    this.cargarCitas();
  }

  // Helpers
  nombrePaciente(cita: CitaResponseDto): string {
    return `${cita.paciente.nombre} ${cita.paciente.apellido}`;
  }

  formatearHora(fechaHora: string): string {
    return new Date(fechaHora).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  formatearFecha(fechaHora: string): string {
    return new Date(fechaHora).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }

  formatearFechaLarga(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatearEstado(estado: string): string {
    const estados: Record<string, string> = {
      pendiente: 'No iniciada',
      atendida: 'Completada',
      cancelada: 'Cancelada',
      completada: 'Completada',
    };
    return estados[estado] || estado;
  }

  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      pendiente:
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700',
      atendida:
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700',
      completada:
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700',
      cancelada:
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700',
    };
    return (
      clases[estado] ||
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700'
    );
  }

  mostrarBotonIngresar(cita: CitaResponseDto): boolean {
    // Mostrar "Ingresar" solo si está pendiente y es hora de la consulta
    if (cita.estado !== 'pendiente') return false;

    const ahora = Date.now();
    const inicio = new Date(cita.fechaHoraInicio).getTime();
    const fin = new Date(cita.fechaHoraFin).getTime();

    // Permitir ingresar desde 10 min antes hasta la hora de fin
    return ahora >= inicio - 10 * 60 * 1000 && ahora <= fin;
  }
}
