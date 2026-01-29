import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  WebRtcConfigDto,
  VideoRoomSessionDto,
  ParticipantInfoDto,
  WebRtcSignalDto,
  ChatMessageDto,
  RoomEventDto,
  GenerateGuestLinkResponseDto,
  GuestValidationDto,
  GenerarInvitacionDto,
  InvitacionResponseDto,
  ParticipantRole,
  SignalType,
  RoomEventType,
} from '../models/video-call.models';
import { Observable, Subject, BehaviorSubject, timer } from 'rxjs';
import { catchError, take, timeout } from 'rxjs/operators';

export interface WebRTCServiceConfig {
  iceServers?: RTCIceServer[];
  enableVideo?: boolean;
  enableAudio?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VideoCallService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // API Base URLs (should come from environment config)
  private readonly apiUrl = 'http://localhost:3000/api';

  // =====================================
  // STATE SIGNALS
  // =====================================
  currentRoom = signal<VideoRoomSessionDto | null>(null);
  localStream = signal<MediaStream | null>(null);
  participants = signal<ParticipantInfoDto[]>([]);
  isAudioEnabled = signal(true);
  isVideoEnabled = signal(true);
  isScreenSharing = signal(false);
  isRecording = signal(false);
  connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>(
    'disconnected',
  );
  error = signal<string | null>(null);

  // Observable streams for real-time updates
  private chatMessages$ = new Subject<ChatMessageDto>();
  private roomEvents$ = new Subject<RoomEventDto>();
  private participantJoined$ = new Subject<ParticipantInfoDto>();
  private participantLeft$ = new Subject<string>();
  private incomingSignals$ = new Subject<WebRtcSignalDto>();

  // =====================================
  // WebRTC Peer Connections
  // =====================================
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localPeerConnection: RTCPeerConnection | null = null;
  private pendingCandidates: Map<string, RTCIceCandidate[]> = new Map();

  // =====================================
  // TIMERS AND MONITORING
  // =====================================
  private connectionTimer: any = null;
  private heartbeatInterval: any = null;
  private callStartTime: number | null = null;
  private currentCallDuration = signal(0);

  // =====================================
  // PUBLIC OBSERVABLES
  // =====================================
  readonly chatMessages = this.chatMessages$.asObservable();
  readonly roomEvents = this.roomEvents$.asObservable();
  readonly participantJoined = this.participantJoined$.asObservable();
  readonly participantLeft = this.participantLeft$.asObservable();
  readonly incomingSignals = this.incomingSignals$.asObservable();
  readonly callDuration = new Observable<number>((subscriber) => {
    const value = this.currentCallDuration();
    subscriber.next(value);
    subscriber.complete();
  });

  // =====================================
  // ROOM MANAGEMENT
  // =====================================

  /**
   * Create a new video room for an appointment
   */
  async createRoom(citaId: number, config?: WebRTCServiceConfig): Promise<VideoRoomSessionDto> {
    try {
      this.connectionState.set('connecting');
      this.error.set(null);

      const response = await this.http
        .post<any>(`${this.apiUrl}/video-rooms/${citaId}/create`, config)
        .toPromise();

      const session: VideoRoomSessionDto = {
        roomId: response.roomId,
        sessionToken: response.sessionToken,
        participantId: response.participantId || 'current-user',
        participantRole: 'patient', // Default role
        iceServers: this.parseIceServers(response.iceServers),
        participants: [],
        createdAt: new Date().toISOString(),
        expiresAt: response.expiresAt,
      };

      this.currentRoom.set(session);
      await this.initializeLocalStream(config);
      await this.setupPeerConnection();

      this.connectionState.set('connected');
      this.startCallTimer();

      return session;
    } catch (error: any) {
      this.handleError('Error creating video room', error);
      throw error;
    }
  }

  /**
   * Join an existing video room
   */
  async joinRoom(citaId: number, guestCode?: string): Promise<VideoRoomSessionDto> {
    try {
      this.connectionState.set('connecting');
      this.error.set(null);

      let response: any;

      if (guestCode) {
        // Guest access (no authentication)
        response = await this.http
          .post(`${this.apiUrl}/video-rooms/${citaId}/join`, { guestCode })
          .toPromise();
      } else {
        // Authenticated user access
        response = await this.http.get(`${this.apiUrl}/video-rooms/${citaId}/join`).toPromise();
      }

      const session: VideoRoomSessionDto = {
        roomId: response.roomId,
        sessionToken: response.sessionToken,
        participantId: response.participantId,
        participantRole: response.participantRole || 'guest',
        iceServers: this.parseIceServers(response.iceServers),
        participants: response.existingParticipants || [],
        createdAt: new Date().toISOString(),
        expiresAt: response.expiresAt,
      };

      this.currentRoom.set(session);
      this.participants.set(response.existingParticipants || []);

      await this.initializeLocalStream();
      await this.setupPeerConnection();

      // Start signaling
      await this.startSignaling();

      this.connectionState.set('connected');
      this.startCallTimer();

      return session;
    } catch (error: any) {
      this.handleError('Error joining video room', error);
      throw error;
    }
  }

  /**
   * Leave the current video room
   */
  async leaveRoom(): Promise<void> {
    try {
      this.stopCallTimer();
      this.stopHeartbeat();

      // Close all peer connections
      this.peerConnections.forEach((pc) => pc.close());
      this.peerConnections.clear();

      // Stop local stream
      const localStream = this.localStream();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        this.localStream.set(null);
      }

      // Notify backend if we're in a room
      const currentRoom = this.currentRoom();
      if (currentRoom) {
        await this.http.delete(`${this.apiUrl}/video-rooms/${currentRoom.roomId}/end`).toPromise();
      }

      this.currentRoom.set(null);
      this.participants.set([]);
      this.connectionState.set('disconnected');
    } catch (error: any) {
      this.handleError('Error leaving room', error);
    }
  }

  // =====================================
  // GUEST INVITATIONS
  // =====================================

  /**
   * Generate guest invitation link
   */
  async generateGuestLink(
    citaId: number,
    guestData: GenerarInvitacionDto,
  ): Promise<GenerateGuestLinkResponseDto> {
    try {
      const response = await this.http
        .post<GenerateGuestLinkResponseDto>(
          `${this.apiUrl}/video-rooms/${citaId}/guest-link`,
          guestData,
        )
        .toPromise();

      return response!;
    } catch (error: any) {
      this.handleError('Error generating guest link', error);
      throw error;
    }
  }

  /**
   * Generate invitation using the other endpoint
   */
  async createInvitation(
    citaId: number,
    guestData: GenerarInvitacionDto,
  ): Promise<InvitacionResponseDto> {
    try {
      const response = await this.http
        .post<InvitacionResponseDto>(
          `${this.apiUrl}/invitaciones/${citaId}/generar-link-invitado`,
          guestData,
        )
        .toPromise();

      return response!;
    } catch (error: any) {
      this.handleError('Error creating invitation', error);
      throw error;
    }
  }

  /**
   * Validate guest access code (public endpoint)
   */
  async validateGuestCode(code: string): Promise<GuestValidationDto> {
    try {
      const response = await this.http
        .get<GuestValidationDto>(`${this.apiUrl}/invitaciones/invitado/${code}`)
        .toPromise();

      return response!;
    } catch (error: any) {
      this.handleError('Error validating guest code', error);
      throw error;
    }
  }

  // =====================================
  // WEBRTC MEDIA CONTROLS
  // =====================================

  /**
   * Initialize local media stream
   */
  async initializeLocalStream(config?: WebRTCServiceConfig): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        video: config?.enableVideo ?? true,
        audio: config?.enableAudio ?? true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream.set(stream);

      // Update control states
      this.isVideoEnabled.set(!!stream.getVideoTracks().length);
      this.isAudioEnabled.set(!!stream.getAudioTracks().length);
    } catch (error: any) {
      this.handleError('Error accessing camera/microphone', error);
      throw error;
    }
  }

  /**
   * Toggle local audio
   */
  toggleAudio(): void {
    const stream = this.localStream();
    if (!stream) return;

    const audioTracks = stream.getAudioTracks();
    const newState = !this.isAudioEnabled();

    audioTracks.forEach((track) => {
      track.enabled = newState;
    });

    this.isAudioEnabled.set(newState);
    this.broadcastAudioToggle(newState);
  }

  /**
   * Toggle local video
   */
  toggleVideo(): void {
    const stream = this.localStream();
    if (!stream) return;

    const videoTracks = stream.getVideoTracks();
    const newState = !this.isVideoEnabled();

    videoTracks.forEach((track) => {
      track.enabled = newState;
    });

    this.isVideoEnabled.set(newState);
    this.broadcastVideoToggle(newState);
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track in all peer connections
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      });

      this.isScreenSharing.set(true);

      // Handle screen sharing end
      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };
    } catch (error: any) {
      this.handleError('Error starting screen share', error);
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    try {
      const localStream = this.localStream();
      if (!localStream) return;

      // Restore original video track
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && localStream.getVideoTracks()[0]) {
          sender.replaceTrack(localStream.getVideoTracks()[0]);
        }
      });

      this.isScreenSharing.set(false);
    } catch (error: any) {
      this.handleError('Error stopping screen share', error);
    }
  }

  // =====================================
  // WEBRTC SIGNALING
  // =====================================

  /**
   * Send WebRTC signal to other participant
   */
  async sendSignal(toParticipantId: string, signalType: SignalType, payload: any): Promise<void> {
    try {
      const currentRoom = this.currentRoom();
      if (!currentRoom) return;

      const signal: WebRtcSignalDto = {
        to: toParticipantId,
        from: currentRoom.participantId,
        type: signalType,
        payload,
        timestamp: new Date().toISOString(),
      };

      await this.http
        .post(`${this.apiUrl}/video-rooms/${currentRoom.roomId}/signal`, signal)
        .toPromise();
    } catch (error: any) {
      this.handleError('Error sending signal', error);
    }
  }

  /**
   * Handle incoming WebRTC signal
   */
  async handleSignal(signal: WebRtcSignalDto): Promise<void> {
    try {
      switch (signal.type) {
        case 'offer':
          await this.handleOffer(signal.payload as RTCSessionDescriptionInit, signal.from);
          break;
        case 'answer':
          await this.handleAnswer(signal.payload as RTCSessionDescriptionInit, signal.from);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(signal.payload as RTCIceCandidateInit, signal.from);
          break;
      }
    } catch (error: any) {
      this.handleError('Error handling signal', error);
    }
  }

  // =====================================
  // CHAT MESSAGING
  // =====================================

  /**
   * Send chat message
   */
  async sendChatMessage(message: string): Promise<void> {
    try {
      const currentRoom = this.currentRoom();
      if (!currentRoom) return;

      const chatMessage: ChatMessageDto = {
        id: Date.now().toString(),
        fromParticipantId: currentRoom.participantId,
        fromParticipantName: 'You', // Will be set based on user profile
        fromParticipantRole: currentRoom.participantRole,
        message,
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      // Send via backend signaling
      await this.http
        .post(`${this.apiUrl}/video-rooms/${currentRoom.roomId}/chat`, chatMessage)
        .toPromise();

      // Add to local messages immediately
      this.chatMessages$.next(chatMessage);
    } catch (error: any) {
      this.handleError('Error sending chat message', error);
    }
  }

  // =====================================
  // PRIVATE HELPER METHODS
  // =====================================

  private parseIceServers(servers: any[]): RTCIceServer[] {
    return servers.map((server) => ({
      urls: server.urls,
      username: server.username,
      credential: server.credential,
    }));
  }

  private async setupPeerConnection(): Promise<void> {
    const currentRoom = this.currentRoom();
    if (!currentRoom) return;

    this.localPeerConnection = new RTCPeerConnection({
      iceServers: currentRoom.iceServers,
    });

    // Add local stream tracks
    const localStream = this.localStream();
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        this.localPeerConnection?.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    this.localPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // This would be sent to all participants
        // For now, we'll store it
        console.log('ICE candidate generated:', event.candidate);
      }
    };

    // Handle remote streams
    this.localPeerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.streams[0]);
      // Handle remote stream display
    };

    // Handle connection state changes
    this.localPeerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.localPeerConnection?.connectionState);
    };
  }

  private async handleOffer(
    offer: RTCSessionDescriptionInit,
    fromParticipantId: string,
  ): Promise<void> {
    const pc = this.getOrCreatePeerConnection(fromParticipantId);
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await this.sendSignal(fromParticipantId, 'answer', answer);
  }

  private async handleAnswer(
    answer: RTCSessionDescriptionInit,
    fromParticipantId: string,
  ): Promise<void> {
    const pc = this.peerConnections.get(fromParticipantId);
    if (pc) {
      await pc.setRemoteDescription(answer);
    }
  }

  private async handleIceCandidate(
    candidate: RTCIceCandidateInit,
    fromParticipantId: string,
  ): Promise<void> {
    const pc = this.peerConnections.get(fromParticipantId);
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private getOrCreatePeerConnection(participantId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(participantId);

    if (!pc) {
      const currentRoom = this.currentRoom();
      pc = new RTCPeerConnection({
        iceServers: currentRoom?.iceServers || [],
      });

      this.peerConnections.set(participantId, pc);

      // Setup event handlers for this peer connection
      this.setupPeerConnectionEvents(pc, participantId);
    }

    return pc;
  }

  private setupPeerConnectionEvents(pc: RTCPeerConnection, participantId: string): void {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(participantId, 'ice-candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      // Handle remote participant's media
      console.log(`Remote track from ${participantId}:`, event.streams[0]);
    };
  }

  private startSignaling(): void {
    // Start WebSocket connection for real-time signaling
    // This would connect to the WebSocket endpoint from backend
    console.log('Starting real-time signaling...');
  }

  private broadcastAudioToggle(enabled: boolean): void {
    // Notify other participants about audio state change
    const currentRoom = this.currentRoom();
    if (!currentRoom) return;

    const event: RoomEventDto = {
      type: 'participant-audio-toggled',
      roomId: currentRoom.roomId,
      participantId: currentRoom.participantId,
      data: { enabled },
      timestamp: new Date().toISOString(),
    };

    this.roomEvents$.next(event);
  }

  private broadcastVideoToggle(enabled: boolean): void {
    // Notify other participants about video state change
    const currentRoom = this.currentRoom();
    if (!currentRoom) return;

    const event: RoomEventDto = {
      type: 'participant-video-toggled',
      roomId: currentRoom.roomId,
      participantId: currentRoom.participantId,
      data: { enabled },
      timestamp: new Date().toISOString(),
    };

    this.roomEvents$.next(event);
  }

  private startCallTimer(): void {
    this.callStartTime = Date.now();
    this.connectionTimer = setInterval(() => {
      if (this.callStartTime) {
        this.currentCallDuration.set(Math.floor((Date.now() - this.callStartTime) / 1000));
      }
    }, 1000);
  }

  private stopCallTimer(): void {
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      this.connectionTimer = null;
    }
    this.callStartTime = null;
    this.currentCallDuration.set(0);
  }

  private startHeartbeat(): void {
    // Send periodic keep-alive messages to maintain connection
    this.heartbeatInterval = setInterval(() => {
      // Send heartbeat to backend
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.error.set(`${message}: ${error?.message || error}`);

    // Auto-leave room on critical errors
    if (message.includes('critical') || message.includes('authentication')) {
      setTimeout(() => this.leaveRoom(), 3000);
    }
  }

  // =====================================
  // PUBLIC GETTERS
  // =====================================

  get isInCall(): boolean {
    return this.connectionState() === 'connected';
  }

  get participantCount(): number {
    return this.participants().length + (this.localStream() ? 1 : 0);
  }

  get formattedCallDuration(): string {
    const totalSeconds = this.currentCallDuration();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

