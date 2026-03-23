import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type {
  AiAssistantBreakdownMode,
  AiAssistantStrategicPlanMode,
} from './AiAssistantIntentContext.ts';
import { getAiAssistantSelectedItems } from './AiAssistantContent.ts';
import type {
  AiAssistantScenarioClassification,
  AiAssistantScenarioClassifierTarget,
} from './AiAssistantScenarioTypes.ts';
import { isPlainObject } from './AiAssistantToolTypes.ts';

const CLASSIFICATION_INTENTS = [
  'strategic_plan',
  'breakdown',
  'dependencies',
  'fill_details',
  'review',
  'missing',
  'clarify',
] as const;

export function buildAiAssistantScenarioClassificationMessages(params: {
  prompt: string;
  snapshot: AiAssistantCanvasSnapshot | null;
  contextMode: AiAssistantContextMode;
}): AiAssistantApiMessage[] {
  return [
    {
      role: 'system',
      content: buildAiAssistantScenarioClassificationSystemPrompt(),
    },
    {
      role: 'user',
      content: [
        'Classify the request into one workspace scenario.',
        `Current context mode: ${params.contextMode}`,
        'Current canvas summary:',
        JSON.stringify(renderAiAssistantScenarioClassifierTarget(params.snapshot), null, 2),
        'User prompt:',
        params.prompt.trim(),
      ].join('\n\n'),
    },
  ];
}

export function parseAiAssistantScenarioClassification(
  content: string
): AiAssistantScenarioClassification | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  if (!isPlainObject(parsed)) {
    return null;
  }

  const intent = parseScenarioClassificationIntent(parsed.intent);
  if (!intent) {
    return null;
  }

  const confidence =
    typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
      ? parsed.confidence
      : 0;
  if (confidence < 0.55) {
    return null;
  }

  const result: AiAssistantScenarioClassification = {
    intent,
    confidence,
  };

  if (intent === 'strategic_plan') {
    const strategicPlanMode = parseStrategicPlanMode(parsed.strategicPlanMode);
    if (strategicPlanMode) {
      result.intentContext = {
        strategicPlanMode,
      };
    }
  } else if (intent === 'breakdown') {
    const breakdownMode = parseBreakdownMode(parsed.breakdownMode);
    if (breakdownMode) {
      result.intentContext = {
        breakdownMode,
      };
    }
  }

  return result;
}

function buildAiAssistantScenarioClassificationSystemPrompt(): string {
  return [
    'You classify workspace requests into scenarios.',
    'Return valid JSON only.',
    'Do not answer the user.',
    'Return this exact shape:',
    '{"intent":"<strategic_plan|breakdown|dependencies|fill_details|review|missing|clarify|null>","strategicPlanMode":"<canvas_bootstrap|goal_subgoals|goal_replan|null>","breakdownMode":"<goal_stories|story_tasks|task_refine|unspecified_goal_decomposition|null>","confidence":0.0}',
    'Use intent=null for conversational prompts, capability chatter, vague talk, or anything that does not clearly map to a workspace scenario.',
    'Prefer strategic_plan when the user asks for a plan, roadmap, strategy, or goal-level structure.',
    'Prefer breakdown when the user asks to split a goal into stories or a story into tasks.',
    'Prefer dependencies when the user asks to connect, sequence, or unblock items.',
    'Prefer fill_details when the user asks to fill missing title or description details.',
    'Use review, missing, or clarify only when the prompt is directly about those planning operations.',
    'Use confidence from 0 to 1.',
    'If strategicPlanMode or breakdownMode does not apply, return null for that field.',
  ].join('\n');
}

function renderAiAssistantScenarioClassifierTarget(
  snapshot: AiAssistantCanvasSnapshot | null
): AiAssistantScenarioClassifierTarget {
  if (!snapshot) {
    return {
      canvasTitle: null,
      selectionCount: 0,
      focus: null,
      selection: [],
    };
  }

  const selection = getAiAssistantSelectedItems(snapshot).map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
  }));
  const focus = snapshot.focusId
    ? snapshot.elements.find((element) => element.id === snapshot.focusId) ?? null
    : null;

  return {
    canvasTitle: snapshot.canvasTitle,
    selectionCount: selection.length,
    focus: focus
      ? {
          id: focus.id,
          kind: focus.kind,
          title: focus.title,
        }
      : null,
    selection,
    summary: snapshot.summary,
  };
}

function parseScenarioClassificationIntent(
  value: unknown
): AiAssistantScenarioClassification['intent'] {
  if (value === null) {
    return null;
  }
  if (!CLASSIFICATION_INTENTS.includes(value as (typeof CLASSIFICATION_INTENTS)[number])) {
    return null;
  }
  return value as AiAssistantScenarioClassification['intent'];
}

function parseStrategicPlanMode(
  value: unknown
): AiAssistantStrategicPlanMode | undefined {
  if (
    value === 'canvas_bootstrap' ||
    value === 'goal_subgoals' ||
    value === 'goal_replan'
  ) {
    return value;
  }
  return undefined;
}

function parseBreakdownMode(
  value: unknown
): AiAssistantBreakdownMode | undefined {
  if (
    value === 'goal_stories' ||
    value === 'story_tasks' ||
    value === 'task_refine' ||
    value === 'unspecified_goal_decomposition'
  ) {
    return value;
  }
  return undefined;
}
