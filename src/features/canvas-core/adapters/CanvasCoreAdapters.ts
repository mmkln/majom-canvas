import type { CanvasAppearanceAdapter } from './CanvasAppearanceAdapter.ts';
import type { CanvasAlignmentAdapter } from './CanvasAlignmentAdapter.ts';
import type { CanvasBackgroundAdapter } from './CanvasBackgroundAdapter.ts';
import type { CanvasDataAdapter } from './CanvasDataAdapter.ts';
import type { CanvasInteractionAdapter } from './CanvasInteractionAdapter.ts';
import type { CanvasLookupAdapter } from './CanvasLookupAdapter.ts';
import type { CanvasNodeSemanticsAdapter } from './CanvasNodeSemanticsAdapter.ts';
import type { CanvasPersistenceAdapter } from './CanvasPersistenceAdapter.ts';
import type { CanvasRuntimeSemanticsAdapter } from './CanvasRuntimeSemanticsAdapter.ts';
import type { CanvasUiAdapter } from './CanvasUiAdapter.ts';
import type { PlanningCanvasRelationAdapter } from './planning/PlanningCanvasRelationAdapter.ts';

export type CanvasCoreAdapters = {
  data: CanvasDataAdapter;
  lookup: CanvasLookupAdapter;
  persistence: CanvasPersistenceAdapter;
  ui: CanvasUiAdapter;
  nodeSemantics?: CanvasNodeSemanticsAdapter;
  appearance?: CanvasAppearanceAdapter;
  alignment?: CanvasAlignmentAdapter;
  background?: CanvasBackgroundAdapter;
  interaction?: CanvasInteractionAdapter;
  semantics?: CanvasRuntimeSemanticsAdapter;
  planningRelations?: PlanningCanvasRelationAdapter;
};
