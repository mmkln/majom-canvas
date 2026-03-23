import type {
  AiAssistantCanvasSnapshot,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type { AiAssistantProfile } from './AiAssistantContextTypes.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';
import type { AiAssistantToolHost } from './AiAssistantToolTypes.ts';
import type { AiAssistantMessageKind } from './AiAssistantTypes.ts';

export type AiAssistantPreparedSubmission = {
  prompt: string;
  snapshot: AiAssistantCanvasSnapshot | null;
  contextMode: AiAssistantContextMode;
  source?: 'manual' | 'intent';
  intent?: AiAssistantIntentKind;
  intentContext?: AiAssistantIntentContext;
  scenario?: AiAssistantScenarioDescriptor;
  profile?: AiAssistantProfile;
  liveHost?: AiAssistantToolHost | null;
  requestLabel?: string;
  requestMessageKind?: Extract<AiAssistantMessageKind, 'system' | 'command'>;
};
