import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import { Story as StoryDto } from '../interfaces/index.js';

export class StoriesApiService {
  constructor(private http: HttpInterceptorClient) {}

  public getStories(): Observable<StoryDto[]> {
    return this.http.get<StoryDto[]>('/stories/');
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

  public deleteStory(id: number): Observable<any> {
    return this.http.delete(`/stories/${id}/`);
  }
}
