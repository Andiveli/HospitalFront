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
export interface SignupDto {
  cedula: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  email: string;
  password: string;
  confirmarPassword: string;
  genero: number; // 1 = Masculino, 2 = Femenino, 3 = Otro
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
        cedula: string;
        nombres: string;
        edad: number;
        email: string;
        telefono: string;
        pais: string;
        genero: string;
        residencia: string;
        sangre: string;
        estilo: string;
        imagen: string | null;
        enfermedades: Record<string, string>;
      };
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

export interface ResetPasswordDto {
  password: string;
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
