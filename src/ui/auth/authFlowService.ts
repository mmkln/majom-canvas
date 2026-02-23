import { Subject } from 'rxjs';

export type LoginRequestReason =
  | 'save'
  | 'protected-action'
  | 'canvas-access'
  | 'unknown';

export type LoginRequest = {
  reason: LoginRequestReason;
};

class AuthFlowService {
  private readonly loginRequestSubject = new Subject<LoginRequest>();

  public readonly loginRequests$ = this.loginRequestSubject.asObservable();

  public requestLogin(reason: LoginRequestReason = 'unknown'): void {
    this.loginRequestSubject.next({ reason });
  }
}

export const authFlowService = new AuthFlowService();
