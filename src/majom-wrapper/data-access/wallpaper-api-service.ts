import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import type { Wallpaper } from '../interfaces/auth-interfaces.ts';

/**
 * WallpaperApiService provides wallpaper-related API calls.
 */
export class WallpaperApiService {
  constructor(private readonly http: HttpInterceptorClient) {}

  /**
   * Fetches available wallpapers.
   */
  public getWallpapers(): Observable<Wallpaper[]> {
    return this.http.get<Wallpaper[]>('/wallpapers/');
  }
}
