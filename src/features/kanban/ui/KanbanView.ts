import type {
  KanbanBoardState,
  KanbanColumnId,
  KanbanColumnState,
} from '../types.ts';
import { KANBAN_COLUMN_ORDER } from '../domain/constants.ts';
import { renderKanbanColumn } from './components/KanbanColumn.ts';
import type { KanbanViewHandlers } from './components/types.ts';
import { ensureKanbanStyles } from './kanbanStyles.ts';

const COLLAPSED_COLUMNS_STORAGE_KEY = 'kanban-collapsed-columns';
const VALID_COLUMN_IDS = new Set<KanbanColumnId>(KANBAN_COLUMN_ORDER);

export class KanbanView {
  private readonly root: HTMLDivElement;
  private readonly boardEl: HTMLDivElement;
  private readonly collapsedColumns = new Set<KanbanColumnId>();
  private readonly completedHabitsCollapsed = new Set<KanbanColumnId>([
    'today',
  ]);
  private state: KanbanBoardState = {
    columns: [],
    loading: false,
    error: null,
    updatedAt: null,
  };

  constructor(
    parent: HTMLElement,
    private readonly handlers: KanbanViewHandlers
  ) {
    ensureKanbanStyles();
    this.root = document.createElement('div');
    this.root.id = 'kanban-root';

    const shell = document.createElement('div');
    shell.className = 'kb-shell';

    const boardScroll = document.createElement('div');
    boardScroll.className = 'kb-board-scroll';
    this.boardEl = document.createElement('div');
    this.boardEl.className = 'kb-board';
    boardScroll.appendChild(this.boardEl);

    shell.append(boardScroll);
    this.root.appendChild(shell);
    parent.appendChild(this.root);

    this.restoreCollapsedColumns();
  }

  public render(state: KanbanBoardState): void {
    this.state = state;
    this.renderColumns(state.columns);
  }

  public destroy(): void {
    this.root.remove();
  }

  private renderColumns(columns: KanbanColumnState[]): void {
    this.pruneCollapsedColumns(columns);
    this.boardEl.replaceChildren();
    columns.forEach((column) => {
      this.boardEl.appendChild(
        renderKanbanColumn(column, {
          handlers: this.handlers,
          collapsedColumns: this.collapsedColumns,
          completedHabitsCollapsed: this.completedHabitsCollapsed,
          onColumnCollapseToggle: (columnId) => this.toggleColumnCollapse(columnId),
          onLocalStateChange: () => this.render(this.state),
        })
      );
    });
  }

  private toggleColumnCollapse(columnId: KanbanColumnId): void {
    if (this.collapsedColumns.has(columnId)) {
      this.collapsedColumns.delete(columnId);
    } else {
      this.collapsedColumns.add(columnId);
    }
    this.persistCollapsedColumns();
    this.render(this.state);
  }

  private restoreCollapsedColumns(): void {
    try {
      const raw = localStorage.getItem(COLLAPSED_COLUMNS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      parsed.forEach((value) => {
        if (typeof value !== 'string') return;
        if (!VALID_COLUMN_IDS.has(value as KanbanColumnId)) return;
        this.collapsedColumns.add(value as KanbanColumnId);
      });
    } catch {
      // no-op
    }
  }

  private persistCollapsedColumns(): void {
    try {
      const serialized = JSON.stringify(Array.from(this.collapsedColumns));
      localStorage.setItem(COLLAPSED_COLUMNS_STORAGE_KEY, serialized);
    } catch {
      // no-op
    }
  }

  private pruneCollapsedColumns(columns: KanbanColumnState[]): void {
    const currentIds = new Set<KanbanColumnId>(columns.map((column) => column.id));
    let changed = false;
    this.collapsedColumns.forEach((columnId) => {
      if (currentIds.has(columnId)) return;
      this.collapsedColumns.delete(columnId);
      changed = true;
    });
    if (changed) {
      this.persistCollapsedColumns();
    }
  }
}
