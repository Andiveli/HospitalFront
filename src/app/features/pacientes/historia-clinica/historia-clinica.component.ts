import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type { HistoriaClinicaResponseDto } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';

/**
 * Componente de Historia Clínica
 * Permite a pacientes ver su propia historia clínica completa
 * y a médicos ver la historia de pacientes que han atendido
 */
@Component({
  selector: 'app-historia-clinica',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './historia-clinica.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HistoriaClinicaComponent {
  private readonly historiaService = inject(HistoriaClinicaService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Input para cuando el médico ve la historia de un paciente específico (viene como string de la URL)
  readonly pacienteIdParam = input<string>();

  // Computed para convertir el string a number
  readonly pacienteId = computed(() => {
    const param = this.pacienteIdParam();
    if (!param) return undefined;
    const id = parseInt(param, 10);
    return isNaN(id) ? undefined : id;
  });

  // State
  readonly historia = signal<HistoriaClinicaResponseDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<'resumen' | 'citas' | 'enfermedades' | 'documentos'>('resumen');

  // Computed
  readonly edad = computed(() => {
    const paciente = this.historia()?.paciente;
    if (!paciente?.fechaNacimiento) return null;
    return this.historiaService.calcularEdad(paciente.fechaNacimiento);
  });

  readonly historiaExiste = computed(() => {
    const h = this.historia();
    return h !== null && h.existe !== false && h.id !== undefined;
  });

  readonly historiaNoExisteMessage = computed(() => {
    const h = this.historia();
    if (h && h.existe === false) {
      return h.message ?? 'El paciente no tiene historia clínica registrada.';
    }
    return null;
  });

  readonly puedeVolver = computed(() => {
    // Si viene de una cita médica (médico viendo historia de paciente)
    return this.router.url.includes('/doctor/historia-clinica');
  });

  constructor() {
    // Cargar historia cuando se inicializa el componente
    effect(() => {
      this.cargarHistoria();
    });
  }

  async cargarHistoria(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      let data: HistoriaClinicaResponseDto;

      // Determinar qué endpoint usar según el rol y el contexto
      const isDoctor = this.authService.isDoctor();
      const isPatient = this.authService.isPatient();
      const targetPacienteId = this.pacienteId();

      if (isDoctor && targetPacienteId) {
        // Médico viendo la historia de un paciente específico
        data = await this.historiaService.getHistoriaClinicaByPacienteId(targetPacienteId);
      } else if (isPatient) {
        // Paciente viendo su propia historia
        data = await this.historiaService.getMiHistoriaClinica();
      } else if (targetPacienteId) {
        // Fallback: usar endpoint flexible si hay ID pero no se detectó rol específico
        data = await this.historiaService.getHistoriaClinica(targetPacienteId);
      } else {
        this.error.set('No se pudo identificar al paciente');
        return;
      }

      this.historia.set(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar la historia clínica';
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  setTab(tab: 'resumen' | 'citas' | 'enfermedades' | 'documentos'): void {
    this.activeTab.set(tab);
  }

  formatFecha(fecha: string): string {
    return this.historiaService.formatFecha(fecha);
  }

  formatFechaHora(fecha: string): string {
    return this.historiaService.formatFechaHora(fecha);
  }

  getDocumentIcon(tipo: string): string {
    return this.historiaService.getDocumentIcon(tipo);
  }

  volver(): void {
    if (this.puedeVolver()) {
      // Si es médico volviendo de ver historia de paciente, ir atrás
      history.back();
    } else {
      // Si es paciente, ir al dashboard
      this.router.navigate(['/dashboard']);
    }
  }
}
