import type { CanvasCoreAdapters } from '../../canvas-core/adapters/CanvasCoreAdapters.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import { LearningCanvasDataAdapter } from './LearningCanvasDataAdapter.ts';
import { LearningCanvasInteractionAdapter } from './LearningCanvasInteractionAdapter.ts';
import { LearningCanvasLookupAdapter } from './LearningCanvasLookupAdapter.ts';
import { LearningCanvasNodeSemanticsAdapter } from './LearningCanvasNodeSemanticsAdapter.ts';
import { LearningCanvasPersistenceAdapter } from './LearningCanvasPersistenceAdapter.ts';
import { LearningCanvasRuntimeSemanticsAdapter } from './LearningCanvasRuntimeSemanticsAdapter.ts';
import { LearningCanvasUiAdapter } from './LearningCanvasUiAdapter.ts';

export function createLearningCanvasAdapters(
  hostApi: LearningCanvasHostApi
): CanvasCoreAdapters {
  const nodeSemantics = new LearningCanvasNodeSemanticsAdapter();
  return {
    data: new LearningCanvasDataAdapter(hostApi, nodeSemantics),
    interaction: new LearningCanvasInteractionAdapter(hostApi),
    lookup: new LearningCanvasLookupAdapter(),
    nodeSemantics,
    persistence: new LearningCanvasPersistenceAdapter(hostApi),
    semantics: new LearningCanvasRuntimeSemanticsAdapter(),
    ui: new LearningCanvasUiAdapter(hostApi),
  };
}
