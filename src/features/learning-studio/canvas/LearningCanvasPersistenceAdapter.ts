import type { Scene } from '../../canvas-core/core/scene/Scene.ts';
import type { IViewState } from '../../canvas-core/core/interfaces/interfaces.ts';
import type { CanvasPersistenceAdapter } from '../../canvas-core/adapters/CanvasPersistenceAdapter.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import {
  hydrateLearningCanvasScene,
  mergeSceneIntoLearningContent,
} from './learningCanvasMapping.ts';

const DEFAULT_VIEW_STATE: IViewState = {
  scrollX: 0,
  scrollY: 0,
  scale: 1,
};

export class LearningCanvasPersistenceAdapter implements CanvasPersistenceAdapter {
  constructor(private readonly hostApi: LearningCanvasHostApi) {}

  public async loadViewState(): Promise<IViewState> {
    const key = this.getViewStateStorageKey();
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return { ...DEFAULT_VIEW_STATE };
      const parsed = JSON.parse(raw) as Partial<IViewState>;
      return {
        scrollX:
          typeof parsed.scrollX === 'number' && Number.isFinite(parsed.scrollX)
            ? parsed.scrollX
            : 0,
        scrollY:
          typeof parsed.scrollY === 'number' && Number.isFinite(parsed.scrollY)
            ? parsed.scrollY
            : 0,
        scale:
          typeof parsed.scale === 'number' && Number.isFinite(parsed.scale)
            ? parsed.scale
            : 1,
      };
    } catch {
      return { ...DEFAULT_VIEW_STATE };
    }
  }

  public async saveViewState(state: IViewState): Promise<void> {
    window.localStorage.setItem(this.getViewStateStorageKey(), JSON.stringify(state));
  }

  public async loadLegacyDiagram(scene: Scene): Promise<void> {
    await hydrateLearningCanvasScene(scene, this.hostApi.getDocument().content);
  }

  public async saveLegacyDiagram(scene: Scene): Promise<void> {
    const document = this.hostApi.getDocument();
    if (document.mode !== 'build') return;
    this.hostApi.saveContent(
      mergeSceneIntoLearningContent(document.content, scene)
    );
  }

  private getViewStateStorageKey(): string {
    const document = this.hostApi.getDocument();
    return `learning-studio-canvas-view:${document.courseId}:${document.mode}`;
  }
}
