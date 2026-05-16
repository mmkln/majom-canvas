const STYLE_ID = 'flows-styles';

const FLOWS_STYLES = `
#flows-root {
  --flows-column-expanded-width: 272px;
  --flows-card-border: 0;
  --flows-card-shadow: 0 1px 1px rgba(9, 30, 66, 0.25), 0 0 0 1px rgba(9, 30, 66, 0.06);
  --flows-list-shadow: 0 1px 1px rgba(9, 30, 66, 0.16), 0 0 1px rgba(9, 30, 66, 0.31);
  --flows-on-wallpaper-text: var(--workspace-dynamic-text-color, #172b4d);
  --flows-on-wallpaper-bg: var(--workspace-dynamic-header-bg, rgba(255, 255, 255, 0.24));
  --flows-on-wallpaper-button-bg-hover: var(--workspace-dynamic-button-bg-hover, rgba(9, 30, 66, 0.16));
  --flows-on-wallpaper-button-bg-active: var(--workspace-dynamic-button-bg-active, rgba(9, 30, 66, 0.22));
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  color: var(--workspace-dynamic-text-color, #0f172a);
  font-family: "Poppins", "Inter", "Segoe UI", "Roboto", "Arial", sans-serif;
}

#flows-root *,
#flows-root *::before,
#flows-root *::after {
  box-sizing: border-box;
}

.flows-page {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
}

.flows-header {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: var(--workspace-dynamic-header-bg, rgba(255, 255, 255, 0.24));
  color: var(--workspace-dynamic-text-color, #172b4d);
  backdrop-filter: blur(10px);
}

.flows-header-title-block {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.flows-header-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.flows-header-title {
  margin: 0;
  overflow: hidden;
  color: var(--workspace-dynamic-text-color, #172b4d);
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flows-header-title-row .flows-header-action {
  flex: 0 0 auto;
}

.flows-header-action {
  display: inline-flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0 !important;
  border-radius: 6px !important;
  color: var(--workspace-dynamic-icon-color, #172b4d) !important;
  background: transparent !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
  padding: 0 10px !important;
}

.flows-header-action:hover,
.flows-header-action:focus-visible,
.flows-header-action:active,
.flows-header-action[aria-pressed="true"] {
  color: var(--workspace-dynamic-icon-color, #172b4d) !important;
  background: var(--workspace-dynamic-button-bg-active, rgba(9, 30, 66, 0.22)) !important;
}

.flows-body {
  display: flex;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px 16px 16px;
}

.flows-center-state {
  display: flex;
  flex: 1;
  height: 100%;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.flows-state-text {
  margin: 0;
  max-width: 32rem;
  color: var(--workspace-dynamic-text-color, #334155);
  font-size: 15px;
  line-height: 1.6;
}

.flows-board {
  display: flex;
  width: max-content;
  min-width: max-content;
  height: 100%;
  align-items: flex-start;
  gap: 18px;
}

.flows-body::-webkit-scrollbar,
.flows-column-task-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.flows-body::-webkit-scrollbar-track,
.flows-column-task-list::-webkit-scrollbar-track {
  background: transparent;
}

.flows-body::-webkit-scrollbar-thumb,
.flows-column-task-list::-webkit-scrollbar-thumb {
  border: 2px solid rgba(248, 250, 252, 0.78);
  border-radius: 999px;
  background: rgba(203, 213, 225, 0.78);
}

.flows-column {
  position: relative;
  display: flex;
  width: var(--flows-column-expanded-width);
  min-width: var(--flows-column-expanded-width);
  flex: 0 0 var(--flows-column-expanded-width);
  height: auto;
  max-height: 100%;
  align-self: flex-start;
  flex-direction: column;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  transition: width 220ms ease, min-width 220ms ease;
}

.flows-column.is-dragging {
  opacity: 0.28;
}

.flows-column-drag-preview {
  position: fixed;
  z-index: 260;
  pointer-events: none;
  opacity: 0.92;
  transform: rotate(1deg);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.18);
}

.flows-column-drag-placeholder {
  flex: 0 0 auto;
  border: 2px dashed rgba(148, 163, 184, 0.55);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.26);
}

.is-flow-column-dragging .flows-column {
  cursor: grabbing;
}

.flows-column.is-collapsed {
  width: 52px;
  min-width: 52px;
  flex-basis: 52px;
  height: auto;
  max-height: calc(100% - 8px);
  overflow: hidden;
  border: var(--flows-card-border);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: var(--flows-list-shadow);
}

.flows-column.is-collapsed .flows-column-expanded {
  display: none;
}

.flows-column:not(.is-collapsed) .flows-column-collapsed {
  display: none;
}

.flows-column-collapsed {
  display: flex;
  width: 100%;
  min-height: 9rem;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 14px 0;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-column-collapsed:hover {
  background: #f8fafc;
  color: #334155;
}

.flows-column-collapsed-title {
  max-height: 14rem;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.flows-column-expanded {
  display: flex;
  width: 100%;
  min-height: 0;
  flex-direction: column;
}

.flows-column-header {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  border: var(--flows-card-border);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: var(--flows-list-shadow);
  padding: 10px 12px 10px 12px;
}

.flows-column-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.flows-column-title-wrap {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
}

.flows-column-title-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
}

.flows-column-title {
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
}

.flows-flow-icon {
  flex: 0 0 auto;
}

.flows-column-collapsed-icon {
  margin-top: 1px;
}

.flows-flow-icon--indigo { color: #818cf8; }
.flows-flow-icon--violet { color: #a78bfa; }
.flows-flow-icon--fuchsia { color: #e879f9; }
.flows-flow-icon--rose { color: #fb7185; }
.flows-flow-icon--orange { color: #fb923c; }
.flows-flow-icon--amber { color: #fbbf24; }
.flows-flow-icon--lime { color: #84cc16; }
.flows-flow-icon--emerald { color: #10b981; }
.flows-flow-icon--teal { color: #14b8a6; }
.flows-flow-icon--cyan { color: #06b6d4; }
.flows-flow-icon--blue { color: #3b82f6; }
.flows-flow-icon--slate { color: #64748b; }

.flows-appearance-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-appearance-button:hover,
.flows-appearance-button:focus-visible,
.flows-appearance-button[aria-expanded="true"] {
  background: #f1f5f9;
  outline: none;
}

.flows-column-title-icon-button {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.flows-edit-title-icon-button {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #f8fafc;
  box-shadow: inset 0 0 0 1px #e2e8f0;
}

.flows-appearance-popover {
  display: grid;
  width: 236px;
  gap: 12px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
  padding: 12px;
}

.flows-appearance-icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.flows-appearance-icon-option,
.flows-appearance-color-option {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.flows-appearance-icon-option {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  transition: background-color 140ms ease, box-shadow 140ms ease;
}

.flows-appearance-icon-option:hover,
.flows-appearance-icon-option.is-selected {
  background: #f8fafc;
  box-shadow: inset 0 0 0 1px currentColor;
}

.flows-appearance-color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.flows-appearance-color-option {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  transition: box-shadow 140ms ease, transform 140ms ease;
}

.flows-appearance-color-option span {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--flow-edit-color, #94a3b8);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.flows-appearance-color-option:hover {
  transform: scale(1.06);
}

.flows-appearance-color-option.is-selected {
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px var(--flow-edit-color, #94a3b8);
}

.flows-column-title-button {
  display: block;
  width: 100%;
  min-width: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 3px 5px;
  text-align: left;
}

.flows-column-title-button:hover,
.flows-column-title-button:focus-visible {
  background: rgba(15, 23, 42, 0.06);
  outline: none;
}

.flows-column-title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

.flows-column-title-input {
  width: 100%;
  min-width: 0;
  height: 30px;
  border: 0;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #cbd5e1;
  color: #1e293b;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  padding: 4px 7px;
}

.flows-column-title-input:focus {
  outline: none;
}

.flows-column-icon-button {
  display: inline-flex;
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-column-icon-button:hover {
  background: #f1f5f9;
  color: #475569;
}

.flows-column-menu-container {
  position: relative;
  flex: 0 0 auto;
}

.flows-column-menu-trigger {
  margin-right: -6px;
}

.flows-column-menu {
  width: 144px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
  padding: 4px 0;
}

.flows-column-menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #475569;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  padding: 8px 12px;
  text-align: left;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-column-menu-item:hover {
  background: #f8fafc;
  color: #334155;
}

.flows-column-menu-item-icon {
  display: inline-flex;
}

.flows-column-menu-item--danger {
  border-top: 1px solid rgba(241, 245, 249, 0.95);
  color: #dc2626;
  margin-top: 4px;
}

.flows-column-menu-item--danger:hover {
  background: #fff1f2;
  color: #be123c;
}

.flows-column-task-list {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 10px 4px 0;
}

.flows-task-card {
  display: block;
  width: 100%;
  border: var(--flows-card-border);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--flows-card-shadow);
  cursor: pointer;
  padding: 14px;
  text-align: left;
  transition: background-color 140ms ease, box-shadow 140ms ease;
}

.flows-task-card:hover {
  background: #f7f8f9;
}

.flows-task-card:disabled {
  cursor: default;
}

.flows-task-title {
  margin: 0 0 12px;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.5;
}

.flows-task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: #94a3b8;
}

.flows-task-meta-item {
  border-radius: 999px;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 650;
  padding: 3px 7px;
  text-transform: capitalize;
}

.flows-task-composer {
  width: 100%;
  flex: 0 0 auto;
}

.flows-add-task-button {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  background: var(--flows-on-wallpaper-bg);
  color: var(--flows-on-wallpaper-text);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 0 14px;
  backdrop-filter: blur(10px);
  transition: background-color 140ms ease;
}

.flows-add-task-button:hover,
.flows-add-task-button:focus-visible {
  background: var(--flows-on-wallpaper-button-bg-hover);
  outline: none;
}

.flows-add-task-button:active {
  background: var(--flows-on-wallpaper-button-bg-active);
}

.flows-task-composer-expanded {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flows-task-composer-textarea {
  width: 100%;
  min-height: 64px;
  max-height: 160px;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--flows-card-shadow);
  color: #334155;
  font: inherit;
  font-size: 16px;
  line-height: 1.45;
  outline: none;
  overflow-y: auto;
  padding: 10px 12px;
  resize: none;
}

.flows-task-composer-textarea::placeholder {
  color: #94a3b8;
}

.flows-task-composer-textarea:focus-visible {
  box-shadow: var(--flows-card-shadow), 0 0 0 2px rgba(148, 163, 184, 0.28);
}

.flows-task-composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flows-task-composer-error {
  margin-top: 6px;
  color: #e11d48;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
}

@media (min-width: 768px) {
  .flows-task-composer-textarea {
    font-size: 13px;
  }
}

.flows-add-flow-panel {
  display: flex;
  width: var(--flows-column-expanded-width);
  height: fit-content;
  flex: 0 0 var(--flows-column-expanded-width);
  flex-direction: column;
  border-radius: 10px;
  background: var(--flows-on-wallpaper-bg);
  box-shadow: none;
  backdrop-filter: blur(10px);
}

.flows-add-flow-button {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--flows-on-wallpaper-text);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 0 14px;
  transition: background-color 140ms ease;
}

.flows-add-flow-button:hover,
.flows-add-flow-button:focus-visible {
  background: var(--flows-on-wallpaper-button-bg-hover);
  outline: none;
}

.flows-add-flow-button:active {
  background: var(--flows-on-wallpaper-button-bg-active);
}

.flows-add-flow-button:disabled {
  cursor: default;
  opacity: 0.64;
}

.flows-column-state {
  display: flex;
  min-height: 84px;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(226, 232, 240, 0.82);
  border-radius: 14px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  padding: 20px;
}

.flows-organize-modal {
  position: fixed;
  inset: 0;
  z-index: 230;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(8px);
  padding: 12px;
}

.flows-organize-dialog {
  display: flex;
  width: min(454px, 100%);
  max-height: min(568px, calc(100vh - 24px));
  overflow: hidden;
  flex-direction: column;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.24);
}

.flows-organize-dialog--multi-column {
  width: min(920px, 100%);
}

.flows-organize-header {
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 26px;
}

.flows-organize-title-wrap {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: #64748b;
}

.flows-organize-title {
  margin: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 20px;
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flows-organize-close {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-organize-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.flows-organize-close:disabled {
  cursor: default;
  opacity: 0.5;
}

.flows-organize-body {
  display: grid;
  min-height: 0;
  gap: 6px;
  overflow-y: auto;
  padding: 18px 10px 26px;
}

.flows-organize-body--multi-column {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-content: start;
  align-items: start;
  column-gap: 8px;
}

.flows-organize-row {
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 0 10px;
  transition: background-color 140ms ease, opacity 140ms ease;
}

.flows-organize-row:hover,
.flows-organize-row:focus-within {
  background: #f8fafc;
}

.flows-organize-row.is-dragging {
  opacity: 0.42;
}

.flows-organize-row.is-pending {
  opacity: 0.68;
}

.flows-organize-row.is-hidden .flows-organize-title-button,
.flows-organize-row.is-hidden .flows-organize-title-text {
  color: #94a3b8;
}

.flows-organize-row.is-hidden .flows-organize-icon {
  opacity: 0.38;
}

.flows-organize-row-main {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 12px;
  color: #334155;
  font: inherit;
  padding: 0 4px;
}

.flows-organize-hide {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  opacity: 0;
  padding: 0;
  transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
}

.flows-organize-row:hover .flows-organize-hide,
.flows-organize-row:focus-within .flows-organize-hide {
  opacity: 1;
}

.flows-organize-hide:hover,
.flows-organize-hide:focus-visible {
  background: #eef2f7;
  color: #334155;
  outline: none;
}

.flows-organize-hide:disabled {
  cursor: default;
  opacity: 0.34;
}

.flows-organize-hide:disabled:hover {
  background: transparent;
  color: #64748b;
}

.flows-organize-drop-placeholder {
  min-height: 56px;
  border-radius: 12px;
  background: #f1f5f9;
  pointer-events: none;
}

.flows-organize-drag-handle {
  display: inline-flex;
  width: 24px;
  height: 28px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #94a3b8;
  cursor: grab;
  opacity: 0.72;
  padding: 0;
  transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
}

.flows-organize-drag-handle:hover,
.flows-organize-drag-handle:focus-visible {
  background: #eef2f7;
  color: #64748b;
  opacity: 1;
}

.flows-organize-drag-handle:active {
  cursor: grabbing;
}

.flows-organize-drag-handle:disabled {
  cursor: default;
  opacity: 0.36;
}

.flows-organize-label {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: #334155;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flows-organize-title-button {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 3px 5px;
  text-align: left;
}

.flows-organize-title-button:hover,
.flows-organize-title-button:focus-visible {
  background: rgba(15, 23, 42, 0.06);
  outline: none;
}

.flows-organize-title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flows-organize-title-input {
  width: 100%;
  min-width: 0;
  height: 30px;
  border: 0;
  border-radius: 7px;
  background: #ffffff;
  box-shadow: inset 0 0 0 2px #cbd5e1;
  color: #334155;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  padding: 4px 7px;
}

.flows-organize-title-input:focus {
  outline: none;
}

.flows-organize-empty {
  margin: 28px 14px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.flows-organize-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #f1f5f9;
  background: rgba(248, 250, 252, 0.72);
  padding: 18px 26px;
}

.flows-organize-done {
  min-width: 96px !important;
  height: 40px !important;
  border-radius: 14px !important;
  background: #1e293b !important;
  color: #ffffff !important;
  font-size: 14px !important;
  font-weight: 750 !important;
}

.flows-organize-done:hover,
.flows-organize-done:focus-visible {
  background: #0f172a !important;
  color: #ffffff !important;
}

.flows-edit-container {
  max-width: 28rem;
}

.flows-edit-dialog {
  display: grid;
  gap: 16px;
  margin: 0;
}

.flows-edit-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.flows-edit-title-control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flows-edit-title-input {
  min-width: 0;
  flex: 1 1 auto;
}

.flows-edit-dropdown {
  min-width: 0;
}

.flows-edit-dropdown-icon,
.flows-edit-dropdown-option-icon {
  flex: 0 0 auto;
}

.flows-edit-dropdown-check {
  color: #64748b;
}

.flows-edit-dropdown-tone--slate { color: #64748b; }
.flows-edit-dropdown-tone--blue { color: #2563eb; }
.flows-edit-dropdown-tone--emerald { color: #059669; }
.flows-edit-dropdown-tone--amber { color: #d97706; }
.flows-edit-dropdown-tone--rose { color: #e11d48; }
.flows-edit-dropdown-tone--violet { color: #7c3aed; }

.flows-edit-color--indigo { --flow-edit-color: #818cf8; }
.flows-edit-color--violet { --flow-edit-color: #a78bfa; }
.flows-edit-color--fuchsia { --flow-edit-color: #e879f9; }
.flows-edit-color--rose { --flow-edit-color: #fb7185; }
.flows-edit-color--orange { --flow-edit-color: #fb923c; }
.flows-edit-color--amber { --flow-edit-color: #fbbf24; }
.flows-edit-color--lime { --flow-edit-color: #a3e635; }
.flows-edit-color--emerald { --flow-edit-color: #34d399; }
.flows-edit-color--teal { --flow-edit-color: #2dd4bf; }
.flows-edit-color--cyan { --flow-edit-color: #22d3ee; }
.flows-edit-color--blue { --flow-edit-color: #60a5fa; }
.flows-edit-color--slate { --flow-edit-color: #94a3b8; }
.flows-edit-color--indigo span { background: #818cf8; }
.flows-edit-color--violet span { background: #a78bfa; }
.flows-edit-color--fuchsia span { background: #e879f9; }
.flows-edit-color--rose span { background: #fb7185; }
.flows-edit-color--orange span { background: #fb923c; }
.flows-edit-color--amber span { background: #fbbf24; }
.flows-edit-color--lime span { background: #a3e635; }
.flows-edit-color--emerald span { background: #34d399; }
.flows-edit-color--teal span { background: #2dd4bf; }
.flows-edit-color--cyan span { background: #22d3ee; }
.flows-edit-color--blue span { background: #60a5fa; }
.flows-edit-color--slate span { background: #94a3b8; }

.flows-edit-error {
  margin: 0;
  border-radius: 10px;
  background: #fff1f2;
  color: #be123c;
  font-size: 13px;
  font-weight: 650;
  padding: 10px 12px;
}


@media (min-width: 768px) {
  .flows-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .flows-header-title-block {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
}

@media (max-width: 640px) {
  #flows-root {
    --flows-column-expanded-width: 272px;
  }

  .flows-body {
    padding: 12px 12px 16px;
  }

  .flows-edit-field-grid {
    grid-template-columns: 1fr;
  }
}
`;

export function ensureFlowsStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = FLOWS_STYLES;
  document.head.appendChild(style);
}
