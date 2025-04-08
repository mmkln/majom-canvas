// @ts-ignore
import { RxJSHttpClient } from 'rxjs-http-client';
import { Observable, tap } from 'rxjs';
import { jwtDecode, JwtPayload } from 'jwt-decode';

export class TokenService {
  constructor(private http: RxJSHttpClient, private apiUrl: string) {}

  refreshToken(): Observable<{ access: string }> {
    return this.http
      .post(`${this.apiUrl}/token/refresh/`, {
        refresh: this.getRefreshToken(),
      })
      .pipe(
        tap((tokens: any) => {
          this.setToken(tokens.access);
        })
      );
  }

  setTokens(token: { access: string; refresh: string }): void {
    localStorage.setItem('jwt', token.access);
    localStorage.setItem('refresh', token.refresh);
  }

  setToken(token: string): void {
    localStorage.setItem('jwt', token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refresh', token);
  }

  removeTokens(): void {
    localStorage.removeItem('jwt');
    localStorage.removeItem('refresh');
  }

  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh');
  }

  isAuthenticated(): boolean {
    const token = this.getRefreshToken();
    return token ? !this.isTokenExpired(token) : false;
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded?.exp) {
        return true;
      }
      const expiryTime = decoded.exp * 1000;
      return Date.now() > expiryTime;
    } catch (error) {
      return true;
    }
  }
}
