// @ts-ignore: implicit any for rxjs-http-client types
import { RxJSHttpClient } from 'rxjs-http-client';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { getAccessToken, refreshAccessToken } from './auth-service.js';
import { requestTracker } from './request-tracker.js';
import { authFlowService } from '../../features/canvas/ui/auth/authFlowService.ts';

/** HTTP client wrapper with one refresh-and-retry for expired Bearer tokens. */
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
    return {
      ...(this.isFormDataBody(body)
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...headers,
    };
  }

  private withAuthorization(
    headers: Record<string, string> = {}
  ): Record<string, string> {
    const accessToken = getAccessToken();
    return accessToken
      ? { ...headers, Authorization: `Bearer ${accessToken}` }
      : headers;
  }

  private handleError(method: string, error: any): Observable<never> {
    if (error?.status === 401) {
      authFlowService.requestLogout('unauthorized');
    }
    console.error(`${method} Error:`, error);
    return throwError(() => error);
  }

  private requestWithRefresh<T>(
    method: string,
    request: (headers: Record<string, string>) => Observable<any>,
    headers: Record<string, string> = {}
  ): Observable<T> {
    const send = () => request(this.withAuthorization(headers));
    return send().pipe(
      switchMap((res: any) => this.parseResponse<T>(res)),
      catchError((error) => {
        if (error?.status !== 401) return this.handleError(method, error);
        return from(refreshAccessToken(this.baseUrl)).pipe(
          switchMap(() => send()),
          switchMap((res: any) => this.parseResponse<T>(res)),
          catchError((retryError) => this.handleError(method, retryError))
        );
      })
    );
  }

  public get<T>(path: string, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.requestWithRefresh<T>(
      'GET',
      (headers) =>
        this.client.get<T>(`${this.baseUrl}${path}`, { ...options, headers }),
      options.headers
    ).pipe(finalize(() => requestTracker.end()));
  }

  public post<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.requestWithRefresh<T>(
      'POST',
      (headers) =>
        this.client.post<T>(`${this.baseUrl}${path}`, {
          ...options,
          body: this.normalizeBody(body),
          headers,
        }),
      this.getMutationHeaders(body, options.headers)
    ).pipe(finalize(() => requestTracker.end()));
  }

  public put<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.requestWithRefresh<T>(
      'PUT',
      (headers) =>
        this.client.put<T>(`${this.baseUrl}${path}`, {
          ...options,
          body: this.normalizeBody(body),
          headers,
        }),
      this.getMutationHeaders(body, options.headers)
    ).pipe(finalize(() => requestTracker.end()));
  }

  public patch<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.requestWithRefresh<T>(
      'PATCH',
      (headers) =>
        this.client.patch<T>(`${this.baseUrl}${path}`, {
          ...options,
          body: this.normalizeBody(body),
          headers,
        }),
      this.getMutationHeaders(body, options.headers)
    ).pipe(finalize(() => requestTracker.end()));
  }

  public delete<T>(path: string, options: any = {}): Observable<T> {
    requestTracker.start();
    return this.requestWithRefresh<T>(
      'DELETE',
      (headers) =>
        this.client.delete<T>(`${this.baseUrl}${path}`, {
          ...options,
          headers,
        }),
      this.getMutationHeaders(undefined, options.headers)
    ).pipe(finalize(() => requestTracker.end()));
  }
}
