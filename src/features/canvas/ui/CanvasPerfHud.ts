import type { Subscription } from 'rxjs';
import type {
  CanvasManager,
  CanvasPerfSnapshot,
} from '../core/managers/CanvasManager.ts';

export class CanvasPerfHud {
  private readonly root: HTMLDivElement;
  private readonly content: HTMLPreElement;
  private perfSubscription: Subscription | null = null;

  constructor(private readonly canvasManager: CanvasManager) {
    this.root = document.createElement('div');
    this.root.className =
      'absolute bottom-4 left-4 z-20 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 shadow-lg backdrop-blur-sm';
    this.root.dataset.uiPointerEvents = 'none';

    this.content = document.createElement('pre');
    this.content.className = 'm-0 whitespace-pre font-mono leading-4';
    this.content.textContent = 'canvas perf hud';
    this.root.appendChild(this.content);
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.root);
    this.perfSubscription = this.canvasManager.perfSnapshot$.subscribe(
      (snapshot) => this.render(snapshot)
    );
  }

  public unmount(): void {
    this.perfSubscription?.unsubscribe();
    this.perfSubscription = null;
    this.root.remove();
  }

  private render(snapshot: CanvasPerfSnapshot): void {
    this.content.textContent = [
      `draw ${snapshot.avgDrawMs.toFixed(2)}ms | ${snapshot.fps.toFixed(1)} fps (cap ${snapshot.fpsCap})`,
      `status ${snapshot.animatedVisible}/${snapshot.animatedTotal} (${snapshot.statusAnimDetail})`,
      `links ${snapshot.animatedConnectionsVisible} (${snapshot.connectionAnimDetail})`,
    ].join('\n');
  }
}
