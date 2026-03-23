import type { AiAssistantBadgeTone } from '../rendering/AiAssistantStructuredResultModel.ts';
import { createIcon, type IconName } from '../../../ui-lib/src/hud/icons.ts';
import { AI_ASSISTANT_ACTION_TOKENS } from './AiAssistantActionUiTokens.ts';

type ActionTextOptions = {
  fontSize: string;
  lineHeight: string;
  color: string;
};

type ActionLabelOptions = {
  letterSpacing: string;
  fontSize: string;
  color: string;
};

export function setAiActionComponentName<T extends HTMLElement>(
  element: T,
  name: string
): T {
  element.dataset.aiActionComponent = name;
  return element;
}

export function createActionTextParagraph(
  text: string,
  options: ActionTextOptions
): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  paragraph.style.margin = '0';
  paragraph.style.fontSize = options.fontSize;
  paragraph.style.lineHeight = options.lineHeight;
  paragraph.style.color = options.color;
  return setAiActionComponentName(paragraph, 'text-paragraph');
}

function createActionLabelText(
  text: string,
  options: ActionLabelOptions
): HTMLSpanElement {
  const label = document.createElement('span');
  label.textContent = text;
  label.style.fontSize = options.fontSize;
  label.style.fontWeight = '650';
  label.style.letterSpacing = options.letterSpacing;
  label.style.textTransform = 'uppercase';
  label.style.color = options.color;
  return label;
}

export function createActionEyebrow(text: string): HTMLSpanElement {
  return setAiActionComponentName(
    createActionLabelText(text, {
      letterSpacing:
        AI_ASSISTANT_ACTION_TOKENS.typography.eyebrow.letterSpacing,
      fontSize: AI_ASSISTANT_ACTION_TOKENS.typography.eyebrow.fontSize,
      color: AI_ASSISTANT_ACTION_TOKENS.typography.eyebrow.color,
    }),
    'eyebrow'
  );
}

export function createActionSectionHeading(text: string): HTMLSpanElement {
  const heading = document.createElement('span');
  heading.textContent = text;
  heading.style.fontSize =
    AI_ASSISTANT_ACTION_TOKENS.typography.sectionHeading.fontSize;
  heading.style.fontWeight =
    AI_ASSISTANT_ACTION_TOKENS.typography.sectionHeading.fontWeight;
  heading.style.lineHeight =
    AI_ASSISTANT_ACTION_TOKENS.typography.sectionHeading.lineHeight;
  heading.style.color = AI_ASSISTANT_ACTION_TOKENS.typography.sectionHeading.color;
  return setAiActionComponentName(heading, 'section-heading');
}

export function createActionInlineLabel(text: string): HTMLSpanElement {
  const label = document.createElement('span');
  label.textContent = text;
  label.style.fontSize = AI_ASSISTANT_ACTION_TOKENS.typography.inlineLabel.fontSize;
  label.style.fontWeight =
    AI_ASSISTANT_ACTION_TOKENS.typography.inlineLabel.fontWeight;
  label.style.lineHeight =
    AI_ASSISTANT_ACTION_TOKENS.typography.inlineLabel.lineHeight;
  label.style.color = AI_ASSISTANT_ACTION_TOKENS.typography.inlineLabel.color;
  return setAiActionComponentName(label, 'inline-label');
}

export function createActionInlineValue(
  text: string,
  options: Partial<ActionTextOptions> = {}
): HTMLSpanElement {
  const value = document.createElement('span');
  value.textContent = text;
  value.style.fontSize =
    options.fontSize ?? AI_ASSISTANT_ACTION_TOKENS.typography.inlineValue.fontSize;
  value.style.lineHeight =
    options.lineHeight ??
    AI_ASSISTANT_ACTION_TOKENS.typography.inlineValue.lineHeight;
  value.style.color =
    options.color ?? AI_ASSISTANT_ACTION_TOKENS.typography.inlineValue.color;
  value.style.whiteSpace = 'pre-wrap';
  value.style.wordBreak = 'break-word';
  return setAiActionComponentName(value, 'inline-value');
}

export function createActionTag(
  text: string,
  tone: AiAssistantBadgeTone,
  options: {
    icon?: IconName;
    iconColor?: string;
    iconOnly?: boolean;
    title?: string;
  } = {}
): HTMLSpanElement {
  const tag = document.createElement('span');
  tag.style.display = 'inline-flex';
  tag.style.alignItems = 'center';
  tag.style.justifyContent = 'center';
  tag.style.gap = '4px';
  tag.style.fontSize = AI_ASSISTANT_ACTION_TOKENS.typography.tag.fontSize;
  tag.style.fontWeight = AI_ASSISTANT_ACTION_TOKENS.typography.tag.fontWeight;
  tag.style.lineHeight = AI_ASSISTANT_ACTION_TOKENS.typography.tag.lineHeight;
  tag.style.borderRadius = '999px';
  tag.style.padding = options.iconOnly ? '2px 6px' : AI_ASSISTANT_ACTION_TOKENS.layout.tagPadding;
  tag.style.letterSpacing = AI_ASSISTANT_ACTION_TOKENS.typography.tag.letterSpacing;
  tag.style.whiteSpace = 'nowrap';
  tag.style.border = `1px solid ${tone.border}`;
  tag.style.background = tone.background;
  tag.style.color = tone.color;
  if (options.title) {
    tag.title = options.title;
  }
  if (options.iconOnly) {
    tag.setAttribute('aria-label', options.title ?? text);
    tag.style.minWidth = '22px';
  }
  if (options.icon) {
    const icon = createIcon(options.icon, {
      size: 12,
      strokeWidth: 1.9,
    });
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.style.color = options.iconColor ?? tone.color;
    icon.style.flex = '0 0 auto';
    tag.appendChild(icon);
  }
  if (!options.iconOnly) {
    const textNode = document.createElement('span');
    textNode.textContent = text;
    tag.appendChild(textNode);
  }
  return setAiActionComponentName(tag, 'tag');
}
