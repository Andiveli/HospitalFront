import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  AVAILABLE_FILTERS,
  DOCUMENT_FILTER_TYPES,
  type DocumentFilterType,
  type DocumentResponseDto,
  getFileExtension,
} from '../../../core/models';
import {
  type DocumentsError,
  DocumentsService,
} from '../../../core/services/documents.service';

/**
 * Componente para mostrar y gestionar los documentos médicos del paciente
 *
 * Features:
 * - Lista de documentos con información: título, fecha, tipo de archivo
 * - Filtros por categoría: Todos, Laboratorios, Imágenes, Informes
 * - Descarga de documentos (redirect a S3)
 * - Diseño responsive siguiendo el wireframe
 *
 * El filtrado se realiza en el backend mediante el endpoint /documents/historia?tipo=
 *
 * Manejo de errores: Muestra el mensaje específico del backend cuando el paciente
 * no tiene historia clínica o no hay documentos disponibles.
 */
@Component({
  selector: 'app-documents',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './documents.html',
})
export class DocumentsComponent {
  private readonly documentsService = inject(DocumentsService);

  // ==========================================
  // State Signals
  // ==========================================

  /** Lista de documentos del paciente (ya filtrados por el backend) */
  readonly documents = signal<DocumentResponseDto[]>([]);

  /** Filtro actual seleccionado */
  readonly activeFilter = signal<DocumentFilterType>(DOCUMENT_FILTER_TYPES.ALL);

  /** Estado de carga */
  readonly loading = signal<boolean>(true);

  /**
   * Error al cargar documentos - muestra el mensaje específico del backend
   * Ejemplo: "No existe una historia clínica para el paciente"
   */
  readonly error = signal<string | null>(null);

  /** Filtros disponibles para la UI */
  readonly availableFilters = AVAILABLE_FILTERS;

  /** Referencia al tipo de filtro ALL para usar en el template */
  readonly DOCUMENT_FILTER_TYPES = DOCUMENT_FILTER_TYPES;

  // ==========================================
  // Effects
  // ==========================================

  /**
   * Carga los documentos cuando cambia el filtro activo
   * El backend se encarga del filtrado mediante el parámetro ?tipo=
   */
  private loadDocumentsEffect = effect(() => {
    const filter = this.activeFilter();
    this.loadDocuments(filter);
  });

  // ==========================================
  // Methods
  // ==========================================

  /**
   * Carga los documentos del paciente desde el backend
   *
   * @param filter - Filtro opcional para enviar al backend
   */
  async loadDocuments(filter?: DocumentFilterType): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Si el filtro es 'all', no enviamos parámetro para obtener todos
      const docs = await this.documentsService.getDocumentsByHistoria(filter);
      this.documents.set(docs);
    } catch (err: unknown) {
      console.error('Error loading documents:', err);

      // Extraer el mensaje específico del backend
      let errorMessage: string;

      if (err instanceof Error) {
        // Usar el mensaje del error personalizado del servicio
        const docsError = err as DocumentsError;
        errorMessage =
          docsError.backendMessage ||
          docsError.message ||
          'Error al cargar los documentos';
      } else {
        errorMessage = 'Error al cargar los documentos';
      }

      this.error.set(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Cambia el filtro activo y recarga los documentos desde el backend
   *
   * @param filter - Tipo de filtro a aplicar
   */
  setFilter(filter: DocumentFilterType): void {
    this.activeFilter.set(filter);
    // El effect se encargará de llamar a loadDocuments automáticamente
  }

  /**
   * Verifica si un filtro está activo
   *
   * @param filter - Filtro a verificar
   */
  isFilterActive(filter: DocumentFilterType): boolean {
    return this.activeFilter() === filter;
  }

  /**
   * Descarga un documento
   *
   * @param document - Documento a descargar
   */
  downloadDocument(document: DocumentResponseDto): void {
    const extension = getFileExtension(document.mimeType);
    const filename = `${document.titulo}.${extension.toLowerCase()}`;
    this.documentsService.downloadDocument(document.id, filename);
  }

  /**
   * Obtiene la extensión del archivo para mostrar en la UI
   *
   * @param mimeType - Tipo MIME del documento
   */
  getFileTypeLabel(mimeType: string): string {
    return getFileExtension(mimeType);
  }

  /**
   * Formatea la fecha para mostrar en la lista
   *
   * @param dateString - Fecha en formato ISO
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Si es hoy
    if (diffDays === 0) {
      return 'Hoy';
    }

    // Si es ayer
    if (diffDays === 1) {
      return 'Ayer';
    }

    // Si es esta semana (menos de 7 días)
    if (diffDays < 7) {
      const days = [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
      ];
      return days[date.getDay()];
    }

    // Formato: "15 de dic"
    const months = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    return `${date.getDate()} de ${months[date.getMonth()]}`;
  }
}
