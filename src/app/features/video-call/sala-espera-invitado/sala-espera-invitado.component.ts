import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { ValidacionInvitadoDataDto } from '../../../core/models/video-call.models';
import { VideoCallService } from '../../../core/services/video-call.service';

@Component({
  selector: 'app-sala-espera-invitado',
  imports: [CommonModule],
  templateUrl: './sala-espera-invitado.component.html',
  styleUrl: './sala-espera-invitado.component.scss',
})
export class SalaEsperaInvitadoComponent {
  private readonly videoCallService = inject(VideoCallService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // =====================================
  // STATE
  // =====================================
  guestCode = signal<string | null>(null);
  validationData = signal<ValidacionInvitadoDataDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // WebRTC state from service
  localStream = computed(() => this.videoCallService.localStream());
  isAudioEnabled = computed(() => this.videoCallService.isAudioEnabled());
  isVideoEnabled = computed(() => this.videoCallService.isVideoEnabled());
  connectionState = computed(() => this.videoCallService.connectionState());

  // UI state
  timeInWaiting = signal(0);
  waitingTimer: any = null;
  isValidCode = signal(false);

  // =====================================
  // COMPUTED
  // =====================================
  waitingMessage = computed(() => {
    const state = this.connectionState();
    const isValid = this.isValidCode();

    if (!isValid) {
      return 'Validando código de acceso...';
    }

    if (state === 'connecting') {
      return 'Conectando con la sala...';
    }

    if (state === 'connected') {
      return 'Esperando al médico y paciente...';
    }

    return 'Preparando conexión...';
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
      case 'error':
        return { text: 'Error', color: 'text-red-600', icon: 'disconnected' };
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

  guestInfo = computed(() => {
    const validation = this.validationData();
    if (!validation) return null;

    return {
      name: validation.nombreInvitado || 'Invitado',
      role: validation.rolInvitado || 'invitado',
      pacienteNombre: validation.nombrePaciente,
      medicoNombre: validation.nombreMedico,
      citaId: validation.citaId,
    };
  });

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Get guest code from route
    effect(() => {
      const code = this.activatedRoute.snapshot.paramMap.get('code');
      if (code) {
        this.guestCode.set(code);
        this.validateGuestCode(code);
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
  async validateGuestCode(code: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const validation = await this.videoCallService.validateGuestCode(code);
      this.validationData.set(validation);
      this.isValidCode.set(validation.valido);

      if (validation.valido) {
        // Start waiting room session
        await this.startWaitingRoom(validation.citaId, code);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Código de acceso inválido o expirado';
      this.error.set(errorMessage);
      this.isValidCode.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  async startWaitingRoom(citaId: number, guestCode: string): Promise<void> {
    try {
      this.loading.set(true);
      this.startWaitingTimer();

      // Get guest name from validation data
      const guestName = this.validationData()?.nombreInvitado || 'Invitado';

      // Join the video room as guest (this also initializes local stream)
      await this.videoCallService.joinRoom(citaId, guestCode, guestName);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al conectar con la sala';
      this.error.set(errorMessage);
      console.error('Error joining guest waiting room:', error);
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
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Error leaving waiting room:', error);
    }
  }

  goToVideoRoom(): void {
    const citaId = this.guestInfo()?.citaId;
    if (citaId) {
      this.router.navigate(['/guest', citaId, 'video-room']);
    }
  }

  async retryConnection(): Promise<void> {
    const code = this.guestCode();
    if (code) {
      await this.validateGuestCode(code);
    }
  }

  // =====================================
  // ERROR HANDLING
  // =====================================
  dismissError(): void {
    this.error.set(null);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could show a toast notification here
        console.log('Código copiado al portapapeles:', text);
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles:', err);
      });
  }
}
