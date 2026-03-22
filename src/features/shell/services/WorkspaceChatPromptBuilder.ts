import {
  isWorkspaceChatHistoryMessage,
  type WorkspaceChatMessage,
} from './WorkspaceChatTypes.ts';
import {
  WORKSPACE_CHAT_STRUCTURED_ACTION_KIND_NOTES,
  WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE,
  getWorkspaceChatCreateTargetRules,
  getWorkspaceChatStructuredReplyExamples,
} from './WorkspaceChatStructuredTransport.ts';
import { formatWorkspaceChatCanonicalContext } from './WorkspaceChatContent.ts';
import type {
  WorkspaceChatAssembledContext,
  WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';

export type WorkspaceChatApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export function buildWorkspaceChatApiMessages(
  prompt: string,
  context: WorkspaceChatAssembledContext,
  history: WorkspaceChatMessage[],
  allowActions: boolean,
  maxHistoryMessages: number
): WorkspaceChatApiMessage[] {
  const systemMessage: WorkspaceChatApiMessage = {
    role: 'system',
    content: buildWorkspaceChatSystemPrompt(context, allowActions),
  };

  const historyMessages = selectRelevantHistoryMessages(
    history,
    prompt,
    context,
    maxHistoryMessages
  ).map(
    (message): WorkspaceChatApiMessage => ({
      role: message.role,
      content: message.content,
    })
  );

  const lastHistory = historyMessages[historyMessages.length - 1];
  if (lastHistory?.role === 'user' && lastHistory.content.trim() === prompt.trim()) {
    return [systemMessage, ...historyMessages];
  }

  return [
    systemMessage,
    ...historyMessages,
    {
      role: 'user',
      content: prompt.trim(),
    },
  ];
}

export function buildWorkspaceChatSystemPrompt(
  context: WorkspaceChatAssembledContext,
  allowActions: boolean
): string {
  const sections = [
    [
      'You are a concise product planning assistant embedded inside a canvas workspace.',
      'Be practical, specific, and action-oriented.',
      'When useful, structure suggestions as short flat lists.',
      'Do not invent canvas facts that are not present in the provided context.',
      `Context profile: ${context.profile}.`,
      buildProfileInstructions(context.profile),
      buildActionInstructions(allowActions),
    ].join('\n'),
    `Workspace context:\n${formatWorkspaceChatCanonicalContext(context.rawSnapshot)}`,
    `Context summary:\n${context.contextSummary}`,
  ];

  if (context.memory.currentIntent || context.memory.agreedFacts.length > 0) {
    sections.push(
      [
        'Conversation memory:',
        context.memory.currentIntent
          ? `Current intent: ${context.memory.currentIntent}`
          : null,
        context.memory.agreedFacts.length > 0
          ? `Agreed facts:\n- ${context.memory.agreedFacts.join('\n- ')}`
          : null,
        context.memory.lastRecommendations.length > 0
          ? `Last recommendations:\n- ${context.memory.lastRecommendations.join('\n- ')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  if (context.focus) {
    sections.push(buildFocusSection(context));
  } else if (context.selection.length > 0) {
    sections.push(
      `Selection:\n- ${context.selection
        .map((item) => `${capitalize(item.kind)} "${item.title || 'Untitled'}"`)
        .join('\n- ')}`
    );
  }

  if (context.queryMatches.length > 0) {
    sections.push(
      `Prompt matches:\n- ${context.queryMatches
        .map((item) => `${capitalize(item.kind)} "${item.title || 'Untitled'}"`)
        .join('\n- ')}`
    );
  }

  if (context.contextMode === 'viewport' && context.viewportItems.length > 0) {
    sections.push(
      `Visible area:\n- ${context.viewportItems
        .map((item) => `${capitalize(item.kind)} "${item.title || 'Untitled'}"`)
        .join('\n- ')}`
    );
  }

  if (context.recentActivity.length > 0) {
    sections.push(
      `Recent activity:\n- ${context.recentActivity
        .map((item) => item.label)
        .join('\n- ')}`
    );
  }

  return sections.join('\n\n');
}

function buildActionInstructions(allowActions: boolean): string {
  if (!allowActions) {
    return [
      'Return valid JSON only.',
      'Use this exact envelope shape:',
      '{"replyMarkdown":"<markdown reply>","actions":[]}',
      'Do not include planning proposals in non-canvas views.',
    ].join('\n');
  }

  const {
    singleActionsExample,
    batchCreateExample,
    dependencySuggestionExample,
    updateSuggestionExample,
  } = getWorkspaceChatStructuredReplyExamples();

  return [
    'Return valid JSON only.',
    'Use this exact envelope shape:',
    WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE,
    'This chat is a confirm-first planning copilot for the canvas.',
    'Never claim that a change was already created or applied. You only prepare proposals pending user confirmation.',
    'Use these structured result types when they fit the request:',
    ...WORKSPACE_CHAT_STRUCTURED_ACTION_KIND_NOTES,
    'If essential data is missing, ask a follow-up question and return "actions": [] and omit reviewFindings.',
    'Supported flat action kinds after parsing: create_task, create_story, create_goal, suggest_relation, suggest_update.',
    'Supported priorities: lowest, low, medium, high, highest.',
    'Supported elementStatus values: defined, pending, in-progress, done.',
    'Never return destructive, delete, move, or auto-apply actions.',
    'A title is required for create actions. Description is optional.',
    'For relation suggestions, always use element IDs from the provided canvas context.',
    'For update suggestions, always use elementId and a non-empty patch.',
    'Targets must follow these rules for create actions:',
    ...getWorkspaceChatCreateTargetRules(),
    `Examples:\n${JSON.stringify(singleActionsExample, null, 2)}`,
    `Batch create example:\n${JSON.stringify(batchCreateExample, null, 2)}`,
    `Dependency suggestion example:\n${JSON.stringify(
      dependencySuggestionExample,
      null,
      2
    )}`,
    `Update suggestion example:\n${JSON.stringify(updateSuggestionExample, null, 2)}`,
  ].join('\n');
}

function buildFocusSection(context: WorkspaceChatAssembledContext): string {
  const focus = context.focus;
  if (!focus) return '';

  const parts = [
    `Active focus:\n- ${capitalize(focus.item.kind)} "${focus.item.title || 'Untitled'}"`,
  ];
  if (focus.parent) {
    parts.push(
      `- Parent: ${capitalize(focus.parent.kind)} "${focus.parent.title || 'Untitled'}"`
    );
  }
  if (focus.item.kind === 'story') {
    parts.push(`- Task count: ${focus.item.childCount ?? focus.children.length}`);
  }
  if (focus.item.kind === 'goal') {
    const descendantTaskCount = focus.children.reduce(
      (total, child) => total + (child.childCount ?? 0),
      0
    );
    parts.push(`- Story count: ${focus.children.length}`);
    parts.push(`- Descendant task count: ${descendantTaskCount}`);
  }
  if (focus.children.length > 0) {
    parts.push(
      `- Children: ${focus.children
        .map((item) => `${capitalize(item.kind)} "${item.title || 'Untitled'}"`)
        .join(', ')}`
    );
  }
  if (focus.siblings.length > 0) {
    parts.push(
      `- Siblings: ${focus.siblings
        .map((item) => `${capitalize(item.kind)} "${item.title || 'Untitled'}"`)
        .join(', ')}`
    );
  }
  if (focus.related.length > 0) {
    parts.push(
      `- Related: ${focus.related
        .map(
          (entry) =>
            `${capitalize(entry.item.kind)} "${entry.item.title || 'Untitled'}" via ${entry.relationType}`
        )
        .join(', ')}`
    );
  }
  return parts.join('\n');
}

function selectRelevantHistoryMessages(
  history: WorkspaceChatMessage[],
  prompt: string,
  context: WorkspaceChatAssembledContext,
  maxHistoryMessages: number
): WorkspaceChatMessage[] {
  const focusTerms = new Set<string>();
  if (context.focus?.item.title) {
    focusTerms.add(context.focus.item.title.toLowerCase());
  }
  context.queryMatches.forEach((item) => {
    if (item.title) {
      focusTerms.add(item.title.toLowerCase());
    }
  });
  const promptTerms = prompt
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length >= 4);

  return history
    .filter((message) => isWorkspaceChatHistoryMessage(message))
    .map((message, index, array) => {
      const normalized = message.content.toLowerCase();
      let score = index / Math.max(1, array.length);
      focusTerms.forEach((term) => {
        if (normalized.includes(term)) score += 3;
      });
      promptTerms.forEach((term) => {
        if (normalized.includes(term)) score += 1;
      });
      return { message, score, index };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxHistoryMessages)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.message);
}

function capitalize(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}

function buildProfileInstructions(profile: WorkspaceChatProfile): string {
  switch (profile) {
    case 'summarize':
      return 'Prioritize board structure, visible clusters, and the main planning narrative over low-level detail.';
    case 'review-selection':
      return 'Focus on the selected items first. Evaluate clarity, completeness, risks, and local gaps around them.';
    case 'next-steps':
      return 'Suggest concrete next actions grounded in the current focus, nearby hierarchy, and recent activity.';
    case 'breakdown':
      return 'Break the active focus into practical child work items while preserving the existing hierarchy and terminology. Prefer create_batch_tasks or create_batch_stories when the user is asking for decomposition.';
    case 'dependency-review':
      return 'Focus on non-hierarchical dependencies, sequence, blockers, and missing links. Prefer suggest_relations when concrete improvements are clear.';
    case 'readiness-check':
      return 'Evaluate whether the current scope is ready for execution. Highlight what is missing, what is unclear, and where suggest_updates or reviewFindings would help.';
    case 'general-question':
    default:
      return 'Answer the user directly, but anchor the answer in the most relevant workspace context available. When the prompt asks for a review, missing work, dependencies, or refinements, prefer structured planning proposals over generic prose.';
  }
}

export function buildWorkspaceChatProfileSummary(
  profile: WorkspaceChatProfile
): string {
  return profile.replace(/-/g, ' ');
}
