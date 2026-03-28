import { Subscription } from 'rxjs';
import type { CanvasUiComponent } from '../../canvas-core/adapters/CanvasUiAdapter.ts';
import type { Scene } from '../../canvas-core/core/scene/Scene.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import {
  isLearningModuleNode,
  isLearningUnitNode,
} from './learningCanvasNodes.ts';

export class LearningCanvasSelectionBridge implements CanvasUiComponent {
  private subscription: Subscription | null = null;
  private lastSelectionKey: string | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly hostApi: LearningCanvasHostApi
  ) {}

  public mount(): void {
    if (this.hostApi.getDocument().mode !== 'build') {
      return;
    }
    this.subscription = this.scene.changes.subscribe(() => {
      this.syncSelection();
    });
    this.syncSelection();
  }

  public unmount(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private syncSelection(): void {
    const document = this.hostApi.getDocument();
    const selected = this.scene.getSelectedElements();
    const nextSelection =
      selected.length === 1
        ? this.resolveSelectionForElement(selected[0], document.courseId)
        : ({ kind: 'course', id: document.courseId } as const);
    const nextKey = `${nextSelection.kind}:${nextSelection.id}`;
    if (nextKey === this.lastSelectionKey) {
      return;
    }
    this.lastSelectionKey = nextKey;
    this.hostApi.selection.setSelection(nextSelection);
  }

  private resolveSelectionForElement(
    element: unknown,
    courseId: string
  ): { kind: 'course'; id: string } | { kind: 'module'; id: string } | { kind: 'unit'; id: string } {
    if (isLearningModuleNode(element as never)) {
      return {
        kind: 'module',
        id: (element as { id: string }).id,
      };
    }
    if (isLearningUnitNode(element as never)) {
      return {
        kind: 'unit',
        id: (element as { id: string }).id,
      };
    }
    return {
      kind: 'course',
      id: courseId,
    };
  }
}
