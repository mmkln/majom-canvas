import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import { User } from '../interfaces/auth-interfaces.ts';

/**
 * UserApiService provides methods for interacting with user-related API endpoints
 */
export class UserApiService {
  constructor(private http: HttpInterceptorClient) {}

  /**
   * Retrieve the current user's profile information
   * @returns Observable of User data
   */
  public getUser(): Observable<User> {
    return this.http.get<User>('/user/');
  }

  /**
   * Update user's profile language
   * @param language The new language code for the user
   * @returns Observable of updated User data
   */
  public setUserProfileLanguage(language: User['language']): Observable<User> {
    return this.http.patch<User>('/user/profile/', {
      language,
    });
  }

  /**
   * Update user's selected wallpaper.
   */
  public setUserWallpaper(wallpaperId: User['wallpaper_id']): Observable<User> {
    return this.http.patch<User>('/user/profile/', {
      wallpaper_id: wallpaperId,
    });
  }

  /**
   * Request user account deletion
   * @returns Observable void indicating successful deletion request
   */
  public deleteUser(): Observable<void> {
    return this.http.delete<void>('/user/profile/');
  }

  /**
   * Restore a previously deleted user account
   * @returns Observable with restoration response
   */
  public restoreUser(): Observable<any> {
    return this.http.post('/user/restore/', {});
  }
}
