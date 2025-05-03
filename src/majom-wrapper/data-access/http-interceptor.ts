// @ts-ignore: implicit any for rxjs-http-client types
import { RxJSHttpClient } from 'rxjs-http-client';
import { Observable, throwError } from 'rxjs';
import {
  catchError,
  switchMap,
  map,
  finalize,
  shareReplay,
} from 'rxjs/operators';
import { from } from 'rxjs';
import { AuthService } from './auth-service.js';
import { ACCESS_TOKEN_KEY } from '../../config/storage-keys.js';

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

  public get<T>(path: string, options: any = {}): Observable<T> {
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
      switchMap((res: any) => from(res.json() as Promise<T>)),
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.get<T>(`${this.baseUrl}${path}`, {
                ...options,
                headers,
              });
            })
          );
        }
        console.error('GET Error:', err);
        return throwError(() => err);
      })
    );
  }

  public post<T>(path: string, body: any, options: any = {}): Observable<T> {
    const authService = this.authService;
    let headers = this.attachAuth(options.headers);
    const accessToken = authService.getAuthToken();
    const request$ =
      accessToken && authService.isTokenExpired(accessToken)
        ? this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.post<T>(`${this.baseUrl}${path}`, body, {
                ...options,
                headers,
              });
            })
          )
        : this.client.post<T>(`${this.baseUrl}${path}`, body, {
            ...options,
            headers,
          });
    return request$.pipe(
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.post<T>(`${this.baseUrl}${path}`, body, {
                ...options,
                headers,
              });
            })
          );
        }
        console.error('POST Error:', err);
        return throwError(() => err);
      })
    );
  }

  public put<T>(path: string, body: any, options: any = {}): Observable<T> {
    const authService = this.authService;
    let headers = this.attachAuth(options.headers);
    const accessToken = authService.getAuthToken();
    const request$ =
      accessToken && authService.isTokenExpired(accessToken)
        ? this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.put<T>(`${this.baseUrl}${path}`, body, {
                ...options,
                headers,
              });
            })
          )
        : this.client.put<T>(`${this.baseUrl}${path}`, body, {
            ...options,
            headers,
          });
    return request$.pipe(
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.put<T>(`${this.baseUrl}${path}`, body, {
                ...options,
                headers,
              });
            })
          );
        }
        console.error('PUT Error:', err);
        return throwError(() => err);
      })
    );
  }

  public patch<T>(path: string, body: any, options: any = {}): Observable<T> {
    const authService = this.authService;
    let headers = this.attachAuth(options.headers);
    const accessToken = authService.getAuthToken();
    const request$ =
      accessToken && authService.isTokenExpired(accessToken)
        ? this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.patch<T>(`${this.baseUrl}${path}`, body, {
                ...options,
                headers,
              });
            })
          )
        : this.client.patch<T>(`${this.baseUrl}${path}`, body, {
            ...options,
            headers,
          });
    return request$.pipe(
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.patch<T>(`${this.baseUrl}${path}`, body, {
                ...options,
                headers,
              });
            })
          );
        }
        console.error('PATCH Error:', err);
        return throwError(() => err);
      })
    );
  }

  public delete<T>(path: string, options: any = {}): Observable<T> {
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
      switchMap((res: any) => from(res.json() as Promise<T>)),
      catchError((err) => {
        if (err.status === 401) {
          return this.getRefreshedAccessToken().pipe(
            switchMap((access) => {
              headers = this.attachAuth(options.headers);
              return this.client.delete<T>(`${this.baseUrl}${path}`, {
                ...options,
                headers,
              });
            })
          );
        }
        console.error('DELETE Error:', err);
        return throwError(() => err);
      })
    );
  }
}
