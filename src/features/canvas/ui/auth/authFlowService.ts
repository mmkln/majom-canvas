import { Subject } from 'rxjs';

export type LoginRequestReason =
  | 'save'
  | 'protected-action'
  | 'canvas-access'
  | 'unknown';

export type LoginRequest = {
  reason: LoginRequestReason;
};

export type LogoutRequestReason =
  | 'manual'
  | 'session-expired'
  | 'unauthorized'
  | 'unknown';

export type LogoutRequest = {
  reason: LogoutRequestReason;
};

class AuthFlowService {
  private readonly loginRequestSubject = new Subject<LoginRequest>();
  private readonly logoutRequestSubject = new Subject<LogoutRequest>();
  private readonly accountSwitchRequestSubject = new Subject<void>();

  public readonly loginRequests$ = this.loginRequestSubject.asObservable();
  public readonly logoutRequests$ = this.logoutRequestSubject.asObservable();
  public readonly accountSwitchRequests$ =
    this.accountSwitchRequestSubject.asObservable();

  public requestLogin(reason: LoginRequestReason = 'unknown'): void {
    this.loginRequestSubject.next({ reason });
  }

  public requestLogout(reason: LogoutRequestReason = 'unknown'): void {
    this.logoutRequestSubject.next({ reason });
  }

  public requestAccountSwitch(): void {
    this.accountSwitchRequestSubject.next();
  }
}

export const authFlowService = new AuthFlowService();
