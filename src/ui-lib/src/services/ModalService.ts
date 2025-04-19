export class ModalService {
  private openCount = 0;

  /** Call when a modal is opened */
  register(): void {
    this.openCount += 1;
  }

  /** Call when a modal is closed */
  unregister(): void {
    this.openCount = Math.max(0, this.openCount - 1);
  }

  /** Returns true if any modal is currently open */
  isOpen(): boolean {
    return this.openCount > 0;
  }
}

/** Singleton service for tracking open modals */
export const modalService = new ModalService();
