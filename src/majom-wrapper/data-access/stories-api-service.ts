import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { Status, Story as StoryDto } from '../interfaces/index.js';
import { PaginatedResponse } from './paginated-response.js';

export class StoriesApiService {
  constructor(private http: HttpInterceptorClient) {}

  public fetchStories(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    goal?: number;
    status?: Status | string;
    statuses?: Array<Status | string>;
  }): Observable<PaginatedResponse<StoryDto>> {
    const query = this.buildQuery(params);
    return this.http.get<PaginatedResponse<StoryDto>>(`/stories/${query}`);
  }

  public fetchStoriesByIds(ids: number[]): Observable<StoryDto[]> {
    if (!ids.length) return of([]);
    const encodedIds = encodeURIComponent(ids.join(','));
    return this.http.get<StoryDto[]>(`/stories/?ids=${encodedIds}`);
  }

  public fetchStoriesByUuids(uuids: string[]): Observable<StoryDto[]> {
    if (!uuids.length) return of([]);
    const encoded = encodeURIComponent(uuids.join(','));
    return this.http.get<StoryDto[]>(`/stories/?uuids=${encoded}`);
  }

  public getStories(): Observable<StoryDto[]> {
    return this.http
      .get<PaginatedResponse<StoryDto> | StoryDto[]>('/stories/')
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
  }

  public getStory(id: string | number): Observable<StoryDto> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.get<StoryDto>(`/stories/${encodedId}/`);
  }

  public createStory(data: Partial<StoryDto>): Observable<StoryDto> {
    return this.http.post<StoryDto>('/stories/', data);
  }

  public updateStory(
    id: string | number,
    data: StoryDto
  ): Observable<StoryDto> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.put<StoryDto>(`/stories/${encodedId}/`, data);
  }

  public patchStory(
    id: string | number,
    data: Partial<StoryDto>
  ): Observable<StoryDto> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.patch<StoryDto>(`/stories/${encodedId}/`, data);
  }

  public deleteStory(id: string | number): Observable<any> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.delete(`/stories/${encodedId}/`);
  }

  private buildQuery(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    goal?: number;
    status?: Status | string;
    statuses?: Array<Status | string>;
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
    if (params.goal !== undefined) {
      query.push(`goal=${encodeURIComponent(params.goal.toString())}`);
    }
    if (params.status) {
      query.push(`status=${encodeURIComponent(params.status.toString())}`);
    }
    if (params.statuses && params.statuses.length > 0) {
      query.push(`status_in=${encodeURIComponent(params.statuses.join(','))}`);
    }
    return query.length ? `?${query.join('&')}` : '';
  }
}
