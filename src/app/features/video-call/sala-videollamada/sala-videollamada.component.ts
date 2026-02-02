import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  ChatMessageDto,
  ParticipantInfoDto,
  ParticipantRole,
} from '../../../core/models/video-call.models';
import { AuthService } from '../../../core/services/auth.service';
import { VideoCallService } from '../../../core/services/video-call.service';
import { SrcObjectDirective } from '../../../shared/directives/src-object.directive';

@Component({
  selector: 'app-sala-videollamada',
  imports: [CommonModule, FormsModule, SrcObjectDirective],
  templateUrl: './sala-videollamada.component.html',
  styleUrl: './sala-videollamada.component.scss',
})
export class SalaVideollamadaComponent {
  private readonly authService = inject(AuthService);
  private readonly videoCallService = inject(VideoCallService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // =====================================
  // STATE
  // =====================================
  citaId = signal<number | null>(null);
  isGuest = signal(false);
  guestCode = signal<string | null>(null);

  loading = signal(true);
  error = signal<string | null>(null);

  // WebRTC state from service
  localStream = computed(() => this.videoCallService.localStream());
  participants = computed(() => this.videoCallService.participants());
  isAudioEnabled = computed(() => this.videoCallService.isAudioEnabled());
  isVideoEnabled = computed(() => this.videoCallService.isVideoEnabled());
  connectionState = computed(() => this.videoCallService.connectionState());
  callDuration = computed(() => this.videoCallService.formattedCallDuration());

  // Chat state
  chatMessages = computed(() => this.videoCallService.chatMessages());
  newMessage = signal('');
  showChat = signal(false);

  // Session time warnings from service
  timeWarning = computed(() => this.videoCallService.timeWarning());
  sessionEnded = computed(() => this.videoCallService.sessionEnded());
  sessionEndReason = computed(() => this.videoCallService.sessionEndReason());
  isDoctor = computed(() => this.authService.isDoctor());

  // =====================================
  // COMPUTED - Participant organization
  // =====================================

  // Get current user role
  myRole = computed((): ParticipantRole => {
    if (this.isGuest()) return 'guest';
    if (this.authService.isDoctor()) return 'doctor';
    if (this.authService.isPatient()) return 'patient';
    // Fallback to patient if role cannot be determined
    return 'patient';
  });

  // Remote participants (excluding self)
  remoteParticipants = computed(() => {
    return this.participants().filter((p) => p.id !== 'local');
  });

  // Doctor participant
  doctorParticipant = computed(() => {
    if (this.myRole() === 'doctor') {
      // We are the doctor, show local
      const stream = this.localStream();
      if (!stream) return null;
      return {
        id: 'local',
        name: 'Tú',
        role: 'doctor' as ParticipantRole,
        isVideoEnabled: this.isVideoEnabled(),
        isAudioEnabled: this.isAudioEnabled(),
        isSpeaking: false,
        joinedAt: new Date().toISOString(),
        mediaStream: stream,
      };
    }
    return this.remoteParticipants().find((p) => p.role === 'doctor') || null;
  });

  // Patient participant (if we're the doctor or guest)
  patientParticipant = computed(() => {
    if (this.myRole() === 'patient') {
      // We are the patient, show local
      const stream = this.localStream();
      if (!stream) return null;
      return {
        id: 'local',
        name: 'Tú',
        role: 'patient' as ParticipantRole,
        isVideoEnabled: this.isVideoEnabled(),
        isAudioEnabled: this.isAudioEnabled(),
        isSpeaking: false,
        joinedAt: new Date().toISOString(),
        mediaStream: stream,
      };
    }
    return this.remoteParticipants().find((p) => p.role === 'patient') || null;
  });

  // Guest participant
  guestParticipant = computed(() => {
    if (this.myRole() === 'guest') {
      // We are the guest, show local
      const stream = this.localStream();
      if (!stream) return null;
      return {
        id: 'local',
        name: 'Tú',
        role: 'guest' as ParticipantRole,
        isVideoEnabled: this.isVideoEnabled(),
        isAudioEnabled: this.isAudioEnabled(),
        isSpeaking: false,
        joinedAt: new Date().toISOString(),
        mediaStream: stream,
      };
    }
    return this.remoteParticipants().find((p) => p.role === 'guest') || null;
  });

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Parse route parameters
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    const codeParam = this.activatedRoute.snapshot.paramMap.get('code');

    if (codeParam) {
      this.isGuest.set(true);
      this.guestCode.set(codeParam);
    }

    if (idParam) {
      this.citaId.set(parseInt(idParam, 10));
    }

    // Listen for chat messages to scroll to bottom
    this.videoCallService.chatMessage$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      // Scroll chat to bottom when new message arrives
      this.scrollChatToBottom();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.endCall();
    });
  }

  async ngOnInit(): Promise<void> {
    const citaId = this.citaId();
    if (citaId) {
      await this.joinVideoRoom(citaId);
    } else {
      this.error.set('No se encontró el ID de la cita');
      this.loading.set(false);
    }
  }

  // =====================================
  // METHODS
  // =====================================
  async joinVideoRoom(citaId: number): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      await this.videoCallService.joinRoom(citaId, this.guestCode() || undefined);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al unirse a la videollamada';
      this.error.set(errorMessage);
      console.error('Error joining video room:', error);
    } finally {
      this.loading.set(false);
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

  toggleChat(): void {
    this.showChat.update((show) => !show);
  }

  endCall(): void {
    this.videoCallService.leaveRoom();
    if (this.isGuest()) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/citas']);
    }
  }

  // =====================================
  // CHAT METHODS
  // =====================================
  sendMessage(): void {
    const message = this.newMessage().trim();
    if (message) {
      this.videoCallService.sendChatMessage(message);
      this.newMessage.set('');
    }
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollChatToBottom(): void {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 50);
  }

  // =====================================
  // UI HELPERS
  // =====================================
  getParticipantDisplayName(participant: ParticipantInfoDto | null, fallback: string): string {
    if (!participant) return fallback;
    if (participant.id === 'local') return 'Tú';
    return participant.name || fallback;
  }

  getRoleName(role: ParticipantRole): string {
    const roleNames: Record<ParticipantRole, string> = {
      doctor: 'Médico',
      patient: 'Paciente',
      guest: 'Invitado',
      companion: 'Acompañante',
      specialist: 'Especialista',
      translator: 'Traductor',
    };
    return roleNames[role] || role;
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  formatTimeRemaining(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  isMyMessage(message: ChatMessageDto): boolean {
    return message.fromParticipantId === 'local';
  }

  // =====================================
  // ERROR HANDLING
  // =====================================
  dismissError(): void {
    this.error.set(null);
  }

  retryConnection(): void {
    const citaId = this.citaId();
    if (citaId) {
      this.joinVideoRoom(citaId);
    }
  }
}
