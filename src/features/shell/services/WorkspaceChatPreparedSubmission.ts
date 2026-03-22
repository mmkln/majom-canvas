import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatIntentKind,
} from '../workspaceChatEvents.ts';
import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';
import type { WorkspaceChatProfile } from './WorkspaceChatContextTypes.ts';
import type { WorkspaceChatToolHost } from './WorkspaceChatToolTypes.ts';
import type { WorkspaceChatMessageKind } from './WorkspaceChatTypes.ts';

export type WorkspaceChatPreparedSubmission = {
  prompt: string;
  snapshot: WorkspaceChatCanvasSnapshot | null;
  contextMode: WorkspaceChatContextMode;
  source?: 'manual' | 'intent';
  intent?: WorkspaceChatIntentKind;
  profile?: WorkspaceChatProfile;
  liveHost?: WorkspaceChatToolHost | null;
  requestLabel?: string;
  requestMessageKind?: Extract<WorkspaceChatMessageKind, 'system' | 'command'>;
};
