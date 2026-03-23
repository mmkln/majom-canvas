export type AiAssistantApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
