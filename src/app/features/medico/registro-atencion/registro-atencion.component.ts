import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  type FormArray,
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { RegistroAtencionResponseDto } from '../../../core/models/video-call.models';
import { AuthService } from '../../../core/services/auth.service';
import { VideoCallService } from '../../../core/services/video-call.service';

@Component({
  selector: 'app-registro-atencion',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-atencion.component.html',
  styleUrl: './registro-atencion.component.scss',
})
export class RegistroAtencionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly videoCallService = inject(VideoCallService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // State
  citaId = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Form
  registroForm: FormGroup;

  constructor() {
    // Get citaId from route params
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.citaId.set(parseInt(id, 10));
    }

    // Initialize form
    this.registroForm = this.fb.group({
      diagnostico: ['', [Validators.required, Validators.minLength(10)]],
      tratamiento: ['', [Validators.required, Validators.minLength(10)]],
      notas: [''],
      proximaCitaRecomendada: [''],
      recetas: this.fb.array([]),
    });

    // Check if user is doctor
    if (!this.authService.isDoctor()) {
      this.error.set('Solo los médicos pueden crear registros de atención');
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    }
  }

  // Getter for recetas FormArray
  get recetas(): FormArray {
    return this.registroForm.get('recetas') as FormArray;
  }

  // Create a new receta form group
  createRecetaGroup(): FormGroup {
    return this.fb.group({
      medicamento: ['', Validators.required],
      dosis: ['', Validators.required],
      frecuencia: ['', Validators.required],
      duracion: ['', Validators.required],
      instrucciones: [''],
    });
  }

  // Add a new receta
  addReceta(): void {
    this.recetas.push(this.createRecetaGroup());
  }

  // Remove a receta
  removeReceta(index: number): void {
    this.recetas.removeAt(index);
  }

  // Submit form
  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registroForm.controls).forEach((key) => {
        const control = this.registroForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const citaId = this.citaId();
    if (!citaId) {
      this.error.set('No se encontró el ID de la cita');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      const formValue = this.registroForm.value;

      const data = {
        citaId,
        diagnostico: formValue.diagnostico,
        tratamiento: formValue.tratamiento,
        notas: formValue.notas || undefined,
        proximaCitaRecomendada: formValue.proximaCitaRecomendada || undefined,
        recetas: formValue.recetas?.length > 0 ? formValue.recetas : undefined,
      };

      const result = await this.videoCallService.createRegistroAtencion(data);

      console.log('[RegistroAtencion] Created:', result);
      this.success.set(true);

      // Redirect after success
      setTimeout(() => {
        this.router.navigate(['/citas/medico']);
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al crear el registro de atención';
      this.error.set(errorMessage);
      console.error('[RegistroAtencion] Error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // Go back
  goBack(): void {
    this.router.navigate(['/citas/medico']);
  }

  // Dismiss error
  dismissError(): void {
    this.error.set(null);
  }
}
