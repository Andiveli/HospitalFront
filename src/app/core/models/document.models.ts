// ==========================================
// Document Models
// ==========================================

/**
 * DTO de respuesta para documentos médicos
 * Según el backend: DocumentResponseDto
 */
export interface DocumentResponseDto {
  /** ID del documento */
  id: number;
  /** Título del documento */
  titulo: string;
  /** Tipo MIME del documento (application/pdf, image/jpeg, etc.) */
  mimeType: string;
  /** Fecha y hora de subida */
  fechaHoraSubida: string;
}

/**
 * Tipo de documento disponible para filtrado
 * Según el backend: TipoDocumentoEntity
 */
export interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ==========================================
// Const Types for Document Filters
// ==========================================

/**
 * Constantes para los filtros de documentos
 * Siguiendo el patrón de const types de TypeScript
 */
export const DOCUMENT_FILTER_TYPES = {
  ALL: 'all',
  LABORATORIO: 'Laboratorio',
  IMAGEN: 'Radiología',
  INFORME: 'Informe Médico',
} as const;

/**
 * Tipo derivado de las constantes
 */
export type DocumentFilterType = (typeof DOCUMENT_FILTER_TYPES)[keyof typeof DOCUMENT_FILTER_TYPES];

/**
 * Interface para los filtros de documentos en la UI
 */
export interface DocumentFilter {
  id: DocumentFilterType;
  label: string;
  icon?: string;
}

/**
 * Filtros disponibles para la UI
 * Nota: Los endpoints para filtrar por tipo no están habilitados aún,
 * pero la lógica está preparada para cuando lo estén.
 */
export const AVAILABLE_FILTERS: DocumentFilter[] = [
  { id: DOCUMENT_FILTER_TYPES.ALL, label: 'Todos' },
  { id: DOCUMENT_FILTER_TYPES.LABORATORIO, label: 'Laboratorios' },
  { id: DOCUMENT_FILTER_TYPES.IMAGEN, label: 'Imágenes' },
  { id: DOCUMENT_FILTER_TYPES.INFORME, label: 'Informes' },
];

// ==========================================
// Utility Functions
// ==========================================

/**
 * Obtiene la extensión del archivo basada en el mimeType
 */
export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  };

  return mimeToExt[mimeType] || 'ARCHIVO';
}

/**
 * Determina si un mimeType es una imagen
 */
export function isImageDocument(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Determina si un mimeType es un PDF
 */
export function isPdfDocument(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}
