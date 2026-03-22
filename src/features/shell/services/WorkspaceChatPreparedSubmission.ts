import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';
import type { WorkspaceChatProfile } from './WorkspaceChatContextTypes.ts';

export type WorkspaceChatPreparedSubmission = {
  prompt: string;
  snapshot: WorkspaceChatCanvasSnapshot | null;
  contextMode: WorkspaceChatContextMode;
  profile?: WorkspaceChatProfile;
};
