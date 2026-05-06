const STYLE_ID = 'focus-board-styles';

const FOCUS_BOARD_STYLES = `
#focus-board-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  color: #334155;
  font-family: "Poppins", "Inter", "Segoe UI", "Roboto", "Arial", sans-serif;
}

#focus-board-root .custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 6px;
}

#focus-board-root .custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

#focus-board-root .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.fb-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fb-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  padding: 24px 28px 18px;
  flex-shrink: 0;
}

.fb-goal-surface {
  flex: 1 1 18rem;
  max-width: min(34rem, 48vw);
}

.fb-wallpaper-surface {
  margin-left: auto;
}

.fb-primary-btn,
.fb-primary-btn-small,
.fb-habit-stack,
.fb-sheet-habit-row {
  font: inherit;
  border: 0;
  outline: none;
  cursor: pointer;
}

.fb-btn-icon {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
}

.fb-habit-stack:hover {
  color: #0f172a;
}

.fb-board-main {
  flex: 1;
  min-height: 0;
  padding: 0;
}

.fb-empty-cycle-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.fb-empty-cycle-kicker {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-empty-cycle-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #0f172a;
}

.fb-empty-cycle-text {
  margin: 0;
  max-width: 44ch;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
}

.fb-board-scroll {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 22px 22px;
}

.fb-board-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: max-content;
  min-width: 100%;
  height: 100%;
}

.fb-day-column {
  width: 340px;
  min-width: 340px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.88);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.fb-day-column[data-today="false"] {
  background: rgba(248, 250, 252, 0.72);
  border-color: rgba(226, 232, 240, 0.92);
  box-shadow: none;
}

.fb-day-column[data-today="true"] {
  border-color: rgba(165, 180, 252, 0.9);
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.14);
}

.fb-day-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 4px 0;
}

.fb-day-kicker {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-day-date {
  margin: 6px 0 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #64748b;
}

.fb-day-goal-wrap {
  padding: 0 4px;
}

.fb-day-goal-wrap textarea {
  resize: none;
}

.fb-habit-stack {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 4px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid transparent;
  transition: background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease,
    color 140ms ease;
}

.fb-habit-stack:hover {
  background: #ffffff;
  border-color: rgba(226, 232, 240, 0.92);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.fb-habit-stack-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.fb-habit-stack-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-habit-stack-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fb-habit-stack-icons {
  display: flex;
  align-items: center;
}

.fb-habit-mini {
  width: 26px;
  height: 26px;
  margin-right: -6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid #ffffff;
  background: rgba(203, 213, 225, 0.72);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
}

.fb-habit-mini[data-checked="true"] {
  background: var(--habit-accent);
}

.fb-habit-stack-stats {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.fb-chevron {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

.fb-focus-zone {
  min-height: 0;
}

.fb-task-list {
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  padding: 0 4px 2px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: background-color 140ms ease, border-color 140ms ease;
}

.fb-day-footer {
  padding: 0 4px 2px;
}

.fb-task-list[data-drag-over="true"],
.fb-backlog-list[data-drag-over="true"] {
  background: rgba(241, 245, 249, 0.92);
  box-shadow: inset 0 0 0 1px rgba(165, 180, 252, 0.9);
}

.fb-column-hint,
.fb-empty-state {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #94a3b8;
}

.fb-task-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.88);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: none;
  cursor: grab;
  transition: opacity 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}

.fb-task-card[data-dragging="true"] {
  opacity: 0.45;
}

.fb-task-card-focus {
  margin: 0 4px;
  border-color: rgba(165, 180, 252, 0.92);
  background: rgba(238, 242, 255, 0.72);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.fb-task-card-done .fb-task-text {
  color: #cbd5e1;
  text-decoration: line-through;
}

.fb-task-toggle-slot {
  flex-shrink: 0;
  display: inline-flex;
  margin-top: 1px;
}

.fb-task-checkbox {
  flex-shrink: 0;
  margin-top: 1px;
}

.fb-task-content {
  min-width: 0;
  flex: 1;
}

.fb-task-label {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-task-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #334155;
  font-weight: 500;
}

.fb-backlog-backdrop,
.fb-modal-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.32);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.fb-backlog-backdrop[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
}

.fb-backlog-sidebar {
  position: absolute;
  inset: 0 0 0 auto;
  width: 320px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-left: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow: -24px 0 48px rgba(15, 23, 42, 0.16);
  transform: translateX(100%);
  transition: transform 220ms ease;
  z-index: 12;
}

.fb-backlog-sidebar[data-open="true"] {
  transform: translateX(0);
}

.fb-side-header,
.fb-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(241, 245, 249, 0.96);
}

.fb-side-title,
.fb-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.fb-side-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.fb-side-subtitle,
.fb-modal-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #94a3b8;
}

.fb-backlog-list {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fb-backlog-search {
  padding: 14px 16px 0;
}

.fb-backlog-footer {
  padding: 16px;
  border-top: 1px solid rgba(241, 245, 249, 0.96);
  background: rgba(248, 250, 252, 0.68);
}

.fb-task-picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fb-task-picker-filters {
  padding: 0 24px 8px;
}

.fb-task-picker-filter-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.fb-modal-overlay,
.fb-sheet-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
  z-index: 20;
}

.fb-modal-overlay[data-open="true"],
.fb-sheet-overlay[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
}

.fb-modal-overlay[data-open="true"] .fb-modal-backdrop,
.fb-sheet-overlay[data-open="true"] .fb-modal-backdrop {
  opacity: 1;
  pointer-events: auto;
}

.fb-modal-card {
  position: relative;
  z-index: 1;
  width: min(100%, 560px);
  max-height: min(86vh, 760px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 32px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
}

.fb-goal-modal {
  max-width: 620px;
}

.fb-modal-body {
  padding: 24px;
  overflow-y: auto;
}

.fb-modal-footer {
  padding: 20px 24px 24px;
  border-top: 1px solid rgba(241, 245, 249, 0.96);
  background: rgba(248, 250, 252, 0.7);
}

.fb-field-label {
  display: block;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-cycle-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fb-cycle-chip {
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.fb-cycle-chip[data-active="true"] {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(79, 70, 229, 0.22);
}

.fb-primary-btn,
.fb-primary-btn-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #4f46e5;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 16px 28px rgba(79, 70, 229, 0.22);
}

.fb-primary-btn {
  width: 100%;
  min-height: 52px;
  padding: 0 20px;
}

.fb-primary-btn-small {
  width: 48px;
  min-width: 48px;
  min-height: 48px;
}

.fb-sheet-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(42vh, 420px);
  overflow-y: auto;
}

.fb-sheet-habit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(241, 245, 249, 0.98);
}

.fb-sheet-habit-row {
  justify-content: flex-start;
  width: 100%;
  background: transparent;
}

.fb-habit-badge {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--habit-accent);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
}

.fb-habit-text {
  min-width: 0;
  font-size: 14px;
  line-height: 1.4;
  color: #334155;
  font-weight: 600;
}

.fb-sheet-overlay {
  align-items: flex-end;
  padding: 0;
}

.fb-habit-sheet {
  position: relative;
  z-index: 1;
  width: min(100%, 720px);
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  border-radius: 32px 32px 0 0;
  background: #ffffff;
  box-shadow: 0 -18px 48px rgba(15, 23, 42, 0.24);
  transform: translateY(100%);
  transition: transform 240ms ease;
}

.fb-habit-sheet[data-open="true"] {
  transform: translateY(0);
}

.fb-sheet-handle {
  width: 52px;
  height: 5px;
  border-radius: 999px;
  background: #e2e8f0;
  margin: 12px auto 0;
}

.fb-sheet-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
}

.fb-sheet-check[data-checked="true"] {
  background: #4f46e5;
  border-color: #4f46e5;
}

@media (max-width: 920px) {
  .fb-header {
    flex-wrap: wrap;
    padding: 18px 16px 14px;
  }

  .fb-goal-surface {
    flex: 1 1 100%;
    order: 3;
    max-width: none;
  }

  .fb-wallpaper-surface {
    margin-left: 0;
  }

  .fb-board-main {
    padding: 0;
  }

  .fb-board-scroll {
    padding: 8px 12px 16px;
  }

  .fb-day-column {
    width: 304px;
    min-width: 304px;
  }

  .fb-modal-overlay {
    padding: 12px;
  }

  .fb-backlog-sidebar {
    width: min(100%, 320px);
  }

  .fb-task-picker-filter-grid {
    grid-template-columns: 1fr;
  }
}
`;

export function ensureFocusBoardStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = FOCUS_BOARD_STYLES;
  document.head.appendChild(style);
}
