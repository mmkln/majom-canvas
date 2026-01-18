import { BehaviorSubject } from 'rxjs';

class RequestTracker {
  private activeCount = 0;
  private activeCount$ = new BehaviorSubject<number>(0);

  public start(): void {
    this.activeCount += 1;
    this.activeCount$.next(this.activeCount);
  }

  public end(): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.activeCount$.next(this.activeCount);
  }

  public changes() {
    return this.activeCount$.asObservable();
  }
}

export const requestTracker = new RequestTracker();
