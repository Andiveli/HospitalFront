// ==========================================
// Auth DTOs - Based on Backend API
// ==========================================

// Login Request & Response
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  message: string;
  data: {
    token: string;
  };
}

// Signup Request
// Backend expects: passwordHash (not password), confirmPassword (not confirmarPassword)
export interface SignupDto {
  cedula: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  email: string;
  passwordHash: string; // Backend expects 'passwordHash'
  confirmPassword: string; // Backend expects 'confirmPassword'
  genero: number; // 1 = Masculino, 2 = Femenino, 3 = Otro
}

// Horario del médico en /auth/perfil
export interface MedicoHorarioDto {
  dia: string; // "Lunes", "Martes", etc.
  horaInicio: string; // "08:00:00"
  horaFin: string; // "16:00:00"
}

// Especialidad del médico
export interface MedicoEspecialidadDto {
  nombre: string;
  descripcion?: string;
  principal?: boolean;
}

// Datos del médico (nested en data.perfiles.medico.data)
export interface MedicoDataDto {
  nombreCompleto: string;
  email: string;
  cedula: string;
  licenciaMedica: string;
  pasaporte?: string;
  telefono?: string;
  genero?: string;
  fotoPerfil?: string;
  especialidades: MedicoEspecialidadDto[];
  horarios: MedicoHorarioDto[];
  citasAtendidas: number;
}

// Wrapper del médico (message + data)
export interface MedicoProfileWrapperDto {
  message: string;
  data: MedicoDataDto;
}

// Perfil Response (lo que realmente devuelve el backend)
export interface BackendPerfilResponseDto {
  message: string;
  data: {
    userId: number;
    email: string;
    roles: string[];
    perfiles: {
      paciente?: {
        nombres: string;
        edad: number;
        email: string;
        cedula: string;
        telefono: string;
        pais: string;
        genero: string;
        residencia: string;
        sangre: string;
        estilo: string;
        imagen: string | null;
        enfermedades: Record<string, string>;
      };
      medico?: MedicoProfileWrapperDto; // Es un wrapper con message y data
    };
  };
}

// Enfermedad del paciente
export interface EnfermedadPaciente {
  nombre: string;
  tipo: string; // "Preexistente", "Hereditaria", etc.
}

// Perfil normalizado para el frontend
export interface PerfilResponseDto {
  id: number;
  cedula?: string;
  email: string;
  nombreCompleto: string;
  roles: string[];
  edad?: number;
  telefono?: string;
  pais?: string;
  genero?: string;
  residencia?: string;
  sangre?: string;
  estilo?: string;
  imagen?: string | null;
  enfermedades: EnfermedadPaciente[];
}

// Password Recovery
export interface ForgotPasswordDto {
  email: string;
}

// Reset password (POST /auth/recuperar-password/{token})
export interface ResetPasswordDto {
  password: string;
  confirmPassword: string;
}

// Change Password
export interface ChangePasswordDto {
  passwordActual: string;
  newPassword: string;
  confirmNewPass: string;
}

// Generic Message Response
export interface MensajeResponseDto {
  message: string;
}

// Auth State (for frontend)
export interface AuthState {
  user: PerfilResponseDto | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
