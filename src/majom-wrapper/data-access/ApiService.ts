import { Observable } from 'rxjs';
import { TokenService } from './TokenService.ts';
//@ts-ignore
import { RxJSHttpClient } from 'rxjs-http-client';

export interface IApiService {
  login(
    username: string,
    password: string
  ): Observable<{ access: string; refresh: string }>;
  logout(): void;
}

export class ApiService implements IApiService{
  constructor(
    private readonly apiUrl: string,
    private readonly tokenService: TokenService,
    private readonly http: RxJSHttpClient
  ) {
  }

  login(
    username: string,
    password: string
  ): Observable<{ access: string; refresh: string }> {
    return this.http.post<{ access: string; refresh: string }>(
      `${this.apiUrl}/token/`,
      {
        username,
        password,
      }
    );
  }

  logout(): void {
      this.tokenService.removeTokens();
  }
}
