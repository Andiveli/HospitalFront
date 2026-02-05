import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  type CreateMedicamentoDto,
  type CreatePresentacionDto,
  type MedicamentoDto,
  MedicamentosService,
  type PresentacionDto,
} from '../../../core/services/medicamentos.service';

@Component({
  selector: 'app-admin-medicamentos',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900">
              Gestión de Medicamentos
            </h1>
            <p class="text-slate-600 mt-1">
              Administra el catálogo de medicamentos del sistema
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
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Total Medicamentos</p>
              <p class="text-2xl font-bold text-slate-900">{{ medicamentos().length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Presentaciones</p>
              <p class="text-2xl font-bold text-slate-900">{{ presentaciones().length }}</p>
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
              <p class="text-sm font-medium text-slate-500">Principios Activos Únicos</p>
              <p class="text-2xl font-bold text-slate-900">{{ principiosActivosUnicos() }}</p>
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
              placeholder="Buscar por nombre o principio activo..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              (click)="openPresentacionesModal()"
              class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Presentaciones
            </button>
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Medicamento
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <div class="flex flex-col items-center justify-center">
            <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p class="text-slate-600 font-medium">Cargando medicamentos...</p>
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
              <h3 class="text-red-800 font-medium">Error al cargar los medicamentos</h3>
              <p class="text-red-600 mt-1">{{ error() }}</p>
              <button
                (click)="loadMedicamentos()"
                class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && medicamentosFiltrados().length === 0) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-700 mb-2">
            {{ searchTerm() ? 'No se encontraron medicamentos' : 'No hay medicamentos registrados' }}
          </h3>
          <p class="text-slate-500 mb-6">
            {{ searchTerm() 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Comienza agregando el primer medicamento al catálogo' }}
          </p>
          @if (!searchTerm()) {
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar Medicamento
            </button>
          }
        </div>
      }

      <!-- Medicamentos Table -->
      @if (!loading() && !error() && medicamentosFiltrados().length > 0) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Medicamento
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Principio Activo
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Concentración
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Presentación
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (medicamento of medicamentosFiltrados(); track medicamento.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                          {{ getInitials(medicamento.nombre) }}
                        </div>
                        <div>
                          <p class="font-medium text-slate-900">{{ medicamento.nombre }}</p>
                          <p class="text-sm text-slate-500">ID: {{ medicamento.id }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                        {{ medicamento.principioActivo }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      @if (medicamento.concentracion) {
                        <span class="text-sm text-slate-700">{{ medicamento.concentracion }}</span>
                      } @else {
                        <span class="text-sm text-slate-400">-</span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        {{ medicamento.presentacion.nombre }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          (click)="openEditModal(medicamento)"
                          class="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          (click)="deleteMedicamento(medicamento)"
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
                {{ editingMedicamento() ? 'Editar Medicamento' : 'Nuevo Medicamento' }}
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
              <form (submit)="saveMedicamento(); $event.preventDefault()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.nombre"
                    name="nombre"
                    required
                    placeholder="Ej: Paracetamol"
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Principio Activo *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.principioActivo"
                    name="principioActivo"
                    required
                    placeholder="Ej: Paracetamol"
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Concentración</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.concentracion"
                    name="concentracion"
                    placeholder="Ej: 500mg"
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Presentación *</label>
                  <select
                    [(ngModel)]="formData.presentacionId"
                    name="presentacionId"
                    required
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Selecciona una presentación</option>
                    @for (presentacion of presentaciones(); track presentacion.id) {
                      <option [value]="presentacion.id">{{ presentacion.nombre }}</option>
                    }
                  </select>
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
                      {{ editingMedicamento() ? 'Guardar Cambios' : 'Crear Medicamento' }}
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Presentaciones Modal -->
      @if (showPresentacionesModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 class="text-xl font-bold text-slate-900">Presentaciones Disponibles</h2>
              <button
                (click)="closePresentacionesModal()"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Content -->
            <div class="flex-1 overflow-y-auto p-6">
              <!-- Create/Edit Presentacion Form -->
              @if (showCreatePresentacionForm()) {
                <div class="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 class="text-sm font-semibold text-slate-700 mb-3">
                    {{ editingPresentacion() ? 'Editar Presentación' : 'Nueva Presentación' }}
                  </h3>
                  <form (submit)="savePresentacion(); $event.preventDefault()" class="space-y-3">
                    <div>
                      <input
                        type="text"
                        [(ngModel)]="presentacionFormData.nombre"
                        name="nombrePresentacion"
                        placeholder="Nombre de la presentación"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    @if (presentacionFormError()) {
                      <div class="bg-red-50 border border-red-200 rounded-lg p-2">
                        <p class="text-xs text-red-600">{{ presentacionFormError() }}</p>
                      </div>
                    }
                    <div class="flex gap-2">
                      <button
                        type="button"
                        (click)="cancelCreatePresentacion()"
                        class="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        [disabled]="savingPresentacion()"
                        class="flex-1 px-3 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
                      >
                        @if (savingPresentacion()) {
                          <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        } @else {
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        }
                        {{ editingPresentacion() ? 'Actualizar' : 'Guardar' }}
                      </button>
                    </div>
                  </form>
                </div>
              } @else {
                <button
                  (click)="openCreatePresentacionForm()"
                  class="w-full mb-4 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Nueva Presentación
                </button>
              }

              <!-- Lista de Presentaciones -->
              <div class="space-y-2">
                @for (presentacion of presentaciones(); track presentacion.id) {
                  <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <span class="font-medium text-slate-700">{{ presentacion.nombre }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <button
                        (click)="openEditPresentacionForm(presentacion)"
                        class="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        (click)="deletePresentacion(presentacion)"
                        class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                (click)="closePresentacionesModal()"
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
export class AdminMedicamentosComponent {
  private readonly medicamentosService = inject(MedicamentosService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly medicamentos = signal<MedicamentoDto[]>([]);
  readonly presentaciones = signal<PresentacionDto[]>([]);

  readonly searchTerm = signal('');

  // Modal state
  readonly showModal = signal(false);
  readonly showPresentacionesModal = signal(false);
  readonly editingMedicamento = signal<MedicamentoDto | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // Presentacion form state
  readonly savingPresentacion = signal(false);
  readonly presentacionFormError = signal<string | null>(null);
  readonly showCreatePresentacionForm = signal(false);
  readonly editingPresentacion = signal<PresentacionDto | null>(null);

  readonly formData = {
    nombre: '',
    principioActivo: '',
    concentracion: '',
    presentacionId: '',
  };

  readonly presentacionFormData = {
    nombre: '',
  };

  readonly medicamentosFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.medicamentos();

    return this.medicamentos().filter((med) => {
      const nombre = med.nombre.toLowerCase();
      const principio = med.principioActivo.toLowerCase();
      const presentacion = med.presentacion.nombre.toLowerCase();
      return nombre.includes(term) || principio.includes(term) || presentacion.includes(term);
    });
  });

  readonly principiosActivosUnicos = computed(() => {
    const principios = this.medicamentos().map((m) => m.principioActivo.toLowerCase());
    return new Set(principios).size;
  });

  constructor() {
    this.loadMedicamentos();
    this.loadPresentaciones();
  }

  async loadMedicamentos(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const medicamentos = await this.medicamentosService.getAllMedicamentos();
      this.medicamentos.set(medicamentos);
    } catch (err: unknown) {
      this.error.set('Error al cargar los medicamentos');
      console.error('Error loading medicamentos:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async loadPresentaciones(): Promise<void> {
    try {
      const presentaciones = await this.medicamentosService.getAllPresentaciones();
      this.presentaciones.set(presentaciones);
    } catch (err) {
      console.error('Error loading presentaciones:', err);
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  getInitials(nombre: string): string {
    return this.medicamentosService.getInitials(nombre);
  }

  openCreateModal(): void {
    this.editingMedicamento.set(null);
    this.resetForm();
    this.showModal.set(true);
    this.formError.set(null);
  }

  openEditModal(medicamento: MedicamentoDto): void {
    this.editingMedicamento.set(medicamento);
    this.formData.nombre = medicamento.nombre;
    this.formData.principioActivo = medicamento.principioActivo;
    this.formData.concentracion = medicamento.concentracion || '';
    this.formData.presentacionId = medicamento.presentacion.id.toString();
    this.showModal.set(true);
    this.formError.set(null);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingMedicamento.set(null);
    this.resetForm();
    this.formError.set(null);
  }

  resetForm(): void {
    this.formData.nombre = '';
    this.formData.principioActivo = '';
    this.formData.concentracion = '';
    this.formData.presentacionId = '';
  }

  async saveMedicamento(): Promise<void> {
    // Validaciones
    if (!this.formData.nombre.trim()) {
      this.formError.set('El nombre es obligatorio');
      return;
    }
    if (!this.formData.principioActivo.trim()) {
      this.formError.set('El principio activo es obligatorio');
      return;
    }
    if (!this.formData.presentacionId) {
      this.formError.set('La presentación es obligatoria');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    try {
      const data: CreateMedicamentoDto = {
        nombre: this.formData.nombre.trim(),
        principioActivo: this.formData.principioActivo.trim(),
        concentracion: this.formData.concentracion.trim() || undefined,
        presentacionId: parseInt(this.formData.presentacionId),
      };

      if (this.editingMedicamento()) {
        await this.medicamentosService.updateMedicamento(this.editingMedicamento()!.id, data);
      } else {
        await this.medicamentosService.createMedicamento(data);
      }

      this.closeModal();
      await this.loadMedicamentos();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el medicamento';
      this.formError.set(errorMsg);
      console.error('Error saving medicamento:', err);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteMedicamento(medicamento: MedicamentoDto): Promise<void> {
    if (!confirm(`¿Estás seguro de eliminar el medicamento "${medicamento.nombre}"?`)) {
      return;
    }

    try {
      const success = await this.medicamentosService.deleteMedicamento(medicamento.id);
      if (success) {
        await this.loadMedicamentos();
      } else {
        alert('No se pudo eliminar el medicamento');
      }
    } catch (err) {
      console.error('Error deleting medicamento:', err);
      alert('Error al eliminar el medicamento');
    }
  }

  openPresentacionesModal(): void {
    this.showPresentacionesModal.set(true);
    this.showCreatePresentacionForm.set(false);
    this.editingPresentacion.set(null);
    this.presentacionFormError.set(null);
    this.presentacionFormData.nombre = '';
  }

  closePresentacionesModal(): void {
    this.showPresentacionesModal.set(false);
    this.showCreatePresentacionForm.set(false);
    this.editingPresentacion.set(null);
    this.presentacionFormError.set(null);
  }

  openCreatePresentacionForm(): void {
    this.editingPresentacion.set(null);
    this.showCreatePresentacionForm.set(true);
    this.presentacionFormError.set(null);
    this.presentacionFormData.nombre = '';
  }

  openEditPresentacionForm(presentacion: PresentacionDto): void {
    this.editingPresentacion.set(presentacion);
    this.showCreatePresentacionForm.set(true);
    this.presentacionFormError.set(null);
    this.presentacionFormData.nombre = presentacion.nombre;
  }

  cancelCreatePresentacion(): void {
    this.showCreatePresentacionForm.set(false);
    this.editingPresentacion.set(null);
    this.presentacionFormError.set(null);
    this.presentacionFormData.nombre = '';
  }

  async savePresentacion(): Promise<void> {
    if (!this.presentacionFormData.nombre.trim()) {
      this.presentacionFormError.set('El nombre de la presentación es obligatorio');
      return;
    }

    this.savingPresentacion.set(true);
    this.presentacionFormError.set(null);

    try {
      const data: CreatePresentacionDto = {
        nombre: this.presentacionFormData.nombre.trim(),
      };

      if (this.editingPresentacion()) {
        await this.medicamentosService.updatePresentacion(this.editingPresentacion()!.id, data);
      } else {
        await this.medicamentosService.createPresentacion(data);
      }

      // Recargar presentaciones y cerrar formulario
      await this.loadPresentaciones();
      this.cancelCreatePresentacion();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar la presentación';
      this.presentacionFormError.set(errorMsg);
      console.error('Error saving presentacion:', err);
    } finally {
      this.savingPresentacion.set(false);
    }
  }

  async deletePresentacion(presentacion: PresentacionDto): Promise<void> {
    if (!confirm(`¿Estás seguro de eliminar la presentación "${presentacion.nombre}"?`)) {
      return;
    }

    try {
      const success = await this.medicamentosService.deletePresentacion(presentacion.id);
      if (success) {
        await this.loadPresentaciones();
      } else {
        alert('No se pudo eliminar la presentación');
      }
    } catch (err) {
      console.error('Error deleting presentacion:', err);
      alert('Error al eliminar la presentación');
    }
  }
}
