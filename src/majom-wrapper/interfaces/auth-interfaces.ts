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

export interface ChangePassword {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  detail: string;
}

/**
 * User defines the structure for user data returned from the backend.
 */
export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  age?: number | null;
  bio?: string | null;
  language: string;
  readonly wallpaper: Wallpaper | null;
  wallpaper_id: string | null;
  readonly deletion_requested_at: string | null;
}

export interface Wallpaper {
  readonly id: number;
  image_file: string;
}
