import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { Story as StoryDto } from '../interfaces/index.js';
import { PaginatedResponse } from './paginated-response.js';

export class StoriesApiService {
  constructor(private http: HttpInterceptorClient) {}

  public fetchStories(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Observable<PaginatedResponse<StoryDto>> {
    const query = this.buildQuery(params);
    return this.http.get<PaginatedResponse<StoryDto>>(`/stories/${query}`);
  }

  public fetchStoriesByIds(ids: number[]): Observable<StoryDto[]> {
    if (!ids.length) return of([]);
    const encodedIds = encodeURIComponent(ids.join(','));
    return this.http.get<StoryDto[]>(`/stories/?ids=${encodedIds}`);
  }

  public getStories(): Observable<StoryDto[]> {
    return this.http
      .get<PaginatedResponse<StoryDto> | StoryDto[]>('/stories/')
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
  }

  public getStory(id: number): Observable<StoryDto> {
    return this.http.get<StoryDto>(`/stories/${id}/`);
  }

  public createStory(data: Partial<StoryDto>): Observable<StoryDto> {
    return this.http.post<StoryDto>('/stories/', data);
  }

  public updateStory(id: number, data: StoryDto): Observable<StoryDto> {
    return this.http.put<StoryDto>(`/stories/${id}/`, data);
  }

  public patchStory(
    id: number,
    data: Partial<StoryDto>
  ): Observable<StoryDto> {
    return this.http.patch<StoryDto>(`/stories/${id}/`, data);
  }

  public deleteStory(id: number): Observable<any> {
    return this.http.delete(`/stories/${id}/`);
  }

  private buildQuery(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): string {
    if (!params) return '';
    const query: string[] = [];
    if (params.page !== undefined) {
      query.push(`page=${encodeURIComponent(params.page.toString())}`);
    }
    if (params.pageSize !== undefined) {
      query.push(`page_size=${encodeURIComponent(params.pageSize.toString())}`);
    }
    if (params.search) {
      query.push(`search=${encodeURIComponent(params.search)}`);
    }
    return query.length ? `?${query.join('&')}` : '';
  }
}
