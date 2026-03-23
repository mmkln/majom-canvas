import { environment } from '../../../config/environment.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
import type { AiAssistantTokenUsage } from './AiAssistantTelemetryTypes.ts';
import {
  AI_ASSISTANT_GROK_BASE_URL,
  AI_ASSISTANT_GROK_MAX_TOKENS,
  AI_ASSISTANT_GROK_MODEL,
  AI_ASSISTANT_GROK_TEMPERATURE,
} from './AiAssistantConfig.ts';

type GrokChatRequest = {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

type GrokChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost?: number;
  };
  error?: {
    message?: string;
  };
};

export class AiAssistantApiClient {
  public isConfigured(): boolean {
    return environment.grokApiKey.trim().length > 0;
  }

  public async completeText(
    messages: AiAssistantApiMessage[],
    options: {
      signal?: AbortSignal;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const apiKey = environment.grokApiKey.trim();
    if (apiKey.length === 0) {
      throw new Error('AI Assistant is not configured.');
    }

    const payload: GrokChatRequest = {
      model: options.model ?? AI_ASSISTANT_GROK_MODEL,
      messages,
      temperature: options.temperature ?? AI_ASSISTANT_GROK_TEMPERATURE,
      max_tokens: options.maxTokens ?? AI_ASSISTANT_GROK_MAX_TOKENS,
      stream: false,
    };

    const result = await this.completeTextWithMetadata(messages, options, payload);
    return result.content;
  }

  public async completeTextWithMetadata(
    messages: AiAssistantApiMessage[],
    options: {
      signal?: AbortSignal;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {},
    payloadOverride?: GrokChatRequest
  ): Promise<{
    content: string;
    usage?: AiAssistantTokenUsage;
  }> {
    const apiKey = environment.grokApiKey.trim();
    if (apiKey.length === 0) {
      throw new Error('AI Assistant is not configured.');
    }

    const payload: GrokChatRequest =
      payloadOverride ?? {
        model: options.model ?? AI_ASSISTANT_GROK_MODEL,
        messages,
        temperature: options.temperature ?? AI_ASSISTANT_GROK_TEMPERATURE,
        max_tokens: options.maxTokens ?? AI_ASSISTANT_GROK_MAX_TOKENS,
        stream: false,
      };

    const response = await fetch(`${AI_ASSISTANT_GROK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({}))) as GrokChatResponse;
      throw new Error(
        errorData.error?.message ||
          `Grok API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as GrokChatResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Grok returned an empty response.');
    }
    return {
      content,
      usage: normalizeUsage(data.usage),
    };
  }

}

function normalizeUsage(
  usage: GrokChatResponse['usage']
): AiAssistantTokenUsage | undefined {
  if (!usage) {
    return undefined;
  }

  const normalized: AiAssistantTokenUsage = {};
  if (typeof usage.prompt_tokens === 'number') {
    normalized.promptTokens = usage.prompt_tokens;
  }
  if (typeof usage.completion_tokens === 'number') {
    normalized.completionTokens = usage.completion_tokens;
  }
  if (typeof usage.total_tokens === 'number') {
    normalized.totalTokens = usage.total_tokens;
  }
  if (typeof usage.cost === 'number') {
    normalized.cost = usage.cost;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}
