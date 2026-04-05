import { Subscription } from 'rxjs';

import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { positionFixedElement } from './overlayPosition.ts';
import { createIconButton } from './primitives/index.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import { addTaskToStory } from './storyTaskActions.ts';
import { EditElementModal } from './components/EditElementModal.ts';

const MIN_VISIBLE_SCALE = 0.2;

export class StoryQuickCreateAction {
  private readonly container: HTMLDivElement;
  private readonly button: HTMLButtonElement;
  private readonly layoutService = new StoryLayoutService();
  private readonly subscriptions: Subscription[] = [];
  private disposeRuntimeSubscription: (() => void) | null = null;
  private activeStory: StoryElement | null = null;
  private isPointerInsideControl = false;
  private mounted = false;
  private activeInteractions = new Set<'drag' | 'resize' | 'select'>();
  private viewportSettleTimer: number | null = null;
  private suppressViewportUpdates = false;
  private readonly viewportSettleMs = 140;

  private readonly pointerMoveHandler = (event: PointerEvent): void => {
    if (!this.mounted) return;

    const target = event.target;
    if (target instanceof Node && this.container.contains(target)) {
      this.isPointerInsideControl = true;
      this.requestUpdate();
      return;
    }
    this.isPointerInsideControl = false;

    const canvas = this.canvasManager.getCanvas();
    if (!(target instanceof Node) || !canvas.contains(target)) {
      this.activeStory = null;
      this.requestUpdate();
      return;
    }
    this.requestUpdate();
  };

  private readonly pointerLeaveHandler = (): void => {
    if (this.isPointerInsideControl) return;
    this.activeStory = null;
    this.requestUpdate();
  };

  private readonly interactionStartHandler = (event: Event): void => {
    const detail = (
      event as CustomEvent<{ kind?: 'drag' | 'resize' | 'select' }>
    ).detail;
    const kind = detail?.kind;
    if (!kind) return;
    this.activeInteractions.add(kind);
    this.hide();
  };

  private readonly interactionEndHandler = (event: Event): void => {
    const detail = (
      event as CustomEvent<{ kind?: 'drag' | 'resize' | 'select' }>
    ).detail;
    const kind = detail?.kind;
    if (!kind) return;
    this.activeInteractions.delete(kind);
    this.requestUpdate();
  };

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager,
    private readonly runtime: AppRuntime = createAppRuntime()
  ) {
    this.container = document.createElement('div');
    this.container.className =
      'fixed z-40 flex items-center opacity-0 scale-95 pointer-events-none transition-[opacity,transform] duration-150 ease-out';
    this.container.setAttribute('aria-hidden', 'true');
    this.button = createIconButton({
      icon: 'plus',
      size: 'sm',
      tone: 'text',
      className:
        'rounded-full bg-white/92 text-slate-500 shadow-[0_4px_12px_rgba(15,23,42,0.08)] ring-1 ring-white/75 backdrop-blur-sm hover:bg-white hover:text-indigo-600 active:bg-slate-50',
      title: '',
      ariaLabel: '',
      onClick: (event) => {
        event.stopPropagation();
        this.handleCreateTask();
      },
    });
    this.button.dataset.role = 'story-quick-create-action';
    this.container.appendChild(this.button);
    this.container.addEventListener('pointerenter', () => {
      this.isPointerInsideControl = true;
    });
    this.container.addEventListener('pointerleave', () => {
      this.isPointerInsideControl = false;
      this.requestUpdate();
    });
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this.mounted) return;
    this.mounted = true;
    parent.appendChild(this.container);

    const canvas = this.canvasManager.getCanvas();
    canvas.addEventListener('pointerleave', this.pointerLeaveHandler);
    window.addEventListener('pointermove', this.pointerMoveHandler);
    window.addEventListener(
      'canvasInteractionStart',
      this.interactionStartHandler
    );
    window.addEventListener('canvasInteractionEnd', this.interactionEndHandler);

    this.subscriptions.push(
      this.scene.changes.subscribe(() => this.requestUpdate())
    );
    this.subscriptions.push(
      this.canvasManager
        .getPanZoomManager()
        .viewChanges.subscribe(() => this.handleViewChange())
    );
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.refreshRuntimeUi(),
      { emitCurrent: true }
    );
  }

  public unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.length = 0;
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;

    const canvas = this.canvasManager.getCanvas();
    canvas.removeEventListener('pointerleave', this.pointerLeaveHandler);
    window.removeEventListener('pointermove', this.pointerMoveHandler);
    window.removeEventListener(
      'canvasInteractionStart',
      this.interactionStartHandler
    );
    window.removeEventListener(
      'canvasInteractionEnd',
      this.interactionEndHandler
    );

    this.container.remove();
    this.activeStory = null;
    this.isPointerInsideControl = false;
    this.activeInteractions.clear();
    this.clearViewportSettleTimer();
    this.suppressViewportUpdates = false;
  }

  private requestUpdate(): void {
    const story = this.getVisibleStory();
    if (!story) {
      this.activeStory = null;
      this.hide();
      return;
    }

    this.activeStory = story;
    this.positionForStory(story);
    this.show();
  }

  private getVisibleStory(): StoryElement | null {
    if (!this.canShowAction()) return null;
    return this.getSelectedStory() ?? this.getHoveredStory();
  }

  private handleViewChange(): void {
    this.suppressViewportUpdates = true;
    this.hide();
    this.clearViewportSettleTimer();
    this.viewportSettleTimer = window.setTimeout(() => {
      this.viewportSettleTimer = null;
      this.suppressViewportUpdates = false;
      this.requestUpdate();
    }, this.viewportSettleMs);
  }

  private clearViewportSettleTimer(): void {
    if (this.viewportSettleTimer === null) return;
    window.clearTimeout(this.viewportSettleTimer);
    this.viewportSettleTimer = null;
  }

  private canShowAction(): boolean {
    if (this.activeInteractions.size > 0) return false;
    if (
      this.suppressViewportUpdates ||
      this.canvasManager.isDraggingElements ||
      this.canvasManager.isResizingStory
    ) {
      return false;
    }

    return this.canvasManager.getPanZoomManager().scale >= MIN_VISIBLE_SCALE;
  }

  private getSelectedStory(): StoryElement | null {
    const selectedElements = this.scene.getSelectedElements();
    return selectedElements.length === 1 &&
      selectedElements[0] instanceof StoryElement
      ? selectedElements[0]
      : null;
  }

  private getHoveredStory(): StoryElement | null {
    if (this.isPointerInsideControl && this.activeStory) {
      return this.activeStory;
    }

    const stories = this.scene
      .getElements()
      .filter((element): element is StoryElement => element instanceof StoryElement);

    for (let index = stories.length - 1; index >= 0; index -= 1) {
      const story = stories[index] as StoryElement & { isHovered?: boolean };
      if (story.isHovered) {
        return story;
      }
    }

    return null;
  }

  private positionForStory(story: StoryElement): void {
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    const anchorX =
      (story.x + story.width) * panZoom.scale - panZoom.scrollX + rect.left;
    const anchorY = story.y * panZoom.scale - panZoom.scrollY + rect.top;

    positionFixedElement(this.container, {
      anchorX,
      anchorY,
      alignX: 'right',
      alignY: 'top',
      offsetX: -12,
      offsetY: 12,
      margin: 12,
    });
  }

  private handleCreateTask(): void {
    if (!this.activeStory) return;

    const task = addTaskToStory({
      story: this.activeStory,
      scene: this.scene,
      canvasManager: this.canvasManager,
      layoutService: this.layoutService,
    });

    this.hide();
    this.activeStory = null;
    new EditElementModal(task, this.scene).show({
      initialTitleMode: 'edit',
    });
  }

  private refreshRuntimeUi(): void {
    const label = this.runtime.i18n.t('selectionMenu.createTask');
    this.button.title = label;
    this.button.setAttribute('aria-label', label);
  }

  private show(): void {
    if (this.container.getAttribute('aria-hidden') === 'false') return;
    this.container.setAttribute('aria-hidden', 'false');
    this.container.classList.remove(
      'opacity-0',
      'scale-95',
      'pointer-events-none'
    );
    this.container.classList.add('opacity-100', 'scale-100');
  }

  private hide(): void {
    if (this.container.getAttribute('aria-hidden') === 'true') return;
    this.container.setAttribute('aria-hidden', 'true');
    this.container.classList.remove('opacity-100', 'scale-100');
    this.container.classList.add(
      'opacity-0',
      'scale-95',
      'pointer-events-none'
    );
  }
}
