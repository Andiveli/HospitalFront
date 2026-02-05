import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { EspecialidadDto } from '../../../core/models';
import type { CreateEspecialidadDto } from '../../../core/services/especialidades.service';
import { EspecialidadesService } from '../../../core/services/especialidades.service';

@Component({
  selector: 'app-admin-especialidades',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900">
              Gestión de Especialidades
            </h1>
            <p class="text-slate-600 mt-1">
              Administra las especialidades médicas del sistema
            </p>
          </div>
          <div class="flex items-center gap-3">
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
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Total Especialidades</p>
              <p class="text-2xl font-bold text-slate-900">{{ especialidades().length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Con Descripción</p>
              <p class="text-2xl font-bold text-slate-900">{{ especialidadesConDescripcion() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Bar -->
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
              placeholder="Buscar por nombre..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Create Button -->
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Especialidad
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <div class="flex flex-col items-center justify-center">
            <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p class="text-slate-600 font-medium">Cargando especialidades...</p>
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
              <h3 class="text-red-800 font-medium">Error al cargar las especialidades</h3>
              <p class="text-red-600 mt-1">{{ error() }}</p>
              <button
                (click)="loadEspecialidades()"
                class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && especialidadesFiltradas().length === 0) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-700 mb-2">
            {{ searchTerm() ? 'No se encontraron especialidades' : 'No hay especialidades registradas' }}
          </h3>
          <p class="text-slate-500 mb-6">
            {{ searchTerm() 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Comienza agregando la primera especialidad médica' }}
          </p>
          @if (!searchTerm()) {
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar Especialidad
            </button>
          }
        </div>
      }

      <!-- Especialidades Table -->
      @if (!loading() && !error() && especialidadesFiltradas().length > 0) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (especialidad of especialidadesFiltradas(); track especialidad.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                          {{ getInitials(especialidad.nombre) }}
                        </div>
                        <div>
                          <p class="font-medium text-slate-900">{{ especialidad.nombre }}</p>
                          <p class="text-sm text-slate-500">ID: {{ especialidad.id }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      @if (especialidad.descripcion) {
                        <p class="text-sm text-slate-600">{{ especialidad.descripcion }}</p>
                      } @else {
                        <span class="text-sm text-slate-400 italic">Sin descripción</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          (click)="openEditModal(especialidad)"
                          class="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          (click)="deleteEspecialidad(especialidad)"
                          class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 class="text-xl font-bold text-slate-900">
                {{ editingEspecialidad() ? 'Editar Especialidad' : 'Nueva Especialidad' }}
              </h2>
              <button
                (click)="closeModal()"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Content -->
            <div class="flex-1 overflow-y-auto p-6">
              <form (submit)="saveEspecialidad(); $event.preventDefault()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.nombre"
                    name="nombre"
                    required
                    placeholder="Ej: Cardiología"
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    [(ngModel)]="formData.descripcion"
                    name="descripcion"
                    rows="3"
                    placeholder="Descripción de la especialidad..."
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  ></textarea>
                </div>

                @if (formError()) {
                  <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p class="text-sm text-red-600">{{ formError() }}</p>
                  </div>
                }

                <div class="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    (click)="closeModal()"
                    class="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    [disabled]="saving()"
                    class="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    @if (saving()) {
                      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    } @else {
                      {{ editingEspecialidad() ? 'Guardar Cambios' : 'Crear Especialidad' }}
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEspecialidadesComponent {
  private readonly especialidadesService = inject(EspecialidadesService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly especialidades = signal<EspecialidadDto[]>([]);

  readonly searchTerm = signal('');

  // Modal state
  readonly showModal = signal(false);
  readonly editingEspecialidad = signal<EspecialidadDto | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly formData = {
    nombre: '',
    descripcion: '',
  };

  readonly especialidadesFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.especialidades();

    return this.especialidades().filter((esp) => {
      const nombre = esp.nombre.toLowerCase();
      const descripcion = (esp.descripcion || '').toLowerCase();
      return nombre.includes(term) || descripcion.includes(term);
    });
  });

  readonly especialidadesConDescripcion = computed(() => {
    return this.especialidades().filter((e) => e.descripcion && e.descripcion.trim().length > 0)
      .length;
  });

  constructor() {
    this.loadEspecialidades();
  }

  async loadEspecialidades(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const especialidades = await this.especialidadesService.getAllEspecialidades();
      this.especialidades.set(especialidades);
    } catch (err: unknown) {
      this.error.set('Error al cargar las especialidades');
      console.error('Error loading especialidades:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  getInitials(nombre: string): string {
    return this.especialidadesService.getInitials(nombre);
  }

  openCreateModal(): void {
    this.editingEspecialidad.set(null);
    this.resetForm();
    this.showModal.set(true);
    this.formError.set(null);
  }

  openEditModal(especialidad: EspecialidadDto): void {
    this.editingEspecialidad.set(especialidad);
    this.formData.nombre = especialidad.nombre;
    this.formData.descripcion = especialidad.descripcion || '';
    this.showModal.set(true);
    this.formError.set(null);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingEspecialidad.set(null);
    this.resetForm();
    this.formError.set(null);
  }

  resetForm(): void {
    this.formData.nombre = '';
    this.formData.descripcion = '';
  }

  async saveEspecialidad(): Promise<void> {
    if (!this.formData.nombre.trim()) {
      this.formError.set('El nombre es obligatorio');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    try {
      const data: CreateEspecialidadDto = {
        nombre: this.formData.nombre.trim(),
        descripcion: this.formData.descripcion.trim() || undefined,
      };

      if (this.editingEspecialidad()) {
        await this.especialidadesService.updateEspecialidad(this.editingEspecialidad()!.id, data);
      } else {
        await this.especialidadesService.createEspecialidad(data);
      }

      this.closeModal();
      await this.loadEspecialidades();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar la especialidad';
      this.formError.set(errorMsg);
      console.error('Error saving especialidad:', err);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteEspecialidad(especialidad: EspecialidadDto): Promise<void> {
    if (!confirm(`¿Estás seguro de eliminar la especialidad "${especialidad.nombre}"?`)) {
      return;
    }

    try {
      const success = await this.especialidadesService.deleteEspecialidad(especialidad.id);
      if (success) {
        await this.loadEspecialidades();
      } else {
        alert('No se pudo eliminar la especialidad');
      }
    } catch (err) {
      console.error('Error deleting especialidad:', err);
      alert('Error al eliminar la especialidad');
    }
  }
}
