import type {
  WorkspaceChatIntentKind,
  WorkspaceChatSelectionItem,
} from './workspaceChatEvents.ts';

export function buildWorkspaceChatReviewPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Review the current canvas structure. Return review findings for missing child items, weak decomposition, duplicates, orphaned items, suspicious dependencies, and overall readiness. When concrete dependency cleanup, relation type fixes, or missing links are obvious, you may return suggest_relations, remove_relations, update_relations, or suggest_updates as confirm-first actions.';
  }

  if (selection.length === 1) {
    const item = selection[0];
    return `Review the selected ${item.kind} "${item.title}" for clarity, missing child items, gaps, overlaps, suspicious dependencies, and readiness. Return review findings. When concrete dependency cleanup, relation type fixes, or missing links are obvious, you may return suggest_relations, remove_relations, update_relations, or suggest_updates as confirm-first actions.`;
  }

  return `Review the selected cluster of ${selection.length} items for coherence, overlaps, missing links, dependency gaps, and execution readiness. Return review findings. When concrete dependency cleanup, relation type fixes, or missing links are obvious, you may return suggest_relations, remove_relations, update_relations, or suggest_updates as confirm-first actions.`;
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

export function buildWorkspaceChatStrategicPlanPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 1 && selection[0]?.kind === 'goal') {
    const item = selection[0];
    return `Create a strategic goal-level plan around the selected goal "${item.title}". Return create_goals for a flat set of child goals, or create_goal_blueprint for subgoals with hierarchy and optional leads_to links. Default to strategic goals only; do not decompose into stories or tasks unless the user explicitly asks for execution detail. Do not invent tools, timelines, certifications, or metrics unless the user explicitly supplied them or asked for them.`;
  }

  return 'Create a strategic goal-level plan for this canvas. Return create_goals for a flat strategic set of top-level goals, or create_goal_blueprint for a strategic skeleton with one main goal, subgoals, and optional leads_to links. Default to strategic goals only; do not decompose into stories or tasks unless the user explicitly asks for execution detail. Do not invent tools, timelines, certifications, or metrics unless the user explicitly supplied them or asked for them.';
}

export function buildWorkspaceChatClarifyPrompt(
  item: WorkspaceChatSelectionItem
): string {
  if (item.kind === 'goal') {
    return `Clarify the selected goal "${item.title}" so it reads as a concrete planning outcome. Tighten the title and description without changing the intent. Return suggest_updates when concrete wording improvements are obvious.`;
  }
  if (item.kind === 'story') {
    return `Clarify the selected story "${item.title}" so the scope, outcome, and description are easier to understand and plan against. Return suggest_updates when concrete wording improvements are obvious.`;
  }
  return `Clarify the selected task "${item.title}" so it is specific, concise, and executable. Tighten the title and description without changing the task intent. Return suggest_updates when concrete wording improvements are obvious.`;
}

export function buildWorkspaceChatDependencyPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Analyze the current canvas and suggest non-hierarchical relations such as blocks, leads_to, or relates_to where they would improve planning clarity. When an existing non-hierarchical link should stay but with a different meaning, return update_relations instead of removing and re-adding it conceptually. Return suggest_relations, remove_relations, or update_relations for the strongest supported changes. Ask a follow-up question only when no concrete relation action can be justified from the current canvas evidence.';
  }
  if (selection.length === 1) {
    const item = selection[0];
    return `Analyze the selected ${item.kind} "${item.title}" and its nearby structure. Suggest non-hierarchical relations like blocks, leads_to, or relates_to where they would clarify sequencing or dependency risk. If an existing link should stay but needs a different type, return update_relations. Return suggest_relations, remove_relations, or update_relations for the strongest supported changes. Ask a follow-up question only when no concrete relation action can be justified from the available evidence.`;
  }
  return `Analyze the selected cluster of ${selection.length} items and suggest non-hierarchical relations such as blocks, leads_to, or relates_to where they would clarify sequencing, blockers, or overlap. When an existing link should remain but with a different meaning, return update_relations. Return suggest_relations, remove_relations, or update_relations for the strongest supported changes inside the selected cluster. Ask a follow-up question only when no concrete relation action can be justified from the available evidence.`;
}

export function buildWorkspaceChatFillDetailsPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Fill in missing planning details across the current canvas. Focus on items with empty or weak titles or descriptions. Return suggest_updates only when concrete wording improvements are clearly supported by the canvas context.';
  }
  if (selection.length === 1) {
    const item = selection[0];
    return `Fill in the missing details for the selected ${item.kind} "${item.title}". Focus on title or description gaps that reduce clarity or make execution harder. Suggest a description when either nearby canvas context or explicit user-provided details support at least one concrete detail beyond the title itself. If the current context is too thin and the user has not supplied enough detail yet, ask one follow-up question instead of paraphrasing the title. Return suggest_updates only when the improvement is specific, reviewable, and grounded in real evidence.`;
  }
  return `Fill in missing details across the selected cluster of ${selection.length} items. Focus on title or description gaps that reduce clarity or make the work harder to execute. Prefer evidence-backed refinements over generic rewrites, and ask follow-up questions only when neither the canvas nor explicit user details support a meaningful update. Return suggest_updates only when each improvement is specific, reviewable, and grounded in real evidence.`;
}

export function buildWorkspaceChatMissingPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Assess what is missing on the current canvas before this plan is ready for execution. Return review findings and suggest_updates when concrete refinements are obvious. If an existing non-hierarchical relation is clearly wrong, needs a different type, or a missing link is obvious, you may return remove_relations, update_relations, or suggest_relations as confirm-first actions.';
  }
  if (selection.length === 1) {
    const item = selection[0];
    return `Assess what is missing before the selected ${item.kind} "${item.title}" is ready for execution. Return review findings and suggest_updates when concrete refinements are obvious. If an existing non-hierarchical relation is clearly wrong, needs a different type, or a missing link is obvious, you may return remove_relations, update_relations, or suggest_relations as confirm-first actions.`;
  }
  return `Assess what is missing in the selected cluster of ${selection.length} items before it is ready for execution. Return review findings and suggest_relations, remove_relations, update_relations, or suggest_updates when concrete improvements are obvious.`;
}

export function buildWorkspaceChatNextStepsPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Suggest the next best planning steps for this canvas, with emphasis on sequence, gaps, blockers, and execution readiness.';
  }
  if (selection.length === 1) {
    const item = selection[0];
    return `Suggest the next best planning steps for the selected ${item.kind} "${item.title}", with emphasis on sequence, gaps, blockers, and execution readiness.`;
  }
  return `Suggest the next best planning steps for the selected cluster of ${selection.length} items, with emphasis on sequence, gaps, blockers, and execution readiness.`;
}

export function buildWorkspaceChatDuplicatePrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Find duplicate or overlapping work on the current canvas. Focus on duplicate titles, likely overlap, and redundant planning slices.';
  }
  if (selection.length === 1) {
    const item = selection[0];
    return `Find duplicate or overlapping work around the selected ${item.kind} "${item.title}". Focus on duplicate titles, likely overlap, and redundant planning slices.`;
  }
  return `Find duplicate or overlapping work inside the selected cluster of ${selection.length} items. Focus on duplicate titles, likely overlap, and redundant planning slices.`;
}

export function buildWorkspaceChatRecentChangesPrompt(
  selection: WorkspaceChatSelectionItem[]
): string {
  if (selection.length === 0) {
    return 'Review the recent canvas activity. Summarize what changed, what looks risky, and what planning follow-up should happen next.';
  }
  if (selection.length === 1) {
    const item = selection[0];
    return `Review the recent activity touching the selected ${item.kind} "${item.title}". Summarize what changed, what looks risky, and what planning follow-up should happen next.`;
  }
  return `Review the recent activity touching the selected cluster of ${selection.length} items. Summarize what changed, what looks risky, and what planning follow-up should happen next.`;
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
    case 'strategic_plan':
      return buildWorkspaceChatStrategicPlanPrompt(selection);
    case 'missing':
      return buildWorkspaceChatMissingPrompt(selection);
    case 'clarify': {
      const item = selection[0];
      return item
        ? buildWorkspaceChatClarifyPrompt(item)
        : buildWorkspaceChatFillDetailsPrompt([]);
    }
    case 'fill_details':
      return buildWorkspaceChatFillDetailsPrompt(selection);
  }
}
