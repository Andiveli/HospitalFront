import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');
  readonly loading = this.authService.loading;
  
  forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });
  
  async onSubmit(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
    
    this.errorMessage.set('');
    this.successMessage.set('');
    
    try {
      const data = this.forgotForm.getRawValue();
      const response = await this.authService.forgotPassword(data);
      this.successMessage.set(response.message);
      this.forgotForm.reset();
    } catch (error: any) {
      const message = error?.error?.message || 'Error al enviar el email. Intentá de nuevo.';
      this.errorMessage.set(message);
    }
  }
  
  get email() { return this.forgotForm.get('email'); }
}
