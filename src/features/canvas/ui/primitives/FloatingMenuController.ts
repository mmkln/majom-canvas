type FloatingMenuControllerOptions = {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
  containsTarget: (target: Node) => boolean;
};

export class FloatingMenuController {
  private readonly isOpen: () => boolean;
  private readonly setOpen: (open: boolean) => void;
  private readonly containsTarget: (target: Node) => boolean;
  private mounted = false;

  constructor(options: FloatingMenuControllerOptions) {
    this.isOpen = options.isOpen;
    this.setOpen = options.setOpen;
    this.containsTarget = options.containsTarget;
  }

  public mount(): void {
    if (this.mounted) return;
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('keydown', this.onKeyDown);
    this.mounted = true;
  }

  public unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('keydown', this.onKeyDown);
    this.mounted = false;
  }

  private readonly onMouseDown = (event: MouseEvent): void => {
    if (!this.isOpen()) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (this.containsTarget(target)) return;
    this.setOpen(false);
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen()) return;
    if (event.key !== 'Escape') return;
    this.setOpen(false);
  };
}
