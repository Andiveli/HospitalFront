import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  type CompletarPerfilDto,
  CompletarPerfilService,
  type EstiloVidaDto,
  type GrupoSanguineoDto,
  type PaisDto,
} from '../../../core/services/completar-perfil.service';

@Component({
  selector: 'app-completar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-lg w-full">
        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
            <div class="flex items-center justify-center mb-4">
              <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h1 class="text-2xl font-bold text-center">Completa tu Perfil</h1>
            <p class="text-white/80 text-center mt-2">
              Para brindarte una mejor atención, necesitamos que completes tu información personal.
            </p>
          </div>

          @if (cargando()) {
            <!-- Loading -->
            <div class="flex justify-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          } @else {
            <!-- Form -->
            <form (submit)="guardar(); $event.preventDefault()" class="p-8 space-y-5">
              <!-- Teléfono -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Teléfono <span class="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telefono"
                  [(ngModel)]="telefono"
                  placeholder="Ej: 0996872426"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <!-- Fecha de Nacimiento -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Fecha de Nacimiento <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha"
                  [(ngModel)]="fecha"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <!-- País -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  País <span class="text-red-500">*</span>
                </label>
                <select
                  name="pais"
                  [(ngModel)]="pais"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar...</option>
                  @for (p of paises(); track p.id) {
                    <option [value]="p.nombre">{{ p.nombre }}</option>
                  }
                </select>
              </div>

              <!-- Residencia -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Ciudad de Residencia <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="residencia"
                  [(ngModel)]="residencia"
                  placeholder="Ej: Calle Alguna 45"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <!-- Tipo de Sangre -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Sangre <span class="text-red-500">*</span>
                </label>
                <select
                  name="sangre"
                  [(ngModel)]="sangre"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar...</option>
                  @for (s of gruposSanguineos(); track s.id) {
                    <option [value]="s.nombre">{{ s.nombre }}</option>
                  }
                </select>
              </div>

              <!-- Estilo de Vida -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Estilo de Vida <span class="text-red-500">*</span>
                </label>
                <select
                  name="estiloVida"
                  [(ngModel)]="estiloVida"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar...</option>
                  @for (e of estilosVida(); track e.id) {
                    <option [value]="e.nombre">{{ e.nombre }}</option>
                  }
                </select>
              </div>

              <!-- Error -->
              @if (error()) {
                <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {{ error() }}
                </div>
              }

              <!-- Submit -->
              <button
                type="submit"
                [disabled]="enviando() || !esValido()"
                class="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                @if (enviando()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                } @else {
                  Completar Perfil
                }
              </button>
            </form>
          }

          <!-- Footer -->
          <div class="px-8 pb-6">
            <p class="text-xs text-slate-500 text-center">
              Esta información es confidencial y será utilizada únicamente para tu atención médica.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CompletarPerfilComponent implements OnInit {
  private readonly perfilService = inject(CompletarPerfilService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Form fields
  telefono = '';
  fecha = '';
  pais = '';
  residencia = '';
  sangre = '';
  estiloVida = '';

  // State
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly cargando = signal(true);

  // Data from API
  readonly paises = signal<PaisDto[]>([]);
  readonly gruposSanguineos = signal<GrupoSanguineoDto[]>([]);
  readonly estilosVida = signal<EstiloVidaDto[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      // Cargar datos desde el backend
      const [paises, grupos, estilos] = await Promise.all([
        this.perfilService.getPaises().toPromise(),
        this.perfilService.getGruposSanguineos().toPromise(),
        this.perfilService.getEstilosVida().toPromise(),
      ]);

      this.paises.set(paises || []);
      this.gruposSanguineos.set(grupos || []);
      this.estilosVida.set(estilos || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
      this.error.set('Error al cargar los datos. Por favor recarga la página.');
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Verifica si el formulario es válido
   */
  esValido(): boolean {
    return !!(
      this.telefono.trim() &&
      this.fecha.trim() &&
      this.pais.trim() &&
      this.residencia.trim() &&
      this.sangre.trim() &&
      this.estiloVida.trim()
    );
  }

  /**
   * Guarda la información del perfil
   */
  async guardar(): Promise<void> {
    if (!this.esValido()) {
      this.error.set('Por favor completa todos los campos obligatorios');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const data: CompletarPerfilDto = {
      telefono: this.telefono.trim(),
      fecha: this.fecha,
      pais: this.pais,
      residencia: this.residencia.trim(),
      sangre: this.sangre,
      estiloVida: this.estiloVida,
    };

    try {
      await this.perfilService.addInfo(data).toPromise();

      // Recargar el perfil del usuario
      await this.authService.loadUserProfile();

      // Redirigir al dashboard
      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar la información';
      this.error.set(errorMsg);
      console.error('Error guardando perfil:', err);
    } finally {
      this.enviando.set(false);
    }
  }
}
