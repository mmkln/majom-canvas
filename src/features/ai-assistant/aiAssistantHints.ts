import type { AiAssistantElementKind } from './aiAssistantEvents.ts';
import type { I18nService } from '../../i18n/index.ts';

type AiHintI18n = Pick<I18nService, 't'>;

export function getAiAssistantReviewHint(i18n?: AiHintI18n): string {
  return (
    i18n?.t('aiAssistantHints.review') ??
    'Finds gaps, overlaps, and readiness risks in the current selection.'
  );
}

export function getAiAssistantClarifyHint(
  kind: AiAssistantElementKind,
  i18n?: AiHintI18n
): string {
  if (kind === 'goal') {
    return (
      i18n?.t('aiAssistantHints.clarify.goal') ??
      'Tightens the goal wording so the outcome reads more clearly.'
    );
  }
  if (kind === 'story') {
    return (
      i18n?.t('aiAssistantHints.clarify.story') ??
      'Sharpens the story wording so the scope and outcome are easier to plan.'
    );
  }
  return (
    i18n?.t('aiAssistantHints.clarify.task') ??
    'Rewrites the task wording so it is clearer and easier to execute.'
  );
}

export function getAiAssistantBreakdownHint(
  kind: AiAssistantElementKind,
  i18n?: AiHintI18n
): string {
  if (kind === 'goal') {
    return (
      i18n?.t('aiAssistantHints.breakdown.goal') ??
      'Suggests a few concrete stories that would move this goal forward.'
    );
  }
  if (kind === 'story') {
    return (
      i18n?.t('aiAssistantHints.breakdown.story') ??
      'Turns this story into actionable tasks you can plan or execute.'
    );
  }
  return (
    i18n?.t('aiAssistantHints.breakdown.task') ??
    'Clarifies the task wording and tightens acceptance criteria.'
  );
}

export function getAiAssistantDependenciesHint(i18n?: AiHintI18n): string {
  return (
    i18n?.t('aiAssistantHints.dependencies') ??
    'Suggests blockers, sequencing links, and related dependencies.'
  );
}

export function getAiAssistantLinkBlockersHint(i18n?: AiHintI18n): string {
  return (
    i18n?.t('aiAssistantHints.linkBlockers') ??
    'Suggests blockers, sequencing links, and nearby relations around this item.'
  );
}

export function getAiAssistantConnectSelectedHint(i18n?: AiHintI18n): string {
  return (
    i18n?.t('aiAssistantHints.connectSelected') ??
    'Suggests blockers, sequencing links, and related connections between the selected items.'
  );
}

export function getAiAssistantFillDetailsHint(i18n?: AiHintI18n): string {
  return (
    i18n?.t('aiAssistantHints.fillDetails') ??
    'Fills obvious title and description gaps for the current scope.'
  );
}

export function getAiAssistantMissingHint(i18n?: AiHintI18n): string {
  return (
    i18n?.t('aiAssistantHints.missing') ??
    'Highlights missing scope, edge cases, and follow-up work.'
  );
}
