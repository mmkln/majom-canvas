import type { WorkspaceChatElementKind } from './workspaceChatEvents.ts';

export function getWorkspaceChatReviewHint(): string {
  return 'Finds gaps, overlaps, and readiness risks in the current selection.';
}

export function getWorkspaceChatClarifyHint(
  kind: WorkspaceChatElementKind
): string {
  if (kind === 'goal') {
    return 'Tightens the goal wording so the outcome reads more clearly.';
  }
  if (kind === 'story') {
    return 'Sharpens the story wording so the scope and outcome are easier to plan.';
  }
  return 'Rewrites the task wording so it is clearer and easier to execute.';
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

export function getWorkspaceChatLinkBlockersHint(): string {
  return 'Suggests blockers, sequencing links, and nearby relations around this item.';
}

export function getWorkspaceChatConnectSelectedHint(): string {
  return 'Suggests blockers, sequencing links, and related connections between the selected items.';
}

export function getWorkspaceChatFillDetailsHint(): string {
  return 'Fills obvious title and description gaps for the current scope.';
}

export function getWorkspaceChatMissingHint(): string {
  return 'Highlights missing scope, edge cases, and follow-up work.';
}
