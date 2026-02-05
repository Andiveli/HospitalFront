import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { HistoriaClinicaResponseDto } from '../../../core/models';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';
import { type PacienteDto, PacientesService } from '../../../core/services/pacientes.service';

@Component({
  selector: 'app-admin-pacientes',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900">
              Gestión de Pacientes
            </h1>
            <p class="text-slate-600 mt-1">
              Administra los pacientes y sus historias clínicas
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
            <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Total Pacientes</p>
              <p class="text-2xl font-bold text-slate-900">{{ pacientes().length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Verificados</p>
              <p class="text-2xl font-bold text-slate-900">{{ pacientesVerificados() }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500">Con Historia Clínica</p>
              <p class="text-2xl font-bold text-slate-900">{{ pacientesConHistoria() }}</p>
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
            <p class="text-slate-600 font-medium">Cargando pacientes...</p>
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
              <h3 class="text-red-800 font-medium">Error al cargar los pacientes</h3>
              <p class="text-red-600 mt-1">{{ error() }}</p>
              <button
                (click)="loadPacientes()"
                class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && pacientesFiltrados().length === 0) {
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-700 mb-2">
            {{ searchTerm() ? 'No se encontraron pacientes' : 'No hay pacientes registrados' }}
          </h3>
          <p class="text-slate-500 mb-6">
            {{ searchTerm() 
              ? 'Intenta con otros términos de búsqueda' 
              : 'No hay pacientes verificados en el sistema' }}
          </p>
        </div>
      }

      <!-- Pacientes Table -->
      @if (!loading() && !error() && pacientesFiltrados().length > 0) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (paciente of pacientesFiltrados(); track paciente.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        @if (paciente.imageUrl) {
                          <img
                            [src]="paciente.imageUrl"
                            [alt]="getNombreCompleto(paciente)"
                            class="w-10 h-10 rounded-full object-cover"
                          />
                        } @else {
                          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                            {{ getInitials(paciente) }}
                          </div>
                        }
                        <div>
                          <p class="font-medium text-slate-900">{{ getNombreCompleto(paciente) }}</p>
                          <p class="text-sm text-slate-500">CI: {{ paciente.cedula }}</p>
                          @if (isMedico(paciente)) {
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 mt-1">
                              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              También es Médico
                            </span>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm text-slate-900">{{ paciente.email }}</p>
                      <p class="text-sm text-slate-500">{{ paciente.genero?.nombre || 'No especificado' }}</p>
                    </td>
                    <td class="px-6 py-4">
                      @if (paciente.verificado) {
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          Verificado
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                          </svg>
                          Pendiente
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm text-slate-600">{{ formatFechaCreacion(paciente.fechaCreacion) }}</p>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          (click)="verHistoriaClinica(paciente)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Ver Historia Clínica"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Historia
                        </button>
                        <button
                          (click)="verDetalles(paciente)"
                          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

      <!-- Historia Clinica Modal -->
      @if (showHistoriaModal() && pacienteSeleccionado()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                  {{ getInitials(pacienteSeleccionado()!) }}
                </div>
                <div>
                  <h2 class="text-lg font-bold text-slate-900">
                    Historia Clínica - {{ getNombreCompleto(pacienteSeleccionado()!) }}
                  </h2>
                  <p class="text-sm text-slate-500">CI: {{ pacienteSeleccionado()?.cedula }}</p>
                </div>
              </div>
              <button
                (click)="closeHistoriaModal()"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Content -->
            <div class="flex-1 overflow-y-auto p-6">
              @if (loadingHistoria()) {
                <div class="flex flex-col items-center justify-center py-12">
                  <div class="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                  <p class="text-slate-600 font-medium">Cargando historia clínica...</p>
                </div>
              } @else if (errorHistoria()) {
                <div class="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 class="text-red-800 font-medium">Error al cargar la historia clínica</h3>
                      <p class="text-red-600 mt-1">{{ errorHistoria() }}</p>
                    </div>
                  </div>
                </div>
              } @else if (historiaClinica()) {
                <div class="space-y-6">
                  <!-- Resumen -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <p class="text-sm font-medium text-emerald-600 mb-1">Total Citas</p>
                      <p class="text-2xl font-bold text-emerald-800">{{ historiaClinica()?.resumen?.totalCitas || 0 }}</p>
                    </div>
                    <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p class="text-sm font-medium text-blue-600 mb-1">Enfermedades</p>
                      <p class="text-2xl font-bold text-blue-800">{{ historiaClinica()?.resumen?.totalEnfermedades || 0 }}</p>
                    </div>
                    <div class="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <p class="text-sm font-medium text-purple-600 mb-1">Documentos</p>
                      <p class="text-2xl font-bold text-purple-800">{{ historiaClinica()?.resumen?.totalDocumentos || 0 }}</p>
                    </div>
                  </div>

                  <!-- Enfermedades -->
                  @if (historiaClinica()?.enfermedades && historiaClinica()!.enfermedades!.length > 0) {
                    <div>
                      <h3 class="text-lg font-semibold text-slate-900 mb-3">Enfermedades Registradas</h3>
                      <div class="space-y-2">
                        @for (enf of historiaClinica()!.enfermedades; track $index) {
                          <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div class="flex items-start justify-between">
                              <div>
                                <p class="font-medium text-slate-900">{{ enf.nombre }}</p>
                                <p class="text-sm text-slate-500">{{ enf.tipo }}</p>
                              </div>
                            </div>
                            @if (enf.observaciones) {
                              <p class="text-sm text-slate-600 mt-2">{{ enf.observaciones }}</p>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Citas Recientes -->
                  @if (historiaClinica()?.citas && historiaClinica()!.citas!.length > 0) {
                    <div>
                      <h3 class="text-lg font-semibold text-slate-900 mb-3">Citas Recientes</h3>
                      <div class="space-y-2">
                        @for (cita of historiaClinica()!.citas!.slice(0, 5); track cita.id) {
                          <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div class="flex items-start justify-between">
                              <div>
                                <p class="font-medium text-slate-900">{{ cita.fecha }}</p>
                                <p class="text-sm text-slate-500">Dr. {{ cita.medicoNombre }}</p>
                              </div>
                              <span 
                                [class]="cita.estado === 'atendida' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                                class="px-2 py-1 rounded-full text-xs font-medium"
                              >
                                {{ cita.estado }}
                              </span>
                            </div>
                            @if (cita.diagnostico) {
                              <p class="text-sm text-slate-600 mt-2">{{ cita.diagnostico }}</p>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- No hay datos -->
                  @if ((!historiaClinica()?.enfermedades || historiaClinica()!.enfermedades!.length === 0) && (!historiaClinica()?.citas || historiaClinica()!.citas!.length === 0)) {
                    <div class="text-center py-8">
                      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 class="text-lg font-semibold text-slate-700 mb-2">Sin registros</h3>
                      <p class="text-slate-500">Este paciente aún no tiene historia clínica registrada</p>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                (click)="closeHistoriaModal()"
                class="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
              <a
                [routerLink]="['/doctor/historia-clinica', pacienteSeleccionado()?.id]"
                class="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                Ver Historia Completa
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPacientesComponent {
  private readonly pacientesService = inject(PacientesService);
  private readonly historiaClinicaService = inject(HistoriaClinicaService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pacientes = signal<PacienteDto[]>([]);

  readonly searchTerm = signal('');

  // Modal state
  readonly showHistoriaModal = signal(false);
  readonly pacienteSeleccionado = signal<PacienteDto | null>(null);
  readonly loadingHistoria = signal(false);
  readonly errorHistoria = signal<string | null>(null);
  readonly historiaClinica = signal<HistoriaClinicaResponseDto | null>(null);

  readonly pacientesFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.pacientes();

    return this.pacientes().filter((paciente) => {
      const nombreCompleto = this.getNombreCompleto(paciente).toLowerCase();
      const cedula = paciente.cedula.toLowerCase();
      const email = paciente.email.toLowerCase();

      return nombreCompleto.includes(term) || cedula.includes(term) || email.includes(term);
    });
  });

  readonly pacientesVerificados = computed(() => {
    return this.pacientes().filter((p) => p.verificado).length;
  });

  readonly pacientesConHistoria = computed(() => {
    // Esto sería ideal obtener del backend, por ahora mostramos todos los verificados
    return this.pacientesVerificados();
  });

  constructor() {
    this.loadPacientes();
  }

  async loadPacientes(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('Cargando pacientes...');
      const pacientes = await this.pacientesService.getAllPacientes();
      console.log('Pacientes cargados:', pacientes.length);
      this.pacientes.set(pacientes);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar los pacientes';
      this.error.set(errorMsg);
      console.error('Error loading pacientes:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  clearFilters(): void {
    this.searchTerm.set('');
  }

  getNombreCompleto(paciente: PacienteDto): string {
    return this.pacientesService.getNombreCompleto(paciente);
  }

  getInitials(paciente: PacienteDto): string {
    return this.pacientesService.getInitials(paciente);
  }

  isMedico(paciente: PacienteDto): boolean {
    return this.pacientesService.isMedico(paciente);
  }

  formatFechaCreacion(fecha: string): string {
    return this.pacientesService.formatFechaCreacion(fecha);
  }

  async verHistoriaClinica(paciente: PacienteDto): Promise<void> {
    this.pacienteSeleccionado.set(paciente);
    this.showHistoriaModal.set(true);
    this.loadingHistoria.set(true);
    this.errorHistoria.set(null);
    this.historiaClinica.set(null);

    try {
      console.log('Cargando historia clínica para paciente:', paciente.id);
      const historia = await this.historiaClinicaService.getHistoriaClinicaByPacienteId(
        paciente.id
      );
      console.log('Historia clínica cargada:', historia);
      this.historiaClinica.set(historia);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar la historia clínica';
      this.errorHistoria.set(errorMsg);
      console.error('Error loading historia clinica:', err);
    } finally {
      this.loadingHistoria.set(false);
    }
  }

  closeHistoriaModal(): void {
    this.showHistoriaModal.set(false);
    this.pacienteSeleccionado.set(null);
    this.historiaClinica.set(null);
    this.errorHistoria.set(null);
  }

  verDetalles(paciente: PacienteDto): void {
    // Por ahora redirigimos a la historia clínica completa
    this.router.navigate(['/doctor/historia-clinica', paciente.id]);
  }
}
