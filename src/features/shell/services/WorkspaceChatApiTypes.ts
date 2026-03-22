export type WorkspaceChatApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
