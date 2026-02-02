import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ChatMessageDto,
  ChatMessageEventDto,
  GenerarInvitacionDto,
  LinkInvitacionDataDto,
  ParticipantInfoDto,
  ValidacionInvitadoDataDto,
} from '../models/video-call.models';
import { AuthService } from './auth.service';
import { VideoCallSocketService } from './video-call-socket.service';

// =====================================
// WEBRTC CONFIG
// =====================================
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const RTC_CONFIG: RTCConfiguration = {
  iceServers: DEFAULT_ICE_SERVERS,
  iceCandidatePoolSize: 10,
};

// =====================================
// VIDEO CALL SERVICE
// Synchronized with Backend WebSocket Documentation
// =====================================
@Injectable({
  providedIn: 'root',
})
export class VideoCallService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly socketService = inject(VideoCallSocketService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly apiUrl = environment.apiUrl;

  // =====================================
  // STATE SIGNALS
  // =====================================
  readonly localStream = signal<MediaStream | null>(null);
  readonly remoteStreams = signal<Map<string, MediaStream>>(new Map());
  readonly isAudioEnabled = signal(true);
  readonly isVideoEnabled = signal(true);
  readonly isScreenSharing = signal(false);
  readonly connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>(
    'disconnected'
  );
  readonly error = signal<string | null>(null);
  readonly currentCitaId = signal<number | null>(null);

  // Chat state
  readonly chatMessages = signal<ChatMessageDto[]>([]);
  private readonly _chatMessage$ = new Subject<ChatMessageDto>();
  readonly chatMessage$ = this._chatMessage$.asObservable();

  // Call duration
  private callStartTime: number | null = null;
  private durationInterval: ReturnType<typeof setInterval> | null = null;
  readonly callDuration = signal(0);

  // Session time warnings
  readonly timeWarning = signal<{
    show: boolean;
    type: '5min' | '1min' | '30sec' | null;
    message: string;
    tiempoRestante: number;
  }>({ show: false, type: null, message: '', tiempoRestante: 0 });
  readonly sessionEnded = signal<boolean>(false);
  readonly sessionEndReason = signal<string | null>(null);

  // =====================================
  // WEBRTC STATE
  // =====================================
  private peerConnections = new Map<string, RTCPeerConnection>();
  private pendingIceCandidates = new Map<string, RTCIceCandidateInit[]>();

  // =====================================
  // COMPUTED
  // =====================================

  // Participants from socket + their remote streams
  readonly participants = computed((): ParticipantInfoDto[] => {
    const socketParticipants = this.socketService.participants();
    const streams = this.remoteStreams();

    return socketParticipants.map((p) => ({
      ...p,
      mediaStream: streams.get(p.id),
    }));
  });

  readonly isConnected = computed(() => this.connectionState() === 'connected');

  readonly formattedCallDuration = computed(() => {
    const totalSeconds = this.callDuration();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  // =====================================
  // CONSTRUCTOR - Setup socket listeners
  // =====================================
  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Room joined - create offers for existing participants
    this.socketService.roomJoined$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      console.log('[VideoCall] Room joined, event:', event);

      if (!event.success) {
        console.error('[VideoCall] Failed to join room:', event.error);
        this.error.set(event.error || 'Failed to join room');
        this.connectionState.set('error');
        return;
      }

      this.connectionState.set('connected');
      this.startCallTimer();

      // Create offers for each existing participant
      if (event.participants) {
        event.participants.forEach((participant) => {
          const socketId = participant.socketId;
          if (socketId && socketId !== this.socketService.mySocketId()) {
            this.createOffer(socketId);
          }
        });
      }
    });

    // New participant joined - create offer (using userConnected$ which is the new event)
    this.socketService.userConnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const socketId = event.socketId;
        console.log('[VideoCall] New participant, creating offer for:', socketId);
        if (socketId) {
          this.createOffer(socketId);
        }
      });

    // Participant left - cleanup peer connection
    this.socketService.userDisconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const socketId = event.socketId;
        console.log('[VideoCall] Participant left:', socketId);
        if (socketId) {
          this.closePeerConnection(socketId);
        }
      });

    // WebRTC offer received
    this.socketService.webrtcOffer$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (event) => {
        console.log('[VideoCall] Received offer from:', event.from);
        if (event.sdp) {
          await this.handleOffer(event.from, event.sdp);
        }
      });

    // WebRTC answer received
    this.socketService.webrtcAnswer$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (event) => {
        console.log('[VideoCall] Received answer from:', event.from);
        if (event.sdp) {
          await this.handleAnswer(event.from, event.sdp);
        }
      });

    // ICE candidate received
    this.socketService.webrtcIceCandidate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (event) => {
        console.log('[VideoCall] Received ICE candidate from:', event.from);
        if (event.candidate) {
          await this.handleIceCandidate(event.from, event.candidate);
        }
      });

    // Chat message received
    this.socketService.chatMessage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: ChatMessageEventDto) => {
        const message = this.socketService.toChatMessageDto(event);
        this.chatMessages.update((messages) => [...messages, message]);
        this._chatMessage$.next(message);
      });

    // Room ended
    this.socketService.roomEnded$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      console.log('[VideoCall] Room ended by host');
      this.leaveRoom();
    });

    // Time warning (5min, 1min, 30sec before session ends)
    this.socketService.timeWarning$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      console.log(`[VideoCall] Time warning: ${event.tipo}`);
      this.timeWarning.set({
        show: true,
        type: event.tipo,
        message: event.mensaje,
        tiempoRestante: event.tiempoRestante,
      });
    });

    // Session ended (time expired or host closed)
    this.socketService.sessionEnded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (event) => {
        console.log('[VideoCall] Session ended:', event.razon);
        this.sessionEnded.set(true);
        this.sessionEndReason.set(event.mensaje);

        // Auto-close the video call after a short delay to show the message
        setTimeout(() => {
          this.leaveRoom();

          // If doctor and requires medical record, redirect to medical record creation
          if (event.requiereRegistroMedico && this.authService.isDoctor()) {
            const citaId = this.currentCitaId();
            if (citaId) {
              this.router.navigate(['/doctor/registro-atencion', citaId]);
            }
          }
        }, 3000);
      });

    // Socket errors
    this.socketService.exception$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((error) => {
      console.error('[VideoCall] Socket error:', error);
      this.error.set(error.message);
    });
  }

  // =====================================
  // PUBLIC METHODS - Join/Leave
  // =====================================

  /**
   * Create video room session via REST API
   * This must be called BEFORE connecting to WebSocket
   */
  private async createRoomSession(citaId: number): Promise<void> {
    try {
      console.log('[VideoCall] Creating room session for cita:', citaId);
      const response = await this.http
        .post<{ message: string; data: unknown }>(`${this.apiUrl}/video-rooms/${citaId}/create`, {})
        .toPromise();
      console.log('[VideoCall] Room session created:', response);
    } catch (error: unknown) {
      // If room already exists, that's fine - continue
      const httpError = error as { status?: number; error?: { message?: string } };
      if (httpError.status === 409) {
        console.log('[VideoCall] Room already exists, continuing...');
        return;
      }
      console.error('[VideoCall] Error creating room session:', error);
      throw error;
    }
  }

  /**
   * Monitor a room without joining with media (for doctor's waiting room panel)
   * This allows the doctor to see who is in the waiting room without activating camera
   */
  async monitorRoom(citaId: number): Promise<void> {
    try {
      this.connectionState.set('connecting');
      this.error.set(null);
      this.currentCitaId.set(citaId);

      // 1. Create room session via REST API first
      await this.createRoomSession(citaId);

      // 2. Connect to WebSocket (no media yet)
      this.socketService.connect();

      // 3. Wait for socket connection, then join room
      return new Promise((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.socketService.isConnected()) {
            clearInterval(checkConnection);
            this.socketService.joinRoom(citaId);
            this.connectionState.set('connected');
            resolve();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          if (!this.socketService.isConnected()) {
            this.error.set('Failed to connect to video call server');
            this.connectionState.set('error');
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error: unknown) {
      console.error('[VideoCall] Error monitoring room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error connecting to room';
      this.error.set(errorMessage);
      this.connectionState.set('error');
      throw error;
    }
  }

  /**
   * Join a video call room (with media)
   * @param citaId - The appointment ID
   * @param guestCode - Optional guest code for unauthenticated guests
   * @param guestName - Optional guest name (required when guestCode is provided)
   */
  async joinRoom(citaId: number, guestCode?: string, guestName?: string): Promise<void> {
    try {
      this.connectionState.set('connecting');
      this.error.set(null);
      this.currentCitaId.set(citaId);

      // 1. Create room session via REST API first (only for authenticated users)
      // Guests don't create rooms - they join existing ones
      const isGuest = !!guestCode && !this.authService.isAuthenticated();
      if (!isGuest) {
        await this.createRoomSession(citaId);
      }

      // 2. Get local media stream
      await this.initializeLocalStream();

      // 3. Connect to WebSocket (pass guestCode for guest authentication)
      this.socketService.connect(isGuest ? guestCode : undefined);

      // 4. Wait for socket connection, then join room
      const checkConnection = setInterval(() => {
        if (this.socketService.isConnected()) {
          clearInterval(checkConnection);
          // Use appropriate join method based on whether user is a guest
          if (isGuest && guestCode) {
            this.socketService.joinRoomAsGuest(citaId, guestCode, guestName || 'Invitado');
          } else {
            this.socketService.joinRoom(citaId);
          }
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!this.socketService.isConnected()) {
          this.error.set('Failed to connect to video call server');
          this.connectionState.set('error');
        }
      }, 10000);
    } catch (error: unknown) {
      console.error('[VideoCall] Error joining room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error joining video call';
      this.error.set(errorMessage);
      this.connectionState.set('error');
      throw error;
    }
  }

  /**
   * Leave the current video call
   */
  async leaveRoom(): Promise<void> {
    const citaId = this.currentCitaId();

    // Stop call timer
    this.stopCallTimer();

    // Close all peer connections
    this.peerConnections.forEach((_pc, odontollamaId) => {
      this.closePeerConnection(odontollamaId);
    });

    // Stop local stream
    const localStream = this.localStream();
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream.set(null);
    }

    // Leave socket room
    if (citaId) {
      this.socketService.leaveRoom(citaId);
    }

    // Disconnect socket
    this.socketService.disconnect();

    // Reset state
    this.remoteStreams.set(new Map());
    this.chatMessages.set([]);
    this.connectionState.set('disconnected');
    this.currentCitaId.set(null);
  }

  // =====================================
  // PUBLIC METHODS - Media Controls
  // =====================================

  /**
   * Initialize local camera and microphone
   */
  async initializeLocalStream(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      this.localStream.set(stream);
      this.isVideoEnabled.set(true);
      this.isAudioEnabled.set(true);

      console.log('[VideoCall] Local stream initialized');
    } catch (error: unknown) {
      console.error('[VideoCall] Error getting media:', error);
      this.error.set('Could not access camera/microphone');
      throw error;
    }
  }

  /**
   * Toggle local audio
   */
  toggleAudio(): void {
    const stream = this.localStream();
    if (!stream) return;

    const enabled = !this.isAudioEnabled();
    stream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });

    this.isAudioEnabled.set(enabled);

    // Notify other participants
    const citaId = this.currentCitaId();
    if (citaId) {
      this.socketService.toggleMic(citaId, enabled);
    }
  }

  /**
   * Toggle local video
   */
  toggleVideo(): void {
    const stream = this.localStream();
    if (!stream) return;

    const enabled = !this.isVideoEnabled();
    stream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });

    this.isVideoEnabled.set(enabled);

    // Notify other participants
    const citaId = this.currentCitaId();
    if (citaId) {
      this.socketService.toggleCamera(citaId, enabled);
    }
  }

  /**
   * Send a chat message
   */
  sendChatMessage(message: string): void {
    const citaId = this.currentCitaId();
    if (!citaId || !message.trim()) return;

    // Send message via WebSocket - it will be broadcast back to us
    // No optimistic update to avoid duplicate messages
    this.socketService.sendChatMessage(citaId, message);
  }

  // =====================================
  // WEBRTC - Peer Connection Management
  // =====================================

  /**
   * Create a new RTCPeerConnection for a participant
   */
  private createPeerConnection(socketId: string): RTCPeerConnection {
    const iceServers = this.socketService.iceServers();
    const config: RTCConfiguration = {
      ...RTC_CONFIG,
      iceServers: iceServers.length > 0 ? iceServers : DEFAULT_ICE_SERVERS,
    };

    const pc = new RTCPeerConnection(config);

    // Add local tracks to the connection
    const localStream = this.localStream();
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.sendIceCandidate(socketId, event.candidate.toJSON());
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('[VideoCall] Remote track received from:', socketId);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.remoteStreams.update((streams) => {
          const newStreams = new Map(streams);
          newStreams.set(socketId, remoteStream);
          return newStreams;
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[VideoCall] Connection state for ${socketId}:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Could implement reconnection logic here
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[VideoCall] ICE connection state for ${socketId}:`, pc.iceConnectionState);
    };

    this.peerConnections.set(socketId, pc);
    return pc;
  }

  /**
   * Close and cleanup a peer connection
   */
  private closePeerConnection(socketId: string): void {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }

    // Remove remote stream
    this.remoteStreams.update((streams) => {
      const newStreams = new Map(streams);
      newStreams.delete(socketId);
      return newStreams;
    });

    // Clear pending ICE candidates
    this.pendingIceCandidates.delete(socketId);
  }

  // =====================================
  // WEBRTC - Signaling
  // =====================================

  /**
   * Create and send an offer to a participant
   */
  private async createOffer(socketId: string): Promise<void> {
    try {
      const pc = this.createPeerConnection(socketId);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      if (pc.localDescription) {
        this.socketService.sendOffer(socketId, pc.localDescription);
      }
    } catch (error) {
      console.error('[VideoCall] Error creating offer:', error);
    }
  }

  /**
   * Handle incoming offer and send answer
   */
  private async handleOffer(fromId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      let pc = this.peerConnections.get(fromId);
      if (!pc) {
        pc = this.createPeerConnection(fromId);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Add any pending ICE candidates
      const pending = this.pendingIceCandidates.get(fromId);
      if (pending) {
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.pendingIceCandidates.delete(fromId);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (pc.localDescription) {
        this.socketService.sendAnswer(fromId, pc.localDescription);
      }
    } catch (error) {
      console.error('[VideoCall] Error handling offer:', error);
    }
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(fromId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const pc = this.peerConnections.get(fromId);
      if (!pc) {
        console.warn('[VideoCall] No peer connection for answer from:', fromId);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Add any pending ICE candidates
      const pending = this.pendingIceCandidates.get(fromId);
      if (pending) {
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.pendingIceCandidates.delete(fromId);
      }
    } catch (error) {
      console.error('[VideoCall] Error handling answer:', error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const pc = this.peerConnections.get(fromId);

      if (!pc || !pc.remoteDescription) {
        // Queue the candidate until we have a remote description
        const pending = this.pendingIceCandidates.get(fromId) || [];
        pending.push(candidate);
        this.pendingIceCandidates.set(fromId, pending);
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('[VideoCall] Error handling ICE candidate:', error);
    }
  }

  // =====================================
  // TIMER
  // =====================================

  private startCallTimer(): void {
    this.callStartTime = Date.now();
    this.durationInterval = setInterval(() => {
      if (this.callStartTime) {
        this.callDuration.set(Math.floor((Date.now() - this.callStartTime) / 1000));
      }
    }, 1000);
  }

  private stopCallTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    this.callStartTime = null;
    this.callDuration.set(0);
  }

  // =====================================
  // GUEST INVITATIONS (HTTP API)
  // =====================================

  /**
   * Create an invitation link for a guest
   * Returns LinkInvitacionDataDto with linkInvitacion, codigoAcceso, expiraEn
   */
  async createInvitation(
    citaId: number,
    guestData: GenerarInvitacionDto
  ): Promise<LinkInvitacionDataDto> {
    const response = await this.http
      .post<{ data: LinkInvitacionDataDto }>(
        `${this.apiUrl}/invitaciones/${citaId}/generar-link-invitado`,
        guestData
      )
      .toPromise();

    console.log('[VideoCall] Invitation response from backend:', response);

    // Backend wraps response in { data: ... }
    const data = response?.data || (response as unknown as LinkInvitacionDataDto);

    // Ensure we have the required fields
    const result: LinkInvitacionDataDto = {
      linkInvitacion: data.linkInvitacion || '',
      codigoAcceso: data.codigoAcceso || '',
      expiraEn: data.expiraEn || '24 horas',
      rolInvitado: data.rolInvitado || guestData.rolInvitado,
    };

    console.log('[VideoCall] Processed invitation:', result);

    return result;
  }

  /**
   * Validate a guest access code
   */
  async validateGuestCode(code: string): Promise<ValidacionInvitadoDataDto> {
    const response = await this.http
      .get<{ data: ValidacionInvitadoDataDto }>(`${this.apiUrl}/invitaciones/invitado/${code}`)
      .toPromise();

    // Backend wraps response in { data: ... }
    return response?.data || (response as unknown as ValidacionInvitadoDataDto);
  }

  // =====================================
  // MEDICAL RECORD (HTTP API)
  // =====================================

  /**
   * Create medical attention record after session ends
   * POST /registro-atencion
   */
  async createRegistroAtencion(data: {
    citaId: number;
    diagnostico: string;
    tratamiento: string;
    recetas?: Array<{
      medicamento: string;
      dosis: string;
      frecuencia: string;
      duracion: string;
      instrucciones?: string;
    }>;
    notas?: string;
    proximaCitaRecomendada?: string;
  }): Promise<unknown> {
    const response = await this.http
      .post<{ message: string; data: unknown }>(`${this.apiUrl}/registro-atencion`, data)
      .toPromise();

    console.log('[VideoCall] Medical record created:', response);
    return response?.data;
  }
}
