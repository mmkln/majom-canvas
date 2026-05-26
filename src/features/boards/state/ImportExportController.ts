import type {
  BoardsExchangeFormat,
  BoardsExchangeScope,
  BoardsExportRequest,
  BoardsExportResult,
  BoardsImportApplyResult,
  BoardsImportPlan,
  BoardsImportPolicies,
  BoardsImportRequest,
  BoardsImportTarget,
} from '../exchange/schema.ts';
import { createDefaultBoardsImportPolicies } from '../exchange/schema.ts';
import type { BoardsCommandResult } from '../domain/types.ts';

export type ImportModalMode = 'edit' | 'review';
export type ImportExportOperation = 'idle' | 'previewing' | 'applying';
export type ImportStatusOverride = {
  messageKey: string;
  tone: 'error' | 'info' | 'success' | 'warning';
};

export type ImportWorkflowState = {
  scope: BoardsExchangeScope;
  target?: BoardsImportTarget;
  source: string;
  format: BoardsExchangeFormat;
  policies: BoardsImportPolicies;
  lastPreviewRequest: BoardsImportRequest | null;
  lastPreviewPlan: BoardsImportPlan | null;
  hasCompletedPreview: boolean;
  mode: ImportModalMode;
  operation: ImportExportOperation;
  statusOverride: ImportStatusOverride | null;
};

export type ExportWorkflowState = {
  operation: 'idle' | 'exporting';
  result: BoardsExportResult | null;
  error: string | null;
};

export type ImportExportPorts = {
  previewImport: (request: BoardsImportRequest) => Promise<BoardsImportPlan>;
  applyImport: (
    request: BoardsImportRequest
  ) => Promise<BoardsCommandResult<BoardsImportApplyResult | null>>;
  exportData: (
    request: BoardsExportRequest
  ) => Promise<BoardsExportResult | null>;
};

export class ImportExportController {
  private importState: ImportWorkflowState | null = null;
  private exportState: ExportWorkflowState = {
    operation: 'idle',
    result: null,
    error: null,
  };

  constructor(private readonly ports: ImportExportPorts) {}

  public get importSnapshot(): ImportWorkflowState | null {
    return this.importState ? cloneImportState(this.importState) : null;
  }

  public get exportSnapshot(): ExportWorkflowState {
    return { ...this.exportState };
  }

  public openImport(config: {
    scope: BoardsExchangeScope;
    target?: BoardsImportTarget;
  }): ImportWorkflowState {
    this.importState = {
      scope: config.scope,
      target: config.target,
      source: '',
      format: 'markdown',
      policies: {
        ...createDefaultBoardsImportPolicies(),
        mode: 'create',
      },
      lastPreviewRequest: null,
      lastPreviewPlan: null,
      hasCompletedPreview: false,
      mode: 'edit',
      operation: 'idle',
      statusOverride: null,
    };
    return cloneImportState(this.importState);
  }

  public closeImport(): void {
    this.importState = null;
  }

  public setImportSource(source: string): ImportWorkflowState | null {
    const state = this.importState;
    if (!state) return null;
    state.source = source;
    this.invalidatePreview(state);
    return cloneImportState(state);
  }

  public setImportFormat(
    format: BoardsExchangeFormat
  ): ImportWorkflowState | null {
    const state = this.importState;
    if (!state) return null;
    state.format = format;
    this.invalidatePreview(state);
    return cloneImportState(state);
  }

  public setImportPolicy<TKey extends keyof BoardsImportPolicies>(
    key: TKey,
    value: BoardsImportPolicies[TKey]
  ): ImportWorkflowState | null {
    const state = this.importState;
    if (!state) return null;
    state.policies[key] = value;
    this.invalidatePreview(state);
    return cloneImportState(state);
  }

  public showImportEdit(): ImportWorkflowState | null {
    const state = this.importState;
    if (!state) return null;
    state.mode = 'edit';
    return cloneImportState(state);
  }

  public async previewImport(): Promise<BoardsImportPlan | null> {
    const state = this.importState;
    if (!state) return null;
    const request = this.createPreviewRequest(state);
    if (!request) return null;

    state.operation = 'previewing';
    state.statusOverride = null;
    try {
      const plan = await this.ports.previewImport(request);
      state.lastPreviewRequest = request;
      state.lastPreviewPlan = plan;
      state.hasCompletedPreview = true;
      state.mode = 'review';
      state.statusOverride = null;
      return plan;
    } catch {
      state.lastPreviewRequest = null;
      state.lastPreviewPlan = null;
      state.statusOverride = {
        messageKey: 'boards.import.previewFailed',
        tone: 'error',
      };
      return null;
    } finally {
      state.operation = 'idle';
    }
  }

  public async applyImport(): Promise<'applied' | 'failed' | 'ignored'> {
    const state = this.importState;
    if (!state?.lastPreviewRequest || !state.lastPreviewPlan?.canApply) {
      return 'ignored';
    }
    if (state.lastPreviewRequest.policies.mode !== 'create') return 'ignored';

    state.operation = 'applying';
    state.statusOverride = null;
    try {
      const result = await this.ports.applyImport(state.lastPreviewRequest);
      if (!result.ok || !result.data) {
        state.statusOverride = {
          messageKey: 'boards.import.applyFailed',
          tone: 'error',
        };
        return 'failed';
      }
      this.closeImport();
      return 'applied';
    } catch {
      state.statusOverride = {
        messageKey: 'boards.import.applyFailed',
        tone: 'error',
      };
      return 'failed';
    } finally {
      if (this.importState === state) state.operation = 'idle';
    }
  }

  public async exportData(
    request: BoardsExportRequest
  ): Promise<BoardsExportResult | null> {
    this.exportState = {
      operation: 'exporting',
      result: null,
      error: null,
    };
    try {
      const result = await this.ports.exportData(request);
      this.exportState = {
        operation: 'idle',
        result,
        error: result ? null : 'boards.export.failed',
      };
      return result;
    } catch {
      this.exportState = {
        operation: 'idle',
        result: null,
        error: 'boards.export.failed',
      };
      return null;
    }
  }

  public clearExport(): void {
    this.exportState = {
      operation: 'idle',
      result: null,
      error: null,
    };
  }

  private createPreviewRequest(
    state: ImportWorkflowState
  ): BoardsImportRequest | null {
    const raw = state.source.trim();
    if (!raw) return null;
    return {
      raw,
      format: state.format,
      scope: state.scope,
      target: state.target,
      policies: { ...state.policies },
    };
  }

  private invalidatePreview(state: ImportWorkflowState): void {
    state.lastPreviewRequest = null;
    state.lastPreviewPlan = null;
    state.statusOverride = null;
  }
}

function cloneImportState(state: ImportWorkflowState): ImportWorkflowState {
  return {
    ...state,
    target: state.target ? { ...state.target } : undefined,
    policies: { ...state.policies },
    lastPreviewRequest: state.lastPreviewRequest
      ? {
          ...state.lastPreviewRequest,
          target: state.lastPreviewRequest.target
            ? { ...state.lastPreviewRequest.target }
            : undefined,
          policies: { ...state.lastPreviewRequest.policies },
        }
      : null,
  };
}
