import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { CitaResponseDto } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CitasService } from '../../core/services/citas.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly citasService = inject(CitasService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.authService.user;
  readonly proximaCita = signal<CitaResponseDto | null>(null);
  readonly loadingCita = signal(false);

  // Estado para el manejo de la sala de espera
  readonly currentTime = signal(new Date());
  readonly citaCancelada = signal(false);

  // Computed properties para el estado de la sala
  readonly tiempoParaCita = computed(() => {
    const cita = this.proximaCita();
    if (!cita) return null;

    const ahora = this.currentTime();
    const horaCita = new Date(cita.fechaHoraInicio);
    return horaCita.getTime() - ahora.getTime();
  });

  readonly ingresarSalaVisible = computed(() => {
    const tiempo = this.tiempoParaCita();
    if (tiempo === null) return false;

    // Mostrar 5 minutos antes (300000 ms = 5 min) hasta 10 minutos después (600000 ms = 10 min)
    return tiempo <= 300000 && tiempo >= -600000;
  });

  readonly citaExpirada = computed(() => {
    const tiempo = this.tiempoParaCita();
    if (tiempo === null) return false;

    // Si pasaron más de 10 minutos después de la hora de cita
    return tiempo < -600000;
  });

  readonly mensajeBoton = computed(() => {
    if (this.citaCancelada()) return 'Cita cancelada';
    if (this.citaExpirada()) return 'Cita expirada';
    if (this.ingresarSalaVisible()) return 'Ingresar a Sala';

    const tiempo = this.tiempoParaCita();
    if (tiempo && tiempo > 300000) {
      const minutos = Math.floor(tiempo / 60000);
      return `Espera ${minutos} min para ingresar`;
    }

    return 'Ingresar a Sala';
  });

  readonly accionesRapidas = [
    {
      icon: 'historia',
      titulo: 'Historia Clínica',
      route: '/historia-clinica',
    },
    {
      icon: 'recetas',
      titulo: 'Mis Recetas',
      route: '/recetas',
    },
    {
      icon: 'documentos',
      titulo: 'Documentos',
      route: '/documentos',
    },
  ];

  constructor() {
    this.loadProximaCita();
    this.iniciarReloj();
  }

  async loadProximaCita(): Promise<void> {
    this.loadingCita.set(true);
    try {
      const citas = await this.citasService.getProximasCitas();
      // Get the first one (most recent)
      this.proximaCita.set(citas[0] || null);
    } catch {
      this.proximaCita.set(null);
    } finally {
      this.loadingCita.set(false);
    }
  }

  getNombrePaciente(): string {
    const nombreCompleto = this.user()?.nombreCompleto || 'Usuario';
    return nombreCompleto.split(' ')[0]; // Solo el primer nombre
  }

  // Format cita for display
  getMedicoNombre(): string {
    const cita = this.proximaCita();
    if (!cita) return '';
    return `Dr. ${cita.medico.nombre} ${cita.medico.apellido}`;
  }

  getEspecialidad(): string {
    const cita = this.proximaCita();
    return cita?.medico.especialidad || 'General';
  }

  getFecha(): Date | null {
    const cita = this.proximaCita();
    return cita ? new Date(cita.fechaHoraInicio) : null;
  }

  getHora(): string {
    const fecha = this.getFecha();
    if (!fecha) return '';
    return (
      fecha.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + 'h'
    );
  }

  ingresarCita(): void {
    const citaId = this.proximaCita()?.id;
    if (citaId) {
      this.router.navigate(['/citas', citaId]);
    }
  }

  agendarCita(): void {
    this.router.navigate(['/citas/agendar']);
  }

  // Inicia el reloj para actualizar el tiempo actual cada segundo
  private iniciarReloj(): void {
    const interval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.destroyRef.onDestroy(() => clearInterval(interval));
  }

  // Verifica si la cita debe cancelarse automáticamente
  private verificarCancelacionAutomatica(): void {
    if (this.citaExpirada() && !this.citaCancelada()) {
      this.citaCancelada.set(true);
      // Aquí podrías llamar a un servicio para cancelar la cita en el backend
      console.log('Cita cancelada automáticamente por tiempo expirado');
    }
  }

  // Efecto para verificar la cancelación automática
  private readonly cancelacionEffect = effect(() => {
    if (this.proximaCita()) {
      this.verificarCancelacionAutomatica();
    }
  });

  // Método para ver detalles de la cita (referenciado en el HTML)
  verDetalleCita(citaId: string): void {
    if (this.ingresarSalaVisible()) {
      this.router.navigate(['/citas', citaId]);
    }
  }

  // Método para ingresar a la sala de espera
  ingresarASala(): void {
    const cita = this.proximaCita();
    if (cita && this.ingresarSalaVisible()) {
      this.router.navigate(['/sala-espera', cita.id]);
    }
  }
}
