import type { AppRuntime } from '../../../../app-runtime/index.ts';
import { CanvasModule as CanvasCoreModule } from '../../../canvas-core/index.ts';
import type { LearningCanvasHostApi } from '../../canvas/LearningCanvasHostApi.ts';
import { createLearningCanvasAdapters } from '../../canvas/createLearningCanvasAdapters.ts';

type LearningStudioCanvasHostViewOptions = {
  runtime: AppRuntime;
  route: 'build' | 'preview';
  hostApi: LearningCanvasHostApi;
};

export class LearningStudioCanvasHostView {
  public readonly element: HTMLDivElement;
  private readonly host: HTMLDivElement;
  private module: CanvasCoreModule | null = null;
  private destroyed = false;

  constructor(private readonly options: LearningStudioCanvasHostViewOptions) {
    this.element = document.createElement('div');
    this.element.className = 'h-full min-h-0 w-full';
    this.element.dataset.role = `learning-studio-${options.route}`;

    this.host = document.createElement('div');
    this.host.className =
      'h-full min-h-[calc(100vh-9rem)] w-full overflow-hidden bg-white';
    this.host.dataset.role = `learning-studio-${options.route}-canvas-host`;

    this.element.append(this.host);
    this.mountCanvas();
  }

  public destroy(): void {
    this.destroyed = true;
    this.module?.unmount();
    this.module = null;
  }

  private mountCanvas(): void {
    if (!this.isCanvasSupported()) {
      this.renderFallback(
        this.options.runtime.i18n.t('learningStudio.canvasHost.unavailable')
      );
      return;
    }

    const module = new CanvasCoreModule({
      runtime: this.options.runtime,
      adapters: createLearningCanvasAdapters(this.options.hostApi),
    });
    this.module = module;

    queueMicrotask(() => {
      if (this.destroyed || this.module !== module) return;
      void module.mount(this.host).catch(() => {
        if (this.destroyed || this.module !== module) return;
        module.unmount();
        this.module = null;
        this.renderFallback(
          this.options.runtime.i18n.t('learningStudio.canvasHost.mountError')
        );
      });
    });
  }

  private isCanvasSupported(): boolean {
    if (
      typeof navigator !== 'undefined' &&
      /jsdom/i.test(navigator.userAgent ?? '')
    ) {
      return false;
    }
    try {
      const probe = document.createElement('canvas');
      if (typeof probe.getContext !== 'function') return false;
      return probe.getContext('2d') !== null;
    } catch {
      return false;
    }
  }

  private renderFallback(message: string): void {
    const state = document.createElement('div');
    state.className =
      'flex h-full min-h-[calc(100vh-9rem)] items-center justify-center px-8 text-center text-sm text-slate-500';
    state.dataset.role = `learning-studio-${this.options.route}-canvas-fallback`;
    state.textContent = message;
    this.host.replaceChildren(state);
  }
}
