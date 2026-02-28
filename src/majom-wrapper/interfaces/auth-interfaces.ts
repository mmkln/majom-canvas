/**
 * LoginCredentials defines the structure for user login data.
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * AuthResponse defines the structure of the response from the authentication endpoint.
 */
export interface AuthResponse {
  access: string;
  refresh: string;
}

/**
 * User defines the structure for user data returned from the backend.
 */
export interface User {
  id: number;
  email: string;
  username: string;
  language: string;
  readonly wallpaper: Wallpaper | null;
  wallpaper_id: string | null;
  readonly deletion_requested_at: string | null;
}

export interface Wallpaper {
  readonly id: number;
  image_file: string;
}
