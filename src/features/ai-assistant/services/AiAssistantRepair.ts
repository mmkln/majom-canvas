import {
  AI_ASSISTANT_STRUCTURED_ACTION_KIND_NOTES,
  AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE,
} from './AiAssistantStructuredTransport.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import { describeAiAssistantStructuredReplyKinds } from './AiAssistantActionPolicy.ts';
import { describeAiAssistantProfiles } from './AiAssistantContextTypes.ts';
import type {
  AiAssistantTelemetryScenarioContext,
  AiAssistantTokenUsage,
} from './AiAssistantTelemetryTypes.ts';

type AiAssistantTextClient = {
  completeText: (
    messages: AiAssistantApiMessage[],
    options?: {
      signal?: AbortSignal;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) => Promise<string>;
  completeTextWithMetadata?: (
    messages: AiAssistantApiMessage[],
    options?: {
      signal?: AbortSignal;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) => Promise<{
    content: string;
    usage?: AiAssistantTokenUsage;
  }>;
};

type AiAssistantValidationResult<T> =
  | {
      ok: true;
      value: T;
      rawContent: string;
      repairAttempts: number;
      usage?: AiAssistantTokenUsage;
    }
  | {
      ok: false;
      error: Error;
      rawContent: string;
      repairAttempts: number;
      usage?: AiAssistantTokenUsage;
    };

export async function completeAiAssistantTextWithRepair<T>(params: {
  client: AiAssistantTextClient;
  messages: AiAssistantApiMessage[];
  validate: (content: string) => T;
  buildRepairMessages: (params: {
    invalidResponse: string;
    validationError: string;
  }) => AiAssistantApiMessage[];
  signal?: AbortSignal;
  maxRepairAttempts?: number;
  onRepairAttempt?: (params: {
    attempt: number;
    validationError: string;
  }) => void;
}): Promise<AiAssistantValidationResult<T>> {
  const maxRepairAttempts = Math.max(0, params.maxRepairAttempts ?? 1);
  const initialResponse = await requestCompletion(
    params.client,
    params.messages,
    {
      signal: params.signal,
    }
  );
  let rawContent = initialResponse.content;
  let usage = cloneUsage(initialResponse.usage);
  let repairAttempts = 0;

  while (true) {
    try {
      return {
        ok: true,
        value: params.validate(rawContent),
        rawContent,
        repairAttempts,
        usage,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('Validation failed.');
      if (repairAttempts >= maxRepairAttempts) {
        return {
          ok: false,
          error: normalizedError,
          rawContent,
          repairAttempts,
          usage,
        };
      }

      params.onRepairAttempt?.({
        attempt: repairAttempts + 1,
        validationError: normalizedError.message,
      });
      const repairResponse = await requestCompletion(
        params.client,
        params.buildRepairMessages({
          invalidResponse: rawContent,
          validationError: normalizedError.message,
        }),
        {
          signal: params.signal,
        }
      );
      rawContent = repairResponse.content;
      usage = combineUsage(usage, repairResponse.usage);
      repairAttempts += 1;
    }
  }
}

function requestCompletion(
  client: AiAssistantTextClient,
  messages: AiAssistantApiMessage[],
  options?: {
    signal?: AbortSignal;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<{
  content: string;
  usage?: AiAssistantTokenUsage;
}> {
  if (client.completeTextWithMetadata) {
    return client.completeTextWithMetadata(messages, options);
  }

  return client.completeText(messages, options).then((content) => ({ content }));
}

function cloneUsage(
  usage: AiAssistantTokenUsage | undefined
): AiAssistantTokenUsage | undefined {
  return usage ? { ...usage } : undefined;
}

function combineUsage(
  first: AiAssistantTokenUsage | undefined,
  second: AiAssistantTokenUsage | undefined
): AiAssistantTokenUsage | undefined {
  if (!first && !second) {
    return undefined;
  }

  return {
    promptTokens: sumUsageField(first?.promptTokens, second?.promptTokens),
    completionTokens: sumUsageField(
      first?.completionTokens,
      second?.completionTokens
    ),
    totalTokens: sumUsageField(first?.totalTokens, second?.totalTokens),
    cost: sumUsageField(first?.cost, second?.cost),
  };
}

function sumUsageField(
  first: number | undefined,
  second: number | undefined
): number | undefined {
  if (typeof first !== 'number' && typeof second !== 'number') {
    return undefined;
  }

  return (
    (typeof first === 'number' ? first : 0) +
    (typeof second === 'number' ? second : 0)
  );
}

export function buildAiAssistantRouterRepairMessages(params: {
  invalidResponse: string;
  validationError: string;
  originalMessages?: AiAssistantApiMessage[];
  scenario?: AiAssistantTelemetryScenarioContext;
}): AiAssistantApiMessage[] {
  const allowedProfiles = describeAiAssistantProfiles();
  const originalContext =
    params.originalMessages && params.originalMessages.length > 0
      ? `Original router request:\n${JSON.stringify(params.originalMessages, null, 2)}`
      : null;
  const scenarioContext = describeScenarioContext(params.scenario);
  const systemLines = [
    'You repair invalid JSON emitted by a routing model.',
    'Return JSON only.',
    'Do not add markdown fences, explanations, or commentary.',
    'Preserve the original routing intent whenever possible.',
    'Use the original router request context to recover the intended decision when the invalid response was conversational or off-format.',
  ];
  if (scenarioContext) {
    systemLines.push(scenarioContext);
  }
  systemLines.push(
    `Use one of these exact profile values: ${allowedProfiles}.`,
    'Allowed decision shapes:',
    '{"kind":"load_instructions","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","instructionIds":["<instruction id>"]}',
    '{"kind":"execute_tools","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","calls":[{"tool":"<tool name>","input":{}}]}',
    '{"kind":"ask_followup","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","question":"<question>"}',
    '{"kind":"finalize","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>"}'
  );
  return [
    {
      role: 'system',
      content: systemLines.join('\n'),
    },
    {
      role: 'user',
      content: [
        `Validation error: ${params.validationError}`,
        'Repair this output into one valid router decision JSON object.',
        originalContext,
        `Invalid response:\n${params.invalidResponse}`,
      ].join('\n\n'),
    },
  ];
}

export function buildAiAssistantStructuredReplyRepairMessages(params: {
  invalidResponse: string;
  validationError: string;
  allowActions: boolean;
  intent?: AiAssistantIntentKind;
  scenario?: AiAssistantTelemetryScenarioContext;
}): AiAssistantApiMessage[] {
  const systemLines = [
    'You repair invalid AI assistant responses into the required structured JSON envelope.',
    'Return JSON only.',
    'Do not add markdown fences, explanations, or commentary.',
    'Preserve the original replyMarkdown meaning whenever possible.',
    `Required envelope shape: ${AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE}`,
  ];
  const scenarioContext = describeScenarioContext(params.scenario);
  if (scenarioContext) {
    systemLines.push(scenarioContext);
  }

  if (!params.allowActions) {
    systemLines.push('If unsure, set "actions": [].');
  } else {
    const intentScopedKinds = describeAiAssistantStructuredReplyKinds(
      params.intent
    );
    systemLines.push(
      'Keep actions confirm-first. If evidence is weak, set "actions": [].',
      ...(intentScopedKinds
        ? [
            `For this request, only use these structured reply fields or action kinds: ${intentScopedKinds}.`,
          ]
        : AI_ASSISTANT_STRUCTURED_ACTION_KIND_NOTES)
    );
  }

  return [
    {
      role: 'system',
      content: systemLines.join('\n'),
    },
    {
      role: 'user',
      content: [
        `Validation error: ${params.validationError}`,
        'Repair this output into one valid structured reply envelope.',
        `Invalid response:\n${params.invalidResponse}`,
      ].join('\n\n'),
    },
  ];
}

function describeScenarioContext(
  scenario: AiAssistantTelemetryScenarioContext | undefined
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
  ].filter(Boolean);

  return parts.length > 0 ? `Scenario context: ${parts.join(', ')}` : null;
}

export function tryParseAiAssistantJsonCandidate<T = unknown>(
  content: string
): T | null {
  const candidates = [content, extractJsonCodeBlock(content), extractJsonObject(content)];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // ignore and try the next candidate
    }
  }
  return null;
}

function extractJsonCodeBlock(content: string): string | null {
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() || null;
}

function extractJsonObject(content: string): string | null {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return content.slice(start, end + 1).trim();
}
