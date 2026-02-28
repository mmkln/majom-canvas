import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { PaginatedResponse } from './paginated-response.js';
import { PlatformEvent } from '../interfaces/index.ts';

export class EventsApiService {
  constructor(private http: HttpInterceptorClient) {}

  public getEvents(): Observable<PlatformEvent[]> {
    return this.http
      .get<PaginatedResponse<PlatformEvent> | PlatformEvent[]>('/events/')
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
  }
}
