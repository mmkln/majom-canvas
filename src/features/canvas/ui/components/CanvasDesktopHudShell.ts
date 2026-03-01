import type { CanvasHudShell, CanvasHudSlots } from '../hudShell.ts';

export class CanvasDesktopHudShell implements CanvasHudShell {
  public readonly mode = 'desktop' as const;
  private root: HTMLDivElement | null = null;
  private slots: CanvasHudSlots | null = null;

  public mount(parent: HTMLElement): CanvasHudSlots {
    if (this.root && this.slots) return this.slots;

    const root = document.createElement('div');
    root.className = 'absolute inset-0 z-20 pointer-events-none';

    const board = document.createElement('div');
    board.className = 'absolute left-4 top-4 z-20 pointer-events-none';

    const save = document.createElement('div');
    save.className = 'absolute right-4 top-4 z-20 pointer-events-none';

    const navigation = document.createElement('div');
    navigation.className = 'absolute right-4 bottom-4 z-20 pointer-events-none';

    root.append(board, save, navigation);
    parent.appendChild(root);

    this.root = root;
    this.slots = { board, save, navigation };
    return this.slots;
  }

  public unmount(): void {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
    this.slots = null;
  }
}

