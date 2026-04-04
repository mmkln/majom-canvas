import type {
  ConnectionLineType,
  ConnectionRelationType,
} from '../core/interfaces/connection.ts';
import type { GoalScale } from '../elements/GoalElement.ts';
import type { HabitCompletionEntry } from '../elements/HabitElement.ts';
import type { ElementStatus } from '../elements/ElementStatus.ts';
import type { Status } from '../../../majom-wrapper/interfaces/index.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';

type BaseCanvasDraftNode = {
  id: string;
  uuid?: string;
  backendId?: number | string;
  x: number;
  y: number;
  title: string;
  description: string;
};

export type CanvasDraftTaskRecord = BaseCanvasDraftNode & {
  kind: 'task';
  status: ElementStatus;
  priority: UiPriority;
  dueDate: string | null;
};

export type CanvasDraftStoryRecord = BaseCanvasDraftNode & {
  kind: 'story';
  width: number;
  height: number;
  status: ElementStatus;
  priority: UiPriority;
  taskIds: string[];
  goalBackendId: number | null;
};

export type CanvasDraftGoalRecord = BaseCanvasDraftNode & {
  kind: 'goal';
  width: number;
  height: number;
  status: ElementStatus;
  priority: UiPriority;
  scale: GoalScale;
  links: string[];
  progress: number;
  tagIds: number[];
  tags: string[];
};

export type CanvasDraftHabitRecord = BaseCanvasDraftNode & {
  kind: 'habit';
  priority: UiPriority;
  habitStatus: Status.Active | Status.Archived;
  meta: Record<string, unknown> | null;
  completedToday: boolean;
  isDueToday: boolean;
  lastChecked: string | null;
  completionHistory: HabitCompletionEntry[];
};

export type CanvasDraftNodeRecord =
  | CanvasDraftTaskRecord
  | CanvasDraftStoryRecord
  | CanvasDraftGoalRecord
  | CanvasDraftHabitRecord;

export type CanvasDraftConnectionRecord = {
  id: string;
  fromId: string;
  toId: string;
  lineType: ConnectionLineType;
  relationType: ConnectionRelationType;
};

export type CanvasDraftSnapshot = {
  version: 2;
  canvasId: string;
  savedAt: string;
  baseCanvasMetaFingerprint: string | null;
  fingerprint: string;
  nodes: CanvasDraftNodeRecord[];
  connections: CanvasDraftConnectionRecord[];
  focusedElementId: string | null;
  highlightedElementIds: string[];
};

export interface CanvasDraftRepository {
  load(canvasId: string): Promise<CanvasDraftSnapshot | null>;
  save(snapshot: CanvasDraftSnapshot): Promise<void>;
  clear(canvasId: string): Promise<void>;
}
