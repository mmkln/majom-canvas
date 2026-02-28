const STYLE_ID = 'kanban-board-styles';

const STYLES = `
#kanban-root {
  --kb-bg-1: #eef5ff;
  --kb-bg-2: #f8fafc;
  --kb-panel: rgba(255, 255, 255, 0.82);
  --kb-border: rgba(148, 163, 184, 0.28);
  --kb-text: #0f172a;
  --kb-muted: #64748b;
  --kb-accent: #2563eb;
  --kb-success: #059669;
  --kb-warn: #ea580c;
  --kb-danger: #dc2626;
  --kb-column-text: #4b5563;
  --kb-header-text: #0f172a;
  --kb-header-bg: rgba(243, 244, 246, 0.86);
  --kb-header-border: rgba(148, 163, 184, 0.28);
  --kb-header-toggle-hover: rgba(15, 23, 42, 0.08);
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  color: var(--kb-text);
  font-family: Poppins, sans-serif;
}

.kb-shell {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
}

.kb-button {
  border: 1px solid var(--kb-border);
  background: #ffffff;
  color: var(--kb-text);
  border-radius: 10px;
  padding: 0 12px;
  height: 32px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.kb-button:hover {
  background: #f8fafc;
}

.kb-board-scroll {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.kb-board {
  display: flex;
  gap: 24px;
  min-width: max-content;
  height: 100%;
  padding: 16px 16px 0;
  box-sizing: border-box;
  align-items: flex-start;
}

/* Utility class replicas from the source Kanban column template */
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.sticky {
  position: sticky;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}

.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.justify-center {
  justify-content: center;
}

.gap-2 {
  gap: 0.5rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.pt-8 {
  padding-top: 2rem;
}

.w-\\[17\\.5rem\\] {
  width: 17.5rem;
}

.w-\\[calc\\(100%-28px\\)\\] {
  width: calc(100% - 28px);
}

.h-4 {
  height: 1rem;
}

.h-9 {
  height: 2.25rem;
}

.h-full {
  height: 100%;
}

.z-10 {
  z-index: 10;
}

.z-\\[-1\\] {
  z-index: -1;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.rounded-full {
  border-radius: 9999px;
}

.rounded-\\[1\\.3rem\\] {
  border-radius: 1.3rem;
}

.mx-3\\.5 {
  margin-left: 0.875rem;
  margin-right: 0.875rem;
}

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}

.text-black {
  color: #000;
}

.text-gray-600 {
  color: #4b5563;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

.backdrop-blur-lg {
  backdrop-filter: blur(16px);
}

.kb-column {
  isolation: isolate;
  min-width: 17.5rem;
  display: flex;
  flex-direction: column;
}

.kb-column.kb-column-collapsed {
  width: 42px;
  min-width: 42px;
}

.kb-column-header-wrap {
  top: 0;
}

.kb-column-header-wrap-collapsed {
  width: 42px;
  height: auto;
  position: static;
}

.kb-column-header {
  color: inherit;
}

.kb-column-header-collapsed {
  width: 42px;
  height: auto;
  padding: 1rem 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.advanced-glass-effect {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
  );
  backdrop-filter: blur(10px) brightness(1.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.advanced-glass-effect::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 3s infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(0, 0);
  }
}

.kb-column-title {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
}

.kb-column-actions {
}

.kb-column-actions-collapsed {
  width: 100%;
  justify-content: center;
}

.kb-column-count {
  line-height: 1;
}

.kb-column-title-vertical {
  display: inline-flex;
  align-items: center;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

.kb-header-toggle {
  border: none;
  background: transparent;
  color: inherit;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.kb-header-toggle:hover {
  background: var(--kb-header-toggle-hover);
}

.kb-header-toggle:disabled {
  opacity: 0.45;
  cursor: default;
}

.kb-header-toggle svg {
  width: 16px;
  height: 16px;
}

.kb-column-collapse-toggle {
  flex: 0 0 auto;
}

.kb-column-body {
  position: relative;
  z-index: 1;
}

.column {
  max-height: calc(100vh - 47px);
}

.kb-column-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kb-column-backdrop {
  inset: 0;
}

.kb-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--kb-muted);
}

.kb-stack {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.kb-event {
  border: 1px solid rgba(37, 99, 235, 0.3);
  background: rgba(37, 99, 235, 0.08);
  border-radius: 12px;
  padding: 8px 10px;
}

.kb-event-title {
  font-size: 12px;
  font-weight: 600;
}

.kb-event-time {
  margin-top: 2px;
  font-size: 11px;
  color: #1d4ed8;
}

.kb-story-group {
  background: rgba(255, 255, 255, 0.75);
  border-radius: 0.5rem;
  padding: 0.25rem;
  backdrop-filter: blur(24px);
}

.kb-story-header {
  min-height: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  color: #717070;
}

.kb-story-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1rem;
  color: inherit;
}

.kb-story-header-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.kb-story-meta {
  font-size: 0.75rem;
  line-height: 1rem;
  color: inherit;
}

.kb-story-toggle {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(148, 163, 184, 0.14);
  color: #6b7280;
  border-radius: 8px;
  height: 20px;
  width: 20px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.kb-story-toggle:hover {
  background: rgba(148, 163, 184, 0.24);
}

.kb-story-toggle svg {
  width: 14px;
  height: 14px;
}

.kb-story-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.kb-card {
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 0.375rem;
  padding: 0.875rem 0.75rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
  transition: box-shadow 120ms ease;
}

.kb-card:hover {
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
}

.kb-card-status-completed {
  border-color: rgba(5, 150, 105, 0.35);
  background: #ffffff;
}

.kb-card-status-active {
  border-color: rgba(37, 99, 235, 0.3);
  background: #ffffff;
}

.kb-card-status-cancelled {
  border-color: rgba(234, 179, 8, 0.38);
  background: #ffffff;
}

.kb-card-status-overdue-today {
  border-color: rgba(234, 179, 8, 0.42);
  background: #ffffff;
}

.kb-card-status-overdue-past {
  border-color: rgba(220, 38, 38, 0.4);
  background: #ffffff;
}

.kb-card-status-default {
  border-color: rgba(148, 163, 184, 0.3);
  background: #ffffff;
}

.kb-task-meta-row,
.kb-task-title-row {
  padding-bottom: 0.5rem;
}

.kb-task-status-top-row {
  display: flex;
  justify-content: flex-start;
  padding-bottom: 0.5rem;
}

.kb-task-meta-list {
  font-size: 11px;
  color: var(--kb-muted);
}

.kb-task-controls-row {
  min-height: 1.25rem;
}

.kb-task-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kb-title-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 6px;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: inherit;
  background: transparent;
}

.kb-title-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  background: rgba(255, 255, 255, 0.75);
  padding: 0 4px;
}

.kb-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.kb-select {
  border: 1px solid var(--kb-border);
  background: rgba(255, 255, 255, 0.82);
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.1;
  padding: 2px 6px;
  height: 20px;
  min-width: 0;
  color: var(--kb-text);
}

.kb-select {
  flex: 0 1 auto;
}

.kb-date-selector {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0;
  gap: 3px;
  width: 38px;
  height: 15px;
  flex: none;
  order: 2;
  flex-grow: 0;
}

.kb-date-label {
  display: flex;
  align-items: center;
  width: 38px;
  height: 15px;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 15px;
  color: #8f9295;
  white-space: nowrap;
  flex: none;
  order: 1;
  flex-grow: 0;
  pointer-events: none;
}

.kb-date-day {
  text-decoration-line: underline;
}

.kb-date-month {
  text-decoration-line: none;
}

.kb-date-label:focus-visible {
  outline: none;
}

.kb-date-input {
  position: absolute;
  inset: 0;
  z-index: 2;
  opacity: 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
}

.kb-card-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.kb-link-open {
  color: var(--kb-accent);
}

.kb-card-secondary-actions {
  display: none;
  gap: 6px;
}

.kb-card:hover .kb-card-secondary-actions {
  display: flex;
}

.kb-link {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  color: inherit;
}

.kb-link-muted {
  color: var(--kb-muted);
}

.kb-link-muted:hover {
  color: var(--kb-text);
}

.kb-task-subtasks {
  margin-top: 0.5rem;
}

.kb-task-subtasks-label {
  font-size: 10px;
  color: var(--kb-muted);
}

.kb-task-subtasks-bar {
  margin-top: 4px;
  height: 4px;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.25);
  overflow: hidden;
}

.kb-task-subtasks-fill {
  height: 100%;
  border-radius: inherit;
  background: rgba(37, 99, 235, 0.6);
}

.kb-habit-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 0.5rem;
  padding: 0.25rem;
  backdrop-filter: blur(24px);
}

.kb-habit-list.is-loading {
  opacity: 0.7;
  pointer-events: none;
}

.kb-habit-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: #717070;
}

.kb-habit-header-title {
  margin: 0;
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1rem;
}

.kb-habit-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.kb-habit-row-due {
  position: relative;
  background: #fdfdfd;
}

.kb-habit-row.done {
  opacity: 0.7;
}

.kb-habit-completed-toggle {
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #4b5563;
  font-size: 12px;
  line-height: 1rem;
  cursor: pointer;
  padding: 0.375rem 0.5rem;
}

.kb-habit-completed-toggle svg {
  width: 14px;
  height: 14px;
}

.kb-habit-title {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--kb-text);
}

.kb-habit-title-due {
  display: inline-flex;
  align-items: baseline;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.kb-habit-title:focus {
  outline: none;
}

.kb-empty {
  font-size: 12px;
  color: var(--kb-muted);
  border: 1px dashed var(--kb-border);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
}

`;

export function ensureKanbanStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}
