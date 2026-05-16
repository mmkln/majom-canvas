import {
  createIconButton,
  createTextButton,
  type TextButtonSize,
  type TextButtonTone,
} from '../hud/index.ts';
import { createIcon, type IconName } from '../hud/icons.ts';

export type InlineComposerClassNames = {
  root: string;
  collapsedButton: string;
  expandedForm: string;
  textarea: string;
  actions: string;
  submitButton?: string;
  cancelButton?: string;
};

export type InlineComposerOptions = {
  expanded: boolean;
  collapsedLabel: string;
  submitLabel: string;
  cancelLabel: string;
  placeholder: string;
  ariaLabel: string;
  classNames: InlineComposerClassNames;
  disabled?: boolean;
  value?: string;
  rows?: number;
  textareaTestId?: string;
  focusOnRender?: boolean;
  dragIgnoreDatasetKey?: string;
  collapsedIcon?: IconName;
  collapsedTone?: TextButtonTone;
  collapsedSize?: TextButtonSize;
  onExpand?: () => void;
  onSubmit?: (value: string, textarea: HTMLTextAreaElement) => void;
  onCancel?: () => void;
  onInput?: (value: string, textarea: HTMLTextAreaElement) => void;
  onTextareaCreated?: (textarea: HTMLTextAreaElement) => void;
};

export type InlineComposerRenderResult = {
  element: HTMLElement;
  textarea: HTMLTextAreaElement | null;
};

function markDragIgnored(
  element: HTMLElement,
  datasetKey: string | undefined
): void {
  if (datasetKey) {
    element.dataset[datasetKey] = 'true';
  }
}

function createCollapsedButton(
  options: InlineComposerOptions
): HTMLButtonElement {
  const button = createTextButton({
    text: options.collapsedLabel,
    tone: options.collapsedTone ?? 'text',
    size: options.collapsedSize ?? 'md',
    fullWidth: true,
    className: options.classNames.collapsedButton,
    disabled: options.disabled ?? false,
    onClick: options.onExpand ? () => options.onExpand?.() : undefined,
  });

  if (options.collapsedIcon) {
    const icon = createIcon(options.collapsedIcon, { size: 15, strokeWidth: 2 });
    icon.setAttribute('aria-hidden', 'true');
    button.replaceChildren(
      icon,
      document.createTextNode(options.collapsedLabel)
    );
  }

  markDragIgnored(button, options.dragIgnoreDatasetKey);
  return button;
}

function createExpandedForm(
  options: InlineComposerOptions
): { form: HTMLFormElement; textarea: HTMLTextAreaElement } {
  const form = document.createElement('form');
  form.className = options.classNames.expandedForm;
  markDragIgnored(form, options.dragIgnoreDatasetKey);

  const textarea = document.createElement('textarea');
  textarea.className = options.classNames.textarea;
  textarea.placeholder = options.placeholder;
  textarea.dir = 'auto';
  textarea.rows = options.rows ?? 2;
  textarea.value = options.value ?? '';
  textarea.disabled = options.disabled ?? false;
  textarea.setAttribute('aria-label', options.ariaLabel);
  if (options.textareaTestId) {
    textarea.setAttribute('data-testid', options.textareaTestId);
  }
  markDragIgnored(textarea, options.dragIgnoreDatasetKey);

  const submit = (): void => {
    if (options.disabled) return;
    options.onSubmit?.(textarea.value, textarea);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit();
  });
  textarea.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    submit();
  });
  if (options.onInput) {
    textarea.addEventListener('input', () => {
      options.onInput?.(textarea.value, textarea);
    });
  }

  options.onTextareaCreated?.(textarea);

  const actions = document.createElement('div');
  actions.className = options.classNames.actions;
  actions.append(
    createTextButton({
      text: options.submitLabel,
      tone: 'primary',
      size: 'sm',
      type: 'submit',
      className: options.classNames.submitButton,
      disabled: options.disabled ?? false,
    }),
    createIconButton({
      icon: 'x-mark',
      tone: 'text',
      size: 'md',
      type: 'button',
      title: options.cancelLabel,
      ariaLabel: options.cancelLabel,
      className: options.classNames.cancelButton,
      onClick: () => options.onCancel?.(),
    })
  );

  form.append(textarea, actions);
  if (options.focusOnRender) {
    requestAnimationFrame(() => textarea.focus());
  }
  return { form, textarea };
}

export function renderInlineComposer(
  options: InlineComposerOptions
): InlineComposerRenderResult {
  const element = document.createElement('div');
  element.className = options.classNames.root;
  markDragIgnored(element, options.dragIgnoreDatasetKey);

  if (!options.expanded) {
    element.append(createCollapsedButton(options));
    return { element, textarea: null };
  }

  const { form, textarea } = createExpandedForm(options);
  element.append(form);
  return { element, textarea };
}
