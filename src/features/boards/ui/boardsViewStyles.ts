const STYLE_ELEMENT_ID = 'majom-boards-view-styles';

export const boardsViewClassNames = {
  root: 'majom-boards',
  shell: 'majom-boards__shell',
  header: 'majom-boards__header',
  titleBlock: 'majom-boards__title-block',
  title: 'majom-boards__title',
  titleButton: 'majom-boards__title-button',
  titleEditInput: 'majom-boards__title-edit-input',
  headerActions: 'majom-boards__header-actions',
  headerMenuButton: 'majom-boards__header-menu-button',
  input: 'majom-boards__input',
  primaryButton: 'majom-boards__button majom-boards__button--primary',
  quietButton: 'majom-boards__button majom-boards__button--quiet',
  dangerButton: 'majom-boards__button majom-boards__button--danger',
  iconButton: 'majom-boards__icon-button',
  dangerIconButton:
    'majom-boards__icon-button majom-boards__icon-button--danger',
  body: 'majom-boards__body',
  tabs: 'majom-boards__tabs',
  boardTab: 'majom-boards__tab',
  boardTabSelected: 'majom-boards__tab is-selected',
  canvas: 'majom-boards__canvas',
  column: 'majom-boards__column',
  columnHeader: 'majom-boards__column-header',
  columnTitleButton: 'majom-boards__column-title-button',
  columnTitleInput: 'majom-boards__column-title-input',
  columnTitle: 'majom-boards__column-title',
  columnMenuButton: 'majom-boards__column-menu-button',
  cards: 'majom-boards__cards',
  card: 'majom-boards__card',
  cardMirror: 'majom-boards__card--mirror',
  cardOpenButton: 'majom-boards__card-open',
  cardSourceLabel: 'majom-boards__card-source-label',
  cardTags: 'majom-boards__card-tags',
  cardTag: 'majom-boards__card-tag',
  cardTagDot: 'majom-boards__card-tag-dot',
  cardTagLabel: 'majom-boards__card-tag-label',
  cardTitle: 'majom-boards__card-title',
  cardBadges: 'majom-boards__card-badges',
  cardBadge: 'majom-boards__card-badge',
  cardComposer: 'majom-boards__card-composer',
  cardComposerCollapsed: 'majom-boards__card-composer-collapsed',
  cardComposerExpanded: 'majom-boards__card-composer-expanded',
  cardComposerTextarea: 'majom-boards__card-composer-textarea',
  textarea: 'majom-boards__textarea',
  composerActions: 'majom-boards__composer-actions',
  composerCancelButton: 'majom-boards__composer-cancel',
  columnComposer: 'majom-boards__column-composer',
  columnComposerCollapsedPanel:
    'majom-boards__column-composer majom-boards__column-composer--collapsed',
  columnComposerExpandedPanel:
    'majom-boards__column-composer majom-boards__column-composer--expanded',
  columnComposerCollapsed: 'majom-boards__column-composer-collapsed',
  columnComposerExpanded: 'majom-boards__column-composer-expanded',
  listComposerTextarea: 'majom-boards__list-composer-textarea',
  empty: 'majom-boards__empty',
  emptyContent: 'majom-boards__empty-content',
  emptyTitle: 'majom-boards__empty-title',
  emptyCopy: 'majom-boards__empty-copy',
  messageWrapper: 'majom-boards__message-wrapper',
  messageLabel: 'majom-boards__message-label',
  error: 'majom-boards__error',
} as const;

export const boardsModalClassNames = {
  container: 'majom-boards-modal',
  body: 'majom-boards-modal__body',
  meta: 'majom-boards-modal__meta',
  field: 'majom-boards-modal__field',
  label: 'majom-boards-modal__label',
  titleInput: 'majom-boards-modal__title-input',
  description: 'majom-boards-modal__description',
  hint: 'majom-boards-modal__hint',
  footerRow: 'majom-boards-modal__footer-row',
  cardBack: 'majom-boards-cardback',
  hiddenShellPart: 'majom-boards-cardback__hidden-shell-part',
  topbar: 'majom-boards-cardback__topbar',
  topbarStart: 'majom-boards-cardback__topbar-start',
  listBadge: 'majom-boards-cardback__list-badge',
  sourceLabel: 'majom-boards-cardback__source-label',
  movePopover: 'majom-boards-cardback__move-popover',
  movePopoverHeader: 'majom-boards-cardback__move-popover-header',
  movePopoverTitle: 'majom-boards-cardback__move-popover-title',
  movePopoverBody: 'majom-boards-cardback__move-popover-body',
  movePopoverContent: 'majom-boards-cardback__move-popover-content',
  moveTabs: 'majom-boards-cardback__move-tabs',
  moveTab: 'majom-boards-cardback__move-tab',
  moveTabSelected: 'majom-boards-cardback__move-tab is-selected',
  moveSectionTitle: 'majom-boards-cardback__move-section-title',
  moveFields: 'majom-boards-cardback__move-fields',
  moveField: 'majom-boards-cardback__move-field',
  moveLabel: 'majom-boards-cardback__move-label',
  moveSelect: 'majom-boards-cardback__move-select',
  moveActions: 'majom-boards-cardback__move-actions',
  moveButton: 'majom-boards-cardback__move-button',
  listActionsPopover: 'majom-boards-list-actions',
  listActionsHeader: 'majom-boards-list-actions__header',
  listActionsTitle: 'majom-boards-list-actions__title',
  listActionsBody: 'majom-boards-list-actions__body',
  listActionsList: 'majom-boards-list-actions__list',
  listActionsItem: 'majom-boards-list-actions__item',
  listActionsButton: 'majom-boards-list-actions__button',
  listActionsDivider: 'majom-boards-list-actions__divider',
  listActionsSection: 'majom-boards-list-actions__section',
  listActionsSectionButton: 'majom-boards-list-actions__section-button',
  listActionsUpgrade: 'majom-boards-list-actions__upgrade',
  listActionsUpgradeTitle: 'majom-boards-list-actions__upgrade-title',
  listActionsUpgradeCopy: 'majom-boards-list-actions__upgrade-copy',
  cardActionsPopover: 'majom-boards-card-actions',
  cardActionsBody: 'majom-boards-card-actions__body',
  cardActionsList: 'majom-boards-card-actions__list',
  cardActionsItem: 'majom-boards-card-actions__item',
  cardActionsButton: 'majom-boards-card-actions__button',
  cardActionsDivider: 'majom-boards-card-actions__divider',
  topbarActions: 'majom-boards-cardback__topbar-actions',
  iconButton: 'majom-boards-cardback__icon-button',
  layout: 'majom-boards-cardback__layout',
  main: 'majom-boards-cardback__main',
  aside: 'majom-boards-cardback__aside',
  section: 'majom-boards-cardback__section',
  sectionIcon: 'majom-boards-cardback__section-icon',
  sectionMain: 'majom-boards-cardback__section-main',
  sectionHeader: 'majom-boards-cardback__section-header',
  sectionTitle: 'majom-boards-cardback__section-title',
  sectionActions: 'majom-boards-cardback__section-actions',
  titleSection: 'majom-boards-cardback__title-section',
  doneButton: 'majom-boards-cardback__done-button',
  titleEditor: 'majom-boards-cardback__title-editor',
  quickActions: 'majom-boards-cardback__quick-actions',
  quickActionList: 'majom-boards-cardback__quick-action-list',
  quickActionButton: 'majom-boards-cardback__quick-action-button',
  labelsHost: 'majom-boards-cardback__labels-host',
  labelsSection: 'majom-boards-cardback__labels-section',
  labelsTitle: 'majom-boards-cardback__labels-title',
  labelsList: 'majom-boards-cardback__labels-list',
  labelSwatch: 'majom-boards-cardback__label-swatch',
  labelAddButton: 'majom-boards-cardback__label-add-button',
  labelPickerPopover: 'majom-boards-cardback__label-picker-popover',
  descriptionEditor: 'majom-boards-cardback__description-editor',
  placeholderPanel: 'majom-boards-cardback__placeholder-panel',
  editorActions: 'majom-boards-cardback__editor-actions',
  activityInput: 'majom-boards-cardback__activity-input',
  activityList: 'majom-boards-cardback__activity-list',
  activityItem: 'majom-boards-cardback__activity-item',
  avatar: 'majom-boards-cardback__avatar',
  quickEditorOverlay: 'majom-boards-quick-editor-overlay',
  quickEditor: 'majom-boards-quick-editor',
  quickEditorForm: 'majom-boards-quick-editor__form',
  quickEditorCard: 'majom-boards-quick-editor__card',
  quickEditorCardMirror: 'majom-boards-quick-editor__card--mirror',
  quickEditorCardInner: 'majom-boards-quick-editor__card-inner',
  quickEditorTitle: 'majom-boards-quick-editor__title',
  quickEditorSave: 'majom-boards-quick-editor__save',
  quickEditorActions: 'majom-boards-quick-editor__actions',
  quickEditorButtons: 'majom-boards-quick-editor__buttons',
  quickEditorButton: 'majom-boards-quick-editor__button',
  quickEditorDangerItem: 'majom-boards-quick-editor__danger-item',
  quickEditorDangerButton: 'majom-boards-quick-editor__button--danger',
  quickEditorNewBadge: 'majom-boards-quick-editor__new-badge',
} as const;

const BOARDS_VIEW_CSS = `
.majom-boards {
  --mb-text: #172b4d;
  --mb-muted: #44546f;
  --mb-subtle: #626f86;
  --mb-list: #f1f2f4;
  --mb-card: #ffffff;
  --mb-card-hover: #f7f8f9;
  --mb-blue: #0c66e4;
  --mb-blue-hover: #0055cc;
  --mb-danger: #ae2e24;
  --mb-danger-soft: #ffeceb;
  --mb-header-bg: rgba(255, 255, 255, 0.24);
  --mb-button-hover: rgba(9, 30, 66, 0.14);
  --mb-button-active: rgba(9, 30, 66, 0.2);
  --mb-list-button-hover: rgba(9, 30, 66, 0.08);
  --mb-list-button-active: rgba(9, 30, 66, 0.14);
  --mb-shadow-card: 0 1px 1px rgba(9, 30, 66, 0.25), 0 0 0 1px rgba(9, 30, 66, 0.06);
  --mb-shadow-list: 0 1px 1px rgba(9, 30, 66, 0.16), 0 0 1px rgba(9, 30, 66, 0.31);
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: var(--mb-text);
  background: transparent;
}

.majom-boards *,
.majom-boards *::before,
.majom-boards *::after {
  box-sizing: border-box;
}

.majom-boards__shell {
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
}

.majom-boards__header {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: var(--mb-header-bg);
  color: var(--mb-text);
  backdrop-filter: blur(10px);
}

.majom-boards__title-block {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.majom-boards__title {
  margin: 0;
  overflow: hidden;
  color: var(--mb-text);
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards__title-button {
  display: block;
  max-width: 280px;
  min-width: 0;
  border: 0;
  border-radius: 6px;
  padding: 4px 8px;
  overflow: hidden;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
}

.majom-boards__title-button:hover,
.majom-boards__title-button:focus-visible {
  background: var(--mb-button-hover);
  outline: none;
}

.majom-boards__title-edit-input {
  max-width: 320px;
  min-width: min(260px, 70vw);
  height: 32px;
  color: var(--mb-text);
  font: inherit;
}

.majom-boards__header-actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
}

.majom-boards__header-menu-button {
  color: var(--mb-text);
  background: var(--mb-button-hover);
}

.majom-boards__body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 12px 16px 16px;
}

.majom-boards__tabs {
  display: flex;
  min-width: 0;
  max-width: 100%;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.majom-boards__tab {
  max-width: 220px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 6px;
  color: var(--mb-text);
  background: transparent;
  box-shadow: none;
}

.majom-boards__tab:hover {
  color: var(--mb-text);
  background: var(--mb-button-hover);
}

.majom-boards__tab.is-selected {
  color: var(--mb-text);
  background: rgba(9, 30, 66, 0.16);
}

.majom-boards__canvas {
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: flex-start;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 8px 8px 0;
}

.majom-boards__column,
.majom-boards__column-composer {
  width: 272px;
  flex: 0 0 272px;
  border-radius: 10px;
  background: var(--mb-list);
  box-shadow: var(--mb-shadow-list);
}

.majom-boards__column {
  display: flex;
  height: auto;
  max-height: 100%;
  min-height: 0;
  align-self: flex-start;
  flex-direction: column;
}

.majom-boards__column-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 10px 8px 0px 12px;
}

.majom-boards__column-title-button {
  min-width: 0;
  flex: 1;
  border: 0;
  border-radius: 4px;
  padding: 4px 6px;
  color: inherit;
  background: transparent;
  text-align: left;
}

.majom-boards__column-title-button:hover,
.majom-boards__column-title-button:focus-visible {
  background: rgba(9, 30, 66, 0.08);
  outline: none;
}

.majom-boards__column-title {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--mb-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards__column-title-input {
  width: 100%;
  min-width: 0;
  min-height: 32px;
  border: 0;
  border-radius: 4px;
  padding: 5px 8px;
  color: var(--mb-text);
  background: #ffffff;
  box-shadow: inset 0 0 0 2px var(--mb-blue);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
}

.majom-boards__column-title-input:focus {
  outline: none;
}

.majom-boards__column-menu-button {
  color: var(--mb-muted);
  background: transparent;
  box-shadow: none;
}

.majom-boards__cards {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 8px;
}

.majom-boards__card {
  position: relative;
  border-radius: 8px;
  background: var(--mb-card);
  box-shadow: var(--mb-shadow-card);
  color: var(--mb-text);
  transition: background-color 150ms ease, box-shadow 150ms ease;
  touch-action: none;
}

.majom-boards__card:hover,
.majom-boards__card:focus-within {
  background: var(--mb-card-hover);
  box-shadow:
    0 1px 2px rgba(9, 30, 66, 0.3),
    0 0 0 2px rgba(12, 102, 228, 0.42);
}

.majom-boards__card--mirror:hover,
.majom-boards__card--mirror:focus-within {
  box-shadow:
    0 1px 2px rgba(9, 30, 66, 0.3),
    0 0 0 2px rgba(12, 102, 228, 0.62);
}

.majom-boards__card-open {
  display: block;
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.majom-boards__card.is-dragging {
  opacity: 0.32;
}

.majom-boards__card-drag-preview {
  position: fixed;
  z-index: 360;
  pointer-events: none;
  background: var(--mb-card);
  transform: rotate(2deg);
  opacity: 0.94;
  box-shadow:
    0 12px 28px rgba(9, 30, 66, 0.28),
    0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards__card-drag-placeholder {
  flex: 0 0 auto;
  border-radius: 8px;
  background: rgba(9, 30, 66, 0.12);
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards.is-card-dragging {
  cursor: grabbing;
  user-select: none;
}

.majom-boards.is-card-dragging .majom-boards__card-open {
  cursor: grabbing;
}

.majom-boards__column.is-dragging {
  opacity: 0.32;
}

.majom-boards__column-drag-preview {
  position: fixed;
  z-index: 350;
  pointer-events: none;
  transform: rotate(1deg);
  opacity: 0.96;
  box-shadow:
    0 16px 32px rgba(9, 30, 66, 0.28),
    0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards__column-drag-placeholder {
  flex: 0 0 auto;
  border-radius: 12px;
  background: rgba(9, 30, 66, 0.16);
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards.is-column-dragging {
  cursor: grabbing;
  user-select: none;
}

.majom-boards__card-source-label {
  display: inline-flex;
  max-width: 100%;
  margin-bottom: 6px;
  border-radius: 4px;
  padding: 2px 6px;
  overflow: hidden;
  color: #0c66e4;
  background: #e9f2ff;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards__card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.majom-boards__card-tag {
  display: block;
  width: 48px;
  max-width: 100%;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  font-size: 0;
  line-height: 0;
}

.majom-boards__card-tag:nth-child(n + 5) {
  width: 32px;
}

.majom-boards__card-open:focus-visible,
.majom-boards__input:focus-visible,
.majom-boards__textarea:focus-visible,
.majom-boards-modal__title-input:focus-visible,
.majom-boards-modal__description:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards__card-title {
  margin: 0;
  color: var(--mb-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.majom-boards__card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.majom-boards__card-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-height: 16px;
  color: var(--mb-muted);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
}

.majom-boards__card-composer {
  flex-shrink: 0;
  padding: 0 8px 8px;
}

.majom-boards__card-composer-expanded {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.majom-boards__card-composer-collapsed {
  width: 100%;
  justify-content: flex-start;
  border-radius: 8px;
  color: var(--mb-muted);
}

.majom-boards__card-composer-collapsed:hover,
.majom-boards__card-composer-collapsed:focus-visible {
  color: var(--mb-text);
  background: var(--mb-list-button-hover);
}

.majom-boards__card-composer-collapsed:active {
  background: var(--mb-list-button-active);
}

.majom-boards__card-composer-textarea {
  width: 100%;
  height: 56px;
  min-height: 56px;
  max-height: 160px;
  border: 0;
  border-radius: 8px;
  padding: 8px 12px;
  resize: none;
  color: var(--mb-text);
  background: var(--mb-card);
  box-shadow: var(--mb-shadow-card);
  font: inherit;
  font-size: 16px;
  line-height: 20px;
  overflow-y: auto;
}

.majom-boards__card-composer-textarea:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards__column-composer {
  display: flex;
  height: fit-content;
  flex-direction: column;
  gap: 8px;
}

.majom-boards__column-composer--expanded {
  padding: 8px;
  background: rgba(241, 242, 244, 0.9);
}

.majom-boards__column-composer--collapsed {
  padding: 0;
  background: rgba(255, 255, 255, 0.24);
  box-shadow: none;
  backdrop-filter: blur(8px);
}

.majom-boards__column-composer-collapsed {
  width: 100%;
  min-height: 44px;
  justify-content: flex-start;
  border-radius: 8px;
  gap: 8px;
  color: var(--mb-text);
  background: transparent;
}

.majom-boards__column-composer-collapsed:hover {
  color: var(--mb-text);
  background: var(--mb-button-hover);
}

.majom-boards__column-composer-expanded {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.majom-boards__list-composer-textarea {
  width: 100%;
  height: 32px;
  min-height: 32px;
  max-height: 120px;
  border: 0;
  border-radius: 8px;
  padding: 6px 12px;
  resize: none;
  color: var(--mb-text);
  background: var(--mb-card);
  box-shadow: var(--mb-shadow-card);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  overflow-y: auto;
}

.majom-boards__list-composer-textarea:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards__input,
.majom-boards__textarea {
  width: 100%;
  border: 0;
  border-radius: 8px;
  color: var(--mb-text);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.16), 0 1px 1px rgba(9, 30, 66, 0.08);
  font: inherit;
  font-size: 16px;
}

.majom-boards__input {
  height: 40px;
  min-height: 40px;
  padding: 8px 12px;
}

.majom-boards__textarea {
  min-height: 72px;
  resize: vertical;
  padding: 10px 12px;
  line-height: 20px;
}

.majom-boards__input::placeholder,
.majom-boards__textarea::placeholder,
.majom-boards__card-composer-textarea::placeholder,
.majom-boards__list-composer-textarea::placeholder,
.majom-boards-modal__description::placeholder,
.majom-boards-modal__title-input::placeholder {
  color: var(--mb-subtle);
}

.majom-boards__composer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.majom-boards__composer-cancel {
  color: var(--mb-muted);
}

.majom-boards__button,
.majom-boards__icon-button {
  border-radius: 8px;
  box-shadow: none;
}

.majom-boards__button--primary {
  background: var(--mb-blue);
  color: #fff;
}

.majom-boards__button--primary:hover {
  background: var(--mb-blue-hover);
  color: #fff;
}

.majom-boards__button--quiet {
  color: var(--mb-muted);
  background: transparent;
}

.majom-boards__button--quiet:hover,
.majom-boards__icon-button:hover {
  color: var(--mb-text);
  background: var(--mb-button-hover);
}

.majom-boards__button--danger,
.majom-boards__icon-button--danger {
  color: var(--mb-danger);
  background: transparent;
}

.majom-boards__button--danger:hover,
.majom-boards__icon-button--danger:hover {
  color: #5d1f1a;
  background: var(--mb-danger-soft);
}

.majom-boards__empty,
.majom-boards__message-wrapper {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.majom-boards__empty-content {
  max-width: 420px;
  text-align: center;
}

.majom-boards__empty-title {
  margin: 0;
  color: var(--mb-text);
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
}

.majom-boards__empty-copy,
.majom-boards__message-label {
  margin: 8px 0 0;
  color: var(--mb-muted);
  font-size: 14px;
  line-height: 22px;
}

.majom-boards__error {
  margin: 0 16px 10px;
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--mb-danger);
  background: var(--mb-danger-soft);
  box-shadow: inset 0 0 0 1px rgba(174, 46, 36, 0.16);
  font-size: 14px;
}

.majom-boards-modal {
  --mb-text: #172b4d;
  --mb-muted: #44546f;
  --mb-subtle: #626f86;
  --mb-blue: #0c66e4;
  --mb-blue-hover: #0055cc;
  --mb-danger: #ae2e24;
  --mb-danger-soft: #ffeceb;
  --mb-button-hover: rgba(9, 30, 66, 0.14);
  width: min(72rem, calc(100vw - 2rem));
  max-width: min(72rem, calc(100vw - 2rem));
  border-radius: 12px;
  padding: 0;
  background: #f1f2f4;
}

.majom-boards-modal__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.majom-boards-modal__meta {
  margin: -4px 0 0;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  line-height: 18px;
}

.majom-boards-modal__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.majom-boards-modal__label {
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.majom-boards-modal__title-input,
.majom-boards-modal__description {
  width: 100%;
  border: 0;
  border-radius: 8px;
  color: var(--mb-text, #172b4d);
  background: #f7f8f9;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.14);
  font: inherit;
  font-size: 16px;
}

.majom-boards-modal__title-input {
  min-height: 44px;
  padding: 10px 12px;
  font-weight: 700;
}

.majom-boards-modal__description {
  min-height: 180px;
  resize: vertical;
  padding: 12px;
  line-height: 22px;
}

.majom-boards-modal__hint {
  margin: 0;
  color: var(--mb-subtle, #626f86);
  font-size: 12px;
  line-height: 18px;
}

.majom-boards-cardback__hidden-shell-part {
  display: none !important;
}

.majom-boards-cardback {
  display: flex;
  min-height: min(720px, calc(100vh - 5rem));
  max-height: min(780px, calc(100vh - 3rem));
  flex-direction: column;
  overflow: hidden;
  color: var(--mb-text, #172b4d);
  background: #f1f2f4;
}

.majom-boards-cardback__topbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(9, 30, 66, 0.14);
  padding: 10px 12px;
  background: #f1f2f4;
}

.majom-boards-cardback__topbar-start,
.majom-boards-cardback__topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.majom-boards-cardback__list-badge {
  display: inline-flex;
  max-width: 280px;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--mb-muted, #44546f);
  background: #dfe1e6;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.majom-boards-cardback__list-badge:hover,
.majom-boards-cardback__list-badge[aria-expanded='true'] {
  background: #cfd3da;
}

.majom-boards-cardback__source-label {
  display: inline-flex;
  max-width: min(360px, 48vw);
  border-radius: 4px;
  padding: 4px 8px;
  overflow: hidden;
  color: #0c66e4;
  background: #e9f2ff;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards-cardback__move-popover {
  display: flex;
  width: min(360px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__move-popover-header {
  display: grid;
  min-height: 48px;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  align-items: center;
  padding: 8px;
}

.majom-boards-cardback__move-popover-title {
  grid-column: 2;
  margin: 0;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.majom-boards-cardback__move-popover-header > button {
  grid-column: 3;
}

.majom-boards-cardback__move-popover-body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.majom-boards-cardback__move-popover-content {
  min-height: 0;
  overflow-y: auto;
  padding: 0 12px;
}

.majom-boards-cardback__move-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0 0 14px;
  border-bottom: 1px solid rgba(9, 30, 66, 0.14);
}

.majom-boards-cardback__move-tab {
  min-height: 36px;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--mb-muted, #44546f);
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}

.majom-boards-cardback__move-tab.is-selected {
  border-bottom-color: var(--mb-blue, #0c66e4);
  color: var(--mb-blue, #0c66e4);
}

.majom-boards-cardback__move-section-title {
  margin: 0 0 10px;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.majom-boards-cardback__move-fields {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.majom-boards-cardback__move-field {
  display: grid;
  gap: 4px;
}

.majom-boards-cardback__move-label {
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.majom-boards-cardback__move-select {
  width: 100%;
  min-height: 40px;
  border: 0;
  border-radius: 4px;
  padding: 8px 34px 8px 10px;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  box-shadow: inset 0 0 0 2px rgba(9, 30, 66, 0.14);
  font: inherit;
  font-size: 16px;
  line-height: 20px;
}

.majom-boards-cardback__move-select:focus {
  box-shadow: inset 0 0 0 2px var(--mb-blue, #0c66e4);
  outline: none;
}

.majom-boards-cardback__move-actions {
  display: flex;
  flex-shrink: 0;
  padding: 12px;
  background: #ffffff;
}

.majom-boards-cardback__move-button {
  min-height: 36px;
  border-radius: 4px;
  padding: 8px 14px;
}

.majom-boards-list-actions {
  width: min(304px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-list-actions__header {
  display: grid;
  min-height: 48px;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  align-items: center;
  padding: 8px;
}

.majom-boards-list-actions__title {
  grid-column: 2;
  margin: 0;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.majom-boards-list-actions__header > button {
  grid-column: 3;
}

.majom-boards-list-actions__body {
  max-height: min(720px, calc(100vh - 96px));
  overflow-y: auto;
  padding: 0 0 8px;
}

.majom-boards-list-actions__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-list-actions__item {
  margin: 0;
}

.majom-boards-list-actions__button,
.majom-boards-list-actions__section-button {
  width: 100%;
  min-height: 32px;
  justify-content: flex-start;
  border-radius: 0;
  padding: 6px 12px;
  color: var(--mb-text, #172b4d);
  background: transparent;
  box-shadow: none;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.majom-boards-list-actions__button:hover:not(:disabled),
.majom-boards-list-actions__section-button:hover:not(:disabled) {
  background: #f1f2f4;
}

.majom-boards-list-actions__button:disabled {
  color: var(--mb-subtle, #626f86);
  opacity: 1;
}

.majom-boards-list-actions__divider {
  height: 1px;
  margin: 8px 0;
  background: rgba(9, 30, 66, 0.14);
}

.majom-boards-list-actions__section {
  padding: 0 0 4px;
}

.majom-boards-list-actions__section-button {
  min-height: 36px;
  font-weight: 700;
}

.majom-boards-list-actions__section-button svg {
  margin-left: auto;
}

.majom-boards-list-actions__upgrade {
  margin: 4px 12px 8px;
  border-radius: 8px;
  padding: 12px;
  color: var(--mb-text, #172b4d);
  background: #f7f8f9;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.1);
}

.majom-boards-list-actions__upgrade-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.majom-boards-list-actions__upgrade-copy {
  margin: 4px 0 0;
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  line-height: 18px;
}

.majom-boards-card-actions {
  width: min(232px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-card-actions__body {
  max-height: min(640px, calc(100vh - 96px));
  overflow-y: auto;
  padding: 8px 0;
}

.majom-boards-card-actions__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-card-actions__item {
  margin: 0;
}

.majom-boards-card-actions__button {
  width: 100%;
  min-height: 34px;
  justify-content: flex-start;
  gap: 8px;
  border-radius: 0;
  padding: 7px 12px;
  color: var(--mb-text, #172b4d);
  background: transparent;
  box-shadow: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.majom-boards-card-actions__button:hover:not(:disabled) {
  background: #f1f2f4;
}

.majom-boards-card-actions__button:disabled {
  color: var(--mb-subtle, #626f86);
  opacity: 1;
}

.majom-boards-card-actions__divider {
  height: 1px;
  margin: 8px 0;
  background: rgba(9, 30, 66, 0.14);
}

.majom-boards-cardback__icon-button {
  color: var(--mb-muted, #44546f);
  background: transparent;
  box-shadow: none;
}

.majom-boards-cardback__icon-button:hover {
  color: var(--mb-text, #172b4d);
  background: var(--mb-button-hover);
}

.majom-boards-cardback__layout {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
}

.majom-boards-cardback__main {
  min-width: 0;
  overflow-y: auto;
  padding: 8px 12px 20px;
}

.majom-boards-cardback__aside {
  display: none;
  min-width: 0;
  overflow-y: auto;
  border-left: 1px solid rgba(9, 30, 66, 0.12);
  background: #f7f8f9;
  padding: 12px;
}

.majom-boards-cardback__section {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
}

.majom-boards-cardback__title-section {
  padding-top: 4px;
}

.majom-boards-cardback__section-icon {
  display: flex;
  min-height: 32px;
  align-items: flex-start;
  justify-content: center;
  padding-top: 5px;
  color: var(--mb-subtle, #626f86);
}

.majom-boards-cardback__section-main {
  min-width: 0;
}

.majom-boards-cardback__section-header {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.majom-boards-cardback__section-title {
  margin: 0;
  color: var(--mb-text, #172b4d);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}

.majom-boards-cardback__section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.majom-boards-cardback__done-button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  color: var(--mb-subtle, #626f86);
  background: transparent;
  box-shadow: none;
}

.majom-boards-cardback__title-editor {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  resize: vertical;
  color: var(--mb-text, #172b4d);
  background: transparent;
  font: inherit;
  font-size: 24px;
  font-weight: 700;
  line-height: 30px;
}

.majom-boards-cardback__title-editor:focus-visible {
  background: #ffffff;
  box-shadow: inset 0 0 0 2px rgba(12, 102, 228, 0.55);
  outline: none;
}

.majom-boards-cardback__quick-actions {
  padding-top: 0;
}

.majom-boards-cardback__quick-action-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-cardback__quick-action-button {
  min-height: 36px;
  justify-content: flex-start;
  gap: 8px;
  border-radius: 8px;
  color: var(--mb-muted, #44546f);
  background: #e9ebee;
  box-shadow: none;
}

.majom-boards-cardback__quick-action-button:hover:not(:disabled) {
  color: var(--mb-text, #172b4d);
  background: #dfe1e6;
}

.majom-boards-cardback__quick-action-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.majom-boards-cardback__labels-host:empty {
  display: none;
}

.majom-boards-cardback__labels-section {
  padding: 6px 0 12px 44px;
}

.majom-boards-cardback__labels-title {
  margin: 0 0 6px;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.majom-boards-cardback__labels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.majom-boards-cardback__label-swatch {
  min-width: 60px;
  max-width: 180px;
  height: 32px;
  border: 0;
  border-radius: 5px;
  padding: 0 10px;
  overflow: hidden;
  box-shadow: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.majom-boards-cardback__label-swatch:hover,
.majom-boards-cardback__label-swatch:focus-visible {
  filter: brightness(0.96);
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards-cardback__label-add-button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: var(--mb-muted, #44546f);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.18);
}

.majom-boards-cardback__label-add-button:hover,
.majom-boards-cardback__label-add-button[aria-expanded='true'] {
  color: var(--mb-text, #172b4d);
  background: #f7f8f9;
}

.majom-boards-cardback__label-picker-popover {
  width: min(304px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__description-editor {
  width: 100%;
  min-height: 180px;
  border: 0;
  border-radius: 8px;
  padding: 12px;
  resize: vertical;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.14);
  font: inherit;
  font-size: 16px;
  line-height: 22px;
}

.majom-boards-cardback__placeholder-panel {
  border-radius: 8px;
  padding: 14px 16px;
  color: var(--mb-muted, #44546f);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.08);
  font-size: 13px;
  line-height: 20px;
}

.majom-boards-cardback__editor-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.majom-boards-cardback__activity-input {
  width: 100%;
  min-height: 40px;
  justify-content: flex-start;
  color: var(--mb-muted, #44546f);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__activity-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.majom-boards-cardback__activity-item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  line-height: 20px;
}

.majom-boards-cardback__avatar {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #ffffff;
  background: #44546f;
  font-size: 12px;
  font-weight: 700;
}

.majom-boards-cardback__description-editor:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards-quick-editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 280;
  background: rgba(9, 30, 66, 0.52);
}

.majom-boards-quick-editor {
  position: fixed;
}

.majom-boards-quick-editor [role="dialog"] {
  position: relative;
  width: 256px;
}

.majom-boards-quick-editor__form {
  display: flex;
  width: 256px;
  flex-direction: column;
  gap: 8px;
}

.majom-boards-quick-editor__card {
  width: 256px;
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.22),
    0 1px 1px rgba(9, 30, 66, 0.2),
    0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards-quick-editor__card--mirror {
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.22),
    0 1px 1px rgba(9, 30, 66, 0.2),
    0 0 0 2px rgba(12, 102, 228, 0.46);
}

.majom-boards-quick-editor__card-inner {
  padding: 10px 12px;
}

.majom-boards-quick-editor__title {
  width: 100%;
  min-height: 56px;
  border: 0;
  border-radius: 6px;
  padding: 0;
  resize: vertical;
  color: var(--mb-text, #172b4d);
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.majom-boards-quick-editor__title:focus-visible {
  background: #ffffff;
  box-shadow: inset 0 0 0 2px rgba(12, 102, 228, 0.55);
  outline: none;
}

.majom-boards-quick-editor__save {
  width: fit-content;
  min-width: 64px;
  min-height: 32px;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 20px;
}

.majom-boards-quick-editor__actions {
  position: absolute;
  top: 0;
  left: calc(100% + 8px);
  max-height: calc(100vh - 24px);
  overflow-y: auto;
}

.majom-boards-quick-editor__buttons {
  display: flex;
  width: max-content;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-quick-editor__button {
  min-height: 32px;
  justify-content: flex-start;
  gap: 6px;
  border-radius: 4px;
  padding: 6px 10px;
  color: #292a2e;
  background: #f7f8f9;
  box-shadow:
    0 2px 6px rgba(9, 30, 66, 0.24),
    0 0 0 1px rgba(9, 30, 66, 0.12);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.majom-boards-quick-editor__button:hover:not(:disabled) {
  color: #172b4d;
  background: #ffffff;
}

.majom-boards-quick-editor__button:disabled {
  color: #292a2e;
  opacity: 1;
}

.majom-boards-quick-editor__danger-item {
  margin-top: 4px;
}

.majom-boards-quick-editor__button--danger {
  color: #ae2e24;
  background: #fff7f6;
  box-shadow:
    0 2px 6px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(174, 46, 36, 0.18);
}

.majom-boards-quick-editor__button--danger:hover:not(:disabled) {
  color: #5d1f1a;
  background: #ffeceb;
}

.majom-boards-quick-editor__new-badge {
  margin-left: 6px;
  border-radius: 4px;
  padding: 1px 5px;
  color: #5d1f80;
  background: #e9d1ff;
  font-size: 11px;
  font-weight: 800;
  line-height: 14px;
}

@media (max-width: 640px) {
  .majom-boards-quick-editor [role="dialog"] {
    width: min(256px, calc(100vw - 24px));
  }

  .majom-boards-quick-editor__form,
  .majom-boards-quick-editor__card {
    width: 100%;
  }

  .majom-boards-quick-editor__actions {
    top: calc(100% + 8px);
    left: 0;
    max-height: calc(100vh - 220px);
  }
}

@media (min-width: 768px) {
  .majom-boards__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .majom-boards__title-block {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .majom-boards__header-actions {
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
  }

  .majom-boards__tabs {
    max-width: min(48vw, 520px);
  }

  .majom-boards__input,
  .majom-boards__textarea,
  .majom-boards__card-composer-textarea,
  .majom-boards__list-composer-textarea,
  .majom-boards-modal__title-input,
  .majom-boards-modal__description {
    font-size: 14px;
  }

  .majom-boards-cardback__layout {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .majom-boards-cardback__main {
    padding: 8px 20px 24px;
  }

  .majom-boards-cardback__aside {
    display: block;
  }

  .majom-boards-cardback__title-editor,
  .majom-boards-cardback__description-editor {
    font-size: 14px;
  }

  .majom-boards-cardback__title-editor {
    font-size: 24px;
  }
}
`;

export function installBoardsViewStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = BOARDS_VIEW_CSS;
  document.head.appendChild(style);
}
