import type {
  WorkspaceChatIntentKind,
  WorkspaceChatSelectionItem,
} from './workspaceChatEvents.ts';

export function buildWorkspaceChatReviewPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Review the current canvas structure. Return review findings for missing child items, weak decomposition, duplicates, orphaned items, suspicious dependencies, and overall readiness.';
  }

  if (selection.length === 1) {
    const item = selection[0]!;
    return `Review the selected ${item.kind} "${item.title}" for clarity, missing child items, gaps, overlaps, suspicious dependencies, and readiness. Return review findings.`;
  }

  return `Review the selected cluster of ${selection.length} items for coherence, overlaps, missing links, dependency gaps, and execution readiness. Return review findings.`;
}

export function buildWorkspaceChatBreakdownPrompt(
  item: WorkspaceChatSelectionItem
): string {
  if (item.kind === 'goal') {
    return `Break down the selected goal "${item.title}" into a few concrete stories. Return a create_batch_stories proposal if the structure is clear.`;
  }
  if (item.kind === 'story') {
    return `Break down the selected story "${item.title}" into actionable tasks. Return a create_batch_tasks proposal if the breakdown is clear.`;
  }
  return `Refine the selected task "${item.title}" into clearer execution language and acceptance criteria. Return suggest_updates if concrete refinements are obvious.`;
}

export function buildWorkspaceChatDependencyPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Analyze the current canvas and suggest non-hierarchical relations such as blocks, leads_to, or relates_to where they would improve planning clarity. Return suggest_relations when appropriate.';
  }
  if (selection.length === 1) {
    const item = selection[0]!;
    return `Analyze the selected ${item.kind} "${item.title}" and its nearby structure. Suggest non-hierarchical relations like blocks, leads_to, or relates_to where they would clarify sequencing or dependency risk. Return suggest_relations when appropriate.`;
  }
  return `Analyze the selected cluster of ${selection.length} items and suggest non-hierarchical relations such as blocks, leads_to, or relates_to where they would clarify sequencing, blockers, or overlap. Return suggest_relations when appropriate.`;
}

export function buildWorkspaceChatMissingPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Assess what is missing on the current canvas before this plan is ready for execution. Return review findings and suggest_updates when concrete refinements are obvious.';
  }
  if (selection.length === 1) {
    const item = selection[0]!;
    return `Assess what is missing before the selected ${item.kind} "${item.title}" is ready for execution. Return review findings and suggest_updates when concrete refinements are obvious.`;
  }
  return `Assess what is missing in the selected cluster of ${selection.length} items before it is ready for execution. Return review findings and suggest_relations or suggest_updates when concrete improvements are obvious.`;
}

export function buildWorkspaceChatIntentPrompt(
  intent: WorkspaceChatIntentKind,
  selection: WorkspaceChatSelectionItem[]
): string {
  switch (intent) {
    case 'review':
      return buildWorkspaceChatReviewPrompt(selection);
    case 'breakdown': {
      const item = selection[0];
      return item
        ? buildWorkspaceChatBreakdownPrompt(item)
        : buildWorkspaceChatReviewPrompt([]);
    }
    case 'dependencies':
      return buildWorkspaceChatDependencyPrompt(selection);
    case 'missing':
      return buildWorkspaceChatMissingPrompt(selection);
  }
}
