import { AuthResponse, LoginCredentials, User } from '../interfaces/auth-interfaces.js';
import { environment } from '../../config/environment.js';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../../config/storage-keys.js';

/**
 * AuthService handles authentication requests to the backend.
 */
export class AuthService {
  private baseUrl: string = environment.apiUrl;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  /**
   * Sends a login request to the backend with the provided credentials.
   * @param credentials Username and password for login.
   * @returns Promise with the authentication response containing tokens.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const data: AuthResponse = await response.json();
      this.setTokens({ access: data.access, refresh: data.refresh });
      return data;
    } catch (error: unknown) {
      throw new Error((error instanceof Error ? error.message : 'An error occurred during login.'));
    }
  }

  /**
   * Refreshes the access token using the refresh token.
   * @returns Promise with the new access token.
   */
  async refreshToken(): Promise<{ access: string }> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available.');
      }

      const response = await fetch(`${this.baseUrl}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed.');
      }

      const data = await response.json();
      this.setToken(data.access);
      return { access: data.access };
    } catch (error: unknown) {
      throw new Error((error instanceof Error ? error.message : 'An error occurred during token refresh.'));
    }
  }

  /**
   * Logs out the user by clearing tokens from local storage.
   */
  logout(): void {
    this.removeTokens();
  }

  /**
   * Sets both access and refresh tokens in local storage.
   * @param tokens Object containing access and refresh tokens.
   */
  setTokens(tokens: { access: string; refresh: string }): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  /**
   * Sets the access token in local storage.
   * @param token The access token.
   */
  setToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  /**
   * Sets the refresh token in local storage.
   * @param token The refresh token.
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  /**
   * Removes both tokens from local storage.
   */
  removeTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Retrieves the stored access token.
   * @returns The access token or null if not found.
   */
  getAuthToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Fetches the current authenticated user's data.
   * @returns Promise with the user data.
   */
  async getUser(): Promise<User> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No auth token found. User is not authenticated.');
      }
      const response = await fetch(`${this.baseUrl}/user/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user data.');
      }
      const user: User = await response.json();
      return user;
    } catch (error: unknown) {
      throw new Error((error instanceof Error ? error.message : 'An error occurred while fetching user data.'));
    }
  }

  /**
   * Retrieves the stored refresh token.
   * @returns The refresh token or null if not found.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Checks if the user is authenticated based on the presence of a refresh token and its validity.
   * @returns True if the user is authenticated and token is not expired, false otherwise.
   */
  isLoggedIn(): boolean {
    const token = this.getRefreshToken();
    return token ? !this.isTokenExpired(token) : false;
  }

  /**
   * Checks if a token is expired by decoding it and comparing the expiration time.
   * @param token The token to check.
   * @returns True if the token is expired or invalid, false otherwise.
   */
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
