import { Observable } from 'rxjs';
// @ts-ignore
import { RxJSHttpClient } from 'rxjs-http-client';
import { Story } from '../interfaces/index.ts';

export class StoriesApiService {
  constructor(private http: RxJSHttpClient, private readonly apiUrl: string) {}

  public getStories(): Observable<Story[]> {
    return this.http.get<Story[]>(`${this.apiUrl}/stories/`);
  }

  public getStory(id: number): Observable<Story> {
    return this.http.get<Story>(`${this.apiUrl}/stories/${id}/`);
  }

  public createStory(data: Partial<Story>): Observable<Story> {
    return this.http.post<Story>(`${this.apiUrl}/stories/`, data, {
      headers: {},
    });
  }

  public updateStory(id: number, data: Story): Observable<Story> {
    return this.http.put<Story>(`${this.apiUrl}/stories/${id}/`, data, {
      headers: {},
    });
  }

  public deleteStory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/stories/${id}/`, {
      headers: {},
    });
  }
}
