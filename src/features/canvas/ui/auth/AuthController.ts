import { BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import { UserApiService } from '../../../../majom-wrapper/data-access/user-api-service.ts';
import {
  LoginCredentials,
  User,
} from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';

export type AuthState = {
  isAuthenticated: boolean;
  isLoginRequested: boolean;
  isSubmitting: boolean;
  isUserLoading: boolean;
  user: User | null;
  error: string | null;
};

export type LoginSubmitResult = { ok: true } | { ok: false; message: string };

const INITIAL_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  isLoginRequested: false,
  isSubmitting: false,
  isUserLoading: false,
  user: null,
  error: null,
};

export class AuthController {
  private readonly stateSubject = new BehaviorSubject<AuthState>(
    INITIAL_AUTH_STATE
  );
  private userLoadSubscription: Subscription | null = null;

  public readonly state$ = this.stateSubject.asObservable();

  constructor(
    private readonly authService: AuthService,
    private readonly userApiService: UserApiService
  ) {}

  public initialize(): void {
    const isAuthenticated = this.authService.isLoggedIn();
    this.patchState({
      isAuthenticated,
      isLoginRequested: false,
      isSubmitting: false,
      error: null,
      user: isAuthenticated ? this.stateSubject.value.user : null,
    });
    if (isAuthenticated) {
      this.loadUserIfNeeded(true);
    }
  }

  public getState(): AuthState {
    return this.stateSubject.value;
  }

  public requestLogin(): void {
    if (this.stateSubject.value.isAuthenticated) return;
    this.patchState({ isLoginRequested: true, error: null });
  }

  public dismissLogin(): void {
    this.patchState({
      isLoginRequested: false,
      error: null,
      isSubmitting: false,
    });
  }

  public async submitLogin(
    credentials: LoginCredentials
  ): Promise<LoginSubmitResult> {
    if (this.stateSubject.value.isSubmitting) {
      return { ok: false, message: 'Login is already in progress.' };
    }
    this.patchState({ isSubmitting: true, error: null });
    try {
      await this.authService.login(credentials);
      this.patchState({
        isAuthenticated: true,
        isSubmitting: false,
        isLoginRequested: false,
        error: null,
      });
      this.loadUserIfNeeded(true);
      return { ok: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.';
      this.patchState({
        isSubmitting: false,
        error: message,
      });
      return { ok: false, message };
    }
  }

  public logout(): void {
    this.authService.logout();
    this.userLoadSubscription?.unsubscribe();
    this.userLoadSubscription = null;
    this.patchState({
      isAuthenticated: false,
      isLoginRequested: false,
      isSubmitting: false,
      isUserLoading: false,
      user: null,
      error: null,
    });
  }

  public loadUserIfNeeded(force: boolean = false): void {
    const state = this.stateSubject.value;
    if (!state.isAuthenticated) return;
    if (state.isUserLoading) return;
    if (state.user && !force) return;

    this.patchState({ isUserLoading: true });
    this.userLoadSubscription?.unsubscribe();
    this.userLoadSubscription = this.userApiService.getUser().subscribe({
      next: (user: User) => {
        this.patchState({
          user,
          isUserLoading: false,
        });
      },
      error: () => {
        this.patchState({ isUserLoading: false });
      },
    });
  }

  public syncUser(user: User): void {
    this.userLoadSubscription?.unsubscribe();
    this.userLoadSubscription = null;
    this.patchState({
      user,
      isUserLoading: false,
      error: null,
    });
  }

  public destroy(): void {
    this.userLoadSubscription?.unsubscribe();
    this.userLoadSubscription = null;
    this.stateSubject.complete();
  }

  private patchState(patch: Partial<AuthState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch,
    });
  }
}
