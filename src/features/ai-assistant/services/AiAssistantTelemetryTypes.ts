import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type { AiAssistantProfile } from './AiAssistantContextTypes.ts';

export type AiAssistantTelemetryRouteType = 'intent' | 'manual';

export type AiAssistantTokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
};

export type AiAssistantTelemetryContext = {
  conversationKey: string;
  requestId: string;
};

export type AiAssistantInteractionTelemetryEvent = {
  kind: 'interaction';
  timestamp: number;
  context: AiAssistantTelemetryContext;
  routeType: AiAssistantTelemetryRouteType;
  intent?: AiAssistantIntentKind;
  profile?: AiAssistantProfile;
  contextMode: AiAssistantContextMode;
  commandSpecUsed: boolean;
  routerHopCount: number;
  toolExecutionRounds: number;
  toolCallCount: number;
  instructionPacketCount: number;
  repairAttempts: number;
  invalidEnvelopeCount: number;
  followupQuestionReturned: boolean;
  tokenUsage?: AiAssistantTokenUsage;
  outcome: 'reply' | 'followup' | 'error' | 'aborted';
};

export type AiAssistantRepairTelemetryEvent = {
  kind: 'repair';
  timestamp: number;
  context: AiAssistantTelemetryContext;
  stage: 'router' | 'command' | 'answer';
  attempt: number;
  validationError: string;
};

export type AiAssistantActionTelemetryEvent = {
  kind: 'action_execution';
  timestamp: number;
  context: AiAssistantTelemetryContext;
  messageId: string;
  appliedActionCount: number;
  pendingActionCount: number;
  actionKinds: string[];
};

export type AiAssistantTelemetryEvent =
  | AiAssistantInteractionTelemetryEvent
  | AiAssistantRepairTelemetryEvent
  | AiAssistantActionTelemetryEvent;

export interface AiAssistantTelemetryCollector {
  record(event: AiAssistantTelemetryEvent): void;
  snapshot(): AiAssistantTelemetryEvent[];
  clear(): void;
}
