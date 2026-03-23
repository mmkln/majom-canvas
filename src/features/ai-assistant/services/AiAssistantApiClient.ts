import { environment } from '../../../config/environment.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
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
    return content;
  }

}
