import { environment } from '../../../config/environment.ts';
import type { WorkspaceChatAssembledContext } from './WorkspaceChatContextTypes.ts';
import {
  WORKSPACE_CHAT_GROK_BASE_URL,
  WORKSPACE_CHAT_GROK_MAX_HISTORY_MESSAGES,
  WORKSPACE_CHAT_GROK_MAX_TOKENS,
  WORKSPACE_CHAT_GROK_MODEL,
  WORKSPACE_CHAT_GROK_TEMPERATURE,
} from './WorkspaceChatConfig.ts';
import { buildWorkspaceChatApiMessages } from './WorkspaceChatPromptBuilder.ts';
import type { WorkspaceChatMessage } from './WorkspaceChatTypes.ts';

type WorkspaceChatApiRequest = {
  prompt: string;
  context: WorkspaceChatAssembledContext;
  history: WorkspaceChatMessage[];
  allowActions: boolean;
  signal?: AbortSignal;
};

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

export class WorkspaceChatApiClient {
  public isConfigured(): boolean {
    return environment.grokApiKey.trim().length > 0;
  }

  public async reply(request: WorkspaceChatApiRequest): Promise<string> {
    const apiKey = environment.grokApiKey.trim();
    if (apiKey.length === 0) {
      throw new Error('Chat is not configured.');
    }

    const payload: GrokChatRequest = {
      model: WORKSPACE_CHAT_GROK_MODEL,
      messages: buildWorkspaceChatApiMessages(
        request.prompt,
        request.context,
        request.history,
        request.allowActions,
        WORKSPACE_CHAT_GROK_MAX_HISTORY_MESSAGES
      ),
      temperature: WORKSPACE_CHAT_GROK_TEMPERATURE,
      max_tokens: WORKSPACE_CHAT_GROK_MAX_TOKENS,
      stream: false,
    };

    const response = await fetch(`${WORKSPACE_CHAT_GROK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: request.signal,
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
