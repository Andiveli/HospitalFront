import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  ChatMessageDto,
  ParticipantInfoDto,
  ParticipantRole,
} from '../../../core/models/video-call.models';
import { VideoCallService } from '../../../core/services/video-call.service';

@Component({
  selector: 'app-sala-videollamada',
  imports: [CommonModule, FormsModule],
  templateUrl: './sala-videollamada.component.html',
  styleUrl: './sala-videollamada.component.scss',
})
export class SalaVideollamadaComponent {
  private readonly videoCallService = inject(VideoCallService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  // =====================================
  // STATE
  // =====================================
  citaId = signal<number | null>(null);
  isGuest = signal(false);
  guestCode = signal<string | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);

  // WebRTC state from service
  localStream = computed(() => this.videoCallService.localStream());
  participants = computed(() => this.videoCallService.participants());
  isAudioEnabled = computed(() => this.videoCallService.isAudioEnabled());
  isVideoEnabled = computed(() => this.videoCallService.isVideoEnabled());
  isScreenSharing = computed(() => this.videoCallService.isScreenSharing());
  isRecording = computed(() => this.videoCallService.isRecording());
  connectionState = computed(() => this.videoCallService.connectionState());
  callDuration = computed(() => this.videoCallService.formattedCallDuration);

  // Chat state
  chatMessages = signal<ChatMessageDto[]>([]);
  newMessage = signal('');
  isChatExpanded = signal(true);

  // UI state
  selectedParticipant = signal<ParticipantInfoDto | null>(null);
  showParticipantInfo = signal(false);
  videoGridMode = signal<'grid' | 'speaker'>('grid');

  // =====================================
  // COMPUTED
  // =====================================
  allParticipants = computed(() => {
    const localStream = this.localStream();
    const localParticipant: ParticipantInfoDto = localStream
      ? {
          id: 'local',
          name: 'Tú',
          role: this.isGuest() ? 'guest' : 'patient',
          isVideoEnabled: this.isVideoEnabled(),
          isAudioEnabled: this.isAudioEnabled(),
          isSpeaking: false,
          joinedAt: new Date().toISOString(),
          mediaStream: localStream,
        }
      : (null as any);

    const remoteParticipants = this.participants();

    return localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants;
  });

  activeParticipants = computed(() => {
    return this.allParticipants().filter((p) => p.mediaStream);
  });

  dominantSpeaker = computed(() => {
    return this.allParticipants().find((p) => p.isSpeaking) || null;
  });

  isGridMode = computed(() => this.videoGridMode() === 'grid');

  unreadMessagesCount = computed(() => {
    return this.chatMessages().filter((msg) => !msg.isRead).length;
  });

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Get route parameters
    effect(() => {
      const idParam = this.activatedRoute.snapshot.paramMap.get('id');
      const codeParam = this.activatedRoute.snapshot.paramMap.get('code');

      if (codeParam) {
        // Guest access
        this.isGuest.set(true);
        this.guestCode.set(codeParam);
        if (idParam) {
          this.citaId.set(parseInt(idParam, 10));
        }
      } else if (idParam) {
        // Authenticated user access
        this.citaId.set(parseInt(idParam, 10));
      }
    });

    // Listen for chat messages
    this.videoCallService.chatMessages.subscribe((message) => {
      this.chatMessages.update((messages) => [...messages, message]);
    });

    // Listen for room events
    this.videoCallService.roomEvents.subscribe((event) => {
      this.handleRoomEvent(event);
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
    }
  }

  // =====================================
  // METHODS
  // =====================================
  async joinVideoRoom(citaId: number): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      if (this.isGuest()) {
        // Join as guest
        await this.videoCallService.joinRoom(citaId, this.guestCode()!);
      } else {
        // Join as authenticated user
        await this.videoCallService.joinRoom(citaId);
      }
    } catch (error: any) {
      this.error.set(error?.message || 'Error al unirse a la sala de videollamada');
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

  async toggleScreenShare(): Promise<void> {
    try {
      if (this.isScreenSharing()) {
        await this.videoCallService.stopScreenShare();
      } else {
        await this.videoCallService.startScreenShare();
      }
    } catch (error: any) {
      console.error('Error toggling screen share:', error);
    }
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
  toggleChat(): void {
    this.isChatExpanded.update((expanded) => !expanded);
  }

  sendMessage(): void {
    const message = this.newMessage().trim();
    if (message) {
      this.videoCallService.sendChatMessage(message);
      this.newMessage.set('');
    }
  }

  markMessageAsRead(messageId: string): void {
    const currentMessages = this.chatMessages();
    const updatedMessages = currentMessages.map((msg) =>
      msg.id === messageId ? { ...msg, isRead: true } : msg
    );
    this.chatMessages.set(updatedMessages);
  }

  // =====================================
  // PARTICIPANT METHODS
  // =====================================
  selectParticipant(participant: ParticipantInfoDto): void {
    this.selectedParticipant.set(participant);
    this.showParticipantInfo.set(true);
  }

  closeParticipantInfo(): void {
    this.showParticipantInfo.set(false);
    this.selectedParticipant.set(null);
  }

  toggleVideoGridMode(): void {
    this.videoGridMode.update((mode) => (mode === 'grid' ? 'speaker' : 'grid'));
  }

  pinParticipant(participantId: string): void {
    // Toggle pin for participant (could expand their video)
    console.log('Pinning participant:', participantId);
  }

  // =====================================
  // ROOM EVENT HANDLING
  // =====================================
  private handleRoomEvent(event: any): void {
    switch (event.type) {
      case 'participant-joined':
        console.log('Participant joined:', event.data);
        break;
      case 'participant-left':
        console.log('Participant left:', event.data);
        break;
      case 'participant-speaking':
        // Update speaking status
        this.updateParticipantSpeakingStatus(event.participantId, event.data.isSpeaking);
        break;
      case 'recording-started':
        console.log('Recording started');
        break;
      case 'recording-stopped':
        console.log('Recording stopped');
        break;
    }
  }

  private updateParticipantSpeakingStatus(participantId: string, isSpeaking: boolean): void {
    const currentParticipants = this.participants();
    const updatedParticipants = currentParticipants.map((p: ParticipantInfoDto) =>
      p.id === participantId ? { ...p, isSpeaking } : p
    );
    // Note: In a real implementation, this would update participants through the service
    console.log('Updating speaking status:', { participantId, isSpeaking });
  }

  // =====================================
  // UI HELPERS
  // =====================================
  getParticipantAvatar(participant: ParticipantInfoDto): string {
    // Generate avatar URL or use placeholder
    return participant.id === 'local'
      ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI0M1RDdGRiIgZD0iTTEwIDlhMyAzIDAgMCA2djZhOGEgMyAzIDAgNi02djZhLTh6Ii8+cGFnZT48L3N2Zz4='
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=3b82f6&color=fff&size=128`;
  }

  getParticipantAvatarForMessage(message: ChatMessageDto): string {
    const participant: ParticipantInfoDto = {
      id: message.fromParticipantId,
      name: message.fromParticipantName,
      role: message.fromParticipantRole,
      isVideoEnabled: false,
      isAudioEnabled: false,
      isSpeaking: false,
      joinedAt: message.timestamp,
      mediaStream: undefined,
    };
    return this.getParticipantAvatar(participant);
  }

  getParticipantRoleLabel(role: ParticipantRole): string {
    const roleLabels = {
      patient: 'Paciente',
      doctor: 'Médico',
      guest: 'Invitado',
      specialist: 'Especialista',
      translator: 'Traductor',
    };
    return roleLabels[role] || role;
  }

  getParticipantRoleColor(role: ParticipantRole): string {
    const roleColors = {
      patient: 'text-blue-600 bg-blue-100',
      doctor: 'text-green-600 bg-green-100',
      guest: 'text-amber-600 bg-amber-100',
      specialist: 'text-purple-600 bg-purple-100',
      translator: 'text-pink-600 bg-pink-100',
    };
    return roleColors[role] || 'text-gray-600 bg-gray-100';
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  scrollToBottom(): void {
    // Scroll chat to bottom (called after new message)
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  onImageError(event: any): void {
    // Handle image loading error
    (event.target as HTMLImageElement).style.display = 'none';
  }

  // =====================================
  // ERROR HANDLING
  // =====================================
  dismissError(): void {
    this.error.set(null);
  }
}
