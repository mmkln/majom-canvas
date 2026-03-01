import type { CanvasHudShell, CanvasHudSlots } from '../hudShell.ts';
import { createSurface } from '../primitives/index.ts';

export class CanvasMobileHudShell implements CanvasHudShell {
  public readonly mode = 'mobile' as const;
  private root: HTMLDivElement | null = null;
  private slots: CanvasHudSlots | null = null;

  public mount(parent: HTMLElement): CanvasHudSlots {
    if (this.root && this.slots) return this.slots;

    const root = document.createElement('div');
    root.className = 'absolute inset-0 z-20 pointer-events-none';

    const topBar = document.createElement('div');
    topBar.className =
      'absolute inset-x-0 top-0 z-20 pointer-events-none px-3 pt-[max(0.75rem,env(safe-area-inset-top))]';
    const contextBar = createSurface({
      className:
        'mx-auto flex w-full max-w-[min(100%,34rem)] items-center justify-between gap-2 p-1.5 pointer-events-auto backdrop-blur-0',
    });

    const board = document.createElement('div');
    board.className = 'min-w-0 flex-1';

    const save = document.createElement('div');
    save.className = 'flex shrink-0 items-center';

    contextBar.append(board, save);
    topBar.appendChild(contextBar);

    const navigation = document.createElement('div');
    navigation.className =
      'absolute inset-x-0 bottom-0 z-20 pointer-events-none px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]';
    const navigationWrap = document.createElement('div');
    navigationWrap.className =
      'mx-auto w-full max-w-[min(100%,28rem)] pointer-events-auto';
    const navigationContent = document.createElement('div');
    navigationContent.className = 'flex w-full flex-col gap-2';
    navigationWrap.appendChild(navigationContent);
    navigation.appendChild(navigationWrap);

    root.append(topBar, navigation);
    parent.appendChild(root);

    this.root = root;
    this.slots = { board, save, navigation: navigationContent };
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
