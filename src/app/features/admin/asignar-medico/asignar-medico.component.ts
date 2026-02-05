import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  type AssignMedicoDto,
  type DiaCatalogoDto,
  type EspecialidadCatalogoDto,
  type EspecialidadDto,
  type HorarioDto,
  MedicosService,
  type UsuarioSimpleDto,
} from '../../../core/services/medicos.service';

interface HorarioForm {
  diaId: number | null;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
}

interface EspecialidadForm {
  especialidadId: number | null;
  especialidadNombre: string;
  principal: boolean;
}

@Component({
  selector: 'app-asignar-medico',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './asignar-medico.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AsignarMedicoComponent {
  private readonly medicosService = inject(MedicosService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  readonly pacientes = signal<UsuarioSimpleDto[]>([]);
  readonly especialidades = signal<EspecialidadCatalogoDto[]>([]);
  readonly dias = signal<DiaCatalogoDto[]>([]);

  readonly pacienteSearchTerm = signal('');
  readonly especialidadSearchTerms = signal<Map<number, string>>(new Map());

  readonly usuarioId = signal<number | null>(null);
  readonly licenciaMedica = signal('');
  readonly pasaporte = signal('');
  readonly especialidadesSeleccionadas = signal<EspecialidadForm[]>([]);
  readonly horariosSeleccionados = signal<HorarioForm[]>([]);

  readonly pacientesFiltrados = computed(() => {
    const term = this.pacienteSearchTerm().toLowerCase().trim();
    if (term.length < 3) return [];

    return this.pacientes()
      .filter((p) => {
        const nombreCompleto = `${p.nombres} ${p.apellidos}`.toLowerCase();
        const cedula = p.cedula.toLowerCase();
        const email = p.email.toLowerCase();
        return nombreCompleto.includes(term) || cedula.includes(term) || email.includes(term);
      })
      .slice(0, 10);
  });

  readonly showPacienteDropdown = computed(() => {
    return (
      this.pacienteSearchTerm().length >= 3 &&
      this.pacientesFiltrados().length > 0 &&
      !this.usuarioId()
    );
  });

  readonly pacienteSeleccionado = computed(() => {
    const id = this.usuarioId();
    if (!id) return null;
    return this.pacientes().find((p) => p.id === id) || null;
  });

  readonly formValid = computed(() => {
    return (
      this.usuarioId() !== null &&
      this.licenciaMedica().trim().length > 0 &&
      this.especialidadesSeleccionadas().length > 0 &&
      this.especialidadesSeleccionadas().some((e) => e.principal) &&
      this.horariosSeleccionados().length > 0 &&
      this.horariosSeleccionados().every((h) => h.diaId !== null && h.horaInicio && h.horaFin)
    );
  });

  readonly tienePrincipal = computed(() => {
    return this.especialidadesSeleccionadas().some((e) => e.principal);
  });

  constructor() {
    effect(() => {
      void this.loadData();
    });
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [pacientes, especialidades] = await Promise.all([
        this.medicosService.getPacientes(),
        this.medicosService.getEspecialidades(),
      ]);

      this.pacientes.set(pacientes);
      this.especialidades.set(especialidades);
      this.dias.set(this.medicosService.getDiasDisponibles());
    } catch (err) {
      this.error.set('Error al cargar los datos del formulario');
      console.error('Load data error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onPacienteSearchChange(term: string): void {
    this.pacienteSearchTerm.set(term);
    if (!term || term.length < 3) {
      this.usuarioId.set(null);
    }
  }

  selectPaciente(paciente: UsuarioSimpleDto): void {
    this.usuarioId.set(paciente.id);
    this.pacienteSearchTerm.set(`${paciente.nombres} ${paciente.apellidos}`);
  }

  clearPaciente(): void {
    this.usuarioId.set(null);
    this.pacienteSearchTerm.set('');
  }

  agregarEspecialidad(): void {
    this.especialidadesSeleccionadas.update((arr) => [
      ...arr,
      { especialidadId: null, especialidadNombre: '', principal: false },
    ]);

    const index = this.especialidadesSeleccionadas().length - 1;
    this.especialidadSearchTerms.update((map) => {
      const newMap = new Map(map);
      newMap.set(index, '');
      return newMap;
    });
  }

  eliminarEspecialidad(index: number): void {
    this.especialidadesSeleccionadas.update((arr) => arr.filter((_, i) => i !== index));

    this.especialidadSearchTerms.update((map) => {
      const newMap = new Map(map);
      newMap.delete(index);
      return newMap;
    });
  }

  onEspecialidadSearchChange(index: number, term: string): void {
    this.especialidadSearchTerms.update((map) => {
      const newMap = new Map(map);
      newMap.set(index, term);
      return newMap;
    });

    if (this.especialidadesSeleccionadas()[index]?.especialidadId) {
      this.especialidadesSeleccionadas.update((arr) => {
        const newArr = [...arr];
        newArr[index] = {
          ...newArr[index],
          especialidadId: null,
          especialidadNombre: '',
        };
        return newArr;
      });
    }
  }

  getEspecialidadesFiltradas(index: number): EspecialidadCatalogoDto[] {
    const term = this.especialidadSearchTerms().get(index) || '';
    if (term.length < 3) return [];

    const termLower = term.toLowerCase();
    const idsYaSeleccionados = this.especialidadesSeleccionadas()
      .filter((e, i) => i !== index && e.especialidadId !== null)
      .map((e) => e.especialidadId);

    return this.especialidades()
      .filter(
        (e) => e.nombre.toLowerCase().includes(termLower) && !idsYaSeleccionados.includes(e.id)
      )
      .slice(0, 10);
  }

  selectEspecialidad(index: number, especialidad: EspecialidadCatalogoDto): void {
    this.especialidadesSeleccionadas.update((arr) => {
      const newArr = [...arr];
      newArr[index] = {
        ...newArr[index],
        especialidadId: especialidad.id,
        especialidadNombre: especialidad.nombre,
      };
      return newArr;
    });

    this.especialidadSearchTerms.update((map) => {
      const newMap = new Map(map);
      newMap.set(index, especialidad.nombre);
      return newMap;
    });
  }

  showEspecialidadDropdown(index: number): boolean {
    const term = this.especialidadSearchTerms().get(index) || '';
    const especialidadActual = this.especialidadesSeleccionadas()[index];
    return (
      term.length >= 3 &&
      !especialidadActual?.especialidadId &&
      this.getEspecialidadesFiltradas(index).length > 0
    );
  }

  onPrincipalChange(index: number): void {
    this.especialidadesSeleccionadas.update((arr) =>
      arr.map((e, i) => ({
        ...e,
        principal: i === index ? !e.principal : false,
      }))
    );
  }

  agregarHorario(): void {
    this.horariosSeleccionados.update((arr) => [
      ...arr,
      { diaId: null, diaNombre: '', horaInicio: '', horaFin: '' },
    ]);
  }

  eliminarHorario(index: number): void {
    this.horariosSeleccionados.update((arr) => arr.filter((_, i) => i !== index));
  }

  onDiaChange(index: number, diaId: number): void {
    const dia = this.dias().find((d) => d.id === diaId);
    if (!dia) return;

    this.horariosSeleccionados.update((arr) => {
      const newArr = [...arr];
      newArr[index] = {
        ...newArr[index],
        diaId,
        diaNombre: dia.nombre,
      };
      return newArr;
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.formValid()) return;

    this.submitting.set(true);
    this.error.set(null);

    try {
      const especialidades: EspecialidadDto[] = this.especialidadesSeleccionadas().map((e) => ({
        especialidadNombre: e.especialidadNombre,
        principal: e.principal,
      }));

      const horarios: HorarioDto[] = this.horariosSeleccionados().map((h) => ({
        diaNombre: h.diaNombre,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
      }));

      const data: AssignMedicoDto = {
        usuarioId: this.usuarioId()!,
        licenciaMedica: this.licenciaMedica(),
        especialidades,
        horarios,
      };

      if (this.pasaporte().trim()) {
        data.pasaporte = this.pasaporte();
      }

      await this.medicosService.assignMedico(data);

      this.success.set(true);

      setTimeout(() => {
        void this.router.navigate(['/admin/medicos']);
      }, 2000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'error' in err) {
        const errorObj = err.error as { message?: string };
        this.error.set(errorObj.message || 'Error al asignar médico');
      } else {
        this.error.set('Error al asignar médico');
      }
      console.error('Assign medico error:', err);
    } finally {
      this.submitting.set(false);
    }
  }

  cancelar(): void {
    void this.router.navigate(['/admin/medicos']);
  }
}
