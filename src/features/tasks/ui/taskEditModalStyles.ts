const STYLE_ID = 'task-edit-modal-styles';

const TASK_EDIT_MODAL_STYLES = `
.task-edit-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 4px;
}

.task-edit-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.task-edit-modal-input,
.task-edit-modal-textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-size: 16px;
  line-height: 1.45;
  outline: none;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.task-edit-modal-input {
  min-height: 42px;
  padding: 9px 12px;
}

.task-edit-modal-textarea {
  min-height: 110px;
  max-height: 260px;
  padding: 10px 12px;
  resize: vertical;
}

.task-edit-modal-input:focus,
.task-edit-modal-textarea:focus {
  border-color: #cbd5e1;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.22);
}

.task-edit-modal-input:disabled,
.task-edit-modal-textarea:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.task-edit-modal-message {
  border-radius: 10px;
  background: #fff1f2;
  color: #be123c;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  padding: 10px 12px;
}

.task-edit-modal-relation-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.task-edit-modal-relation-clear {
  height: 42px;
  width: 42px;
}

@media (min-width: 768px) {
  .task-edit-modal-input,
  .task-edit-modal-textarea {
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .task-edit-modal-grid {
    grid-template-columns: 1fr;
  }
}
`;

export function ensureTaskEditModalStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = TASK_EDIT_MODAL_STYLES;
  document.head.appendChild(style);
}
