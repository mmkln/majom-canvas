import type {
  WorkspaceChatCanvasElement,
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatRecentActivityItem,
} from '../workspaceChatEvents.ts';
import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';

export type WorkspaceChatProfile =
  | 'summarize'
  | 'review-selection'
  | 'next-steps'
  | 'breakdown'
  | 'dependency-review'
  | 'readiness-check'
  | 'general-question';

export type WorkspaceChatMemoryState = {
  currentIntent: string | null;
  agreedFacts: string[];
  workingSet: string[];
  lastRecommendations: string[];
  updatedAt: number | null;
};

export type WorkspaceChatFocusItem = {
  item: WorkspaceChatCanvasElement;
  parent: WorkspaceChatCanvasElement | null;
  children: WorkspaceChatCanvasElement[];
  siblings: WorkspaceChatCanvasElement[];
  related: Array<{
    item: WorkspaceChatCanvasElement;
    relationType: string;
  }>;
};

export type WorkspaceChatAssembledContext = {
  profile: WorkspaceChatProfile;
  contextMode: WorkspaceChatContextMode;
  rawSnapshot: WorkspaceChatCanvasSnapshot | null;
  contextSummary: string;
  workspaceSummary: string;
  selection: WorkspaceChatCanvasElement[];
  focus: WorkspaceChatFocusItem | null;
  viewportItems: WorkspaceChatCanvasElement[];
  recentActivity: WorkspaceChatRecentActivityItem[];
  memory: WorkspaceChatMemoryState;
  queryMatches: WorkspaceChatCanvasElement[];
};

export const EMPTY_WORKSPACE_CHAT_MEMORY_STATE: WorkspaceChatMemoryState = {
  currentIntent: null,
  agreedFacts: [],
  workingSet: [],
  lastRecommendations: [],
  updatedAt: null,
};
