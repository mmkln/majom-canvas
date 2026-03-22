import {
  WORKSPACE_CHAT_STRUCTURED_ACTION_KIND_NOTES,
  WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE,
} from './WorkspaceChatStructuredTransport.ts';
import type { WorkspaceChatApiMessage } from './WorkspaceChatApiTypes.ts';

type WorkspaceChatTextClient = {
  completeText: (
    messages: WorkspaceChatApiMessage[],
    options?: {
      signal?: AbortSignal;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) => Promise<string>;
};

type WorkspaceChatValidationResult<T> =
  | {
      ok: true;
      value: T;
      rawContent: string;
      repairAttempts: number;
    }
  | {
      ok: false;
      error: Error;
      rawContent: string;
      repairAttempts: number;
    };

export async function completeWorkspaceChatTextWithRepair<T>(params: {
  client: WorkspaceChatTextClient;
  messages: WorkspaceChatApiMessage[];
  validate: (content: string) => T;
  buildRepairMessages: (params: {
    invalidResponse: string;
    validationError: string;
  }) => WorkspaceChatApiMessage[];
  signal?: AbortSignal;
  maxRepairAttempts?: number;
}): Promise<WorkspaceChatValidationResult<T>> {
  const maxRepairAttempts = Math.max(0, params.maxRepairAttempts ?? 1);
  let rawContent = await params.client.completeText(params.messages, {
    signal: params.signal,
  });
  let repairAttempts = 0;

  while (true) {
    try {
      return {
        ok: true,
        value: params.validate(rawContent),
        rawContent,
        repairAttempts,
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
        };
      }

      rawContent = await params.client.completeText(
        params.buildRepairMessages({
          invalidResponse: rawContent,
          validationError: normalizedError.message,
        }),
        {
          signal: params.signal,
        }
      );
      repairAttempts += 1;
    }
  }
}

export function buildWorkspaceChatRouterRepairMessages(params: {
  invalidResponse: string;
  validationError: string;
}): WorkspaceChatApiMessage[] {
  return [
    {
      role: 'system',
      content: [
        'You repair invalid JSON emitted by a routing model.',
        'Return JSON only.',
        'Do not add markdown fences, explanations, or commentary.',
        'Preserve the original routing intent whenever possible.',
        'Allowed decision shapes:',
        '{"kind":"load_instructions","profile":"<workspace chat profile>","contextMode":"<none|canvas|viewport|selection>","instructionIds":["<instruction id>"]}',
        '{"kind":"execute_tools","profile":"<workspace chat profile>","contextMode":"<none|canvas|viewport|selection>","calls":[{"tool":"<tool name>","input":{}}]}',
        '{"kind":"ask_followup","profile":"<workspace chat profile>","contextMode":"<none|canvas|viewport|selection>","question":"<question>"}',
        '{"kind":"finalize","profile":"<workspace chat profile>","contextMode":"<none|canvas|viewport|selection>"}',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Validation error: ${params.validationError}`,
        'Repair this output into one valid router decision JSON object.',
        `Invalid response:\n${params.invalidResponse}`,
      ].join('\n\n'),
    },
  ];
}

export function buildWorkspaceChatStructuredReplyRepairMessages(params: {
  invalidResponse: string;
  validationError: string;
  allowActions: boolean;
}): WorkspaceChatApiMessage[] {
  const systemLines = [
    'You repair invalid workspace chat responses into the required structured JSON envelope.',
    'Return JSON only.',
    'Do not add markdown fences, explanations, or commentary.',
    'Preserve the original replyMarkdown meaning whenever possible.',
    `Required envelope shape: ${WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE}`,
  ];

  if (!params.allowActions) {
    systemLines.push('If unsure, set "actions": [].');
  } else {
    systemLines.push(
      'Keep actions confirm-first. If evidence is weak, set "actions": [].',
      ...WORKSPACE_CHAT_STRUCTURED_ACTION_KIND_NOTES
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

export function tryParseWorkspaceChatJsonCandidate<T = unknown>(
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
