import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LoginDto,
  SignupDto,
  AuthResponseDto,
  PerfilResponseDto,
  BackendPerfilResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MensajeResponseDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = 'http://localhost:3000/auth';
  private readonly TOKEN_KEY = 'hospital_token';

  // Signals para el estado de autenticación
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly userSignal = signal<PerfilResponseDto | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  // Computed signals (valores derivados)
  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.userSignal());

  constructor() {
    // Constructor vacío - la inicialización se hace en initialize()
  }

  // ==========================================
  // App Initialization (called by APP_INITIALIZER)
  // ==========================================

  async initialize(): Promise<void> {
    // Si hay token almacenado, cargar el perfil del usuario
    if (this.tokenSignal()) {
      try {
        console.log('🔄 AuthService: Inicializando app, cargando perfil...');
        await this.loadUserProfile();
        console.log('✅ AuthService: Perfil cargado exitosamente en inicialización');
      } catch (error) {
        console.error('❌ Error al cargar perfil en inicialización:', error);
        // Si falla, limpiar la autenticación
        this.clearAuth();
      }
    } else {
      console.log('ℹ️ AuthService: No hay token, usuario no autenticado');
    }
  }

  // ==========================================
  // Authentication Methods
  // ==========================================

  async login(credentials: LoginDto): Promise<void> {
    this.loadingSignal.set(true);
    try {
      console.log('🔄 AuthService: Enviando request a:', `${this.API_URL}/login`);
      console.log('🔄 AuthService: Credenciales:', credentials);

      const response = await firstValueFrom(
        this.http.post<AuthResponseDto>(`${this.API_URL}/login`, credentials),
      );

      console.log('✅ AuthService: Response recibida:', response);

      const token = response.data.token;
      this.setToken(token);

      console.log('🔄 AuthService: Cargando perfil de usuario...');
      await this.loadUserProfile();

      console.log('✅ AuthService: Login exitoso, redirigiendo a dashboard');
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('❌ AuthService: Error en login:', error);
      this.clearAuth();
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async signup(data: SignupDto): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      console.log('🔄 AuthService: Registrando usuario en:', this.API_URL);
      console.log('🔄 AuthService: Data:', data);
      return await firstValueFrom(this.http.post<MensajeResponseDto>(this.API_URL, data));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async logout(): Promise<void> {
    this.clearAuth();
    await this.router.navigate(['/auth/login']);
  }

  // ==========================================
  // Password Recovery
  // ==========================================

  async forgotPassword(data: ForgotPasswordDto): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(
        this.http.post<MensajeResponseDto>(`${this.API_URL}/olvide-password`, data),
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async resetPassword(token: string, data: ResetPasswordDto): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(
        this.http.post<MensajeResponseDto>(`${this.API_URL}/recuperar-password/${token}`, data),
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async changePassword(data: ChangePasswordDto): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(
        this.http.post<MensajeResponseDto>(`${this.API_URL}/cambiarPass`, data),
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // ==========================================
  // User Profile
  // ==========================================

  async loadUserProfile(): Promise<void> {
    if (!this.tokenSignal()) {
      console.log('⚠️ AuthService: No token, no se puede cargar perfil');
      return;
    }

    try {
      console.log('🔄 AuthService: Cargando perfil de usuario...');
      const backendResponse = await firstValueFrom(
        this.http.get<BackendPerfilResponseDto>(`${this.API_URL}/perfil`),
      );
      console.log('✅ AuthService: Respuesta del backend:', backendResponse);
      
      // Mapear la respuesta del backend al formato del frontend
      const profile: PerfilResponseDto = {
        id: backendResponse.data.userId,
        email: backendResponse.data.email,
        nombreCompleto: backendResponse.data.perfiles.paciente?.nombres.trim() || 'Usuario',
        roles: backendResponse.data.roles,
        edad: backendResponse.data.perfiles.paciente?.edad,
        telefono: backendResponse.data.perfiles.paciente?.telefono,
        pais: backendResponse.data.perfiles.paciente?.pais,
        genero: backendResponse.data.perfiles.paciente?.genero,
        residencia: backendResponse.data.perfiles.paciente?.residencia,
        sangre: backendResponse.data.perfiles.paciente?.sangre,
        estilo: backendResponse.data.perfiles.paciente?.estilo,
        imagen: backendResponse.data.perfiles.paciente?.imagen,
      };
      
      console.log('✅ AuthService: Perfil normalizado:', profile);
      this.userSignal.set(profile);
      console.log('✅ AuthService: userSignal actualizado. isAuthenticated:', this.isAuthenticated());
    } catch (error) {
      console.error('❌ AuthService: Error cargando perfil:', error);
      // Si falla cargar el perfil, limpiar autenticación
      this.clearAuth();
      throw error;
    }
  }

  // ==========================================
  // Token Management
  // ==========================================

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  // ==========================================
  // Public Getters (for interceptor)
  // ==========================================

  getToken(): string | null {
    return this.tokenSignal();
  }
}
