import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { EnfermedadDto } from '../../../core/models';
import {
  type CreateEnfermedadDto,
  EnfermedadService,
} from '../../../core/services/enfermedad.service';
import {
  type CreateTipoEnfermedadDto,
  type TipoEnfermedadDto,
  TiposEnfermedadService,
} from '../../../core/services/tipos-enfermedad.service';

@Component({
  selector: 'app-admin-enfermedades',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900">
              Gestión de Enfermedades
            </h1>
            <p class="text-slate-600 mt-1">
              Administra el catálogo de enfermedades y tipos
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
            <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Total Enfermedades</p>
              <p class="text-2xl font-bold text-slate-900">{{ enfermedades().length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Tipos de Enfermedad</p>
              <p class="text-2xl font-bold text-slate-900">{{ tipos().length }}</p>
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
              placeholder="Buscar enfermedades..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              (click)="openTiposModal()"
              class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Tipos
            </button>
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Enfermedad
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <div class="flex flex-col items-center justify-center">
            <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p class="text-slate-600 font-medium">Cargando enfermedades...</p>
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
              <h3 class="text-red-800 font-medium">Error al cargar las enfermedades</h3>
              <p class="text-red-600 mt-1">{{ error() }}</p>
              <button
                (click)="loadEnfermedades()"
                class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && enfermedadesFiltradas().length === 0) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-700 mb-2">
            {{ searchTerm() ? 'No se encontraron enfermedades' : 'No hay enfermedades registradas' }}
          </h3>
          <p class="text-slate-500 mb-6">
            {{ searchTerm() 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Comienza agregando la primera enfermedad al catálogo' }}
          </p>
          @if (!searchTerm()) {
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar Enfermedad
            </button>
          }
        </div>
      }

      <!-- Enfermedades Table -->
      @if (!loading() && !error() && enfermedadesFiltradas().length > 0) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Enfermedad
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
                @for (enfermedad of enfermedadesFiltradas(); track enfermedad.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                          {{ getInitials(enfermedad.nombre) }}
                        </div>
                        <div>
                          <p class="font-medium text-slate-900">{{ enfermedad.nombre }}</p>
                          <p class="text-sm text-slate-500">ID: {{ enfermedad.id }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      @if (enfermedad.descripcion) {
                        <p class="text-sm text-slate-600">{{ enfermedad.descripcion }}</p>
                      } @else {
                        <span class="text-sm text-slate-400 italic">Sin descripción</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          (click)="openEditModal(enfermedad)"
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
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 class="text-xl font-bold text-slate-900">
                {{ editingEnfermedad() ? 'Editar Enfermedad' : 'Nueva Enfermedad' }}
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
              <form (submit)="saveEnfermedad(); $event.preventDefault()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.nombre"
                    name="nombre"
                    required
                    placeholder="Ej: Diabetes Tipo 2"
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    [(ngModel)]="formData.descripcion"
                    name="descripcion"
                    rows="3"
                    placeholder="Descripción de la enfermedad..."
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
                      {{ editingEnfermedad() ? 'Guardar Cambios' : 'Crear Enfermedad' }}
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Tipos Modal -->
      @if (showTiposModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 class="text-xl font-bold text-slate-900">Tipos de Enfermedad</h2>
              <button
                (click)="closeTiposModal()"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Content -->
            <div class="flex-1 overflow-y-auto p-6">
              <!-- Create Tipo Form -->
              @if (showCreateTipoForm()) {
                <div class="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 class="text-sm font-semibold text-slate-700 mb-3">Nuevo Tipo</h3>
                  <form (submit)="saveTipo(); $event.preventDefault()" class="space-y-3">
                    <div>
                      <input
                        type="text"
                        [(ngModel)]="tipoFormData.nombre"
                        name="nombreTipo"
                        placeholder="Nombre del tipo"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    @if (tipoFormError()) {
                      <div class="bg-red-50 border border-red-200 rounded-lg p-2">
                        <p class="text-xs text-red-600">{{ tipoFormError() }}</p>
                      </div>
                    }
                    <div class="flex gap-2">
                      <button
                        type="button"
                        (click)="cancelCreateTipo()"
                        class="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        [disabled]="savingTipo()"
                        class="flex-1 px-3 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
                      >
                        @if (savingTipo()) {
                          <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        } @else {
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        }
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              } @else {
                <button
                  (click)="openCreateTipoForm()"
                  class="w-full mb-4 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Nuevo Tipo
                </button>
              }

              <!-- Lista de Tipos -->
              <div class="space-y-2">
                @for (tipo of tipos(); track tipo.id) {
                  <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <span class="font-medium text-slate-700">{{ tipo.nombre }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                (click)="closeTiposModal()"
                class="w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEnfermedadesComponent {
  private readonly enfermedadService = inject(EnfermedadService);
  private readonly tiposService = inject(TiposEnfermedadService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly enfermedades = signal<EnfermedadDto[]>([]);
  readonly tipos = signal<TipoEnfermedadDto[]>([]);

  readonly searchTerm = signal('');

  // Modal state
  readonly showModal = signal(false);
  readonly showTiposModal = signal(false);
  readonly editingEnfermedad = signal<EnfermedadDto | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // Tipo form state
  readonly showCreateTipoForm = signal(false);
  readonly savingTipo = signal(false);
  readonly tipoFormError = signal<string | null>(null);

  readonly formData = {
    nombre: '',
    descripcion: '',
  };

  readonly tipoFormData = {
    nombre: '',
  };

  readonly enfermedadesFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.enfermedades();

    return this.enfermedades().filter((enf) => {
      const nombre = enf.nombre.toLowerCase();
      const descripcion = (enf.descripcion || '').toLowerCase();
      return nombre.includes(term) || descripcion.includes(term);
    });
  });

  constructor() {
    this.loadEnfermedades();
    this.loadTipos();
  }

  async loadEnfermedades(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const enfermedades = await this.enfermedadService.getEnfermedades();
      this.enfermedades.set(enfermedades);
    } catch (err: unknown) {
      this.error.set('Error al cargar las enfermedades');
      console.error('Error loading enfermedades:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async loadTipos(): Promise<void> {
    try {
      const tipos = await this.tiposService.getAllTipos();
      this.tipos.set(tipos);
    } catch (err) {
      console.error('Error loading tipos:', err);
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  getInitials(nombre: string): string {
    return this.enfermedadService.getInitials(nombre);
  }

  openCreateModal(): void {
    this.editingEnfermedad.set(null);
    this.resetForm();
    this.showModal.set(true);
    this.formError.set(null);
  }

  openEditModal(enfermedad: EnfermedadDto): void {
    this.editingEnfermedad.set(enfermedad);
    this.formData.nombre = enfermedad.nombre;
    this.formData.descripcion = enfermedad.descripcion || '';
    this.showModal.set(true);
    this.formError.set(null);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingEnfermedad.set(null);
    this.resetForm();
    this.formError.set(null);
  }

  resetForm(): void {
    this.formData.nombre = '';
    this.formData.descripcion = '';
  }

  async saveEnfermedad(): Promise<void> {
    if (!this.formData.nombre.trim()) {
      this.formError.set('El nombre es obligatorio');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    try {
      const data: CreateEnfermedadDto = {
        nombre: this.formData.nombre.trim(),
        descripcion: this.formData.descripcion.trim() || undefined,
      };

      if (this.editingEnfermedad()) {
        await this.enfermedadService.updateEnfermedad(this.editingEnfermedad()!.id, data);
      } else {
        await this.enfermedadService.createEnfermedad(data);
      }

      this.closeModal();
      await this.loadEnfermedades();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar la enfermedad';
      this.formError.set(errorMsg);
      console.error('Error saving enfermedad:', err);
    } finally {
      this.saving.set(false);
    }
  }

  // Tipos Modal
  openTiposModal(): void {
    this.showTiposModal.set(true);
    this.showCreateTipoForm.set(false);
    this.tipoFormError.set(null);
    this.tipoFormData.nombre = '';
  }

  closeTiposModal(): void {
    this.showTiposModal.set(false);
    this.showCreateTipoForm.set(false);
    this.tipoFormError.set(null);
  }

  openCreateTipoForm(): void {
    this.showCreateTipoForm.set(true);
    this.tipoFormError.set(null);
    this.tipoFormData.nombre = '';
  }

  cancelCreateTipo(): void {
    this.showCreateTipoForm.set(false);
    this.tipoFormError.set(null);
    this.tipoFormData.nombre = '';
  }

  async saveTipo(): Promise<void> {
    if (!this.tipoFormData.nombre.trim()) {
      this.tipoFormError.set('El nombre del tipo es obligatorio');
      return;
    }

    this.savingTipo.set(true);
    this.tipoFormError.set(null);

    try {
      const data: CreateTipoEnfermedadDto = {
        nombre: this.tipoFormData.nombre.trim(),
      };

      await this.tiposService.createTipo(data);

      // Recargar tipos y cerrar formulario
      await this.loadTipos();
      this.cancelCreateTipo();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear el tipo';
      this.tipoFormError.set(errorMsg);
      console.error('Error saving tipo:', err);
    } finally {
      this.savingTipo.set(false);
    }
  }
}
