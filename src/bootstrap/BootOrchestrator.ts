import { Subscription, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../config/environment.ts';
import { AuthService } from '../majom-wrapper/data-access/auth-service.ts';
import { HttpInterceptorClient } from '../majom-wrapper/data-access/http-interceptor.ts';
import { UserApiService } from '../majom-wrapper/data-access/user-api-service.ts';
import { WallpaperApiService } from '../majom-wrapper/data-access/wallpaper-api-service.ts';
import type { LoginCredentials } from '../majom-wrapper/interfaces/auth-interfaces.ts';
import { authFlowService } from '../features/canvas/ui/auth/authFlowService.ts';
import type { LoginSubmitResult } from '../features/canvas/ui/auth/AuthController.ts';
import { LoginPage } from '../features/canvas/ui/components/LoginPage.ts';
import { LoadingScreen } from '../features/canvas/ui/components/LoadingScreen.ts';
import { WallpaperService } from '../features/shell/services/WallpaperService.ts';
import type { BootEvent, BootState } from './BootState.ts';
import { nextBootState } from './BootStateMachine.ts';
import { GlobalAppHeader } from './GlobalAppHeader.ts';
import { RuntimeHost } from './RuntimeHost.ts';

export class BootOrchestrator {
  private readonly authService = new AuthService();
  private readonly http = new HttpInterceptorClient(environment.apiUrl);
  private readonly userApi = new UserApiService(this.http);
  private readonly wallpaperService = new WallpaperService(
    new WallpaperApiService(this.http)
  );
  private readonly runtimeHost: RuntimeHost;
  private readonly globalHeader: GlobalAppHeader;
  private readonly loginPage: LoginPage;
  private readonly loadingScreen: LoadingScreen;
  private readonly minLoadingScreenMs: number;
  private logoutSubscription: Subscription | null = null;
  private loginSubscription: Subscription | null = null;
  private state: BootState = 'auth_required';
  private bootInFlight = false;
  private logoutInProgress = false;

  constructor() {
    this.globalHeader = new GlobalAppHeader();
    this.runtimeHost = new RuntimeHost(this.wallpaperService);
    this.loadingScreen = new LoadingScreen();
    this.minLoadingScreenMs = this.resolveMinLoadingScreenDuration();
    this.loginPage = new LoginPage({
      title: 'Welcome back',
      onSubmit: async (credentials) => this.handleLoginSubmit(credentials),
    });
  }

  public start(): void {
    this.globalHeader.mount(document.body);
    this.bindAuthFlow();
    this.runtimeHost.hideCanvas();
    this.dispatch('app_start');

    if (this.authService.isLoggedIn()) {
      this.dispatch('session_found');
      this.render();
      void this.bootstrapRuntime();
      return;
    }

    this.dispatch('session_missing');
    this.render();
  }

  private bindAuthFlow(): void {
    this.logoutSubscription = authFlowService.logoutRequests$.subscribe(() => {
      this.handleHardLogout();
    });
    this.loginSubscription = authFlowService.loginRequests$.subscribe(() => {
      if (this.authService.isLoggedIn()) return;
      this.dispatch('session_missing');
      this.render();
    });
  }

  private dispatch(event: BootEvent): void {
    this.state = nextBootState(this.state, event);
  }

  private render(): void {
    if (this.state === 'auth_required') {
      this.runtimeHost.hideCanvas();
      this.loadingScreen.hide();
      this.loginPage.show();
      this.loginPage.focusPrimaryField();
      return;
    }

    if (this.state === 'booting') {
      this.runtimeHost.hideCanvas();
      this.loginPage.hide();
      this.loadingScreen.showLoading('Fetching your data...');
      return;
    }

    if (this.state === 'boot_error') {
      this.runtimeHost.hideCanvas();
      this.loginPage.hide();
      this.loadingScreen.showError(
        'Failed to load canvas data. Please try again.',
        () => {
          void this.retryBoot();
        }
      );
      return;
    }

    this.loginPage.hide();
    this.loadingScreen.hide();
    this.runtimeHost.showCanvas();
  }

  private async handleLoginSubmit(
    credentials: LoginCredentials
  ): Promise<LoginSubmitResult> {
    try {
      await this.authService.login(credentials);
      this.dispatch('login_success');
      this.render();
      void this.bootstrapRuntime();
      return { ok: true };
    } catch (error: unknown) {
      this.authService.logout();
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Login failed. Please try again.',
      };
    }
  }

  private async retryBoot(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.dispatch('session_missing');
      this.render();
      return;
    }
    this.dispatch('retry');
    this.render();
    await this.bootstrapRuntime();
  }

  private async bootstrapRuntime(): Promise<void> {
    if (this.bootInFlight) return;
    if (this.state !== 'booting') return;
    this.bootInFlight = true;
    const startedAt = Date.now();
    try {
      await this.initializeUserWallpaper();
      await this.runtimeHost.start();
      this.dispatch('boot_succeeded');
    } catch (error) {
      console.error('Failed to initialize authenticated app session.', error);
      this.dispatch('boot_failed');
    } finally {
      const elapsedMs = Date.now() - startedAt;
      const remainingMs = this.minLoadingScreenMs - elapsedMs;
      if (remainingMs > 0) {
        await new Promise<void>((resolve) =>
          window.setTimeout(resolve, remainingMs)
        );
      }
      this.bootInFlight = false;
      this.render();
    }
  }

  private async initializeUserWallpaper(): Promise<void> {
    const profilePromise = firstValueFrom(this.userApi.getUser());
    const wallpaperListPromise = firstValueFrom(
      this.wallpaperService.loadWallpaperList().pipe(
        catchError((error: unknown) => {
          console.warn('Wallpaper list failed to load.', error);
          return of([]);
        })
      )
    );
    const [user] = await Promise.all([profilePromise, wallpaperListPromise]);
    this.wallpaperService.applyUserWallpaper(user);
  }

  private handleHardLogout(): void {
    if (this.logoutInProgress) return;
    this.logoutInProgress = true;
    this.dispatch('logout');
    this.authService.logout();
    this.runtimeHost.dispose();
    this.globalHeader.unmount();
    this.render();
    window.location.reload();
  }

  private resolveMinLoadingScreenDuration(): number {
    if (typeof window === 'undefined') return 1800;
    if (typeof window.matchMedia !== 'function') return 1800;
    return window.matchMedia('(pointer: coarse), (max-width: 640px)').matches
      ? 900
      : 1800;
  }
}
