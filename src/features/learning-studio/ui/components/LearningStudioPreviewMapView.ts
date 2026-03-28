import type { AppRuntime } from '../../../../app-runtime/index.ts';
import { DotGridCanvasBackgroundAdapter } from '../../../canvas-core/adapters/DotGridCanvasBackgroundAdapter.ts';
import { CanvasManager } from '../../../canvas-core/core/managers/CanvasManager.ts';
import { Scene } from '../../../canvas-core/core/scene/Scene.ts';
import { LearningCanvasRuntimeSemanticsAdapter } from '../../canvas/LearningCanvasRuntimeSemanticsAdapter.ts';
import {
  isLearningLessonNode,
  isLearningUnitNode,
  type LearningCanvasNode,
} from '../../canvas/learningCanvasNodes.ts';
import {
  buildLearningCourseMapCanvasScene,
  type LearningCourseMapCanvasSceneSnapshot,
} from '../../map/index.ts';
import type { LearningStudioPreviewModel } from './LearningStudioScreenModels.ts';

type LearningStudioPreviewMapViewOptions = {
  runtime: AppRuntime;
  preview: LearningStudioPreviewModel;
  onSelectLesson: (lessonId: string) => void;
  immersive?: boolean;
};

const FIT_PADDING = 72;
const MIN_MAP_SCALE = 0.24;
const MAX_MAP_SCALE = 1.25;

export class LearningStudioPreviewMapView {
  public readonly element: HTMLDivElement;

  private canvasManager: CanvasManager | null = null;
  private scene: Scene | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrameId: number | null = null;
  private cleanupHandlers: Array<() => void> = [];
  private sceneSnapshot: LearningCourseMapCanvasSceneSnapshot | null = null;

  constructor(private options: LearningStudioPreviewMapViewOptions) {
    this.element = document.createElement('div');
    this.element.className = 'h-full min-h-0 w-full';
    this.render();
  }

  public update(options: LearningStudioPreviewMapViewOptions): void {
    this.options = options;
    this.render();
  }

  public destroy(): void {
    this.teardownCanvas();
  }

  private render(): void {
    this.teardownCanvas();

    const root = document.createElement('div');
    root.className = this.options.immersive
      ? 'relative h-full min-h-0 w-full overflow-hidden bg-slate-950'
      : 'relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950';
    root.dataset.role = 'learning-studio-preview-map';

    const canvas = document.createElement('canvas');
    canvas.className = 'block h-full w-full bg-slate-950';
    canvas.dataset.role = 'learning-studio-preview-map-canvas';
    root.append(canvas);

    this.element.replaceChildren(root);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallback = document.createElement('div');
      fallback.className =
        'absolute inset-6 flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 px-6 text-center text-sm text-slate-300';
      fallback.dataset.role = 'learning-studio-preview-map-canvas-fallback';
      fallback.textContent = this.options.runtime.i18n.t(
        'learningStudio.preview.mapCanvasUnavailable'
      );
      root.append(fallback, this.renderFallbackNodes());
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.sceneSnapshot = buildLearningCourseMapCanvasScene({
      model: this.options.preview.map,
      labels: {
        structural: this.options.runtime.i18n.t(
          'learningStudio.preview.mapMetaStructural'
        ),
        available: this.options.runtime.i18n.t('learningStudio.progress.available'),
        inProgress: this.options.runtime.i18n.t(
          'learningStudio.progress.inProgress'
        ),
        completed: this.options.runtime.i18n.t('learningStudio.progress.completed'),
        locked: this.options.runtime.i18n.t('learningStudio.progress.locked'),
        review: this.options.runtime.i18n.t('learningStudio.progress.review'),
        hiddenChildren: (count) =>
          this.options.runtime.i18n.t('learningStudio.preview.mapHiddenChildren', {
            count: String(count),
          }),
      },
    });

    const scene = new Scene();
    this.sceneSnapshot.nodes.forEach((node) => scene.addElement(node));
    this.sceneSnapshot.connections.forEach((connection) => scene.addElement(connection));
    this.scene = scene;

    const canvasManager = new CanvasManager(
      canvas,
      scene,
      null,
      new LearningCanvasRuntimeSemanticsAdapter(),
      new DotGridCanvasBackgroundAdapter({
        fillColor: '#020617',
        dotColor: 'rgba(148, 163, 184, 0.18)',
        dotRadius: 1.15,
        spacing: 28,
      })
    );
    this.canvasManager = canvasManager;

    this.installReadOnlyPreviewInteractions(canvas, scene, canvasManager);
    this.applySceneSelection(this.options.preview.map.focusedNodeId);

    canvasManager.init();
    this.fitWhenReady(root);
    this.observeResize(root);
  }

  private renderFallbackNodes(): HTMLElement {
    const panel = document.createElement('div');
    panel.className =
      'absolute bottom-4 left-4 right-4 flex max-h-[40%] flex-col gap-2 overflow-auto rounded-2xl border border-white/10 bg-slate-900/90 p-3';
    panel.dataset.role = 'learning-studio-preview-map-fallback-nodes';

    this.options.preview.map.nodes.forEach((node) => {
      const interactive = node.kind !== 'module';
      const item = interactive
        ? document.createElement('button')
        : document.createElement('div');
      if (interactive) {
        (item as HTMLButtonElement).type = 'button';
      }
      item.className =
        'rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 text-left text-slate-100';
      item.dataset.role = `learning-studio-preview-map-node-${node.id}`;

      if (interactive) {
        item.addEventListener('click', () => {
          this.options.onSelectLesson(
            node.kind === 'lesson' ? node.id : node.parentId ?? node.id
          );
        });
      }

      const title = document.createElement('p');
      title.className = 'text-xs font-semibold uppercase tracking-[0.12em] text-slate-300';
      title.textContent = `${node.kind.toUpperCase()} · ${node.title}`;

      const meta = document.createElement('p');
      meta.className = 'mt-1 text-xs text-slate-400';
      meta.textContent = this.getFallbackMeta(node);

      item.append(title, meta);
      panel.append(item);
    });

    return panel;
  }

  private getFallbackMeta(
    node: LearningStudioPreviewModel['map']['nodes'][number]
  ): string {
    const parts: string[] = [];
    if (node.kind !== 'module') {
      parts.push(this.getProgressLabel(node.state));
    }
    if (node.hiddenChildCount > 0) {
      parts.push(
        this.options.runtime.i18n.t('learningStudio.preview.mapHiddenChildren', {
          count: String(node.hiddenChildCount),
        })
      );
    }
    return parts.join(' · ');
  }

  private getProgressLabel(
    state: LearningStudioPreviewModel['map']['nodes'][number]['state']
  ): string {
    const { i18n } = this.options.runtime;
    switch (state) {
      case 'completed':
        return i18n.t('learningStudio.progress.completed');
      case 'in_progress':
        return i18n.t('learningStudio.progress.inProgress');
      case 'locked':
        return i18n.t('learningStudio.progress.locked');
      case 'review':
        return i18n.t('learningStudio.progress.review');
      case 'available':
        return i18n.t('learningStudio.progress.available');
      case 'none':
      default:
        return i18n.t('learningStudio.preview.mapMetaStructural');
    }
  }

  private installReadOnlyPreviewInteractions(
    canvas: HTMLCanvasElement,
    scene: Scene,
    canvasManager: CanvasManager
  ): void {
    const interactionManager = canvasManager.getInteractionManager() as {
      handleMouseDown: (event: MouseEvent, sceneX: number, sceneY: number) => boolean;
    };
    interactionManager.handleMouseDown = () => false;

    const handleClick = (event: MouseEvent): void => {
      if (event.button !== 0) return;
      const node = this.findSelectableNodeAtClientPoint(
        event.clientX,
        event.clientY,
        canvasManager
      );
      if (!node) return;
      this.applySceneSelection(node.id);
      this.options.onSelectLesson(
        isLearningLessonNode(node)
          ? node.id
          : isLearningUnitNode(node)
            ? node.parentLessonId ?? node.id
            : node.id
      );
    };

    const handleMouseMove = (event: MouseEvent): void => {
      if (event.buttons !== 0) return;
      const node = this.findSelectableNodeAtClientPoint(
        event.clientX,
        event.clientY,
        canvasManager
      );
      canvas.style.cursor = node ? 'pointer' : 'grab';
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    this.cleanupHandlers.push(() => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
    });

    this.cleanupHandlers.push(() => {
      scene.clear();
    });
  }

  private applySceneSelection(nodeId: string | null): void {
    if (!this.scene || !this.sceneSnapshot) return;
    const nextFocusedId =
      nodeId && this.sceneSnapshot.nodes.some((node) => node.id === nodeId)
        ? nodeId
        : null;
    const selectedNode =
      nextFocusedId === null
        ? null
        : this.sceneSnapshot.nodes.find((node) => node.id === nextFocusedId) ?? null;

    this.scene.setFocusedElementById(nextFocusedId);
    if (selectedNode) {
      this.scene.setSelected([selectedNode]);
    } else {
      this.scene.clearSelected();
    }

    this.sceneSnapshot.nodes.forEach((node) => {
      node.focused = node.id === nextFocusedId;
      node.highlighted =
        node.id === this.options.preview.map.recommendedNodeId &&
        node.id !== nextFocusedId;
    });
    this.scene.changes.next();
  }

  private findSelectableNodeAtClientPoint(
    clientX: number,
    clientY: number,
    canvasManager: CanvasManager
  ): LearningCanvasNode | null {
    const canvas = canvasManager.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const panZoom = canvasManager.getPanZoomManager();
    const sceneX = (clientX - rect.left + panZoom.scrollX) / panZoom.scale;
    const sceneY = (clientY - rect.top + panZoom.scrollY) / panZoom.scale;
    const nodes = (this.sceneSnapshot?.nodes ?? []).filter((node) =>
      isLearningLessonNode(node) || isLearningUnitNode(node)
    );

    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      const node = nodes[index];
      if (node.contains(sceneX, sceneY)) {
        return node;
      }
    }
    return null;
  }

  private observeResize(root: HTMLDivElement): void {
    if (!this.canvasManager) return;
    if (typeof ResizeObserver === 'undefined') {
      const handleWindowResize = (): void => this.fitSceneToViewport();
      window.addEventListener('resize', handleWindowResize);
      this.cleanupHandlers.push(() => {
        window.removeEventListener('resize', handleWindowResize);
      });
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.fitSceneToViewport();
    });
    this.resizeObserver.observe(root);
  }

  private fitWhenReady(root: HTMLDivElement): void {
    const run = (): void => {
      if (!this.canvasManager || !this.sceneSnapshot) return;
      const rect = root.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) {
        this.animationFrameId = window.requestAnimationFrame(run);
        return;
      }
      this.fitSceneToViewport();
      this.animationFrameId = null;
    };

    this.animationFrameId = window.requestAnimationFrame(run);
  }

  private fitSceneToViewport(): void {
    if (!this.canvasManager || !this.sceneSnapshot) return;
    this.canvasManager.resizeCanvas();

    const canvas = this.canvasManager.getCanvas();
    const panZoom = this.canvasManager.getPanZoomManager();
    const safeWidth = Math.max(1, canvas.width - FIT_PADDING * 2);
    const safeHeight = Math.max(1, canvas.height - FIT_PADDING * 2);
    const bounds = this.sceneSnapshot.bounds;
    const fitScale = Math.min(
      safeWidth / Math.max(1, bounds.width),
      safeHeight / Math.max(1, bounds.height),
      1
    );
    const scale = Math.min(Math.max(fitScale, MIN_MAP_SCALE), MAX_MAP_SCALE);

    panZoom.virtualWidth = Math.max(bounds.maxX + FIT_PADDING, canvas.width / scale);
    panZoom.virtualHeight = Math.max(bounds.maxY + FIT_PADDING, canvas.height / scale);
    panZoom.scale = scale;

    const offsetX = (canvas.width - bounds.width * scale) / 2;
    const offsetY = (canvas.height - bounds.height * scale) / 2;
    panZoom.setScroll(
      Math.max(0, bounds.minX * scale - offsetX),
      Math.max(0, bounds.minY * scale - offsetY)
    );
    this.scene?.changes.next();
  }

  private teardownCanvas(): void {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    while (this.cleanupHandlers.length > 0) {
      this.cleanupHandlers.pop()?.();
    }
    this.canvasManager?.destroy();
    this.canvasManager = null;
    this.scene = null;
    this.sceneSnapshot = null;
  }
}
