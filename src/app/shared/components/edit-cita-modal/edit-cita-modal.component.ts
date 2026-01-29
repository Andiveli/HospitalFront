import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  CitaDetalladaResponseDto,
  DisponibilidadResponseDto,
  SlotDisponibleDto,
  UpdateCitaDto,
} from '../../../core/models';
import { CitasService } from '../../../core/services/citas.service';
import { MedicosService } from '../../../core/services/medicos.service';

@Component({
  selector: 'app-edit-cita-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-cita-modal.component.html',
  styleUrl: './edit-cita-modal.component.scss',
})
export default class EditCitaModalComponent {
  private readonly citasService = inject(CitasService);
  private readonly medicosService = inject(MedicosService);

  // =====================================
  // INPUTS & OUTPUTS
  // =====================================
  cita = input.required<CitaDetalladaResponseDto>();
  onClose = output<void>();
  onSave = output<void>();

  // =====================================
  // STATE
  // =====================================
  isOpen = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  // Form data
  selectedDate = signal<Date | null>(null);
  selectedSlot = signal<SlotDisponibleDto | null>(null);
  // TEMPORARY: Force telefonica until presencial functionality is ready
  telefonica = signal(true);

  // Disponibilidad data
  diasAtencion = signal<number[]>([]);
  disponibilidad = signal<DisponibilidadResponseDto | null>(null);
  loadingDisponibilidad = signal(false);

  // =====================================
  // COMPUTED
  // =====================================
  hasSelectedDate = computed(() => this.selectedDate() !== null);
  hasSelectedSlot = computed(() => this.selectedSlot() !== null);
  canSave = computed(() => {
    return this.hasSelectedDate() && this.hasSelectedSlot() && !this.loading();
  });

  availableSlots = computed(() => {
    const disp = this.disponibilidad();
    if (!disp || !disp.atiende) return [];

    const slots = disp.slots || [];
    const selectedDate = this.selectedDate();
    if (!selectedDate) return slots;

    // Filter past times if today
    const today = new Date();
    const isToday =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate();

    if (!isToday) return slots;

    const now = new Date();
    return slots.filter((slot) => {
      const [hours, minutes] = slot.horaInicio.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, minutes, 0, 0);
      return slotTime > now;
    });
  });

  // =====================================
  // CONSTRUCTOR
  // =====================================
  constructor() {
    // Initialize form with current cita data when cita changes
    effect(() => {
      const citaData = this.cita();
      if (citaData) {
        this.initializeForm(citaData);
      }
    });
  }

  // =====================================
  // METHODS - Modal Control
  // =====================================
  open(): void {
    this.isOpen.set(true);
    this.error.set(null);
    this.loadDiasAtencion();
  }

  close(): void {
    this.isOpen.set(false);
    this.onClose.emit();
  }

  // =====================================
  // METHODS - Form Initialization
  // =====================================
  private initializeForm(cita: CitaDetalladaResponseDto): void {
    // Set initial date
    const citaDate = new Date(cita.fechaHoraInicio);
    this.selectedDate.set(citaDate);

    // Set telefonica
    this.telefonica.set(cita.telefonica);

    // Extract slot from cita
    const hours = citaDate.getHours().toString().padStart(2, '0');
    const minutes = citaDate.getMinutes().toString().padStart(2, '0');
    const horaInicio = `${hours}:${minutes}`;

    // Create a temporary slot (we'll load the real ones from disponibilidad)
    this.selectedSlot.set({
      horaInicio,
      horaFin: '', // Will be filled when we load disponibilidad
    });
  }

  // =====================================
  // METHODS - Load Data
  // =====================================
  async loadDiasAtencion(): Promise<void> {
    try {
      const medicoId = this.cita().medico.id;
      const dias = await this.medicosService.getDiasAtencion(medicoId);
      this.diasAtencion.set(dias);

      // Load disponibilidad for current selected date
      const currentDate = this.selectedDate();
      if (currentDate) {
        await this.loadDisponibilidad(currentDate);
      }
    } catch (error) {
      console.error('Error loading días de atención:', error);
      this.error.set('Error al cargar días de atención del médico');
    }
  }

  async loadDisponibilidad(date: Date): Promise<void> {
    this.loadingDisponibilidad.set(true);
    this.error.set(null);

    try {
      const medicoId = this.cita().medico.id;
      const dateStr = this.formatDateForAPI(date);
      const disp = await this.medicosService.getDisponibilidad(medicoId, dateStr);
      this.disponibilidad.set(disp);

      if (!disp.atiende) {
        this.error.set(disp.mensaje || 'El médico no atiende este día');
        this.selectedSlot.set(null);
      }
    } catch (error: any) {
      console.error('Error loading disponibilidad:', error);
      this.error.set('Error al cargar disponibilidad');
      this.disponibilidad.set(null);
    } finally {
      this.loadingDisponibilidad.set(false);
    }
  }

  // =====================================
  // METHODS - Date Selection
  // =====================================
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const dateStr = input.value;

    if (!dateStr) {
      this.selectedDate.set(null);
      this.selectedSlot.set(null);
      this.disponibilidad.set(null);
      return;
    }

    // Parse date as local (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Validate date is in the future
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + 3); // 72 hours = 3 days

    if (date < minDate) {
      this.error.set('La cita debe ser al menos 72 horas en el futuro');
      this.selectedDate.set(null);
      return;
    }

    // Validate day is in días de atención
    const dayOfWeek = date.getDay();
    const dias = this.diasAtencion();
    if (dias.length > 0 && !dias.includes(dayOfWeek)) {
      this.error.set('El médico no atiende este día de la semana');
      this.selectedDate.set(null);
      return;
    }

    // Set date and load disponibilidad
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    this.loadDisponibilidad(date);
  }

  onSlotChange(slot: SlotDisponibleDto): void {
    this.selectedSlot.set(slot);
    this.error.set(null);
  }

  onTelefonicaChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.telefonica.set(checkbox.checked);
  }

  // =====================================
  // METHODS - Save
  // =====================================
  async save(): Promise<void> {
    if (!this.canSave()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const date = this.selectedDate()!;
      const slot = this.selectedSlot()!;

      // Create ISO datetime string
      const [hours, minutes] = slot.horaInicio.split(':').map(Number);
      const fechaHoraInicio = new Date(date);
      fechaHoraInicio.setHours(hours, minutes, 0, 0);

      const updateDto: UpdateCitaDto = {
        fechaHoraInicio: fechaHoraInicio.toISOString(),
        // TEMPORARY: Force telefonica until presencial functionality is ready
        telefonica: true,
      };

      await this.citasService.updateCita(this.cita().id, updateDto);

      // Success
      this.close();
      this.onSave.emit();
    } catch (error: any) {
      console.error('Error updating cita:', error);
      this.error.set(error?.error?.message || 'Error al actualizar la cita. Intente nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }

  // =====================================
  // HELPER METHODS
  // =====================================
  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMinDate(): string {
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + 3); // 72 hours minimum
    return this.formatDateForAPI(minDate);
  }

  getMedicoNombre(): string {
    const medico = this.cita().medico;
    return `Dr. ${medico.nombre} ${medico.apellido}`;
  }

  getEspecialidad(): string {
    return this.cita().medico.especialidad;
  }

  isDayAvailable(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return this.diasAtencion().includes(dayOfWeek);
  }
}
