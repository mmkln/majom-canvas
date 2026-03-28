import type { Scene } from '../../core/scene/Scene.ts';
import type { IViewState } from '../../core/interfaces/interfaces.ts';
import { DiagramRepository } from '../../core/data/DiagramRepository.ts';
import type { IDataProvider } from '../../core/interfaces/dataProvider.ts';
import type { CanvasPersistenceAdapter } from '../CanvasPersistenceAdapter.ts';

export class PlanningCanvasPersistenceAdapter
  implements CanvasPersistenceAdapter
{
  private readonly diagramRepository: DiagramRepository;

  constructor(private readonly dataProvider: IDataProvider) {
    this.diagramRepository = new DiagramRepository(dataProvider);
  }

  public loadViewState(canvasId?: string | null): Promise<IViewState> {
    return this.dataProvider.loadViewState(canvasId);
  }

  public saveViewState(
    state: IViewState,
    canvasId?: string | null
  ): Promise<void> {
    return this.dataProvider.saveViewState(state, canvasId);
  }

  public loadLegacyDiagram(scene: Scene): Promise<void> {
    return this.diagramRepository.loadDiagram(scene);
  }

  public saveLegacyDiagram(scene: Scene): Promise<void> {
    return this.diagramRepository.saveDiagram(scene);
  }
}
