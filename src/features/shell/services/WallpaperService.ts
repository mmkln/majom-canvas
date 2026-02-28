import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type {
  Wallpaper,
  User,
} from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { WallpaperApiService } from '../../../majom-wrapper/data-access/wallpaper-api-service.ts';
import { environment } from '../../../config/environment.ts';

function parseWallpaperId(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function resolveWallpaperUrl(imageFile: string | null | undefined): string {
  const value = (imageFile ?? '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  try {
    const apiUrl = new URL(environment.apiUrl, window.location.origin);
    if (value.startsWith('/')) {
      return `${apiUrl.origin}${value}`;
    }
    return new URL(value, `${apiUrl.origin}/`).toString();
  } catch {
    return value;
  }
}

/**
 * WallpaperService is the source of truth for authenticated workspace wallpaper.
 */
export class WallpaperService {
  private readonly wallpaperListSubject = new BehaviorSubject<Wallpaper[]>([]);
  private readonly wallpaperSubject = new BehaviorSubject<string>('');

  constructor(private readonly wallpaperApi: WallpaperApiService) {}

  public get wallpaper$() {
    return this.wallpaperSubject.asObservable();
  }

  public get wallpaperList$() {
    return this.wallpaperListSubject.asObservable();
  }

  public get wallpaperUrl(): string {
    return this.wallpaperSubject.value;
  }

  public get wallpaperList(): Wallpaper[] {
    return this.wallpaperListSubject.value;
  }

  public loadWallpaperList(): Observable<Wallpaper[]> {
    return this.wallpaperApi.getWallpapers().pipe(
      tap((list) => {
        this.wallpaperListSubject.next(Array.isArray(list) ? list : []);
      })
    );
  }

  public setDefaultWallpaper(wallpaper: Wallpaper | null | undefined): void {
    this.wallpaperSubject.next(resolveWallpaperUrl(wallpaper?.image_file));
  }

  public findWallpaperById(
    wallpaperId: string | number | null | undefined
  ): Wallpaper | null {
    const id = parseWallpaperId(wallpaperId);
    if (id === null) return null;
    const found = this.wallpaperListSubject.value.find(
      (item) => item.id === id
    );
    return found ?? null;
  }

  public applyUserWallpaper(user: User): void {
    if (user.wallpaper?.image_file) {
      this.setDefaultWallpaper(user.wallpaper);
      return;
    }

    const fallback = this.findWallpaperById(user.wallpaper_id);
    if (fallback) {
      this.setDefaultWallpaper(fallback);
      return;
    }

    this.wallpaperSubject.next('');
  }
}
