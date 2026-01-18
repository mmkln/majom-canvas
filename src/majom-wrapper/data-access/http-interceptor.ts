// @ts-ignore: implicit any for rxjs-http-client types
import { RxJSHttpClient } from 'rxjs-http-client';
import { Observable, throwError, of, from } from 'rxjs';
import {
  catchError,
  switchMap,
  map,
  finalize,
  shareReplay,
} from 'rxjs/operators';
import { AuthService } from './auth-service.js';
import { ACCESS_TOKEN_KEY } from '../../config/storage-keys.js';
import { requestTracker } from './request-tracker.js';

/**
 * HTTP client wrapper: automatically attaches JWT and handles errors.
 */
export class HttpInterceptorClient {
  private client = new RxJSHttpClient();
  private authService: AuthService;
  private refreshAccessToken$?: Observable<string>;

  constructor(private readonly baseUrl: string) {
    this.authService = new AuthService(this.baseUrl);
  }

  private attachAuth(
    headers: Record<string, string> = {}
  ): Record<string, string> {
    // Use access token set by AuthService under key 'jwt'
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return { ...headers, Authorization: token ? `Bearer ${token}` : '' };
  }

  private getRefreshedAccessToken(): Observable<string> {
    if (!this.refreshAccessToken$) {
      this.refreshAccessToken$ = from(this.authService.refreshToken()).pipe(
        map(({ access }) => access),
        finalize(() => {
          this.refreshAccessToken$ = undefined;
        }),
        shareReplay(1)
      );
    }
    return this.refreshAccessToken$;
  }

  private parseResponse<T>(res: any): Observable<T> {
    if (!res || typeof res.status !== 'number') {
      return of(res as T);
    }
    if (res.status === 204 || res.status === 205) {
      return of(undefined as T);
    }
    return from(res.json() as Promise<T>);
  }

  private normalizeBody(body: any): any {
    if (body === undefined || body === null) return body;
    if (Array.isArray(body)) return JSON.stringify(body);
    return body;
  }

  public get<T>(path: string, options: any = {}): Observable<T> {
    requestTracker.start();
    const authService = this.authService;
    let headers = this.attachAuth(options.headers);
    const accessToken = authService.getAuthToken();
    const request$ =
      accessToken && authService.isTokenExpired(accessToken)
        ? this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.get<T>(`${this.baseUrl}${path}`, {
                ...options,
                headers,
              });
            })
          )
        : this.client.get<T>(`${this.baseUrl}${path}`, { ...options, headers });
    return request$.pipe(
      switchMap((res: any) => this.parseResponse<T>(res)),
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.get<T>(`${this.baseUrl}${path}`, {
                ...options,
                headers,
              });
            }),
            switchMap((res: any) => this.parseResponse<T>(res))
          );
        }
        console.error('GET Error:', err);
        return throwError(() => err);
      }),
      finalize(() => requestTracker.end())
    );
  }

  public post<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    const authService = this.authService;
    const baseHeaders = { 'Content-Type': 'application/json', ...options.headers };
    let headers = this.attachAuth(baseHeaders);
    const normalizedBody = this.normalizeBody(body);
    const accessToken = authService.getAuthToken();
    const request$ =
      accessToken && authService.isTokenExpired(accessToken)
        ? this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(baseHeaders);
              return this.client.post<T>(`${this.baseUrl}${path}`, {
                ...options,
                body: normalizedBody,
                headers,
              });
            })
          )
        : this.client.post<T>(`${this.baseUrl}${path}`, {
            ...options,
            body: normalizedBody,
            headers,
          });
    return request$.pipe(
      switchMap((res: any) => this.parseResponse<T>(res)),
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(baseHeaders);
              return this.client.post<T>(`${this.baseUrl}${path}`, {
                ...options,
                body: normalizedBody,
                headers,
              });
            }),
            switchMap((res: any) => this.parseResponse<T>(res))
          );
        }
        console.error('POST Error:', err);
        return throwError(() => err);
      }),
      finalize(() => requestTracker.end())
    );
  }

  public put<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    const authService = this.authService;
    const baseHeaders = { 'Content-Type': 'application/json', ...options.headers };
    let headers = this.attachAuth(baseHeaders);
    const normalizedBody = this.normalizeBody(body);
    const accessToken = authService.getAuthToken();
    const request$ =
      accessToken && authService.isTokenExpired(accessToken)
        ? this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(baseHeaders);
              return this.client.put<T>(`${this.baseUrl}${path}`, {
                ...options,
                body: normalizedBody,
                headers,
              });
            })
          )
        : this.client.put<T>(`${this.baseUrl}${path}`, {
            ...options,
            body: normalizedBody,
            headers,
          });
    return request$.pipe(
      switchMap((res: any) => this.parseResponse<T>(res)),
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(baseHeaders);
              return this.client.put<T>(`${this.baseUrl}${path}`, {
                ...options,
                body: normalizedBody,
                headers,
              });
            }),
            switchMap((res: any) => this.parseResponse<T>(res))
          );
        }
        console.error('PUT Error:', err);
        return throwError(() => err);
      }),
      finalize(() => requestTracker.end())
    );
  }

  public patch<T>(path: string, body: any, options: any = {}): Observable<T> {
    requestTracker.start();
    const authService = this.authService;
    const baseHeaders = { 'Content-Type': 'application/json', ...options.headers };
    let headers = this.attachAuth(baseHeaders);
    const normalizedBody = this.normalizeBody(body);
    const accessToken = authService.getAuthToken();
    const request$ =
      accessToken && authService.isTokenExpired(accessToken)
        ? this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(baseHeaders);
              return this.client.patch<T>(`${this.baseUrl}${path}`, {
                ...options,
                body: normalizedBody,
                headers,
              });
            })
          )
        : this.client.patch<T>(`${this.baseUrl}${path}`, {
            ...options,
            body: normalizedBody,
            headers,
          });
    return request$.pipe(
      switchMap((res: any) => this.parseResponse<T>(res)),
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(baseHeaders);
              return this.client.patch<T>(`${this.baseUrl}${path}`, {
                ...options,
                body: normalizedBody,
                headers,
              });
            }),
            switchMap((res: any) => this.parseResponse<T>(res))
          );
        }
        console.error('PATCH Error:', err);
        return throwError(() => err);
      }),
      finalize(() => requestTracker.end())
    );
  }

  public delete<T>(path: string, options: any = {}): Observable<T> {
    requestTracker.start();
    const authService = this.authService;
    let headers = this.attachAuth(options.headers);
    const accessToken = authService.getAuthToken();
    const request$ =
      accessToken && authService.isTokenExpired(accessToken)
        ? this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.delete<T>(`${this.baseUrl}${path}`, {
                ...options,
                headers,
              });
            })
          )
        : this.client.delete<T>(`${this.baseUrl}${path}`, {
            ...options,
            headers,
          });
    return request$.pipe(
      switchMap((res: any) => this.parseResponse<T>(res)),
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.delete<T>(`${this.baseUrl}${path}`, {
                ...options,
                headers,
              });
            }),
            switchMap((res: any) => this.parseResponse<T>(res))
          );
        }
        console.error('DELETE Error:', err);
        return throwError(() => err);
      }),
      finalize(() => requestTracker.end())
    );
  }
}
