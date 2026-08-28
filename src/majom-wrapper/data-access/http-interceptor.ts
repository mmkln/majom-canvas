// @ts-ignore: implicit any for rxjs-http-client types
import { RxJSHttpClient } from 'rxjs-http-client';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { getSessionCsrfToken } from './auth-service.js';
import { requestTracker } from './request-tracker.js';
import { authFlowService } from '../../features/canvas/ui/auth/authFlowService.ts';

/** HTTP client wrapper backed by the browser's HttpOnly Django session. */
export class HttpInterceptorClient {
  private readonly client = new RxJSHttpClient();

  constructor(private readonly baseUrl: string) {}

  private parseResponse<T>(res: any): Observable<T> {
    if (!res || typeof res.status !== 'number') return of(res as T);
    if (res.status === 204 || res.status === 205) return of(undefined as T);
    return from(res.json() as Promise<T>);
  }

  private normalizeBody(body: any): any {
    if (body === undefined || body === null) return body;
    if (this.isFormDataBody(body)) return body;
    if (Array.isArray(body)) return JSON.stringify(body);
    return body;
  }

  private isFormDataBody(body: any): body is FormData {
    return typeof FormData !== 'undefined' && body instanceof FormData;
  }

  private getMutationHeaders(
    body: any,
    headers: Record<string, string> = {}
  ): Record<string, string> {
    const csrfToken = getSessionCsrfToken();
    return {
      ...(this.isFormDataBody(body) ? {} : { 'Content-Type': 'application/json' }),
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      ...headers,
    };
  }

  private handleError(method: string, error: any): Observable<never> {
    if (error?.status === 401) {
      authFlowService.requestLogout('unauthorized');
    }
    console.error(`${method} Error:`, error);
    return throwError(() => error);
  }

  public get<T>(path: string, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.client
      .get<T>(`${this.baseUrl}${path}`, {
        ...options,
        credentials: 'include',
      })
      .pipe(
        switchMap((res: any) => this.parseResponse<T>(res)),
        catchError((error) => this.handleError('GET', error)),
        finalize(() => requestTracker.end())
      );
  }

  public post<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.client
      .post<T>(`${this.baseUrl}${path}`, {
        ...options,
        body: this.normalizeBody(body),
        credentials: 'include',
        headers: this.getMutationHeaders(body, options.headers),
      })
      .pipe(
        switchMap((res: any) => this.parseResponse<T>(res)),
        catchError((error) => this.handleError('POST', error)),
        finalize(() => requestTracker.end())
      );
  }

  public put<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.client
      .put<T>(`${this.baseUrl}${path}`, {
        ...options,
        body: this.normalizeBody(body),
        credentials: 'include',
        headers: this.getMutationHeaders(body, options.headers),
      })
      .pipe(
        switchMap((res: any) => this.parseResponse<T>(res)),
        catchError((error) => this.handleError('PUT', error)),
        finalize(() => requestTracker.end())
      );
  }

  public patch<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.client
      .patch<T>(`${this.baseUrl}${path}`, {
        ...options,
        body: this.normalizeBody(body),
        credentials: 'include',
        headers: this.getMutationHeaders(body, options.headers),
      })
      .pipe(
        switchMap((res: any) => this.parseResponse<T>(res)),
        catchError((error) => this.handleError('PATCH', error)),
        finalize(() => requestTracker.end())
      );
  }

  public delete<T>(path: string, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.client
      .delete<T>(`${this.baseUrl}${path}`, {
        ...options,
        credentials: 'include',
        headers: this.getMutationHeaders(undefined, options.headers),
      })
      .pipe(
        switchMap((res: any) => this.parseResponse<T>(res)),
        catchError((error) => this.handleError('DELETE', error)),
        finalize(() => requestTracker.end())
      );
  }
}
