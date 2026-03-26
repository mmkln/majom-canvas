import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import {
  describeAiAssistantSelectionInline,
  getAiAssistantSelectedItems,
} from './AiAssistantContent.ts';
import type { I18nService } from '../../../i18n/index.ts';

type AiAssistantWelcomeI18n = Pick<I18nService, 't'>;

export function buildAiAssistantWelcomeContent(
  context: AiAssistantCanvasSnapshot | null,
  i18n?: AiAssistantWelcomeI18n
): string {
  if (!context) {
    return (
      i18n?.t('aiChat.welcome.noCanvas') ??
      'Open a canvas and select something when you want contextual help.'
    );
  }

  const selection = getAiAssistantSelectedItems(context);

  return [
    i18n?.t('aiChat.welcome.lookingAtCanvas', {
      title:
        context.canvasTitle ||
        (i18n?.t('aiChat.context.untitledCanvas') ?? 'Untitled canvas'),
    }) ?? `You're looking at "${context.canvasTitle || 'Untitled canvas'}".`,
    formatAiAssistantWelcomeCanvasSummary(context, i18n),
    context.summary.goalCount === 0 &&
    context.summary.storyCount === 0 &&
    context.summary.taskCount === 0
      ? i18n?.t('aiChat.welcome.emptyCanvas') ??
        'This canvas is still empty. I can help you sketch the first goal structure.'
      : null,
    selection.length === 1 && selection[0]?.kind === 'goal'
      ? i18n?.t('aiChat.welcome.singleGoalSelection') ??
        'I can help expand this goal into strategic subgoals or break it into stories for execution planning.'
      : null,
    selection.length > 0
      ? i18n?.t('aiChat.welcome.selection', {
          selection: describeAiAssistantSelectionInline(selection, i18n),
        }) ??
        `You currently have ${describeAiAssistantSelectionInline(selection, i18n)} selected.`
      : i18n?.t('aiChat.welcome.selectItem') ??
        'Select a goal, story, or task if you want more specific help.',
  ]
    .filter((item): item is string => Boolean(item))
    .join('\n\n');
}

function formatAiAssistantWelcomeCanvasSummary(
  context: AiAssistantCanvasSnapshot,
  i18n?: AiAssistantWelcomeI18n
): string {
  return (
    i18n?.t('aiChat.welcome.canvasSummary', {
      goals: context.summary.goalCount,
      stories: context.summary.storyCount,
      tasks: context.summary.taskCount,
    }) ??
    `Right now this canvas has ${formatAiAssistantWelcomeCount(context.summary.goalCount, 'goal')}, ${formatAiAssistantWelcomeCount(context.summary.storyCount, 'story')}, and ${formatAiAssistantWelcomeCount(context.summary.taskCount, 'task')}.`
  );
}

function formatAiAssistantWelcomeCount(count: number, label: string): string {
  if (count === 0) {
    return `no ${label}s`;
  }

  return `${count} ${label}${count === 1 ? '' : 's'}`;
}
