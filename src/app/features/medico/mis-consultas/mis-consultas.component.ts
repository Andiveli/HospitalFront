import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 class="text-3xl font-bold text-slate-800">Consultas Asignadas</h1>

        <!-- Filtros -->
        <div class="flex items-center gap-4">
          <!-- Checkbox Ver Todas -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [checked]="verTodas()"
              (change)="toggleVerTodas()"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span class="text-slate-700 font-medium">Ver todas</span>
          </label>

          <!-- Selector de Fecha (solo si no está en "Ver todas") -->
          @if (!verTodas()) {
            <input
              type="date"
              [value]="fechaSeleccionada()"
              (change)="cambiarFecha($event)"
              class="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      } @else if (citas().length === 0) {
        <div class="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-lg font-medium text-slate-600">
            {{ verTodas() ? 'No tienes consultas asignadas' : 'No hay consultas para esta fecha' }}
          </p>
          <p class="text-slate-500 mt-1">
            {{ verTodas() ? 'Las consultas aparecerán aquí cuando sean agendadas' : 'Selecciona otra fecha o verifica más tarde' }}
          </p>
        </div>
      } @else {
        <!-- Info de cantidad -->
        <div class="mb-4 text-sm text-slate-500">
          Mostrando {{ citas().length }} consulta{{ citas().length === 1 ? '' : 's' }}
          {{ verTodas() ? 'en total' : 'para el ' + formatearFechaLarga(fechaSeleccionada()) }}
        </div>

        <!-- Tabla de Consultas -->
        <div class="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
          <table class="w-full">
            <thead class="bg-slate-50">
              <tr class="border-b border-slate-300">
                <th class="py-4 px-4 text-left font-semibold text-slate-700">Hora Inicio</th>
                <th class="py-4 px-4 text-left font-semibold text-slate-700">Hora Fin</th>
                <th class="py-4 px-4 text-left font-semibold text-slate-700">Fecha</th>
                <th class="py-4 px-4 text-left font-semibold text-slate-700">Paciente</th>
                <th class="py-4 px-4 text-left font-semibold text-slate-700">Estado</th>
                <th class="py-4 px-4 text-center font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              @for (cita of citas(); track cita.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="py-4 px-4 text-slate-700">
                    {{ formatearHora(cita.fechaHoraInicio) }}
                  </td>
                  <td class="py-4 px-4 text-slate-700">
                    {{ formatearHora(cita.fechaHoraFin) }}
                  </td>
                  <td class="py-4 px-4 text-slate-700">
                    {{ formatearFecha(cita.fechaHoraInicio) }}
                  </td>
                  <td class="py-4 px-4 font-medium text-slate-800">
                    {{ nombrePaciente(cita) }}
                  </td>
                  <td class="py-4 px-4">
                    <span [class]="getEstadoClase(cita.estado)">
                      {{ formatearEstado(cita.estado) }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    @if (mostrarBotonIngresar(cita)) {
                      <button
                        [routerLink]="['/sala-espera', cita.id]"
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                      >
                        Ingresar
                      </button>
                    } @else {
                      <button
                        [routerLink]="['/citas/medico', cita.id]"
                        class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                      >
                        Ver Detalles
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`],
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
    return new Date().toISOString().split('T')[0];
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
