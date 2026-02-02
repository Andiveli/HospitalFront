import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { CitaDetalladaResponseDto } from '../../../core/models/citas.models';

import { AuthService } from '../../../core/services/auth.service';
import { CitasService } from '../../../core/services/citas.service';
import { VideoCallService } from '../../../core/services/video-call.service';

// Participant status constant
const PARTICIPANT_STATUS = {
  EN_SALA_ESPERA: 'en_sala_espera',
  CONECTADO: 'conectado',
  DESCONECTADO: 'desconectado',
  NO_INVITADO: 'no_invitado',
} as const;

type ParticipantStatus = (typeof PARTICIPANT_STATUS)[keyof typeof PARTICIPANT_STATUS];

// Consultation status types
const CONSULTA_STATUS = {
  ESPERANDO_PARTICIPANTES: 'esperando_participantes',
  LISTA_PARA_INICIAR: 'lista_para_iniciar',
  EN_CURSO: 'en_curso',
  FINALIZADA: 'finalizada',
} as const;

type ConsultaStatus = (typeof CONSULTA_STATUS)[keyof typeof CONSULTA_STATUS];

interface ParticipantCardInfo {
  nombre: string;
  tipo: 'paciente' | 'acompanante';
  status: ParticipantStatus;
  statusLabel: string;
}

@Component({
  selector: 'app-panel-consulta-medico',
  imports: [CommonModule],
  templateUrl: './panel-consulta-medico.component.html',
  styleUrl: './panel-consulta-medico.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelConsultaMedicoComponent {
  private readonly videoCallService = inject(VideoCallService);
  private readonly citasService = inject(CitasService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // =====================================
  // STATE
  // =====================================
  cita = signal<CitaDetalladaResponseDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  startingCall = signal(false);

  // User info
  readonly user = this.authService.user;
  readonly doctorName = computed(() => {
    const userData = this.user();
    return userData?.nombreCompleto || 'Doctor';
  });

  // WebRTC state from service
  participants = computed(() => this.videoCallService.participants());
  connectionState = computed(() => this.videoCallService.connectionState());

  // =====================================
  // COMPUTED: Participants
  // =====================================
  pacienteInfo = computed((): ParticipantCardInfo => {
    const citaData = this.cita();
    const participants = this.participants();

    if (!citaData) {
      return {
        nombre: 'Cargando...',
        tipo: 'paciente',
        status: PARTICIPANT_STATUS.DESCONECTADO,
        statusLabel: 'Desconectado',
      };
    }

    const pacienteEnSala = participants.find((p) => p.role === 'patient');

    return {
      nombre: `${citaData.paciente.nombre} ${citaData.paciente.apellido}`,
      tipo: 'paciente',
      status: pacienteEnSala ? PARTICIPANT_STATUS.EN_SALA_ESPERA : PARTICIPANT_STATUS.DESCONECTADO,
      statusLabel: pacienteEnSala ? 'En sala de espera' : 'Desconectado',
    };
  });

  acompananteInfo = computed((): ParticipantCardInfo => {
    const participants = this.participants();
    const acompanante = participants.find((p) => p.role === 'guest');

    if (acompanante) {
      return {
        nombre: acompanante.name || 'Acompañante',
        tipo: 'acompanante',
        status: PARTICIPANT_STATUS.EN_SALA_ESPERA,
        statusLabel: 'En sala de espera',
      };
    }

    return {
      nombre: 'Sin acompañante',
      tipo: 'acompanante',
      status: PARTICIPANT_STATUS.NO_INVITADO,
      statusLabel: 'No invitado',
    };
  });

  // =====================================
  // COMPUTED: Consultation Status
  // =====================================
  consultaStatus = computed((): ConsultaStatus => {
    const paciente = this.pacienteInfo();

    if (paciente.status === PARTICIPANT_STATUS.EN_SALA_ESPERA) {
      return CONSULTA_STATUS.LISTA_PARA_INICIAR;
    }

    return CONSULTA_STATUS.ESPERANDO_PARTICIPANTES;
  });

  consultaStatusLabel = computed(() => {
    const status = this.consultaStatus();

    switch (status) {
      case CONSULTA_STATUS.LISTA_PARA_INICIAR:
        return 'Lista para iniciar';
      case CONSULTA_STATUS.EN_CURSO:
        return 'En curso';
      case CONSULTA_STATUS.FINALIZADA:
        return 'Finalizada';
      default:
        return 'Esperando participantes';
    }
  });

  canStartCall = computed(() => {
    const paciente = this.pacienteInfo();
    return paciente.status === PARTICIPANT_STATUS.EN_SALA_ESPERA;
  });

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Load cita data from route
    effect(() => {
      const citaIdStr = this.activatedRoute.snapshot.paramMap.get('id');
      if (citaIdStr) {
        this.loadCitaData(parseInt(citaIdStr, 10));
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      // Cleanup if needed
    });
  }

  // =====================================
  // METHODS
  // =====================================
  async loadCitaData(citaId: number): Promise<void> {
    try {
      this.loading.set(true);
      const cita = await this.citasService.getCitaDetalleMedico(citaId);
      this.cita.set(cita);

      // Connect to the waiting room to monitor participants
      await this.connectToRoom(citaId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cargar información de la consulta';
      this.error.set(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  async connectToRoom(citaId: number): Promise<void> {
    try {
      // Monitor room without activating camera (just to see who's waiting)
      await this.videoCallService.monitorRoom(citaId);
    } catch (error: unknown) {
      console.error('Error connecting to room:', error);
      // Don't set error here, as the room might not be created yet
    }
  }

  async startConsultation(): Promise<void> {
    const citaId = this.cita()?.id;
    if (!citaId) return;

    try {
      this.startingCall.set(true);

      // Join the video call room (this initializes stream too)
      await this.videoCallService.joinRoom(citaId);

      // Navigate to video room
      this.router.navigate(['/doctor/videollamada', citaId]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar la consulta';
      this.error.set(errorMessage);
    } finally {
      this.startingCall.set(false);
    }
  }

  refreshParticipants(): void {
    const citaId = this.cita()?.id;
    if (citaId) {
      this.connectToRoom(citaId);
    }
  }

  goBack(): void {
    this.router.navigate(['/citas/medico']);
  }

  dismissError(): void {
    this.error.set(null);
  }

  // =====================================
  // UI HELPERS
  // =====================================
  getStatusColor(status: ParticipantStatus): string {
    switch (status) {
      case PARTICIPANT_STATUS.EN_SALA_ESPERA:
        return 'text-green-600 bg-green-50';
      case PARTICIPANT_STATUS.CONECTADO:
        return 'text-blue-600 bg-blue-50';
      case PARTICIPANT_STATUS.DESCONECTADO:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  }

  getStatusDotColor(status: ParticipantStatus): string {
    switch (status) {
      case PARTICIPANT_STATUS.EN_SALA_ESPERA:
        return 'bg-green-500';
      case PARTICIPANT_STATUS.CONECTADO:
        return 'bg-blue-500';
      case PARTICIPANT_STATUS.DESCONECTADO:
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }
}
