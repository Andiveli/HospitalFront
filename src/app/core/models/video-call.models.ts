// =====================================
// VIDEO CALL ROOM MODELS
// =====================================

// Guest invitation role types
export type GuestRole = 'invitado' | 'acompanante' | 'especialista' | 'traductor';

// Participant roles in video room
export type ParticipantRole = 'patient' | 'doctor' | 'guest' | 'specialist' | 'translator';

// WebRTC signal types
export type SignalType = 'offer' | 'answer' | 'ice-candidate';

// Video room session info
export interface VideoRoomSessionDto {
  roomId: string;
  sessionToken: string;
  participantId: string;
  participantRole: ParticipantRole;
  iceServers: RTCIceServer[];
  participants: ParticipantInfoDto[];
  createdAt: string;
  expiresAt: string;
}

// Participant information
export interface ParticipantInfoDto {
  id: string;               // Socket ID or unique identifier
  name: string;             // Display name
  role: ParticipantRole;      // Role in the call
  isVideoEnabled: boolean;   // Video stream status
  isAudioEnabled: boolean;   // Audio stream status
  isSpeaking: boolean;      // Currently speaking
  joinedAt: string;         // When they joined the room
  mediaStream?: MediaStream;  // WebRTC media stream (frontend only)
}

// Guest invitation creation request
export interface GenerarInvitacionDto {
  nombreInvitado: string;
  rolInvitado?: GuestRole;
}

// Guest invitation response
export interface InvitacionResponseDto {
  id: string;
  codigo: string;            // 8-character access code
  nombreInvitado: string;
  rolInvitado: GuestRole;
  citaId: number;
  createdBy: string;         // Who created the invitation
  createdAt: string;
  expiresAt: string;
  accessUrl: string;        // Full URL for guest access
}

// Guest invitation creation response (from video-rooms endpoint)
export interface GenerateGuestLinkResponseDto {
  guestCode: string;           // 8-character code
  accessUrl: string;            // Full URL
  expiresIn: number;            // Hours until expiry (default: 24)
  maxUses: number;             // Max times link can be used
  currentUses: number;          // How many times used
}

// Guest validation response (public endpoint)
export interface GuestValidationDto {
  isValid: boolean;
  citaId: number;
  pacienteNombre: string;
  medicoNombre: string;
  guestInfo: {
    nombre: string;
    rol: GuestRole;
  };
  roomInfo?: {
    roomId: string;
    sessionToken: string;
  };
}

// WebRTC signaling DTO
export interface WebRtcSignalDto {
  to: string;               // Recipient participant ID
  from: string;             // Sender participant ID
  type: SignalType;         // Signal type
  payload: object;          // SDP offer/answer or ICE candidate
  timestamp: string;         // When signal was sent
}

// Room creation request/response
export interface CreateVideoRoomResponseDto {
  roomId: string;
  sessionToken: string;
  iceServers: RTCIceServer[];
  signalingUrl: string;
  maxParticipants: number;
  recordingEnabled: boolean;
}

// Room join request/response
export interface JoinVideoRoomResponseDto {
  roomId: string;
  participantId: string;
  sessionToken: string;
  iceServers: RTCIceServer[];
  existingParticipants: ParticipantInfoDto[];
  signalingUrl: string;
}

// Guest link generation response
export interface GenerateGuestLinkResponseDto {
  guestCode: string;           // 8-character code
  accessUrl: string;            // Full URL
  expiresIn: number;            // Hours until expiry (default: 24)
  maxUses: number;             // Max times link can be used
  currentUses: number;          // How many times used
}

// Room end response
export interface EndVideoRoomResponseDto {
  roomId: string;
  endedAt: string;
  participantCount: number;     // How many participants attended
  duration: number;             // Call duration in seconds
  recordingUrl?: string;        // URL to call recording if enabled
  participantSummary: {
    totalDuration: number;        // Total minutes per participant
    joinedAt: string;
    leftAt: string;
  }[];
}

// Chat message types
export type ChatMessageType = 'text' | 'system' | 'file' | 'medical-note';

// Chat message in video call
export interface ChatMessageDto {
  id: string;
  fromParticipantId: string;
  fromParticipantName: string;
  fromParticipantRole: ParticipantRole;
  message: string;
  type: ChatMessageType;
  timestamp: string;
  isEdited?: boolean;
  isRead?: boolean;
  attachments?: ChatAttachmentDto[];
}

// Chat file attachment
export interface ChatAttachmentDto {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// Real-time room events (WebSocket)
export type RoomEventType = 
  | 'participant-joined'
  | 'participant-left'
  | 'participant-audio-toggled'
  | 'participant-video-toggled'
  | 'participant-speaking'
  | 'room-ended'
  | 'recording-started'
  | 'recording-stopped'
  | 'chat-message';

// Room event payload
export interface RoomEventDto {
  type: RoomEventType;
  roomId: string;
  participantId?: string;
  data: any;                  // Event-specific data
  timestamp: string;
}

// Screen sharing configuration
export interface ScreenShareConfigDto {
  enabled: boolean;
  maxResolution: '720p' | '1080p' | '4k';
  frameRate: number;
  audioEnabled: boolean;
}

// Recording configuration
export interface RecordingConfigDto {
  enabled: boolean;
  autoRecord: boolean;         // Start recording automatically
  maxDuration: number;         // Maximum minutes
  storageLocation: 'cloud' | 'local';
}

// Call quality metrics
export interface CallQualityMetricsDto {
  participantId: string;
  videoResolution: string;
  audioBitrate: number;
  videoBitrate: number;
  packetLoss: number;
  latency: number;
  connectionStability: number;  // 0-100 score
  timestamp: string;
}

// Technical configuration for WebRTC
export interface WebRtcConfigDto {
  iceServers: RTCIceServer[];
  enableVideo: boolean;
  enableAudio: boolean;
  videoConstraints: MediaStreamConstraints['video'];
  audioConstraints: MediaStreamConstraints['audio'];
  screenShareConfig?: ScreenShareConfigDto;
  recordingConfig?: RecordingConfigDto;
}