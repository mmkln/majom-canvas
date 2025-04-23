// @ts-ignore: implicit any for rxjs-http-client types
import { RxJSHttpClient } from 'rxjs-http-client';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ACCESS_TOKEN_KEY } from '../../config/storage-keys.js';

/**
 * HTTP client wrapper: automatically attaches JWT and handles errors.
 */
export class HttpInterceptorClient {
  private client = new RxJSHttpClient();

  constructor(private readonly baseUrl: string) {}

  private attachAuth(headers: Record<string, string> = {}): Record<string, string> {
    // Use access token set by AuthService under key 'jwt'
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return { ...headers, Authorization: token ? `Bearer ${token}` : '' };
  }

  public get<T>(path: string, options: any = {}): Observable<T> {
    const headers = this.attachAuth(options.headers);
    return this.client.get<T>(`${this.baseUrl}${path}`, { ...options, headers }).pipe(
      catchError(err => {
        console.error('GET Error:', err);
        return throwError(() => err);
      })
    );
  }

  public post<T>(path: string, body: any, options: any = {}): Observable<T> {
    const headers = this.attachAuth(options.headers);
    return this.client.post<T>(`${this.baseUrl}${path}`, body, { ...options, headers }).pipe(
      catchError(err => {
        console.error('POST Error:', err);
        return throwError(() => err);
      })
    );
  }

  public put<T>(path: string, body: any, options: any = {}): Observable<T> {
    const headers = this.attachAuth(options.headers);
    return this.client.put<T>(`${this.baseUrl}${path}`, body, { ...options, headers }).pipe(
      catchError(err => {
        console.error('PUT Error:', err);
        return throwError(() => err);
      })
    );
  }

  public patch<T>(path: string, body: any, options: any = {}): Observable<T> {
    const headers = this.attachAuth(options.headers);
    return this.client.patch<T>(`${this.baseUrl}${path}`, body, { ...options, headers }).pipe(
      catchError(err => {
        console.error('PATCH Error:', err);
        return throwError(() => err);
      })
    );
  }

  public delete<T>(path: string, options: any = {}): Observable<T> {
    const headers = this.attachAuth(options.headers);
    return this.client.delete<T>(`${this.baseUrl}${path}`, { ...options, headers }).pipe(
      catchError(err => {
        console.error('DELETE Error:', err);
        return throwError(() => err);
      })
    );
  }
}
