import { Subject } from 'rxjs';

export type CanvasPersistenceSnapshot = {
  historyLayoutDirty: boolean;
  restoredLayoutDirty: boolean;
  restoredReplayPending: boolean;
  restoredReplayFailed: boolean;
};

export class CanvasPersistenceState {
  private historyLayoutDirty = false;
  private restoredLayoutDirty = false;
  private restoredReplayPending = false;
  private restoredReplayFailed = false;

  public readonly changes = new Subject<void>();

  public getSnapshot(): CanvasPersistenceSnapshot {
    return {
      historyLayoutDirty: this.historyLayoutDirty,
      restoredLayoutDirty: this.restoredLayoutDirty,
      restoredReplayPending: this.restoredReplayPending,
      restoredReplayFailed: this.restoredReplayFailed,
    };
  }

  public hasLayoutDirty(): boolean {
    return this.historyLayoutDirty || this.restoredLayoutDirty;
  }

  public hasRestoredReplayPending(): boolean {
    return this.restoredReplayPending;
  }

  public hasRestoredReplayFailed(): boolean {
    return this.restoredReplayFailed;
  }

  public hasManualSaveWork(): boolean {
    return this.hasLayoutDirty() || this.restoredReplayFailed;
  }

  public syncHistoryLayoutDirty(isDirty: boolean): void {
    if (this.historyLayoutDirty === isDirty) return;
    this.historyLayoutDirty = isDirty;
    this.changes.next();
  }

  public markRestoredLayoutDirty(): void {
    if (this.restoredLayoutDirty) return;
    this.restoredLayoutDirty = true;
    this.changes.next();
  }

  public clearRestoredLayoutDirty(): void {
    if (!this.restoredLayoutDirty) return;
    this.restoredLayoutDirty = false;
    this.changes.next();
  }

  public startRestoredReplay(): void {
    const changed = !this.restoredReplayPending || this.restoredReplayFailed;
    this.restoredReplayPending = true;
    this.restoredReplayFailed = false;
    if (changed) {
      this.changes.next();
    }
  }

  public markRestoredReplayFailed(): void {
    const changed = this.restoredReplayPending || !this.restoredReplayFailed;
    this.restoredReplayPending = false;
    this.restoredReplayFailed = true;
    if (changed) {
      this.changes.next();
    }
  }

  public clearRestoredReplayState(): void {
    const changed = this.restoredReplayPending || this.restoredReplayFailed;
    this.restoredReplayPending = false;
    this.restoredReplayFailed = false;
    if (changed) {
      this.changes.next();
    }
  }

  public reset(): void {
    const changed =
      this.historyLayoutDirty ||
      this.restoredLayoutDirty ||
      this.restoredReplayPending ||
      this.restoredReplayFailed;
    this.historyLayoutDirty = false;
    this.restoredLayoutDirty = false;
    this.restoredReplayPending = false;
    this.restoredReplayFailed = false;
    if (changed) {
      this.changes.next();
    }
  }
}
