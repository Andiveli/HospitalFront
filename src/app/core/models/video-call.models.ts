// =====================================
// VIDEO CALL ROOM MODELS
// Synchronized with Backend WebSocket Documentation
// =====================================

// =====================================
// ENUMS & TYPES
// =====================================

// Backend participant roles (Spanish)
export type BackendParticipantRole =
  | 'medico'
  | 'paciente'
  | 'invitado'
  | 'acompanante'
  | 'especialista'
  | 'traductor';

// Frontend normalized participant roles (English)
export type ParticipantRole =
  | 'doctor'
  | 'patient'
  | 'guest'
  | 'companion'
  | 'specialist'
  | 'translator';

// Guest invitation role types
export type GuestRole = 'invitado' | 'acompanante' | 'especialista' | 'traductor';

// WebRTC signal types
export type SignalType = 'offer' | 'answer' | 'ice-candidate';

// Chat message types from backend
export type BackendChatMessageType = 'texto' | 'imagen' | 'archivo' | 'audio';

// Frontend chat message types
export type ChatMessageType = 'text' | 'image' | 'file' | 'audio' | 'system';

// Recording status
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

// Recording actions
export type RecordingAction = 'start' | 'stop' | 'pause' | 'resume';

// =====================================
// WEBSOCKET DTOs - CLIENT → SERVER (Entrada)
// =====================================

// Join room request
export interface JoinRoomDto {
  citaId: number;
  usuarioId?: number | null; // null for guests
  odontollamaId?: number; // Alias for usuarioId (frontend compatibility)
  token?: string; // JWT access token for guests
  nombreInvitado?: string; // Guest name (only for guests without account)
}

// Leave room request
export interface RoomLeaveDto {
  citaId: number;
}

// Send chat message request
export interface SendChatMessageDto {
  citaId: number;
  contenidoTexto?: string;
  contenidoUrl?: string; // Attached file URL
  tipoMensaje: BackendChatMessageType;
}

// Toggle microphone request
export interface ToggleMicDto {
  citaId: number;
  enabled: boolean;
}

// Toggle camera request
export interface ToggleCameraDto {
  citaId: number;
  enabled: boolean;
}

// Recording control request
export interface RecordingControlDto {
  citaId: number;
  action: RecordingAction;
}

// Recording chunk upload
export interface RecordingChunkDto {
  citaId: number;
  chunkIndex: number;
  data: string; // Base64 encoded chunk
  isLast: boolean;
}

// WebRTC signal request
export interface WebRtcSignalDto {
  to: string; // Recipient socket ID
  type: SignalType;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | object;
}

// =====================================
// WEBSOCKET DTOs - SERVER → CLIENT (Salida)
// =====================================

// Participant info from backend
export interface BackendParticipantInfoDto {
  socketId: string;
  participanteId: number;
  usuarioId?: number | null;
  nombre: string;
  rol: BackendParticipantRole;
  micEnabled: boolean;
  cameraEnabled: boolean;
  isScreenSharing: boolean;
  joinedAt: string;
}

// Room joined event response
export interface RoomJoinedEventDto {
  success: boolean;
  room?: string; // Room name (e.g., "cita_123")
  userInfo?: BackendParticipantInfoDto;
  participants?: BackendParticipantInfoDto[];
  error?: string; // Error message if success=false
}

// User connected event (new participant joined)
export interface UserConnectedEventDto extends BackendParticipantInfoDto {}

// User disconnected event
export interface UserDisconnectedEventDto {
  socketId: string;
  participanteId?: number;
}

// Chat participant info (nested in chat message)
export interface ChatParticipantInfoDto {
  id: number;
  nombre: string;
  rol: BackendParticipantRole;
}

// Chat message event from backend
export interface ChatMessageEventDto {
  id: number;
  citaId: number;
  contenidoTexto?: string;
  contenidoUrl?: string;
  tipoMensaje: BackendChatMessageType;
  fechaHoraEnvio: string;
  from: string; // Sender socket ID
  participante: ChatParticipantInfoDto;
}

// Media state update event
export interface MediaStateUpdateEventDto {
  socketId: string;
  participanteId: number;
  micEnabled: boolean;
  cameraEnabled: boolean;
  nombre: string;
  rol: BackendParticipantRole;
}

// Recording state event
export interface RecordingStateEventDto {
  status: RecordingStatus;
  startedBy?: number;
  startedAt?: string;
  duration?: number; // Seconds (only when stopped)
  error?: string;
}

// Recording chunk acknowledgment
export interface RecordingChunkAckEventDto {
  chunkIndex: number;
  received: boolean;
  error?: string;
}

// WebRTC signal event from backend
export interface WebRtcSignalEventDto {
  from: string; // Sender socket ID
  sdp?: RTCSessionDescriptionInit; // For offer/answer
  candidate?: RTCIceCandidateInit; // For ice-candidate
  payload?: object; // Additional data
}

// Error event
export interface ErrorEventDto {
  error: string;
}

// WebSocket exception event
export interface WsExceptionEventDto {
  status: number;
  message: string;
  errors?: string[];
  timestamp: string;
}

// =====================================
// SESSION TIME MANAGEMENT DTOs
// =====================================

// Time warning event (sent at 5min and 1min before session ends)
export interface TimeWarningEventDto {
  citaId: number;
  tiempoRestante: number; // seconds remaining
  tipo: '5min' | '1min' | '30sec';
  mensaje: string;
}

// Session ended event (sent when session time expires)
export interface SessionEndedEventDto {
  citaId: number;
  razon: 'tiempo_expirado' | 'medico_finalizo' | 'paciente_abandono' | 'error_sistema';
  mensaje: string;
  timestamp: string;
  requiereRegistroMedico: boolean; // Only true for doctor role
}

// =====================================
// MEDICAL RECORD DTOs
// =====================================

// Medical attention record creation request
export interface CreateRegistroAtencionDto {
  citaId: number;
  diagnostico: string;
  tratamiento: string;
  recetas?: RecetaMedicaDto[];
  notas?: string;
  proximaCitaRecomendada?: string; // ISO date string
}

// Medical prescription item
export interface RecetaMedicaDto {
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  instrucciones?: string;
}

// Medical attention record response
export interface RegistroAtencionResponseDto {
  id: number;
  citaId: number;
  medicoId: number;
  pacienteId: number;
  diagnostico: string;
  tratamiento: string;
  recetas: RecetaMedicaDto[];
  notas?: string;
  fechaAtencion: string;
  createdAt: string;
}

// =====================================
// INVITATION DTOs
// =====================================

// Guest invitation creation request
export interface GenerarInvitacionDto {
  nombreInvitado: string;
  rolInvitado?: GuestRole;
}

// Guest invitation response (from POST /invitaciones/{citaId}/generar-link-invitado)
export interface LinkInvitacionDataDto {
  linkInvitacion: string; // Full URL to share with guest
  codigoAcceso: string; // 8-character alphanumeric code
  expiraEn: string; // Validity time (e.g., "24 horas")
  rolInvitado?: GuestRole;
}

// Guest validation response (from GET /invitaciones/invitado/{codigo})
export interface ValidacionInvitadoDataDto {
  valido: boolean;
  citaId: number;
  nombreSesion: string;
  nombreMedico: string;
  nombrePaciente: string;
  fechaHoraInicio: string;
  nombreInvitado: string;
  rolInvitado: GuestRole;
}

// =====================================
// FRONTEND NORMALIZED DTOs
// =====================================

// Normalized participant info for frontend use
export interface ParticipantInfoDto {
  id: string; // Socket ID
  name: string;
  role: ParticipantRole;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking: boolean;
  joinedAt: string;
  mediaStream?: MediaStream; // WebRTC media stream (frontend only)
}

// Normalized chat message for frontend use
export interface ChatMessageDto {
  id: string;
  fromParticipantId: string;
  fromParticipantName: string;
  fromParticipantRole: ParticipantRole;
  message: string;
  type: ChatMessageType;
  timestamp: string;
  attachmentUrl?: string;
}

// =====================================
// LEGACY DTOs (kept for compatibility)
// =====================================

// @deprecated Use LinkInvitacionDataDto instead
export interface InvitacionResponseDto {
  id: string;
  codigo: string;
  nombreInvitado: string;
  rolInvitado: GuestRole;
  citaId: number;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  accessUrl: string;
}

// @deprecated Use ValidacionInvitadoDataDto instead
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

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Convert backend role (Spanish) to frontend role (English)
 */
export function normalizeRole(backendRole: BackendParticipantRole | string): ParticipantRole {
  const roleMap: Record<string, ParticipantRole> = {
    medico: 'doctor',
    paciente: 'patient',
    invitado: 'guest',
    acompanante: 'companion',
    especialista: 'specialist',
    traductor: 'translator',
  };
  return roleMap[backendRole] || 'guest';
}

/**
 * Convert backend chat message type to frontend type
 */
export function normalizeChatMessageType(
  backendType: BackendChatMessageType | string
): ChatMessageType {
  const typeMap: Record<string, ChatMessageType> = {
    texto: 'text',
    imagen: 'image',
    archivo: 'file',
    audio: 'audio',
  };
  return typeMap[backendType] || 'text';
}

/**
 * Convert backend participant to frontend format
 */
export function normalizeParticipant(backend: BackendParticipantInfoDto): ParticipantInfoDto {
  return {
    id: backend.socketId,
    name: backend.nombre,
    role: normalizeRole(backend.rol),
    isVideoEnabled: backend.cameraEnabled,
    isAudioEnabled: backend.micEnabled,
    isSpeaking: false,
    joinedAt: backend.joinedAt,
  };
}

/**
 * Convert backend chat message to frontend format
 */
export function normalizeChatMessage(backend: ChatMessageEventDto): ChatMessageDto {
  return {
    id: String(backend.id),
    fromParticipantId: backend.from,
    fromParticipantName: backend.participante.nombre,
    fromParticipantRole: normalizeRole(backend.participante.rol),
    message: backend.contenidoTexto || '',
    type: normalizeChatMessageType(backend.tipoMensaje),
    timestamp: backend.fechaHoraEnvio,
    attachmentUrl: backend.contenidoUrl,
  };
}
