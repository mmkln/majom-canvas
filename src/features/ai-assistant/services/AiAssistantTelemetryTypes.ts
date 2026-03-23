import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type {
  AiAssistantActiveScenario,
  AiAssistantProfile,
} from './AiAssistantContextTypes.ts';

export type AiAssistantTelemetryRouteType = 'intent' | 'manual';

export type AiAssistantTelemetryRouteLength = 'short' | 'long';

export type AiAssistantTelemetryProposalStyle =
  | 'clarify-first'
  | 'direct';

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

export type AiAssistantTelemetryScenarioContext = {
  scenarioId?: string;
  scenarioMode?: string;
  scenarioKind?: 'typed' | 'fallback';
  routeLength?: AiAssistantTelemetryRouteLength;
  proposalStyle?: AiAssistantTelemetryProposalStyle;
  fallbackReason?: string;
};

export function buildAiAssistantTelemetryScenarioContext(params: {
  scenario?: AiAssistantActiveScenario | null;
  fallbackReason?: string;
  awaitingUserInput?: boolean;
}): AiAssistantTelemetryScenarioContext | undefined {
  const scenario = params.scenario;
  const routeLength =
    scenario?.routeLength ?? (params.awaitingUserInput ? 'long' : undefined);
  const proposalStyle =
    scenario?.proposalStyle ?? (params.awaitingUserInput ? 'clarify-first' : undefined);

  if (!scenario && !params.fallbackReason && !routeLength && !proposalStyle) {
    return undefined;
  }

  return {
    scenarioId: scenario?.id,
    scenarioMode: scenario?.mode,
    scenarioKind: scenario?.kind,
    routeLength,
    proposalStyle,
    fallbackReason: params.fallbackReason,
  };
}

export function describeAiAssistantTelemetryScenarioContext(
  scenario: AiAssistantTelemetryScenarioContext | null | undefined
): string | null {
  if (!scenario) {
    return null;
  }

  const parts = [
    scenario.scenarioId ? `scenarioId=${scenario.scenarioId}` : null,
    scenario.scenarioMode ? `scenarioMode=${scenario.scenarioMode}` : null,
    scenario.scenarioKind ? `scenarioKind=${scenario.scenarioKind}` : null,
    scenario.routeLength ? `routeLength=${scenario.routeLength}` : null,
    scenario.proposalStyle ? `proposalStyle=${scenario.proposalStyle}` : null,
    scenario.fallbackReason ? `fallbackReason=${scenario.fallbackReason}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? `Scenario context: ${parts.join(', ')}` : null;
}

export type AiAssistantInteractionTelemetryEvent = {
  kind: 'interaction';
  timestamp: number;
  context: AiAssistantTelemetryContext;
  scenarioId?: string;
  scenarioMode?: string;
  scenarioKind?: 'typed' | 'fallback';
  routeLength?: AiAssistantTelemetryRouteLength;
  proposalStyle?: AiAssistantTelemetryProposalStyle;
  fallbackReason?: string;
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
  scenarioId?: string;
  scenarioMode?: string;
  scenarioKind?: 'typed' | 'fallback';
  routeLength?: AiAssistantTelemetryRouteLength;
  proposalStyle?: AiAssistantTelemetryProposalStyle;
  fallbackReason?: string;
  stage: 'router' | 'command' | 'answer';
  attempt: number;
  validationError: string;
};

export type AiAssistantActionTelemetryEvent = {
  kind: 'action_execution';
  timestamp: number;
  context: AiAssistantTelemetryContext;
  scenarioId?: string;
  scenarioMode?: string;
  scenarioKind?: 'typed' | 'fallback';
  routeLength?: AiAssistantTelemetryRouteLength;
  proposalStyle?: AiAssistantTelemetryProposalStyle;
  fallbackReason?: string;
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
