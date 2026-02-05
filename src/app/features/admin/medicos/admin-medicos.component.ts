import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { type MedicoResponseDto, MedicosService } from '../../../core/services/medicos.service';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-admin-medicos',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900">
              Gestión de Médicos
            </h1>
            <p class="text-slate-600 mt-1">
              Administra los médicos y sus especialidades
            </p>
          </div>
          <a
            routerLink="/admin/medicos/asignar"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >n              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Asignar Nuevo Médico
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Total Médicos</p>
              <p class="text-2xl font-bold text-slate-900">{{ meta().total }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Citas Atendidas</p>
              <p class="text-2xl font-bold text-slate-900">{{ totalCitasAtendidas() }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Especialidades</p>
              <p class="text-2xl font-bold text-slate-900">{{ totalEspecialidadesUnicas() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div class="flex flex-col sm:flex-row gap-4">
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
              placeholder="Buscar por nombre, cédula o email..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            (click)="clearFilters()"
            class="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <div class="flex flex-col items-center justify-center">
            <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p class="text-slate-600 font-medium">Cargando médicos...</p>
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
              <h3 class="text-red-800 font-medium">Error al cargar los médicos</h3>
              <p class="text-red-600 mt-1">{{ error() }}</p>
              <button
                (click)="loadMedicos()"
                class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && medicosFiltrados().length === 0) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-700 mb-2">
            {{ searchTerm() ? 'No se encontraron médicos' : 'No hay médicos registrados' }}
          </h3>
          <p class="text-slate-500 mb-6">
            {{ searchTerm() 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Comienza asignando el rol de médico a un usuario existente' }}
          </p>
          @if (!searchTerm()) {
            <a
              routerLink="/admin/medicos/asignar"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Asignar Médico
            </a>
          }
        </div>
      }

      <!-- Medicos Table -->
      @if (!loading() && !error() && medicosFiltrados().length > 0) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Médico
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Licencia
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Especialidades
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Horarios
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Citas
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (medico of medicosFiltrados(); track medico.cedula) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                          {{ getInitials(medico.nombreCompleto) }}
                        </div>
                        <div>
                          <p class="font-medium text-slate-900">{{ medico.nombreCompleto }}</p>
                          <p class="text-sm text-slate-500">{{ medico.email }}</p>
                          <p class="text-xs text-slate-400">CI: {{ medico.cedula }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {{ medico.licenciaMedica }}
                      </span>
                      @if (medico.pasaporte) {
                        <p class="text-xs text-slate-400 mt-1">Pass: {{ medico.pasaporte }}</p>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-wrap gap-1">
                        @for (especialidad of medico.especialidades; track especialidad) {
                          <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            {{ especialidad }}
                          </span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="space-y-1">
                        @for (horario of getHorariosResumen(medico.horarios); track horario) {
                          <p class="text-sm text-slate-600">{{ horario }}</p>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                          {{ medico.citasAtendidas }}
                        </span>
                        <span class="text-sm text-slate-500">atendidas</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          class="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
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
                <span class="font-medium">{{ meta().total }}</span> médicos
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
export class AdminMedicosComponent {
  private readonly medicosService = inject(MedicosService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly medicos = signal<MedicoResponseDto[]>([]);
  readonly meta = signal<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  readonly searchTerm = signal('');
  readonly Math = Math;

  readonly medicosFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.medicos();

    return this.medicos().filter((medico) => {
      const nombre = medico.nombreCompleto.toLowerCase();
      const email = medico.email.toLowerCase();
      const cedula = medico.cedula.toLowerCase();
      const licencia = medico.licenciaMedica.toLowerCase();
      const especialidades = medico.especialidades.join(' ').toLowerCase();

      return (
        nombre.includes(term) ||
        email.includes(term) ||
        cedula.includes(term) ||
        licencia.includes(term) ||
        especialidades.includes(term)
      );
    });
  });

  readonly totalCitasAtendidas = computed(() => {
    return this.medicos().reduce((sum, m) => sum + m.citasAtendidas, 0);
  });

  readonly totalEspecialidadesUnicas = computed(() => {
    const todas = this.medicos().flatMap((m) => m.especialidades);
    return new Set(todas).size;
  });

  constructor() {
    // Cargar médicos al inicializar el componente
    this.loadMedicos();
  }

  async loadMedicos(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('Cargando médicos...');
      const response = await this.medicosService.getAllMedicos(this.meta().page, this.meta().limit);
      console.log('Respuesta del backend:', response);

      // Validar que la respuesta tenga la estructura correcta
      if (!response || !Array.isArray(response.data)) {
        throw new Error('La respuesta del servidor no tiene el formato esperado');
      }

      this.medicos.set(response.data);
      this.meta.set(response.meta);
      console.log('Médicos cargados:', response.data.length);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar los médicos';
      this.error.set(errorMsg);
      console.error('Error loading medicos:', err);
    } finally {
      this.loading.set(false);
      console.log('Loading finalizado');
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.meta.update((m) => ({ ...m, page: 1 }));
    this.loadMedicos();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta().totalPages) return;
    this.meta.update((m) => ({ ...m, page }));
    this.loadMedicos();
  }

  getPagesArray(): number[] {
    const total = this.meta().totalPages;
    const current = this.meta().page;
    const pages: number[] = [];

    // Mostrar máximo 5 páginas alrededor de la actual
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

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getHorariosResumen(horarios: string[]): string[] {
    // Los horarios vienen como strings del backend, mostramos los primeros 3
    return horarios.slice(0, 3);
  }
}
