import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  type ConfiguracionHospital,
  ConfiguracionService,
  type DiaFestivo,
} from '../../../core/services/configuracion.service';

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-6 lg:p-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900">
              Configuración del Sistema
            </h1>
            <p class="text-slate-600 mt-1">
              Administra los parámetros generales del hospital
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              (click)="guardarTodo()"
              [disabled]="guardando()"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              @if (guardando()) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Guardar Cambios
              }
            </button>
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

      <!-- Mensaje de éxito -->
      @if (mensajeExito()) {
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-green-800 font-medium">{{ mensajeExito() }}</p>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Horarios del Hospital -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900">Horarios del Hospital</h2>
              <p class="text-sm text-slate-500">Define los horarios de atención general</p>
            </div>
          </div>

          <div class="space-y-3">
            @for (horario of configHorarios(); track horario.diaSemana) {
              <div class="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="flex items-center gap-2 w-28">
                  <input
                    type="checkbox"
                    [(ngModel)]="horario.abierto"
                    [name]="'abierto_' + horario.diaSemana"
                    class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span class="font-medium text-slate-700">{{ getNombreDia(horario.diaSemana) }}</span>
                </div>
                
                @if (horario.abierto) {
                  <div class="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      [(ngModel)]="horario.horaApertura"
                      [name]="'apertura_' + horario.diaSemana"
                      class="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span class="text-slate-400">-</span>
                    <input
                      type="time"
                      [(ngModel)]="horario.horaCierre"
                      [name]="'cierre_' + horario.diaSemana"
                      class="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                } @else {
                  <span class="text-sm text-slate-400 italic flex-1">Cerrado</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Configuración de Citas -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900">Configuración de Citas</h2>
              <p class="text-sm text-slate-500">Parámetros para agendamiento</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Duración de cada cita (minutos)</label>
              <input
                type="number"
                [(ngModel)]="configCitas().duracionCitaMinutos"
                name="duracionCita"
                min="15"
                max="120"
                step="5"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Máximo citas por día</label>
              <input
                type="number"
                [(ngModel)]="configCitas().maxCitasPorDia"
                name="maxCitas"
                min="1"
                max="200"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Días de anticipación para agendar</label>
              <input
                type="number"
                [(ngModel)]="configCitas().diasAnticipacionAgendar"
                name="diasAnticipacion"
                min="1"
                max="365"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p class="text-xs text-slate-500 mt-1">Cuántos días adelante puede agendar un paciente</p>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                [(ngModel)]="configCitas().permitirCitasTelefonicas"
                name="citasTelefonicas"
                id="citasTelefonicas"
                class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label for="citasTelefonicas" class="text-sm text-slate-700">Permitir citas telefónicas</label>
            </div>
          </div>
        </div>

        <!-- Notificaciones -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900">Notificaciones</h2>
              <p class="text-sm text-slate-500">Canales de comunicación con pacientes</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span class="text-slate-700">Notificaciones por Email</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="configNotificaciones().notificacionesEmail"
                name="notifEmail"
                class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span class="text-slate-700">Notificaciones por SMS</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="configNotificaciones().notificacionesSMS"
                name="notifSMS"
                class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Tiempo de recordatorio (horas antes)</label>
              <input
                type="number"
                [(ngModel)]="configNotificaciones().tiempoRecordatorioHoras"
                name="tiempoRecordatorio"
                min="1"
                max="72"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p class="text-xs text-slate-500 mt-1">Cuántas horas antes enviar el recordatorio</p>
            </div>
          </div>
        </div>

        <!-- Días Festivos -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-900">Días Festivos</h2>
                <p class="text-sm text-slate-500">Fechas sin atención</p>
              </div>
            </div>
            <button
              (click)="openAddFestivoModal()"
              class="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              + Agregar
            </button>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            @if (festivos().length === 0) {
              <p class="text-sm text-slate-400 text-center py-4">No hay días festivos registrados</p>
            } @else {
              @for (festivo of festivos(); track festivo.id) {
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                    </svg>
                    <div>
                      <p class="font-medium text-slate-900">{{ formatFecha(festivo.fecha) }}</p>
                      <p class="text-xs text-slate-500">{{ festivo.descripcion }}</p>
                    </div>
                  </div>
                  <button
                    (click)="eliminarFestivo(festivo.id)"
                    class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              }
            }
          </div>
        </div>
      </div>

      <!-- Modal Agregar Festivo -->
      @if (showAddFestivoModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 class="text-lg font-bold text-slate-900 mb-4">Agregar Día Festivo</h3>
            
            <form (submit)="agregarFestivo(); $event.preventDefault()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  [(ngModel)]="nuevoFestivo.fecha"
                  name="fechaFestivo"
                  required
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  [(ngModel)]="nuevoFestivo.descripcion"
                  name="descFestivo"
                  placeholder="Ej: Navidad, Año Nuevo..."
                  required
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  (click)="closeAddFestivoModal()"
                  class="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium transition-colors"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Info del Backend -->
      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 class="font-medium text-blue-900">Configuración Local</h4>
            <p class="text-sm text-blue-700 mt-1">
              Actualmente las configuraciones se guardan localmente en el navegador. 
              Cuando el backend implemente los endpoints de configuración, se sincronizarán automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminConfiguracionComponent {
  private readonly configService = inject(ConfiguracionService);

  readonly guardando = signal(false);
  readonly mensajeExito = signal<string | null>(null);
  readonly showAddFestivoModal = signal(false);

  // Configuraciones separadas para edición
  configHorarios = signal(this.configService.configuracion().horarios);
  configCitas = signal({
    duracionCitaMinutos: this.configService.configuracion().duracionCitaMinutos,
    maxCitasPorDia: this.configService.configuracion().maxCitasPorDia,
    diasAnticipacionAgendar: this.configService.configuracion().diasAnticipacionAgendar,
    permitirCitasTelefonicas: this.configService.configuracion().permitirCitasTelefonicas,
  });
  configNotificaciones = signal({
    notificacionesEmail: this.configService.configuracion().notificacionesEmail,
    notificacionesSMS: this.configService.configuracion().notificacionesSMS,
    tiempoRecordatorioHoras: this.configService.configuracion().tiempoRecordatorioHoras,
  });

  festivos = signal<DiaFestivo[]>(this.configService.festivos());

  nuevoFestivo = {
    fecha: '',
    descripcion: '',
  };

  getNombreDia(diaSemana: number): string {
    return this.configService.getNombreDia(diaSemana);
  }

  formatFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async guardarTodo(): Promise<void> {
    this.guardando.set(true);

    try {
      const config: ConfiguracionHospital = {
        horarios: this.configHorarios(),
        duracionCitaMinutos: this.configCitas().duracionCitaMinutos,
        maxCitasPorDia: this.configCitas().maxCitasPorDia,
        diasAnticipacionAgendar: this.configCitas().diasAnticipacionAgendar,
        permitirCitasTelefonicas: this.configCitas().permitirCitasTelefonicas,
        notificacionesEmail: this.configNotificaciones().notificacionesEmail,
        notificacionesSMS: this.configNotificaciones().notificacionesSMS,
        tiempoRecordatorioHoras: this.configNotificaciones().tiempoRecordatorioHoras,
      };

      this.configService.guardarConfiguracion(config);
      this.configService.guardarFestivos(this.festivos());

      this.mensajeExito.set('Configuración guardada exitosamente');

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        this.mensajeExito.set(null);
      }, 3000);
    } catch (error) {
      console.error('Error guardando configuración:', error);
    } finally {
      this.guardando.set(false);
    }
  }

  openAddFestivoModal(): void {
    this.nuevoFestivo = { fecha: '', descripcion: '' };
    this.showAddFestivoModal.set(true);
  }

  closeAddFestivoModal(): void {
    this.showAddFestivoModal.set(false);
  }

  agregarFestivo(): void {
    if (!this.nuevoFestivo.fecha || !this.nuevoFestivo.descripcion) {
      return;
    }

    const festivo: DiaFestivo = {
      id: Date.now().toString(),
      fecha: this.nuevoFestivo.fecha,
      descripcion: this.nuevoFestivo.descripcion,
    };

    this.festivos.set([...this.festivos(), festivo]);
    this.closeAddFestivoModal();
  }

  eliminarFestivo(id: string): void {
    this.festivos.set(this.festivos().filter((f) => f.id !== id));
  }
}
