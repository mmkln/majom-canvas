import type { LearningProgressState } from '../domain/types.ts';

export type LearningCourseMapLayoutMode = 'auto' | 'manual';

export type LearningCourseMapChildUnitVisibility =
  | 'auto'
  | 'important_only'
  | 'all_child_units';

export type LearningCourseMapNodeKind =
  | 'module'
  | 'lesson'
  | 'exercise'
  | 'checkpoint';

export type LearningCourseMapEdgeKind = 'contains' | 'prerequisite';

export type LearningCourseMapNodeState = LearningProgressState | 'none';

export type LearningCourseMapPresentation = {
  layoutMode: LearningCourseMapLayoutMode;
  showModules: boolean;
  childUnitVisibility: LearningCourseMapChildUnitVisibility;
  promotedUnitIds: string[];
  hiddenNodeIds: string[];
  manualNodePositions: Record<string, { x: number; y: number }>;
};

export type LearningCourseMapNode = {
  id: string;
  kind: LearningCourseMapNodeKind;
  title: string;
  moduleId: string;
  parentId: string | null;
  state: LearningCourseMapNodeState;
  isFocused: boolean;
  isRecommended: boolean;
  childCount: number;
  hiddenChildCount: number;
  position: { x: number; y: number } | null;
};

export type LearningCourseMapEdge = {
  id: string;
  kind: LearningCourseMapEdgeKind;
  fromId: string;
  toId: string;
};

export type LearningCourseMapModel = {
  layoutMode: LearningCourseMapLayoutMode;
  presentation: LearningCourseMapPresentation;
  nodes: LearningCourseMapNode[];
  edges: LearningCourseMapEdge[];
  focusedNodeId: string | null;
  recommendedNodeId: string | null;
};

export function createDefaultLearningCourseMapPresentation(): LearningCourseMapPresentation {
  return {
    layoutMode: 'auto',
    showModules: true,
    childUnitVisibility: 'auto',
    promotedUnitIds: [],
    hiddenNodeIds: [],
    manualNodePositions: {},
  };
}
