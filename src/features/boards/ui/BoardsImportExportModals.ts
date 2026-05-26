import type { AppRuntime } from '../../../app-runtime/index.ts';
import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import { Textarea } from '../../../ui-lib/src/components/Textarea.ts';
import {
  createFormMessage,
  createIconButton,
  HudSegmentedControl,
} from '../../../ui-lib/src/hud/index.ts';
import { notify } from '../../../ui-lib/src/services/NotificationService.ts';
import {
  BOARDS_EXCHANGE_SCHEMA,
  BOARDS_EXCHANGE_VERSION,
  type BoardsExchangeFormat,
  type BoardsExchangeScope,
  type BoardsExportRequest,
  type BoardsExportResult,
  type BoardsImportMatchStrategy,
  type BoardsImportMode,
  type BoardsImportPlan,
  type BoardsImportPolicies,
  type BoardsImportTarget,
  type BoardsImportUnknownFieldPolicy,
} from '../exchange/schema.ts';
import type { ImportExportController } from '../state/ImportExportController.ts';
import { boardsModalClassNames } from './boardsViewStyles.ts';

export type ImportPreviewModalScope = {
  scope: BoardsExchangeScope;
  titleKey: string;
  target?: BoardsImportTarget;
};

export type ExportOutputModalConfig = {
  titleKey: string;
  request: BoardsExportRequest;
};

type ImportFormatGuideHandle = {
  element: HTMLElement;
  refresh: () => void;
};

const IMPORT_ENTITY_LABEL_KEYS = {
  board: 'boards.import.entity.board',
  column: 'boards.import.entity.column',
  card: 'boards.import.entity.card',
  checklist: 'boards.import.entity.checklist',
  checkItem: 'boards.import.entity.checkItem',
} as const;

const IMPORT_ACTION_GROUP_LABEL_KEYS = {
  create: 'boards.import.group.create',
  update: 'boards.import.group.update',
  skip: 'boards.import.group.skip',
  conflict: 'boards.import.group.conflict',
} as const;

export class BoardsImportExportModals {
  private importPreviewOverlay: HTMLDivElement | null = null;
  private exportOutputOverlay: HTMLDivElement | null = null;

  constructor(
    private readonly runtime: AppRuntime,
    private readonly controller: ImportExportController
  ) {}

  public openImport(config: ImportPreviewModalScope): void {
    this.closeImport();
    this.closeExport();
    this.controller.openImport({
      scope: config.scope,
      target: config.target,
    });
    const getImportState = () => this.controller.importSnapshot!;

    const { overlay, container, body, footer } = createModalShell(
      this.runtime.i18n.t(config.titleKey),
      {
        intent: 'info',
        zIndex: 370,
        onClose: () => this.closeImport(),
      }
    );
    container.classList.add(boardsModalClassNames.importModal);
    overlay.setAttribute('data-testid', 'boards-import-preview-modal');

    const editContent = document.createElement('div');
    editContent.className = boardsModalClassNames.importLayout;
    editContent.setAttribute('data-testid', 'boards-import-edit-mode');
    const reviewContent = document.createElement('section');
    reviewContent.className = boardsModalClassNames.importReview;
    reviewContent.setAttribute('data-testid', 'boards-import-review-mode');

    const sourcePanel = document.createElement('section');
    sourcePanel.className = boardsModalClassNames.importPanel;

    let guide: ImportFormatGuideHandle | null = null;
    const formatControl = new HudSegmentedControl<BoardsExchangeFormat>({
      value: getImportState().format,
      size: 'sm',
      fullWidth: true,
      ariaLabel: this.runtime.i18n.t('boards.import.format'),
      options: [
        {
          id: 'markdown',
          value: 'markdown',
          label: this.runtime.i18n.t('boards.import.formatMarkdown'),
        },
        {
          id: 'json',
          value: 'json',
          label: this.runtime.i18n.t('boards.import.formatJson'),
        },
      ],
      onChange: (value) => {
        this.controller.setImportFormat(value);
        renderImportStalePreview();
        guide?.refresh();
        syncImportControls();
      },
    });

    const sourceField = document.createElement('section');
    sourceField.className = boardsModalClassNames.importField;
    const sourceHeader = document.createElement('div');
    sourceHeader.className = boardsModalClassNames.importSourceHeader;
    const sourceLabel = document.createElement('label');
    sourceLabel.className = boardsModalClassNames.importLabel;
    sourceLabel.htmlFor = 'boards-import-source';
    sourceLabel.textContent = this.runtime.i18n.t('boards.import.source');
    const sourceInput = new Textarea({
      id: 'boards-import-source',
      rows: 14,
      placeholder: this.runtime.i18n.t('boards.import.sourcePlaceholder'),
      className: boardsModalClassNames.importSource,
      onInput: () => {
        this.controller.setImportSource(sourceInput.value);
        renderImportStalePreview();
        syncImportControls();
      },
    }).createElement();
    sourceInput.spellcheck = false;
    sourceInput.autocomplete = 'off';
    sourceInput.wrap = 'off';

    const configPanel = document.createElement('section');
    configPanel.className = boardsModalClassNames.importPanel;
    configPanel.append(
      this.createImportSelect<BoardsImportMode>({
        id: 'boards-import-mode',
        labelKey: 'boards.import.mode',
        value: getImportState().policies.mode,
        options: [
          ['merge', 'boards.import.mode.merge'],
          ['create', 'boards.import.mode.create'],
          ['replace', 'boards.import.mode.replace'],
        ],
        onChange: (value) => {
          this.controller.setImportPolicy('mode', value);
          renderImportStalePreview();
          syncImportControls();
        },
      }),
      this.createImportSelect<BoardsImportMatchStrategy>({
        id: 'boards-import-match',
        labelKey: 'boards.import.match',
        value: getImportState().policies.matchStrategy,
        options: [
          ['title', 'boards.import.match.title'],
          ['id', 'boards.import.match.id'],
          ['external_ref', 'boards.import.match.externalRef'],
        ],
        onChange: (value) => {
          this.controller.setImportPolicy('matchStrategy', value);
          renderImportStalePreview();
          syncImportControls();
        },
      }),
      this.createImportSelect<BoardsImportPolicies['missingFieldPolicy']>({
        id: 'boards-import-missing',
        labelKey: 'boards.import.missingFields',
        value: getImportState().policies.missingFieldPolicy,
        options: [
          ['keep_existing', 'boards.import.missing.keepExisting'],
          ['use_defaults', 'boards.import.missing.useDefaults'],
          ['clear_on_replace', 'boards.import.missing.clearOnReplace'],
        ],
        onChange: (value) => {
          this.controller.setImportPolicy('missingFieldPolicy', value);
          renderImportStalePreview();
          syncImportControls();
        },
      }),
      this.createImportSelect<BoardsImportUnknownFieldPolicy>({
        id: 'boards-import-unknown',
        labelKey: 'boards.import.unknownFields',
        value: getImportState().policies.unknownFieldPolicy,
        options: [
          ['warn_and_ignore', 'boards.import.unknown.warn'],
          ['strict_error', 'boards.import.unknown.strict'],
        ],
        onChange: (value) => {
          this.controller.setImportPolicy('unknownFieldPolicy', value);
          renderImportStalePreview();
          syncImportControls();
        },
      })
    );

    const previewPanel = document.createElement('section');
    previewPanel.className = boardsModalClassNames.importPreviewPanel;
    previewPanel.setAttribute('data-testid', 'boards-import-preview-panel');
    this.renderImportPreviewPlan(previewPanel, null);
    reviewContent.append(previewPanel);

    const message = createFormMessage({
      className: boardsModalClassNames.importMessage,
      ariaLive: 'polite',
    });
    guide = this.createImportFormatGuide({
      scope: config.scope,
      getFormat: () => getImportState().format,
      onInsertTemplate: () => {
        sourceInput.value = this.getImportTemplate(
          config.scope,
          getImportState().format
        );
        this.controller.setImportSource(sourceInput.value);
        renderImportStalePreview();
        syncImportControls();
        sourceInput.focus();
      },
      onCopyAiPrompt: () => {
        void this.copyImportAiPrompt(config.scope, getImportState().format);
      },
      onClear: () => {
        sourceInput.value = '';
        this.controller.setImportSource('');
        renderImportStalePreview();
        syncImportControls();
        sourceInput.focus();
      },
    });
    sourceHeader.append(sourceLabel, guide.element);
    sourceField.append(sourceHeader, sourceInput);
    sourcePanel.replaceChildren(formatControl.element, sourceField);
    const sidePanel = document.createElement('aside');
    sidePanel.className = boardsModalClassNames.importSidePanel;
    sidePanel.append(configPanel);
    editContent.append(sourcePanel, sidePanel);

    const row = document.createElement('div');
    row.className = boardsModalClassNames.importActions;
    row.setAttribute('data-testid', 'boards-import-action-row');
    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = boardsModalClassNames.importActionButtonSecondary;
    previewButton.textContent = this.runtime.i18n.t('boards.import.preview');
    previewButton.setAttribute('data-testid', 'boards-import-preview-button');

    const applyButton = document.createElement('button');
    applyButton.type = 'button';
    applyButton.className = boardsModalClassNames.importActionButtonPrimary;
    applyButton.textContent = this.runtime.i18n.t('boards.import.apply');
    applyButton.disabled = true;
    applyButton.setAttribute('data-testid', 'boards-import-apply-button');

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = boardsModalClassNames.importActionButtonSecondary;
    backButton.textContent = this.runtime.i18n.t('boards.import.backToEdit');
    backButton.setAttribute('data-testid', 'boards-import-back-button');
    backButton.addEventListener('click', () => {
      this.controller.showImportEdit();
      renderImportMode();
      syncImportControls();
      requestAnimationFrame(() => sourceInput.focus());
    });

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = boardsModalClassNames.importActionButtonSecondary;
    closeButton.textContent = this.runtime.i18n.t('common.close');
    closeButton.addEventListener('click', () => this.closeImport());

    const runPreview = async (): Promise<void> => {
      if (!sourceInput.value.trim()) return;
      this.controller.setImportSource(sourceInput.value);
      const preview = this.controller.previewImport();
      syncImportControls();
      await preview;
      const state = this.controller.importSnapshot;
      if (!state || this.importPreviewOverlay !== overlay) return;
      this.renderImportPreviewPlan(
        previewPanel,
        state.lastPreviewPlan,
        state.lastPreviewRequest?.policies.mode === 'create'
      );
      renderImportMode();
      syncImportControls();
    };

    const applyImport = async (): Promise<void> => {
      const apply = this.controller.applyImport();
      syncImportControls();
      const result = await apply;
      if (this.importPreviewOverlay !== overlay && result !== 'applied') return;
      if (result === 'applied') {
        this.closeImport();
        notify(this.runtime.i18n.t('boards.import.applied'), 'success');
        return;
      }
      syncImportControls();
    };

    const renderImportStalePreview = (): void => {
      this.renderImportPreviewPlan(previewPanel, null);
    };

    const renderImportMode = (): void => {
      body.replaceChildren(
        getImportState().mode === 'review' ? reviewContent : editContent
      );
    };

    const syncImportControls = (): void => {
      const state = getImportState();
      const hasSource = state.source.trim().length > 0;
      const busy = state.operation !== 'idle';
      const hasFreshPreview = state.lastPreviewRequest !== null;
      const previewCanApply = state.lastPreviewPlan?.canApply === true;
      const canApplyMode = state.lastPreviewRequest?.policies.mode === 'create';
      const reviewMode = state.mode === 'review';

      previewButton.disabled = busy || !hasSource;
      applyButton.disabled =
        busy ||
        !reviewMode ||
        !hasFreshPreview ||
        !previewCanApply ||
        !canApplyMode;
      previewButton.hidden = reviewMode;
      backButton.hidden = !reviewMode;
      applyButton.hidden = !reviewMode;
      previewButton.className = boardsModalClassNames.importActionButtonPrimary;
      applyButton.className = applyButton.disabled
        ? boardsModalClassNames.importActionButtonSecondary
        : boardsModalClassNames.importActionButtonPrimary;
      previewButton.textContent = this.runtime.i18n.t(
        state.hasCompletedPreview
          ? 'boards.import.previewUpdate'
          : 'boards.import.preview'
      );

      if (state.operation === 'previewing') {
        message.show(this.runtime.i18n.t('boards.import.previewing'), 'info');
      } else if (state.operation === 'applying') {
        message.show(this.runtime.i18n.t('boards.import.applying'), 'info');
      } else if (state.statusOverride) {
        message.show(
          this.runtime.i18n.t(state.statusOverride.messageKey),
          state.statusOverride.tone
        );
      } else if (!hasSource) {
        message.show(this.runtime.i18n.t('boards.import.needSource'), 'info');
      } else if (!reviewMode) {
        if (hasFreshPreview) {
          message.clear();
        } else {
          message.show(
            this.runtime.i18n.t('boards.import.previewRequired'),
            'info'
          );
        }
      } else if (!hasFreshPreview) {
        message.show(
          this.runtime.i18n.t('boards.import.previewRequired'),
          'info'
        );
      } else if (!previewCanApply) {
        message.show(
          this.runtime.i18n.t('boards.import.blockedByPlan'),
          'error'
        );
      } else if (!canApplyMode) {
        message.show(
          this.runtime.i18n.t('boards.import.unsupportedMode'),
          'warning'
        );
      } else {
        message.clear();
      }

      const applyReason = applyButton.disabled
        ? message.element.textContent?.trim()
        : '';
      if (applyReason) {
        applyButton.title = applyReason;
      } else {
        applyButton.removeAttribute('title');
      }
    };

    previewButton.addEventListener('click', () => void runPreview());
    applyButton.addEventListener('click', () => void applyImport());
    row.append(closeButton, backButton, previewButton, applyButton);
    footer.replaceChildren(message.element, row);
    renderImportMode();
    syncImportControls();

    this.importPreviewOverlay = overlay;
    renderImportStalePreview();
    requestAnimationFrame(() => sourceInput.focus());
  }

  public async openExport(config: ExportOutputModalConfig): Promise<void> {
    this.closeExport();
    this.closeImport();

    const result = await this.controller.exportData(config.request);
    if (!result) {
      notify(this.runtime.i18n.t('boards.export.failed'), 'error');
      return;
    }

    const { overlay, container, body, footer } = createModalShell(
      this.runtime.i18n.t(config.titleKey),
      {
        intent: 'info',
        zIndex: 380,
        onClose: () => this.closeExport(),
      }
    );
    container.classList.add(boardsModalClassNames.exportModal);
    overlay.setAttribute('data-testid', 'boards-export-output-modal');

    const content = document.createElement('div');
    content.className = boardsModalClassNames.exportContent;

    const meta = document.createElement('p');
    meta.className = boardsModalClassNames.exportMeta;
    meta.textContent = `${result.fileName} Â· ${result.format.toUpperCase()}`;

    const output = new Textarea({
      rows: 18,
      value: result.content,
      className: boardsModalClassNames.exportOutput,
    }).createElement();
    output.readOnly = true;
    output.setAttribute('data-testid', 'boards-export-output');
    output.addEventListener('focus', () => output.select());

    content.append(meta, output);
    body.replaceChildren(content);

    const row = createModalActionRow({ variant: 'confirm' });
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = getModalActionButtonClass('default');
    closeButton.textContent = this.runtime.i18n.t('common.close');
    closeButton.addEventListener('click', () => this.closeExport());

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = getModalActionButtonClass('wide');
    copyButton.textContent = this.runtime.i18n.t('boards.export.copy');
    copyButton.setAttribute('data-testid', 'boards-export-copy-button');
    copyButton.addEventListener('click', () => {
      void this.copyExportContent(result, output);
    });

    row.append(closeButton, copyButton);
    footer.replaceChildren(row);
    this.exportOutputOverlay = overlay;
    requestAnimationFrame(() => output.focus());
  }

  public closeImport(): void {
    this.importPreviewOverlay?.remove();
    this.importPreviewOverlay = null;
    this.controller.closeImport();
  }

  public closeExport(): void {
    this.exportOutputOverlay?.remove();
    this.exportOutputOverlay = null;
    this.controller.clearExport();
  }

  private createImportField(labelKey: string, id: string): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = boardsModalClassNames.importField;
    label.htmlFor = id;
    const text = document.createElement('span');
    text.className = boardsModalClassNames.importLabel;
    text.textContent = this.runtime.i18n.t(labelKey);
    label.append(text);
    return label;
  }

  private createImportSelect<TValue extends string>(options: {
    id: string;
    labelKey: string;
    value: TValue;
    options: Array<[TValue, string]>;
    onChange: (value: TValue) => void;
  }): HTMLElement {
    const field = this.createImportField(options.labelKey, options.id);
    const select = document.createElement('select');
    select.id = options.id;
    select.className = boardsModalClassNames.importSelect;
    for (const [value, labelKey] of options.options) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = this.runtime.i18n.t(labelKey);
      select.append(option);
    }
    select.value = options.value;
    select.addEventListener('change', () => {
      options.onChange(select.value as TValue);
    });
    field.append(select);
    return field;
  }

  private createImportFormatGuide(options: {
    scope: BoardsExchangeScope;
    getFormat: () => BoardsExchangeFormat;
    onInsertTemplate: () => void;
    onCopyAiPrompt: () => void;
    onClear: () => void;
  }): ImportFormatGuideHandle {
    const section = document.createElement('section');
    section.className = boardsModalClassNames.importGuide;
    section.setAttribute('data-testid', 'boards-import-format-guide');

    const helpButton = createIconButton({
      icon: 'light-bulb',
      size: 'sm',
      tone: 'text',
      className: boardsModalClassNames.importGuideHelp,
      ariaLabel: this.runtime.i18n.t('boards.import.guide.title'),
      title: this.runtime.i18n.t('boards.import.guide.title'),
    });
    helpButton.setAttribute('data-testid', 'boards-import-format-help');

    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.importGuideActions;
    actions.append(
      helpButton,
      this.createImportGuideButton(
        'boards.import.guide.insertTemplate',
        'boards-import-insert-template-button',
        options.onInsertTemplate
      ),
      this.createImportGuideButton(
        'boards.import.guide.copyAiPrompt',
        'boards-import-copy-ai-prompt-button',
        options.onCopyAiPrompt
      ),
      this.createImportGuideButton(
        'boards.import.guide.clear',
        'boards-import-clear-source-button',
        options.onClear
      )
    );

    const refresh = (): void => {
      const format = options.getFormat();
      helpButton.title = this.getImportGuideTooltip(format);
      helpButton.setAttribute(
        'aria-label',
        this.runtime.i18n.t('boards.import.guide.title')
      );
    };

    section.append(actions);
    refresh();
    return { element: section, refresh };
  }

  private getImportGuideTooltip(format: BoardsExchangeFormat): string {
    return [
      this.runtime.i18n.t('boards.import.guide.title'),
      this.runtime.i18n.t(
        format === 'markdown'
          ? 'boards.import.guide.markdownSummary'
          : 'boards.import.guide.jsonSummary'
      ),
      this.runtime.i18n.t(
        format === 'markdown'
          ? 'boards.import.guide.markdownRequired'
          : 'boards.import.guide.jsonRequired'
      ),
      this.runtime.i18n.t('boards.import.guide.optional'),
      this.runtime.i18n.t('boards.import.guide.partial'),
      this.runtime.i18n.t('boards.import.guide.createOnly'),
    ].join('\n');
  }

  private createImportGuideButton(
    labelKey: string,
    testId: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = boardsModalClassNames.importGuideButton;
    button.textContent = this.runtime.i18n.t(labelKey);
    button.setAttribute('data-testid', testId);
    button.addEventListener('click', onClick);
    return button;
  }

  private getImportTemplate(
    scope: BoardsExchangeScope,
    format: BoardsExchangeFormat
  ): string {
    if (format === 'json') {
      return JSON.stringify(
        {
          schema: BOARDS_EXCHANGE_SCHEMA,
          version: BOARDS_EXCHANGE_VERSION,
          scope,
          payload: this.getJsonImportTemplatePayload(scope),
        },
        null,
        2
      );
    }

    if (scope === 'column') {
      return [
        '## Column: Backlog',
        '',
        '### Card: First task',
        'Description:',
        'Optional description.',
        '',
        '### Card: Second task',
      ].join('\n');
    }

    if (scope === 'card') {
      return [
        '### Card: First task',
        'Description:',
        'Optional description.',
        '',
        'Checklist: Steps',
        '- [ ] First step',
        '- [ ] Second step',
      ].join('\n');
    }

    return [
      '---',
      'title: "Project board"',
      '---',
      '',
      '## Column: Backlog',
      '',
      '### Card: First task',
      'Description:',
      'Short task description.',
      '',
      'Checklist: Setup',
      '- [ ] Prepare data',
      '- [x] Confirm format',
    ].join('\n');
  }

  private getJsonImportTemplatePayload(
    scope: BoardsExchangeScope
  ): Record<string, unknown> {
    const card = {
      title: 'First task',
      description: 'Optional description.',
      checklists: [
        {
          title: 'Steps',
          items: [
            { title: 'First step', state: 'incomplete' },
            { title: 'Second step', state: 'complete' },
          ],
        },
      ],
    };

    if (scope === 'card') return card;
    const column = { title: 'Backlog', cards: [card] };
    if (scope === 'column') return column;
    return { title: 'Project board', columns: [column] };
  }

  private getImportAiPrompt(
    scope: BoardsExchangeScope,
    format: BoardsExchangeFormat
  ): string {
    const scopeLabel =
      scope === 'board' ? 'board' : scope === 'column' ? 'list' : 'card';
    if (format === 'json') {
      return [
        `Generate a Majom Boards JSON import for one ${scopeLabel}.`,
        `Use schema "${BOARDS_EXCHANGE_SCHEMA}" and version "${BOARDS_EXCHANGE_VERSION}".`,
        'Use this shape:',
        this.getImportTemplate(scope, 'json'),
        'Return only valid JSON.',
      ].join('\n\n');
    }

    return [
      `Generate a Majom Boards Markdown import for one ${scopeLabel}.`,
      'Use this format:',
      '- YAML front matter with title for board imports',
      '- ## Column: column name',
      '- ### Card: card title',
      '- Description: optional multiline description',
      '- Checklist: optional checklist title',
      '- - [ ] unchecked item',
      '- - [x] completed item',
      'Missing optional fields are allowed.',
      'Return only Markdown.',
      '',
      this.getImportTemplate(scope, 'markdown'),
    ].join('\n');
  }

  private async copyImportAiPrompt(
    scope: BoardsExchangeScope,
    format: BoardsExchangeFormat
  ): Promise<void> {
    const prompt = this.getImportAiPrompt(scope, format);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = prompt;
        fallback.style.position = 'fixed';
        fallback.style.left = '-9999px';
        document.body.append(fallback);
        fallback.select();
        document.execCommand('copy');
        fallback.remove();
      }
      notify(this.runtime.i18n.t('boards.import.aiPromptCopied'), 'success');
    } catch {
      notify(
        this.runtime.i18n.t('boards.import.aiPromptCopyFailed'),
        'warning'
      );
    }
  }

  private renderImportPreviewPlan(
    host: HTMLElement,
    plan: BoardsImportPlan | null,
    applyModeSupported = true
  ): void {
    host.replaceChildren();

    if (!plan) {
      const title = document.createElement('h3');
      title.className = boardsModalClassNames.importPreviewTitle;
      title.textContent = this.runtime.i18n.t('boards.import.previewTitle');
      const empty = document.createElement('p');
      empty.className = boardsModalClassNames.importEmpty;
      empty.textContent = this.runtime.i18n.t('boards.import.previewEmpty');
      host.append(title, empty);
      return;
    }

    const header = document.createElement('header');
    header.className = boardsModalClassNames.importReviewHeader;
    const headerText = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = boardsModalClassNames.importReviewEyebrow;
    eyebrow.textContent = this.runtime.i18n.t('boards.import.previewTitle');
    const headline = document.createElement('h3');
    headline.className = boardsModalClassNames.importReviewHeadline;
    headline.textContent = this.runtime.i18n.t(
      plan.canApply
        ? applyModeSupported
          ? 'boards.import.status.ready'
          : 'boards.import.status.previewOnly'
        : 'boards.import.status.blocked'
    );
    headerText.append(eyebrow, headline);
    header.append(headerText);
    host.append(header);

    if (plan.items.length > 0) {
      const groups = document.createElement('div');
      groups.className = boardsModalClassNames.importPlanGroups;
      (['create', 'update', 'skip', 'conflict'] as const).forEach((action) => {
        const groupItems = plan.items
          .filter((planItem) => planItem.action === action)
          .slice(0, 40);
        if (groupItems.length === 0) return;
        const group = document.createElement('section');
        group.className = `${boardsModalClassNames.importPlanGroup} majom-boards-import__plan-group--${action}`;
        const groupHeader = document.createElement('header');
        groupHeader.className = boardsModalClassNames.importPlanGroupHeader;
        const groupTitle = document.createElement('h4');
        groupTitle.className = boardsModalClassNames.importPlanGroupTitle;
        groupTitle.textContent = this.runtime.i18n.t(
          IMPORT_ACTION_GROUP_LABEL_KEYS[action]
        );
        groupHeader.append(groupTitle);

        const list = document.createElement('ul');
        list.className = boardsModalClassNames.importItems;
        groupItems.forEach((planItem) => {
          const item = document.createElement('li');
          item.className = boardsModalClassNames.importItem;
          const entity = document.createElement('span');
          entity.className = boardsModalClassNames.importItemEntity;
          entity.textContent = this.runtime.i18n.t(
            IMPORT_ENTITY_LABEL_KEYS[planItem.entity]
          );
          const text = document.createElement('span');
          const main = document.createElement('span');
          main.className = boardsModalClassNames.importItemMain;
          main.textContent = planItem.title;
          text.append(main);
          const metaText = this.getImportPlanItemMeta(planItem);
          if (metaText) {
            const meta = document.createElement('span');
            meta.className = boardsModalClassNames.importItemMeta;
            meta.textContent = metaText;
            text.append(meta);
          }
          item.append(entity, text);
          list.append(item);
        });
        group.append(groupHeader, list);
        groups.append(group);
      });
      host.append(groups);
    }

    if (plan.diagnostics.length > 0) {
      const diagnostics = document.createElement('ul');
      diagnostics.className = boardsModalClassNames.importDiagnostics;
      plan.diagnostics.slice(0, 20).forEach((diagnostic) => {
        const item = document.createElement('li');
        item.className =
          diagnostic.level === 'error'
            ? boardsModalClassNames.importDiagnosticError
            : boardsModalClassNames.importDiagnosticWarning;
        item.textContent = diagnostic.path
          ? `${diagnostic.path}: ${diagnostic.message}`
          : diagnostic.message;
        diagnostics.append(item);
      });
      host.append(diagnostics);
    }
  }

  private getImportPlanItemMeta(
    planItem: BoardsImportPlan['items'][number]
  ): string | null {
    if (planItem.action === 'create') return null;

    const reasonLabels: Record<string, string> = {
      'ambiguous-title-match': this.runtime.i18n.t(
        'boards.import.reason.ambiguousTitle'
      ),
      'invalid-source': this.runtime.i18n.t(
        'boards.import.reason.invalidSource'
      ),
      'matched-by-title': this.runtime.i18n.t(
        'boards.import.reason.matchedByTitle'
      ),
      'replace-target-not-found': this.runtime.i18n.t(
        'boards.import.reason.replaceTargetNotFound'
      ),
      'target-board-not-found': this.runtime.i18n.t(
        'boards.import.reason.targetBoardNotFound'
      ),
      'target-column-not-found': this.runtime.i18n.t(
        'boards.import.reason.targetColumnNotFound'
      ),
    };

    if (planItem.reason) return reasonLabels[planItem.reason] ?? planItem.path;
    if (planItem.targetId) {
      return this.runtime.i18n.t('boards.import.reason.existingTarget');
    }
    return planItem.path;
  }

  private async copyExportContent(
    result: BoardsExportResult,
    output: HTMLTextAreaElement
  ): Promise<void> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.content);
      } else {
        output.select();
        document.execCommand('copy');
      }
      notify(this.runtime.i18n.t('boards.export.copied'), 'success');
    } catch {
      output.select();
      notify(this.runtime.i18n.t('boards.export.copyFailed'), 'warning');
    }
  }
}
