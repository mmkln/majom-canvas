import type { WorkspaceChatElementKind } from './workspaceChatEvents.ts';

export function getWorkspaceChatReviewHint(): string {
  return 'Finds gaps, overlaps, and readiness risks in the current selection.';
}

export function getWorkspaceChatBreakdownHint(
  kind: WorkspaceChatElementKind
): string {
  if (kind === 'goal') {
    return 'Suggests a few concrete stories that would move this goal forward.';
  }
  if (kind === 'story') {
    return 'Turns this story into actionable tasks you can plan or execute.';
  }
  return 'Clarifies the task wording and tightens acceptance criteria.';
}

export function getWorkspaceChatDependenciesHint(): string {
  return 'Suggests blockers, sequencing links, and related dependencies.';
}

export function getWorkspaceChatMissingHint(): string {
  return 'Highlights missing scope, edge cases, and follow-up work.';
}
