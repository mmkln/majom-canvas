import { App } from '../App.ts';
import { LocalStorageDataProvider } from '../core/data/LocalStorageDataProvider.ts';

export class RuntimeHost {
  private app: App | null = null;
  private starting = false;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  public hideCanvas(): void {
    this.canvas.style.display = 'none';
    this.canvas.style.pointerEvents = 'none';
  }

  public showCanvas(): void {
    this.canvas.style.display = 'block';
    this.canvas.style.pointerEvents = 'auto';
  }

  public async start(): Promise<void> {
    if (this.app || this.starting) return;
    this.starting = true;
    try {
      const nextApp = new App(new LocalStorageDataProvider());
      await nextApp.init();
      this.app = nextApp;
    } finally {
      this.starting = false;
    }
  }
}
