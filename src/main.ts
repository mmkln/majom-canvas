// main.ts
import { App } from './App.ts';
import { LocalStorageDataProvider } from './core/data/LocalStorageDataProvider.ts';
import { AuthService } from './majom-wrapper/data-access/auth-service.ts';
import { LoginPage } from './ui/components/LoginPage.ts';
import { authFlowService } from './ui/auth/authFlowService.ts';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('myCanvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Canvas element not found');
  }

  const authService = new AuthService();
  let app: App | null = null;
  let mountingApp = false;
  let logoutInProgress = false;

  const hideCanvas = (): void => {
    canvas.style.display = 'none';
    canvas.style.pointerEvents = 'none';
  };

  const showCanvas = (): void => {
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'auto';
  };

  const mountApp = async (): Promise<void> => {
    if (app || mountingApp) return;
    mountingApp = true;
    try {
      showCanvas();
      const nextApp = new App(new LocalStorageDataProvider());
      await nextApp.init();
      app = nextApp;
    } catch (error) {
      hideCanvas();
      authService.logout();
      throw error;
    } finally {
      mountingApp = false;
    }
  };

  const loginPage = new LoginPage({
    title: 'Welcome back',
    onSubmit: async (credentials) => {
      try {
        await authService.login(credentials);
        await mountApp();
        return { ok: true };
      } catch (error: unknown) {
        authService.logout();
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : 'Login failed. Please try again.',
        };
      }
    },
  });

  const showLoginGate = (): void => {
    hideCanvas();
    if (!loginPage.isVisible()) {
      loginPage.show();
      return;
    }
    loginPage.focusPrimaryField();
  };

  const requestHardLogout = (): void => {
    if (logoutInProgress) return;
    logoutInProgress = true;
    authService.logout();
    loginPage.hide();
    hideCanvas();
    window.location.reload();
  };

  authFlowService.logoutRequests$.subscribe(() => {
    requestHardLogout();
  });

  authFlowService.loginRequests$.subscribe(() => {
    if (authService.isLoggedIn()) return;
    if (!app) {
      showLoginGate();
      return;
    }
    authFlowService.requestLogout('session-expired');
  });

  const bootstrap = async (): Promise<void> => {
    hideCanvas();
    if (!authService.isLoggedIn()) {
      showLoginGate();
      return;
    }
    try {
      await mountApp();
    } catch (error) {
      console.error('Failed to initialize authenticated app session.', error);
      showLoginGate();
    }
  };

  void bootstrap();
});
