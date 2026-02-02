import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  EspecialidadDto,
  PaginatedResponse,
  PaginationParams,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class EspecialidadesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/especialidades`;

  /**
   * Get list of medical specialties (paginated)
   * GET /especialidades?page=1&limit=50
   */
  async getEspecialidades(
    params: PaginationParams = { page: 1, limit: 50 },
  ): Promise<PaginatedResponse<EspecialidadDto>> {
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    return firstValueFrom(
      this.http.get<PaginatedResponse<EspecialidadDto>>(this.baseUrl, {
        params: httpParams,
      }),
    );
  }

  /**
   * Get all specialties (unpaginated - fetches all pages)
   */
  async getAllEspecialidades(): Promise<EspecialidadDto[]> {
    const firstPage = await this.getEspecialidades({ page: 1, limit: 100 });

    if (firstPage.meta.totalPages > 1) {
      const promises: Promise<PaginatedResponse<EspecialidadDto>>[] = [];

      for (let i = 2; i <= firstPage.meta.totalPages; i++) {
        promises.push(this.getEspecialidades({ page: i, limit: 100 }));
      }

      const results = await Promise.all(promises);
      const allData = [...firstPage.data, ...results.flatMap((r) => r.data)];

      return allData;
    }

    return firstPage.data;
  }
}
