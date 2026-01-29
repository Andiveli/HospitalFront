import { Component, signal, inject, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { VideoCallService } from '../../../core/services/video-call.service';
import { CitaResponseDto } from '../../../core/models/citas.models';
import { CitasService } from '../../../core/services/citas.service';

@Component({
  selector: 'app-sala-espera-paciente',
  imports: [CommonModule],
  templateUrl: './sala-espera-paciente.component.html',
  styleUrl: './sala-espera-paciente.component.scss',
})
export class SalaEsperaPacienteComponent {
  private readonly videoCallService = inject(VideoCallService);
  private readonly citasService = inject(CitasService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // =====================================
  // STATE
  // =====================================
  cita = signal<CitaResponseDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // WebRTC state from service
  localStream = computed(() => this.videoCallService.localStream());
  isAudioEnabled = computed(() => this.videoCallService.isAudioEnabled());
  isVideoEnabled = computed(() => this.videoCallService.isVideoEnabled());
  connectionState = computed(() => this.videoCallService.connectionState());
  participants = computed(() => this.videoCallService.participants());

  // UI state
  medicoConnected = signal(false);
  esperandoMedico = signal(true);
  timeInWaiting = signal(0);
  waitingTimer: any = null;

  // =====================================
  // COMPUTED
  // =====================================
  waitingMessage = computed(() => {
    const state = this.connectionState();
    const medicoConnected = this.medicoConnected();

    if (state === 'connecting') {
      return 'Conectando con la sala de videollamada...';
    }

    if (state === 'connected' && medicoConnected) {
      return '¡Médico conectado! Iniciando videollamada...';
    }

    if (state === 'connected') {
      return 'Esperando al médico...';
    }

    return 'Preparando sala de espera...';
  });

  connectionStatus = computed(() => {
    const state = this.connectionState();
    const hasStream = !!this.localStream();

    switch (state) {
      case 'connecting':
        return { text: 'Conectando...', color: 'text-amber-600', icon: 'connecting' };
      case 'connected':
        return hasStream
          ? { text: 'Listo', color: 'text-green-600', icon: 'ready' }
          : { text: 'Configurando...', color: 'text-blue-600', icon: 'configuring' };
      case 'reconnecting':
        return { text: 'Reconectando...', color: 'text-orange-600', icon: 'reconnecting' };
      default:
        return { text: 'Desconectado', color: 'text-red-600', icon: 'disconnected' };
    }
  });

  formattedWaitingTime = computed(() => {
    const seconds = this.timeInWaiting();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `0:${remainingSeconds.toString().padStart(2, '0')}`;
  });

  medicoNombre = computed(() => {
    const citaData = this.cita();
    if (!citaData) return 'Médico';
    return `Dr. ${citaData.medico.nombre} ${citaData.medico.apellido}`;
  });

  especialidad = computed(() => {
    const citaData = this.cita();
    return citaData?.medico.especialidad || 'Especialidad';
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

    // Listen for participant changes
    effect(() => {
      const participants = this.participants();
      const hasDoctor = participants.some((p) => p.role === 'doctor');
      this.medicoConnected.set(hasDoctor);

      if (hasDoctor) {
        this.esperandoMedico.set(false);
        this.stopWaitingTimer();
        // Auto-redirect to main video room after 2 seconds
        setTimeout(() => {
          this.goToVideoRoom();
        }, 2000);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.stopWaitingTimer();
    });
  }

  // =====================================
  // METHODS
  // =====================================
  async loadCitaData(citaId: number): Promise<void> {
    try {
      this.loading.set(true);
      const cita = await this.citasService.getCitaDetalle(citaId);
      this.cita.set(cita);

      // Start waiting room session
      await this.startWaitingRoom(citaId);
    } catch (error: any) {
      this.error.set(error?.message || 'Error al cargar información de la cita');
    } finally {
      this.loading.set(false);
    }
  }

  async startWaitingRoom(citaId: number): Promise<void> {
    try {
      this.loading.set(true);
      this.startWaitingTimer();

      // Join the video room in waiting mode
      await this.videoCallService.joinRoom(citaId);

      // Initialize local stream for preview
      await this.videoCallService.initializeLocalStream({
        enableVideo: true,
        enableAudio: true,
      });
    } catch (error: any) {
      this.error.set(error?.message || 'Error al conectar con la sala de espera');
      console.error('Error joining waiting room:', error);
    } finally {
      this.loading.set(false);
    }
  }

  startWaitingTimer(): void {
    this.timeInWaiting.set(0);
    this.waitingTimer = setInterval(() => {
      this.timeInWaiting.update((time) => time + 1);
    }, 1000);
  }

  stopWaitingTimer(): void {
    if (this.waitingTimer) {
      clearInterval(this.waitingTimer);
      this.waitingTimer = null;
    }
  }

  // =====================================
  // MEDIA CONTROLS
  // =====================================
  toggleAudio(): void {
    this.videoCallService.toggleAudio();
  }

  toggleVideo(): void {
    this.videoCallService.toggleVideo();
  }

  // =====================================
  // NAVIGATION
  // =====================================
  async leaveWaitingRoom(): Promise<void> {
    try {
      await this.videoCallService.leaveRoom();
      this.router.navigate(['/citas']);
    } catch (error: any) {
      console.error('Error leaving waiting room:', error);
    }
  }

  goToVideoRoom(): void {
    const citaId = this.cita()?.id;
    if (citaId) {
      this.router.navigate(['/citas', citaId, 'video-room']);
    }
  }

  async retryConnection(): Promise<void> {
    const citaId = this.cita()?.id;
    if (citaId) {
      await this.startWaitingRoom(citaId);
    }
  }

  // =====================================
  // ERROR HANDLING
  // =====================================
  dismissError(): void {
    this.error.set(null);
  }
}

