import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AuthResponseDto,
  BackendPerfilResponseDto,
  ChangePasswordDto,
  EnfermedadPaciente,
  ForgotPasswordDto,
  LoginDto,
  MedicoProfileWrapperDto,
  MensajeResponseDto,
  PerfilResponseDto,
  ResetPasswordDto,
  SignupDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'hospital_token';

  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly userSignal = signal<PerfilResponseDto | null>(null);
  private readonly medicoProfileSignal = signal<MedicoProfileWrapperDto | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly medicoProfile = this.medicoProfileSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.userSignal());
  readonly isDoctor = computed(
    () => this.user()?.roles.includes('doctor') || this.user()?.roles.includes('medico')
  );
  readonly isPatient = computed(
    () => this.user()?.roles.includes('patient') || this.user()?.roles.includes('paciente')
  );
  readonly isAdmin = computed(
    () => this.user()?.roles.includes('admin') || this.user()?.roles.includes('administrador')
  );
  readonly hasBothRoles = computed(() => this.isDoctor() && this.isPatient());

  async initialize(): Promise<void> {
    if (this.tokenSignal()) {
      try {
        await this.loadUserProfile();
      } catch {
        this.clearAuth();
      }
    }
  }

  async login(credentials: LoginDto): Promise<void> {
    this.loadingSignal.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponseDto>(`${this.API_URL}/login`, credentials)
      );

      const token = response.data.token;
      this.setToken(token);

      await this.loadUserProfile();

      await this.redirectToDashboard();
    } catch (error) {
      this.clearAuth();
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async signup(data: SignupDto): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(this.http.post<MensajeResponseDto>(this.API_URL, data));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async logout(): Promise<void> {
    this.clearAuth();
    await this.router.navigate(['/auth/login']);
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(
        this.http.post<MensajeResponseDto>(`${this.API_URL}/olvide-password`, data)
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async resetPassword(token: string, data: ResetPasswordDto): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(
        this.http.post<MensajeResponseDto>(`${this.API_URL}/recuperar-password/${token}`, data)
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Confirms user email with the token sent via email
   * GET /auth/confirmar/{token}
   */
  async confirmEmail(token: string): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(
        this.http.get<MensajeResponseDto>(`${this.API_URL}/confirmar/${token}`)
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Validates the password reset token
   * GET /auth/recuperar-password/{token}
   */
  async validateResetToken(token: string): Promise<MensajeResponseDto> {
    return await firstValueFrom(
      this.http.get<MensajeResponseDto>(`${this.API_URL}/recuperar-password/${token}`)
    );
  }

  async changePassword(data: ChangePasswordDto): Promise<MensajeResponseDto> {
    this.loadingSignal.set(true);
    try {
      return await firstValueFrom(
        this.http.post<MensajeResponseDto>(`${this.API_URL}/cambiarPass`, data)
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadUserProfile(): Promise<void> {
    if (!this.tokenSignal()) {
      return;
    }

    try {
      const backendResponse = await firstValueFrom(
        this.http.get<BackendPerfilResponseDto>(`${this.API_URL}/perfil`)
      );

      const enfermedadesMap = backendResponse.data.perfiles.paciente?.enfermedades || {};
      const enfermedades: EnfermedadPaciente[] = Object.entries(enfermedadesMap).map(
        ([nombre, tipo]) => ({ nombre, tipo })
      );

      const medicoData = backendResponse.data.perfiles.medico?.data;

      const profile: PerfilResponseDto = {
        id: backendResponse.data.userId,
        cedula: backendResponse.data.perfiles.paciente?.cedula || medicoData?.cedula,
        email: backendResponse.data.email,
        nombreCompleto:
          backendResponse.data.perfiles.paciente?.nombres.trim() ||
          medicoData?.nombreCompleto.trim() ||
          'Usuario',
        roles: backendResponse.data.roles,
        edad: backendResponse.data.perfiles.paciente?.edad,
        telefono: backendResponse.data.perfiles.paciente?.telefono || medicoData?.telefono,
        pais: backendResponse.data.perfiles.paciente?.pais,
        genero: backendResponse.data.perfiles.paciente?.genero || medicoData?.genero,
        residencia: backendResponse.data.perfiles.paciente?.residencia,
        sangre: backendResponse.data.perfiles.paciente?.sangre,
        estilo: backendResponse.data.perfiles.paciente?.estilo,
        imagen: backendResponse.data.perfiles.paciente?.imagen || medicoData?.fotoPerfil,
        enfermedades,
      };

      this.userSignal.set(profile);

      if (backendResponse.data.perfiles.medico) {
        this.medicoProfileSignal.set(backendResponse.data.perfiles.medico);
      }
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

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
    this.medicoProfileSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Redirect user based on their role priority
   * Admin > Doctor > Patient
   */
  async redirectToDashboard(): Promise<void> {
    if (this.isAdmin()) {
      await this.router.navigate(['/admin/dashboard']);
    } else if (this.isDoctor()) {
      await this.router.navigate(['/doctor/dashboard']);
    } else if (this.isPatient()) {
      await this.router.navigate(['/dashboard']);
    } else {
      await this.router.navigate(['/auth/login']);
    }
  }
}
