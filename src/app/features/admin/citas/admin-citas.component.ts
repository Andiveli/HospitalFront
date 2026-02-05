import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, type CitaResponseDto } from '../../../core/services/admin.service';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type CitaEstado = 'pendiente' | 'atendida' | 'cancelada' | 'all';

@Component({
  selector: 'app-admin-citas',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900">
              Gestión de Citas
            </h1>
            <p class="text-slate-600 mt-1">
              Administra todas las citas médicas del sistema
            </p>
          </div>
          <a
            routerLink="/admin/dashboard"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">Total Citas</p>
              <p class="text-xl font-bold text-slate-900">{{ meta().total }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">Pendientes</p>
              <p class="text-xl font-bold text-slate-900">{{ citasPendientes() }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">Atendidas</p>
              <p class="text-xl font-bold text-slate-900">{{ citasAtendidas() }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">Canceladas</p>
              <p class="text-xl font-bold text-slate-900">{{ citasCanceladas() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1 relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Buscar por paciente, médico o especialidad..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Estado Filter -->
          <div class="flex gap-2">
            @for (filtro of filtrosEstado; track filtro.valor) {
              <button
                (click)="setEstadoFilter(filtro.valor)"
                [class]="estadoFilter() === filtro.valor 
                  ? 'bg-purple-600 text-white border-purple-600' 
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'"
                class="px-4 py-2.5 border rounded-lg font-medium text-sm transition-colors"
              >
                {{ filtro.label }}
              </button>
            }
          </div>

          <!-- Clear Filters -->
          <button
            (click)="clearFilters()"
            class="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            Limpiar
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <div class="flex flex-col items-center justify-center">
            <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p class="text-slate-600 font-medium">Cargando citas...</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error() && !loading()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="text-red-800 font-medium">Error al cargar las citas</h3>
              <p class="text-red-600 mt-1">{{ error() }}</p>
              <button
                (click)="loadCitas()"
                class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && citasFiltradas().length === 0) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-700 mb-2">
            {{ searchTerm() || estadoFilter() !== 'all' ? 'No se encontraron citas' : 'No hay citas registradas' }}
          </h3>
          <p class="text-slate-500">
            {{ searchTerm() || estadoFilter() !== 'all' 
              ? 'Intenta con otros filtros de búsqueda' 
              : 'El sistema no tiene citas médicas registradas' }}
          </p>
        </div>
      }

      <!-- Citas Table -->
      @if (!loading() && !error() && citasFiltradas().length > 0) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cita
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Médico
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (cita of citasFiltradas(); track cita.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex flex-col">
                        <span class="text-sm font-medium text-slate-900">
                          {{ formatFecha(cita.fechaHoraInicio) }}
                        </span>
                        <span class="text-xs text-slate-500">
                          {{ formatHora(cita.fechaHoraInicio) }} - {{ formatHora(cita.fechaHoraFin) }}
                        </span>
                        @if (cita.telefonica) {
                          <span class="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Telefónica
                          </span>
                        }
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                          {{ getInitials(cita.paciente.nombre, cita.paciente.apellido) }}
                        </div>
                        <div>
                          <p class="text-sm font-medium text-slate-900">
                            {{ cita.paciente.nombre }} {{ cita.paciente.apellido }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                          {{ getInitials(cita.medico.nombre, cita.medico.apellido) }}
                        </div>
                        <div>
                          <p class="text-sm font-medium text-slate-900">
                            Dr. {{ cita.medico.nombre }} {{ cita.medico.apellido }}
                          </p>
                          @if (cita.medico.especialidad) {
                            <p class="text-xs text-slate-500">{{ cita.medico.especialidad }}</p>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      @switch (cita.estado) {
                        @case ('pendiente') {
                          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></span>
                            Pendiente
                          </span>
                        }
                        @case ('atendida') {
                          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                            Atendida
                          </span>
                        }
                        @case ('cancelada') {
                          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                            Cancelada
                          </span>
                        }
                        @default {
                          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {{ cita.estado }}
                          </span>
                        }
                      }
                    </td>
                    <td class="px-4 py-3 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <a
                          [routerLink]="['/citas/paciente', cita.id]"
                          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (meta().totalPages > 1) {
            <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <p class="text-sm text-slate-600">
                Mostrando <span class="font-medium">{{ ((meta().page - 1) * meta().limit) + 1 }}</span> - 
                <span class="font-medium">{{ Math.min(meta().page * meta().limit, meta().total) }}</span> de 
                <span class="font-medium">{{ meta().total }}</span> citas
              </p>
              <div class="flex items-center gap-2">
                <button
                  (click)="goToPage(meta().page - 1)"
                  [disabled]="meta().page === 1"
                  class="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <div class="flex items-center gap-1">
                  @for (page of getPagesArray(); track page) {
                    <button
                      (click)="goToPage(page)"
                      [class.bg-purple-600]="page === meta().page"
                      [class.text-white]="page === meta().page"
                      [class.bg-white]="page !== meta().page"
                      [class.text-slate-700]="page !== meta().page"
                      [class.hover:bg-slate-50]="page !== meta().page"
                      class="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg border border-slate-300 transition-colors"
                    >
                      {{ page }}
                    </button>
                  }
                </div>
                <button
                  (click)="goToPage(meta().page + 1)"
                  [disabled]="meta().page === meta().totalPages"
                  class="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCitasComponent {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly citas = signal<CitaResponseDto[]>([]);
  readonly meta = signal<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  readonly searchTerm = signal('');
  readonly estadoFilter = signal<CitaEstado>('all');
  readonly Math = Math;

  readonly filtrosEstado = [
    { label: 'Todas', valor: 'all' as CitaEstado },
    { label: 'Pendientes', valor: 'pendiente' as CitaEstado },
    { label: 'Atendidas', valor: 'atendida' as CitaEstado },
    { label: 'Canceladas', valor: 'cancelada' as CitaEstado },
  ];

  readonly citasFiltradas = computed(() => {
    let resultado = this.citas();

    // Filtrar por estado
    if (this.estadoFilter() !== 'all') {
      resultado = resultado.filter((c) => c.estado === this.estadoFilter());
    }

    // Filtrar por búsqueda
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      resultado = resultado.filter((c) => {
        const paciente = `${c.paciente.nombre} ${c.paciente.apellido}`.toLowerCase();
        const medico = `${c.medico.nombre} ${c.medico.apellido}`.toLowerCase();
        const especialidad = (c.medico.especialidad || '').toLowerCase();
        return paciente.includes(term) || medico.includes(term) || especialidad.includes(term);
      });
    }

    return resultado;
  });

  readonly citasPendientes = computed(() => {
    return this.citas().filter((c) => c.estado === 'pendiente').length;
  });

  readonly citasAtendidas = computed(() => {
    return this.citas().filter((c) => c.estado === 'atendida').length;
  });

  readonly citasCanceladas = computed(() => {
    return this.citas().filter((c) => c.estado === 'cancelada').length;
  });

  constructor() {
    this.loadCitas();
  }

  async loadCitas(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('Cargando citas...');
      const citas = await this.adminService.getAllCitasAdmin(this.meta().page, this.meta().limit);
      console.log('Citas cargadas:', citas.length);
      this.citas.set(citas);

      // Actualizar meta basado en los resultados (el servicio actual no devuelve meta completo)
      this.meta.update((m) => ({
        ...m,
        total: citas.length,
        totalPages: Math.ceil(citas.length / m.limit) || 1,
      }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar las citas';
      this.error.set(errorMsg);
      console.error('Error loading citas:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  setEstadoFilter(estado: CitaEstado): void {
    this.estadoFilter.set(estado);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.estadoFilter.set('all');
    this.meta.update((m) => ({ ...m, page: 1 }));
    this.loadCitas();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta().totalPages) return;
    this.meta.update((m) => ({ ...m, page }));
    this.loadCitas();
  }

  getPagesArray(): number[] {
    const total = this.meta().totalPages;
    const current = this.meta().page;
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getInitials(nombre: string, apellido: string): string {
    return `${nombre[0]}${apellido[0]}`.toUpperCase();
  }

  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  formatHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
