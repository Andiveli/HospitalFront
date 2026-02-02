import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import type {
  BackendParticipantInfoDto,
  ChatMessageDto,
  ChatMessageEventDto,
  MediaStateUpdateEventDto,
  ParticipantInfoDto,
  RoomJoinedEventDto,
  SessionEndedEventDto,
  TimeWarningEventDto,
  UserConnectedEventDto,
  UserDisconnectedEventDto,
  WebRtcSignalEventDto,
  WsExceptionEventDto,
} from '../models/video-call.models';
import { normalizeChatMessage, normalizeRole } from '../models/video-call.models';
import { AuthService } from './auth.service';

// =====================================
// RE-EXPORT TYPES FOR CONSUMERS
// =====================================
export type { ChatMessageEventDto, UserConnectedEventDto, UserDisconnectedEventDto };

// =====================================
// VIDEO CALL SOCKET SERVICE
// Synchronized with Backend WebSocket Documentation
// =====================================

@Injectable({
  providedIn: 'root',
})
export class VideoCallSocketService {
  private readonly authService = inject(AuthService);

  private socket: Socket | null = null;
  private readonly socketUrl = environment.apiUrl.replace('/api', '');

  // =====================================
  // STATE SIGNALS
  // =====================================
  readonly isConnected = signal(false);
  readonly currentRoomId = signal<string | null>(null);
  readonly mySocketId = signal<string | null>(null);
  readonly participants = signal<ParticipantInfoDto[]>([]);
  readonly iceServers = signal<RTCIceServer[]>([]);
  readonly error = signal<string | null>(null);

  // =====================================
  // EVENT SUBJECTS (Observables)
  // =====================================
  private readonly _roomJoined$ = new Subject<RoomJoinedEventDto>();
  private readonly _userConnected$ = new Subject<UserConnectedEventDto>();
  private readonly _userDisconnected$ = new Subject<UserDisconnectedEventDto>();
  private readonly _webrtcOffer$ = new Subject<WebRtcSignalEventDto>();
  private readonly _webrtcAnswer$ = new Subject<WebRtcSignalEventDto>();
  private readonly _webrtcIceCandidate$ = new Subject<WebRtcSignalEventDto>();
  private readonly _mediaStateUpdate$ = new Subject<MediaStateUpdateEventDto>();
  private readonly _chatMessage$ = new Subject<ChatMessageEventDto>();
  private readonly _roomEnded$ = new Subject<void>();
  private readonly _exception$ = new Subject<WsExceptionEventDto>();
  private readonly _timeWarning$ = new Subject<TimeWarningEventDto>();
  private readonly _sessionEnded$ = new Subject<SessionEndedEventDto>();

  // Public observables
  readonly roomJoined$ = this._roomJoined$.asObservable();
  readonly userConnected$ = this._userConnected$.asObservable();
  readonly userDisconnected$ = this._userDisconnected$.asObservable();
  readonly webrtcOffer$ = this._webrtcOffer$.asObservable();
  readonly webrtcAnswer$ = this._webrtcAnswer$.asObservable();
  readonly webrtcIceCandidate$ = this._webrtcIceCandidate$.asObservable();
  readonly mediaStateUpdate$ = this._mediaStateUpdate$.asObservable();
  readonly chatMessage$ = this._chatMessage$.asObservable();
  readonly roomEnded$ = this._roomEnded$.asObservable();
  readonly exception$ = this._exception$.asObservable();
  readonly timeWarning$ = this._timeWarning$.asObservable();
  readonly sessionEnded$ = this._sessionEnded$.asObservable();

  // Legacy aliases for backward compatibility
  readonly participantJoined$ = this._userConnected$.asObservable();
  readonly participantLeft$ = this._userDisconnected$.asObservable();

  // =====================================
  // CONNECTION MANAGEMENT
  // =====================================

  /**
   * Connect to the video call WebSocket namespace
   * @param guestToken Optional guest invitation code for unauthenticated users
   */
  connect(guestToken?: string): void {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    const authToken = this.authService.getToken();

    // Either authenticated user with token, or guest with invitation code
    if (!authToken && !guestToken) {
      this.error.set('No authentication token or guest code available');
      return;
    }

    console.log(
      '[Socket] Connecting to:',
      `${this.socketUrl}/videollamadas`,
      guestToken ? '(as guest)' : '(authenticated)'
    );

    // Build auth object based on connection type
    const authConfig = authToken ? { token: authToken } : { guestToken: guestToken };

    this.socket = io(`${this.socketUrl}/videollamadas`, {
      auth: authConfig,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected.set(false);
    this.currentRoomId.set(null);
    this.mySocketId.set(null);
    this.participants.set([]);
  }

  /**
   * Setup all socket event listeners
   * Events based on backend documentation
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // =====================================
    // CONNECTION EVENTS
    // =====================================
    this.socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', this.socket?.id);
      this.isConnected.set(true);
      this.mySocketId.set(this.socket?.id || null);
      this.error.set(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.isConnected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      this.error.set(`Connection error: ${error.message}`);
      this.isConnected.set(false);
    });

    // =====================================
    // ROOM EVENTS
    // =====================================

    // room:joined - Response after joining a room
    this.socket.on('room:joined', (data: RoomJoinedEventDto) => {
      console.log('[Socket] Room joined:', data);

      if (!data.success) {
        console.error('[Socket] Failed to join room:', data.error);
        this.error.set(data.error || 'Failed to join room');
        return;
      }

      this.currentRoomId.set(data.room || null);

      if (data.participants) {
        this.updateParticipantsFromBackend(data.participants);
      }

      this._roomJoined$.next(data);
    });

    // room:user-connected - New participant joined
    this.socket.on('room:user-connected', (data: UserConnectedEventDto) => {
      console.log('[Socket] User connected:', data);
      this.addParticipantFromBackend(data);
      this._userConnected$.next(data);
    });

    // room:user-disconnected - Participant left
    this.socket.on('room:user-disconnected', (data: UserDisconnectedEventDto) => {
      console.log('[Socket] User disconnected:', data);
      this.removeParticipant(data.socketId);
      this._userDisconnected$.next(data);
    });

    // room:ended - Room has ended (called by host)
    this.socket.on('room:ended', () => {
      console.log('[Socket] Room ended');
      this._roomEnded$.next();
    });

    // room:time-warning - Session ending warning (5min, 1min, 30sec before end)
    this.socket.on('room:time-warning', (data: TimeWarningEventDto) => {
      console.log(`[Socket] Time warning: ${data.tipo} - ${data.tiempoRestante}s remaining`);
      this._timeWarning$.next(data);
    });

    // room:session-ended - Session has ended (time expired or host closed)
    this.socket.on('room:session-ended', (data: SessionEndedEventDto) => {
      console.log('[Socket] Session ended:', data.razon);
      this._sessionEnded$.next(data);
    });

    // =====================================
    // WEBRTC SIGNALING EVENTS
    // =====================================

    // webrtc:offer - Received WebRTC offer
    this.socket.on('webrtc:offer', (data: WebRtcSignalEventDto) => {
      console.log('[Socket] Received offer from:', data.from);
      this._webrtcOffer$.next(data);
    });

    // webrtc:answer - Received WebRTC answer
    this.socket.on('webrtc:answer', (data: WebRtcSignalEventDto) => {
      console.log('[Socket] Received answer from:', data.from);
      this._webrtcAnswer$.next(data);
    });

    // webrtc:ice-candidate - Received ICE candidate
    this.socket.on('webrtc:ice-candidate', (data: WebRtcSignalEventDto) => {
      console.log('[Socket] Received ICE candidate from:', data.from);
      this._webrtcIceCandidate$.next(data);
    });

    // =====================================
    // MEDIA EVENTS
    // =====================================

    // media:state-update - Participant media state changed
    this.socket.on('media:state-update', (data: MediaStateUpdateEventDto) => {
      console.log('[Socket] Media state update:', data);
      this.updateParticipantMedia(data.socketId, data.micEnabled, data.cameraEnabled);
      this._mediaStateUpdate$.next(data);
    });

    // media:error - Media operation error
    this.socket.on('media:error', (data: { error: string }) => {
      console.error('[Socket] Media error:', data.error);
      this.error.set(data.error);
    });

    // =====================================
    // CHAT EVENTS
    // =====================================

    // chat:message - Received chat message
    this.socket.on('chat:message', (data: ChatMessageEventDto) => {
      console.log('[Socket] Chat message:', data);
      this._chatMessage$.next(data);
    });

    // chat:error - Chat operation error
    this.socket.on('chat:error', (data: { error: string }) => {
      console.error('[Socket] Chat error:', data.error);
      this.error.set(data.error);
    });

    // =====================================
    // ERROR EVENTS
    // =====================================

    // exception - WebSocket exception
    this.socket.on('exception', (error: WsExceptionEventDto) => {
      console.error('[Socket] Exception:', error);
      this.error.set(error.message);
      this._exception$.next(error);
    });
  }

  // =====================================
  // ROOM ACTIONS (Emit events to server)
  // =====================================

  /**
   * Join a video call room
   * Emits: room:join
   */
  joinRoom(citaId: number): void {
    if (!this.socket?.connected) {
      this.error.set('Socket not connected');
      return;
    }

    const user = this.authService.user();
    if (!user) {
      this.error.set('User not authenticated');
      return;
    }

    console.log('[Socket] Joining room for cita:', citaId);
    this.socket.emit('room:join', {
      citaId,
      usuarioId: user.id,
      odontollamaId: user.id, // Alias for compatibility
    });
  }

  /**
   * Join a room as a guest (using invitation token)
   * Emits: room:join
   */
  joinRoomAsGuest(citaId: number, token: string, nombreInvitado: string): void {
    if (!this.socket?.connected) {
      this.error.set('Socket not connected');
      return;
    }

    console.log('[Socket] Joining room as guest for cita:', citaId);
    this.socket.emit('room:join', {
      citaId,
      token,
      nombreInvitado,
    });
  }

  /**
   * Leave the current room
   * Emits: room:leave
   */
  leaveRoom(citaId: number): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Leaving room:', citaId);
    this.socket.emit('room:leave', { citaId });
    this.currentRoomId.set(null);
    this.participants.set([]);
  }

  // =====================================
  // WEBRTC SIGNALING (Emit events to server)
  // =====================================

  /**
   * Send WebRTC offer to a specific participant
   * Emits: webrtc:offer
   */
  sendOffer(to: string, offer: RTCSessionDescriptionInit): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Sending offer to:', to);
    this.socket.emit('webrtc:offer', {
      to,
      type: 'offer',
      payload: offer,
    });
  }

  /**
   * Send WebRTC answer to a specific participant
   * Emits: webrtc:answer
   */
  sendAnswer(to: string, answer: RTCSessionDescriptionInit): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Sending answer to:', to);
    this.socket.emit('webrtc:answer', {
      to,
      type: 'answer',
      payload: answer,
    });
  }

  /**
   * Send ICE candidate to a specific participant
   * Emits: webrtc:ice-candidate
   */
  sendIceCandidate(to: string, candidate: RTCIceCandidateInit): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Sending ICE candidate to:', to);
    this.socket.emit('webrtc:ice-candidate', {
      to,
      type: 'ice-candidate',
      payload: candidate,
    });
  }

  // =====================================
  // MEDIA CONTROLS (Emit events to server)
  // =====================================

  /**
   * Toggle microphone and notify other participants
   * Emits: media:mic-toggle
   */
  toggleMic(citaId: number, enabled: boolean): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Toggling mic:', enabled);
    this.socket.emit('media:mic-toggle', { citaId, enabled });
  }

  /**
   * Toggle camera and notify other participants
   * Emits: media:camera-toggle
   */
  toggleCamera(citaId: number, enabled: boolean): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Toggling camera:', enabled);
    this.socket.emit('media:camera-toggle', { citaId, enabled });
  }

  // =====================================
  // CHAT (Emit events to server)
  // =====================================

  /**
   * Send a text chat message
   * Emits: chat:message
   */
  sendChatMessage(citaId: number, message: string): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Sending chat message');
    this.socket.emit('chat:message', {
      citaId,
      contenidoTexto: message,
      tipoMensaje: 'texto',
    });
  }

  /**
   * Send a file/attachment chat message
   * Emits: chat:message
   */
  sendChatFile(citaId: number, fileUrl: string, fileType: 'imagen' | 'archivo' | 'audio'): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Sending chat file:', fileType);
    this.socket.emit('chat:message', {
      citaId,
      contenidoUrl: fileUrl,
      tipoMensaje: fileType,
    });
  }

  // =====================================
  // RECORDING CONTROLS (Emit events to server)
  // =====================================

  /**
   * Control recording (start, stop, pause, resume)
   * Emits: recording:control
   */
  controlRecording(citaId: number, action: 'start' | 'stop' | 'pause' | 'resume'): void {
    if (!this.socket?.connected) return;

    console.log('[Socket] Recording control:', action);
    this.socket.emit('recording:control', { citaId, action });
  }

  /**
   * Send recording chunk
   * Emits: recording:chunk
   */
  sendRecordingChunk(citaId: number, chunkIndex: number, data: string, isLast: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('recording:chunk', {
      citaId,
      chunkIndex,
      data,
      isLast,
    });
  }

  // =====================================
  // HELPER METHODS
  // =====================================

  /**
   * Update participants list from backend format
   */
  private updateParticipantsFromBackend(backendParticipants: BackendParticipantInfoDto[]): void {
    console.log('[Socket] Updating participants from backend:', backendParticipants);

    const participants: ParticipantInfoDto[] = backendParticipants.map((p) => ({
      id: p.socketId,
      name: p.nombre,
      role: normalizeRole(p.rol),
      isVideoEnabled: p.cameraEnabled,
      isAudioEnabled: p.micEnabled,
      isSpeaking: false,
      joinedAt: p.joinedAt,
    }));

    console.log('[Socket] Normalized participants:', participants);
    this.participants.set(participants);
  }

  /**
   * Add a participant from backend event
   */
  private addParticipantFromBackend(data: BackendParticipantInfoDto): void {
    console.log('[Socket] Adding participant:', data);

    const newParticipant: ParticipantInfoDto = {
      id: data.socketId,
      name: data.nombre,
      role: normalizeRole(data.rol),
      isVideoEnabled: data.cameraEnabled,
      isAudioEnabled: data.micEnabled,
      isSpeaking: false,
      joinedAt: data.joinedAt,
    };

    console.log('[Socket] New participant normalized:', newParticipant);
    this.participants.update((current) => [...current, newParticipant]);
  }

  /**
   * Remove a participant by socket ID
   */
  private removeParticipant(socketId: string): void {
    this.participants.update((current) => current.filter((p) => p.id !== socketId));
  }

  /**
   * Update participant media state
   */
  private updateParticipantMedia(
    socketId: string,
    micEnabled: boolean,
    cameraEnabled: boolean
  ): void {
    this.participants.update((current) =>
      current.map((p) => {
        if (p.id === socketId) {
          return {
            ...p,
            isAudioEnabled: micEnabled,
            isVideoEnabled: cameraEnabled,
          };
        }
        return p;
      })
    );
  }

  /**
   * Convert backend chat event to frontend ChatMessageDto
   */
  toChatMessageDto(event: ChatMessageEventDto): ChatMessageDto {
    return normalizeChatMessage(event);
  }
}
