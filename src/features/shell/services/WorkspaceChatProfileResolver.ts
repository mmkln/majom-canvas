import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import type { WorkspaceChatProfile } from './WorkspaceChatContextTypes.ts';

export function resolveWorkspaceChatProfile(
  prompt: string,
  snapshot: WorkspaceChatCanvasSnapshot | null
): WorkspaceChatProfile {
  const normalizedPrompt = prompt.trim().toLowerCase();
  if (
    normalizedPrompt.includes('summarize') ||
    normalizedPrompt.includes('summary')
  ) {
    return 'summarize';
  }

  if (
    normalizedPrompt.includes('review') ||
    normalizedPrompt.includes('selection') ||
    normalizedPrompt.includes('selected')
  ) {
    return 'review-selection';
  }

  if (
    normalizedPrompt.includes('dependency') ||
    normalizedPrompt.includes('dependencies') ||
    normalizedPrompt.includes('relation') ||
    normalizedPrompt.includes('blocker') ||
    normalizedPrompt.includes('sequence')
  ) {
    return 'dependency-review';
  }

  if (
    normalizedPrompt.includes('missing') ||
    normalizedPrompt.includes('readiness') ||
    normalizedPrompt.includes('ready') ||
    normalizedPrompt.includes('gap') ||
    normalizedPrompt.includes('what is missing')
  ) {
    return 'readiness-check';
  }

  if (
    normalizedPrompt.includes('next') ||
    normalizedPrompt.includes('suggest') ||
    normalizedPrompt.includes('what should') ||
    normalizedPrompt.includes('what next')
  ) {
    return 'next-steps';
  }

  if (
    normalizedPrompt.includes('break down') ||
    normalizedPrompt.includes('breakdown') ||
    normalizedPrompt.includes('break this') ||
    normalizedPrompt.includes('split into') ||
    normalizedPrompt.includes('decompose') ||
    normalizedPrompt.includes('acceptance') ||
    normalizedPrompt.includes('criteria')
  ) {
    return 'breakdown';
  }

  if ((snapshot?.selectionIds.length ?? 0) > 0 && normalizedPrompt.includes('help')) {
    return 'review-selection';
  }

  return 'general-question';
}
