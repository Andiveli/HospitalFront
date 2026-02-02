import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { CitaResponseDto } from '../../../core/models/citas.models';
import type {
  GenerarInvitacionDto,
  LinkInvitacionDataDto,
} from '../../../core/models/video-call.models';
import { AuthService } from '../../../core/services/auth.service';
import { CitasService } from '../../../core/services/citas.service';
import { VideoCallService } from '../../../core/services/video-call.service';

@Component({
  selector: 'app-sala-espera-paciente',
  imports: [CommonModule, FormsModule],
  templateUrl: './sala-espera-paciente.component.html',
  styleUrl: './sala-espera-paciente.component.scss',
})
export class SalaEsperaPacienteComponent {
  private readonly videoCallService = inject(VideoCallService);
  private readonly citasService = inject(CitasService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // =====================================
  // STATE
  // =====================================
  cita = signal<CitaResponseDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // User info
  readonly user = this.authService.user;
  readonly userName = computed(() => {
    const userData = this.user();
    return userData?.nombreCompleto?.split(' ')[0] || 'Paciente';
  });

  // WebRTC state from service
  localStream = computed(() => this.videoCallService.localStream());
  isAudioEnabled = computed(() => this.videoCallService.isAudioEnabled());
  isVideoEnabled = computed(() => this.videoCallService.isVideoEnabled());
  connectionState = computed(() => this.videoCallService.connectionState());
  participants = computed(() => this.videoCallService.participants());

  // Countdown state
  countdownMinutes = signal(5);
  countdownSeconds = signal(0);
  countdownTimer: ReturnType<typeof setInterval> | null = null;

  // Modal states
  showInviteModal = signal(false);
  inviteLoading = signal(false);
  inviteError = signal<string | null>(null);
  inviteSuccess = signal<LinkInvitacionDataDto | null>(null);

  // Invite form
  guestName = signal('');
  guestRole = signal<'acompanante' | 'invitado'>('acompanante');

  // UI state
  medicoConnected = signal(false);
  canJoin = signal(false);

  // =====================================
  // COMPUTED
  // =====================================
  medicoNombre = computed(() => {
    const citaData = this.cita();
    if (!citaData) return 'Médico';
    return `Dr. ${citaData.medico.nombre} ${citaData.medico.apellido}`;
  });

  especialidad = computed(() => {
    const citaData = this.cita();
    return citaData?.medico.especialidad || 'Especialidad';
  });

  formattedCountdown = computed(() => {
    const mins = this.countdownMinutes();
    const secs = this.countdownSeconds();
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        this.canJoin.set(true);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.stopCountdownTimer();
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

      // Calculate countdown based on appointment time
      this.calculateCountdown(cita.fechaHoraInicio);

      // Start waiting room session
      await this.startWaitingRoom(citaId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cargar información de la cita';
      this.error.set(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  calculateCountdown(fechaHoraInicio: string): void {
    const appointmentTime = new Date(fechaHoraInicio).getTime();
    const now = Date.now();
    const diff = appointmentTime - now;

    if (diff > 0) {
      const totalMinutes = Math.floor(diff / 60000);
      const minutes = Math.min(totalMinutes, 59);
      const seconds = Math.floor((diff % 60000) / 1000);

      this.countdownMinutes.set(minutes);
      this.countdownSeconds.set(seconds);
      this.startCountdownTimer();
    } else {
      // Appointment time has passed, can join immediately
      this.countdownMinutes.set(0);
      this.countdownSeconds.set(0);
      this.canJoin.set(true);
    }
  }

  startCountdownTimer(): void {
    this.countdownTimer = setInterval(() => {
      const mins = this.countdownMinutes();
      const secs = this.countdownSeconds();

      if (secs > 0) {
        this.countdownSeconds.set(secs - 1);
      } else if (mins > 0) {
        this.countdownMinutes.set(mins - 1);
        this.countdownSeconds.set(59);
      } else {
        // Countdown finished
        this.stopCountdownTimer();
        this.canJoin.set(true);
      }
    }, 1000);
  }

  stopCountdownTimer(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  async startWaitingRoom(citaId: number): Promise<void> {
    try {
      this.loading.set(true);

      // Join the video room (this also initializes local stream)
      await this.videoCallService.joinRoom(citaId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al conectar con la sala de espera';
      this.error.set(errorMessage);
      console.error('Error joining waiting room:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // =====================================
  // INVITE FAMILY MEMBER
  // =====================================
  openInviteModal(): void {
    this.showInviteModal.set(true);
    this.inviteError.set(null);
    this.inviteSuccess.set(null);
    this.guestName.set('');
    this.guestRole.set('acompanante');
  }

  closeInviteModal(): void {
    this.showInviteModal.set(false);
  }

  async sendInvitation(): Promise<void> {
    const citaId = this.cita()?.id;
    if (!citaId || !this.guestName().trim()) return;

    try {
      this.inviteLoading.set(true);
      this.inviteError.set(null);

      const invitationData: GenerarInvitacionDto = {
        nombreInvitado: this.guestName().trim(),
        rolInvitado: this.guestRole(),
      };

      const response = await this.videoCallService.createInvitation(citaId, invitationData);
      this.inviteSuccess.set(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar invitación';
      this.inviteError.set(errorMessage);
    } finally {
      this.inviteLoading.set(false);
    }
  }

  copyInviteLink(): void {
    const invitation = this.inviteSuccess();
    if (!invitation) return;

    // Use linkInvitacion if available, otherwise construct from codigoAcceso
    const url =
      invitation.linkInvitacion || `${window.location.origin}/invitado/${invitation.codigoAcceso}`;

    navigator.clipboard.writeText(url).then(() => {
      console.log('Link copiado al portapapeles:', url);
    });
  }

  // =====================================
  // REQUEST PHONE CALL
  // =====================================
  requestPhoneCall(): void {
    // This would trigger a request to the backend to change the appointment type
    // For now, just show an alert
    alert('Solicitud de atención telefónica enviada. El médico se comunicará contigo pronto.');
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
    } catch (error: unknown) {
      console.error('Error leaving waiting room:', error);
    }
  }

  joinVideoCall(): void {
    const citaId = this.cita()?.id;
    if (citaId) {
      this.router.navigate(['/videollamada', citaId]);
    }
  }

  // =====================================
  // ERROR HANDLING
  // =====================================
  dismissError(): void {
    this.error.set(null);
  }

  async retryConnection(): Promise<void> {
    const citaId = this.cita()?.id;
    if (citaId) {
      await this.startWaitingRoom(citaId);
    }
  }
}
