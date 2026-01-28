import { Component, signal, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicosService } from '../../../core/services/medicos.service';
import { CitasService } from '../../../core/services/citas.service';
import {
  MedicoDisponibleDto,
  SlotDisponibleDto,
  EspecialidadDto,
  formatMedicoNombre,
} from '../../../core/models';

// Stepper state type
type Step = 1 | 2 | 3;

@Component({
  selector: 'app-agendar-cita',
  imports: [CommonModule, FormsModule],
  templateUrl: './agendar-cita.component.html',
  styleUrl: './agendar-cita.component.scss',
})
export default class AgendarCitaComponent {
  private readonly medicosService = inject(MedicosService);
  private readonly citasService = inject(CitasService);
  private readonly router = inject(Router);

  // =====================================
  // STATE - Stepper
  // =====================================
  currentStep = signal<Step>(1);

  // =====================================
  // STATE - Step 1: Doctor Selection & Filters
  // =====================================
  allMedicos = signal<MedicoDisponibleDto[]>([]); // All doctors from API
  medicos = signal<MedicoDisponibleDto[]>([]); // Filtered doctors for display
  loadingMedicos = signal(false);
  selectedMedico = signal<MedicoDisponibleDto | null>(null);

  // Specialty filter
  especialidades = signal<EspecialidadDto[]>([]);
  loadingEspecialidades = signal(false);
  selectedEspecialidadId = signal<number | null>(null);

  // Computed: extract unique specialties from loaded doctors
  especialidadesFromMedicos = computed(() => {
    const medicos = this.allMedicos();
    const especialidadesMap = new Map<number, EspecialidadDto>();

    medicos.forEach((medico) => {
      medico.especialidades.forEach((esp) => {
        if (!especialidadesMap.has(esp.id)) {
          especialidadesMap.set(esp.id, {
            id: esp.id,
            nombre: esp.nombre,
            descripcion: null,
          });
        }
      });
    });

    return Array.from(especialidadesMap.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  });

  // Computed: filtered doctors based on selected specialty
  filteredMedicos = computed(() => {
    const especialidadId = this.selectedEspecialidadId();
    const allDoctors = this.allMedicos();

    if (!especialidadId) {
      return allDoctors; // Show all doctors when no filter
    }

    return allDoctors.filter((m) => 
      m.especialidades.some(esp => esp.id === especialidadId)
    );
  });

  // =====================================
  // STATE - Step 2: Date & Time Selection
  // =====================================
  availableDays = signal<{ date: Date; label: string }[]>([]);
  selectedDate = signal<Date | null>(null);
  selectedDateFormatted = computed(() => {
    const date = this.selectedDate();
    return date ? this.medicosService.formatDateForAPI(date) : '';
  });

  availableSlots = signal<SlotDisponibleDto[]>([]);
  loadingSlots = signal(false);
  selectedSlot = signal<SlotDisponibleDto | null>(null);

  // Appointment type: telefonica = true (videocall), false (presencial)
  isTelefonica = signal(true);

  // =====================================
  // STATE - Step 3: Confirmation
  // =====================================
  submitting = signal(false);
  error = signal<string | null>(null);

  // =====================================
  // COMPUTED - For Templates
  // =====================================
  canGoToStep2 = computed(() => this.selectedMedico() !== null);
  canGoToStep3 = computed(
    () => this.selectedDate() !== null && this.selectedSlot() !== null
  );

  selectedMedicoName = computed(() => {
    const medico = this.selectedMedico();
    return medico ? formatMedicoNombre(medico) : '';
  });

  selectedMedicoEspecialidad = computed(() => {
    const medico = this.selectedMedico();
    return medico ? (medico.especialidades[0]?.nombre || 'General') : '';
  });

  selectedDateTime = computed(() => {
    const date = this.selectedDate();
    const slot = this.selectedSlot();
    if (!date || !slot) return null;

    // Combine date and time
    const [hours, minutes] = slot.horaInicio.split(':');
    const dateTime = new Date(date);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime;
  });

  selectedDateTimeFormatted = computed(() => {
    const dateTime = this.selectedDateTime();
    if (!dateTime) return '';

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const dateStr = dateTime.toLocaleDateString('es-EC', options);
    const timeStr = dateTime.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${dateStr} ${timeStr}H`;
  });

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Load doctors on init
    this.loadMedicos();

    // Update displayed doctors when filter changes
    effect(() => {
      const filtered = this.filteredMedicos();
      this.medicos.set(filtered);
    });

    // Update especialidades signal when doctors are loaded
    effect(() => {
      const especialidades = this.especialidadesFromMedicos();
      this.especialidades.set(especialidades);
    });

    // When a date is selected, load available slots
    effect(() => {
      const date = this.selectedDateFormatted();
      const medico = this.selectedMedico();

      if (date && medico) {
        this.loadAvailableSlots(medico.id, date);
      }
    });
  }

  // =====================================
  // METHODS - Load Data
  // =====================================
  async loadMedicos(): Promise<void> {
    this.loadingMedicos.set(true);
    this.error.set(null);
    try {
      const medicos = await this.medicosService.getMedicos();
      this.allMedicos.set(medicos);
      console.log('✅ Médicos cargados:', medicos.length);
    } catch (error: any) {
      console.error('❌ Error loading doctors:', error);
      const errorMsg = error?.error?.message || error?.message || 'Error desconocido';
      this.error.set(`Error al cargar los médicos: ${errorMsg}`);
    } finally {
      this.loadingMedicos.set(false);
    }
  }

  async loadAvailableSlots(medicoId: number, fecha: string): Promise<void> {
    this.loadingSlots.set(true);
    this.selectedSlot.set(null); // Reset selected slot
    this.error.set(null); // Clear previous errors
    
    try {
      console.log('🔄 AgendarCita: Cargando slots para médico', medicoId, 'fecha', fecha);
      
      const disponibilidad = await this.medicosService.getDisponibilidad(
        medicoId,
        fecha
      );

      console.log('✅ AgendarCita: Disponibilidad recibida:', disponibilidad);

      // Check if doctor works this day
      if (!disponibilidad.atiende) {
        this.availableSlots.set([]);
        this.error.set(disponibilidad.mensaje || 'El médico no atiende este día. Selecciona otra fecha.');
        return;
      }

      // Filter slots based on current time if it's today
      let filteredSlots = disponibilidad.slots;
      const now = new Date();
      const selectedDate = this.selectedDate();
      
      if (selectedDate) {
        const isToday = this.isSameDay(selectedDate, now);
        
        if (isToday) {
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          console.log(`⏰ Es HOY, hora actual: ${currentTime}`);
          
          // Only show slots that start AFTER current time
          filteredSlots = disponibilidad.slots.filter(slot => {
            const isAfter = slot.horaInicio > currentTime;
            console.log(`  Slot ${slot.horaInicio} - ${isAfter ? '✅ futuro' : '❌ pasado'}`);
            return isAfter;
          });
          
          console.log(`✅ Slots filtrados por hora: ${filteredSlots.length} de ${disponibilidad.slots.length}`);
        }
      }

      // Set available slots
      this.availableSlots.set(filteredSlots);
      console.log('✅ AgendarCita: Slots disponibles:', filteredSlots.length);
      
      if (filteredSlots.length === 0) {
        if (disponibilidad.slots.length === 0) {
          this.error.set('No hay horarios disponibles para esta fecha. Todos los turnos están ocupados.');
        } else {
          this.error.set('No hay horarios disponibles. Todos los turnos de hoy ya pasaron.');
        }
      }
    } catch (error) {
      console.error('❌ AgendarCita: Error loading slots:', error);
      this.error.set('Error al cargar los horarios. Intenta de nuevo.');
      this.availableSlots.set([]);
    } finally {
      this.loadingSlots.set(false);
    }
  }

  // Helper: check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // =====================================
  // METHODS - Step 1: Select Doctor & Filter
  // =====================================
  selectMedico(medico: MedicoDisponibleDto): void {
    this.selectedMedico.set(medico);
    this.loadDiasAtencionAndGenerateDays(medico.id);
    this.goToStep(2);
  }

  filterByEspecialidad(especialidadId: number | null): void {
    this.selectedEspecialidadId.set(especialidadId);
  }

  clearFilter(): void {
    this.selectedEspecialidadId.set(null);
  }

  // Load doctor's working days and generate next 14 days (filtered)
  async loadDiasAtencionAndGenerateDays(medicoId: number): Promise<void> {
    try {
      console.log('🔄 AgendarCita: Cargando días de atención del médico', medicoId);
      
      const workingDayNumbers = await this.medicosService.getDiasAtencion(medicoId);
      console.log('✅ AgendarCita: Días laborables (números):', workingDayNumbers);

      // Defensive check
      if (!Array.isArray(workingDayNumbers)) {
        console.error('❌ workingDayNumbers NO es un array:', workingDayNumbers);
        // Fallback: generate all 7 days
        this.generateAvailableDays(new Set([0, 1, 2, 3, 4, 5, 6]));
        return;
      }

      if (workingDayNumbers.length === 0) {
        console.warn('⚠️ workingDayNumbers está vacío, médico no tiene días configurados');
        // Fallback: generate all 7 days
        this.generateAvailableDays(new Set([0, 1, 2, 3, 4, 5, 6]));
        return;
      }

      // Create Set of working days
      const workingDays = new Set(workingDayNumbers);
      console.log('✅ AgendarCita: Días laborables (Set):', Array.from(workingDays));

      this.generateAvailableDays(workingDays);
    } catch (error) {
      console.error('❌ Error loading working days:', error);
      // Fallback: generate all 7 days
      this.generateAvailableDays(new Set([0, 1, 2, 3, 4, 5, 6]));
    }
  }

  // Generate next 14 days (2 weeks) for date selection, filtered by working days
  generateAvailableDays(workingDays: Set<number>): void {
    const days: { date: Date; label: string }[] = [];
    
    // Get current date in local timezone (no UTC issues)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    console.log('📅 AgendarCita: Hoy es:', today.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    console.log('📅 AgendarCita: Días laborables:', Array.from(workingDays).map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d]).join(', '));
    
    let daysAdded = 0;
    let offset = 0;

    // Keep adding days until we have 14 working days or reach 30 days max
    while (daysAdded < 14 && offset < 30) {
      // Create date for current offset
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      // Check if this day is a working day
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      console.log(`📅 Día ${offset}: ${date.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' })} (dayOfWeek=${dayOfWeek}) - ${workingDays.has(dayOfWeek) ? '✅ TRABAJA' : '❌ NO trabaja'}`);
      
      if (workingDays.has(dayOfWeek)) {
        let label = '';
        if (offset === 0) label = 'Hoy';
        else if (offset === 1) label = 'Mañana';
        else {
          const dayName = this.medicosService.getDayName(date);
          const dayNum = date.getDate();
          const month = date.toLocaleDateString('es-EC', { month: 'short' });
          label = `${dayName} ${dayNum} ${month}`;
        }

        days.push({ date, label });
        daysAdded++;
        console.log(`  ✅ Agregado: ${label}`);
      }

      offset++;
    }

    console.log('✅ AgendarCita: Días disponibles generados:', days.length);
    this.availableDays.set(days);
  }

  // =====================================
  // METHODS - Step 2: Select Date & Time
  // =====================================
  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  selectSlot(slot: SlotDisponibleDto): void {
    this.selectedSlot.set(slot);
  }

  toggleModalidad(): void {
    this.isTelefonica.update((val) => !val);
  }

  // =====================================
  // METHODS - Step 3: Confirm & Submit
  // =====================================
  async confirmarCita(): Promise<void> {
    const medico = this.selectedMedico();
    const dateTime = this.selectedDateTime();

    if (!medico || !dateTime) {
      this.error.set('Faltan datos para agendar la cita');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const dto = {
        medicoId: medico.id,
        fechaHoraInicio: this.citasService.formatDateForAPI(dateTime),
        telefonica: this.isTelefonica(),
      };

      await this.citasService.createCita(dto);

      // Success! Redirect to appointments list
      await this.router.navigate(['/citas']);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      this.error.set(
        error?.error?.message || 'Error al agendar la cita. Intenta de nuevo.'
      );
    } finally {
      this.submitting.set(false);
    }
  }

  // =====================================
  // METHODS - Navigation
  // =====================================
  goToStep(step: Step): void {
    this.currentStep.set(step);
  }

  goBack(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => (step - 1) as Step);
    } else {
      this.router.navigate(['/citas']);
    }
  }

  cancel(): void {
    this.router.navigate(['/citas']);
  }
}
