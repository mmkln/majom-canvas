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
import {
  clearUserPreferences,
  initializeUserPreferences,
  refreshUserPreferencesFromServer,
} from '../features/shell/services/UserPreferencesService.ts';
import type { BootEvent, BootState } from './BootState.ts';
import { nextBootState } from './BootStateMachine.ts';
import { GlobalAppHeader } from './GlobalAppHeader.ts';
import { RuntimeHost } from './RuntimeHost.ts';
import { createAppRuntime } from '../app-runtime/index.ts';

export class BootOrchestrator {
  private readonly runtime = createAppRuntime();
  private readonly i18n = this.runtime.i18n;
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
  private readonly windowFocusHandler: () => void;
  private readonly visibilityChangeHandler: () => void;
  private state: BootState = 'auth_required';
  private bootInFlight = false;
  private logoutInProgress = false;

  constructor() {
    this.globalHeader = new GlobalAppHeader(this.runtime);
    this.runtimeHost = new RuntimeHost(this.wallpaperService, this.runtime, {
      userApiService: this.userApi,
    });
    this.loadingScreen = new LoadingScreen({ runtime: this.runtime });
    this.minLoadingScreenMs = this.resolveMinLoadingScreenDuration();
    this.loginPage = new LoginPage({
      runtime: this.runtime,
      onSubmit: async (credentials) => this.handleLoginSubmit(credentials),
    });
    this.windowFocusHandler = () => {
      void this.refreshUserPreferences();
    };
    this.visibilityChangeHandler = () => {
      if (document.visibilityState !== 'visible') return;
      void this.refreshUserPreferences();
    };
  }

  public start(): void {
    this.bindAuthFlow();
    window.addEventListener('focus', this.windowFocusHandler);
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
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
      this.globalHeader.unmount();
      this.runtimeHost.hideCanvas();
      this.loadingScreen.hide();
      this.loginPage.show();
      this.loginPage.focusPrimaryField();
      return;
    }

    if (this.state === 'booting') {
      this.globalHeader.unmount();
      this.runtimeHost.hideCanvas();
      this.loginPage.hide();
      this.loadingScreen.showLoading((i18n) => i18n.t('loading.fetchingData'));
      return;
    }

    if (this.state === 'boot_error') {
      this.globalHeader.unmount();
      this.runtimeHost.hideCanvas();
      this.loginPage.hide();
      this.loadingScreen.showError(
        (i18n) => i18n.t('loading.canvasFailed'),
        () => {
          void this.retryBoot();
        }
      );
      return;
    }

    this.loginPage.hide();
    this.loadingScreen.hide();
    this.globalHeader.mount(document.body);
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
            : this.i18n.t('login.errorFallback'),
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
      await this.initializeUserSessionContext();
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

  private async initializeUserSessionContext(): Promise<void> {
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
    const hydratedUser = await initializeUserPreferences({
      user,
      userApiService: this.userApi,
    });
    this.runtime.setLocale(hydratedUser.language || this.i18n.getLocale());
    this.wallpaperService.applyUserWallpaper(hydratedUser);
  }

  private handleHardLogout(): void {
    if (this.logoutInProgress) return;
    this.logoutInProgress = true;
    window.removeEventListener('focus', this.windowFocusHandler);
    document.removeEventListener(
      'visibilitychange',
      this.visibilityChangeHandler
    );
    this.dispatch('logout');
    this.authService.logout();
    clearUserPreferences();
    this.runtimeHost.dispose();
    this.globalHeader.unmount();
    this.render();
    window.location.reload();
  }

  private async refreshUserPreferences(): Promise<void> {
    if (!this.authService.isLoggedIn()) return;
    const user = await refreshUserPreferencesFromServer();
    if (!user) return;
    this.runtime.setLocale(user.language || this.i18n.getLocale());
    this.wallpaperService.applyUserWallpaper(user);
  }

  private resolveMinLoadingScreenDuration(): number {
    if (typeof window === 'undefined') return 1800;
    if (typeof window.matchMedia !== 'function') return 1800;
    return window.matchMedia('(pointer: coarse), (max-width: 640px)').matches
      ? 900
      : 1800;
  }
}
