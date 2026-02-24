import { Subscription } from 'rxjs';
import { AuthService } from '../majom-wrapper/data-access/auth-service.ts';
import type { LoginCredentials } from '../majom-wrapper/interfaces/auth-interfaces.ts';
import { authFlowService } from '../ui/auth/authFlowService.ts';
import type { LoginSubmitResult } from '../ui/auth/AuthController.ts';
import { LoginPage } from '../ui/components/LoginPage.ts';
import { LoadingScreen } from '../ui/components/LoadingScreen.ts';
import type { BootEvent, BootState } from './BootState.ts';
import { nextBootState } from './BootStateMachine.ts';
import { RuntimeHost } from './RuntimeHost.ts';

type BootOrchestratorOptions = {
  canvas: HTMLCanvasElement;
};

export class BootOrchestrator {
  private readonly authService = new AuthService();
  private readonly runtimeHost: RuntimeHost;
  private readonly loginPage: LoginPage;
  private readonly loadingScreen: LoadingScreen;
  private logoutSubscription: Subscription | null = null;
  private loginSubscription: Subscription | null = null;
  private state: BootState = 'auth_required';
  private bootInFlight = false;
  private logoutInProgress = false;

  constructor(options: BootOrchestratorOptions) {
    this.runtimeHost = new RuntimeHost(options.canvas);
    this.loadingScreen = new LoadingScreen();
    this.loginPage = new LoginPage({
      title: 'Welcome back',
      onSubmit: async (credentials) => this.handleLoginSubmit(credentials),
    });
  }

  public start(): void {
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
    try {
      await this.runtimeHost.start();
      this.dispatch('boot_succeeded');
    } catch (error) {
      console.error('Failed to initialize authenticated app session.', error);
      this.dispatch('boot_failed');
    } finally {
      this.bootInFlight = false;
      this.render();
    }
  }

  private handleHardLogout(): void {
    if (this.logoutInProgress) return;
    this.logoutInProgress = true;
    this.dispatch('logout');
    this.authService.logout();
    this.render();
    window.location.reload();
  }
}
