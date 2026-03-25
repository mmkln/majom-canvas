import type { AiAssistantActionStatus } from '../aiAssistantActions.ts';
import {
  createActionSectionHeading,
  createActionTextParagraph,
  setAiActionComponentName,
} from './AiAssistantActionUiPrimitives.ts';
import { AI_ASSISTANT_ACTION_TOKENS } from './AiAssistantActionUiTokens.ts';

function createActionSurfaceElement(options: {
  radiusPx: number;
  background: string;
  border: string;
}): HTMLDivElement {
  const surface = document.createElement('div');
  surface.style.boxSizing = 'border-box';
  surface.style.border = options.border;
  surface.style.borderRadius = `${options.radiusPx}px`;
  surface.style.background = options.background;
  surface.style.boxShadow = 'none';
  return setAiActionComponentName(surface, 'surface');
}

export function createActionCardSurface(options: {
  kind: 'single' | 'group';
  status?: AiAssistantActionStatus;
  gap: string;
  padding?: string;
}): HTMLDivElement {
  const tokens = AI_ASSISTANT_ACTION_TOKENS.surface;
  const surface = createActionSurfaceElement({
    radiusPx: tokens.cardRadiusPx,
    background: tokens.cardBackground,
    border: tokens.cardBorder,
  });

  surface.dataset.actionCard = options.kind;
  if (options.status) {
    surface.dataset.actionStatus = options.status;
    if (options.status === 'applying') {
      surface.style.background = tokens.cardApplyingBackground;
    } else if (options.status === 'failed') {
      surface.style.background = tokens.cardFailedBackground;
      surface.style.border = tokens.cardFailedBorder;
    }
  }

  surface.style.display = 'flex';
  surface.style.flexDirection = 'column';
  surface.style.gap = options.gap;
  surface.style.padding = options.padding ?? tokens.cardPadding;
  return setAiActionComponentName(surface, 'card-surface');
}

export function createActionPreviewSurface(
  options: {
    gap?: string;
  } = {}
): HTMLDivElement {
  const tokens = AI_ASSISTANT_ACTION_TOKENS;
  const surface = createActionSurfaceElement({
    radiusPx: tokens.surface.previewRadiusPx,
    background: tokens.surface.previewBackground,
    border: 'none',
  });

  surface.dataset.actionPreview = 'true';
  surface.style.display = 'flex';
  surface.style.flexDirection = 'column';
  surface.style.gap = options.gap ?? tokens.layout.previewGap;
  surface.style.padding = tokens.layout.previewPadding;
  return setAiActionComponentName(surface, 'preview-surface');
}

export function createActionSurfaceSection(
  title: string,
  content: HTMLElement
): HTMLDivElement {
  const section = document.createElement('div');
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.gap = AI_ASSISTANT_ACTION_TOKENS.layout.surfaceSectionGap;
  section.append(createActionSectionHeading(title), content);

  const surface = createActionPreviewSurface();
  surface.appendChild(section);
  surface.dataset.aiActionSection = title;
  return setAiActionComponentName(surface, 'surface-section');
}

export function createActionInlineSection(
  title: string,
  content: HTMLElement
): HTMLDivElement {
  const section = document.createElement('div');
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.gap = AI_ASSISTANT_ACTION_TOKENS.layout.inlineSectionGap;
  section.style.paddingLeft =
    AI_ASSISTANT_ACTION_TOKENS.layout.inlineSectionPaddingLeft;
  section.append(createActionSectionHeading(title), content);
  section.dataset.aiActionSection = title;
  return setAiActionComponentName(section, 'inline-section');
}

export function createActionAccentedSection(
  title: string,
  content: HTMLElement
): HTMLDivElement {
  const tokens = AI_ASSISTANT_ACTION_TOKENS;
  const surface = createActionSurfaceElement({
    radiusPx: tokens.surface.previewRadiusPx,
    background: tokens.surface.importantMetaBackground,
    border: 'none',
  });
  surface.style.display = 'flex';
  surface.style.flexDirection = 'column';
  surface.style.gap = '6px';
  surface.style.padding = '8px 10px';
  surface.style.minWidth = '0';

  const heading = createActionSectionHeading(title);

  surface.append(heading, content);
  surface.dataset.aiActionSection = title;
  return setAiActionComponentName(surface, 'accented-section');
}

export function createActionImportantMetaBlock(text: string): HTMLDivElement {
  const tokens = AI_ASSISTANT_ACTION_TOKENS;
  const surface = createActionSurfaceElement({
    radiusPx: tokens.surface.previewRadiusPx,
    background: tokens.surface.importantMetaBackground,
    border: 'none',
  });

  surface.dataset.actionPreview = 'meta';
  surface.style.display = 'flex';
  surface.style.flexDirection = 'column';
  surface.style.gap = tokens.layout.importantMetaGap;
  surface.style.padding = tokens.layout.importantMetaPadding;
  surface.appendChild(
    createActionTextParagraph(text, tokens.typography.importantMeta)
  );
  return setAiActionComponentName(surface, 'important-meta-block');
}

export function applyGroupedActionEntryStyles(
  entry: HTMLDivElement,
  status: AiAssistantActionStatus
): void {
  const tokens = AI_ASSISTANT_ACTION_TOKENS;
  entry.style.paddingLeft = tokens.layout.groupedEntryPaddingLeft;
  entry.style.borderLeftWidth = '1px';
  entry.style.borderLeftStyle = 'solid';

  switch (status) {
    case 'failed':
      entry.style.borderLeftColor = tokens.surface.groupedEntryRail.failed;
      break;
    case 'applying':
      entry.style.borderLeftColor = tokens.surface.groupedEntryRail.applying;
      break;
    case 'applied':
      entry.style.borderLeftColor = tokens.surface.groupedEntryRail.applied;
      break;
    case 'idle':
    default:
      entry.style.borderLeftColor = tokens.surface.groupedEntryRail.idle;
      break;
  }
}
