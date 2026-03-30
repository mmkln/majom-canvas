import type { Observable, Subscription } from 'rxjs';
import type { Goal, Tag } from '../../../../majom-wrapper/interfaces/index.ts';
import {
  ExistingEntityPicker,
  type ExistingEntityPickerControlsApi,
  type ExistingEntityPickerOpenOptions,
  type ExistingPickerPage,
} from './ExistingEntityPicker.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
import { TasksApiService } from '../../../../majom-wrapper/data-access/tasks-api-service.ts';
import { HttpInterceptorClient } from '../../../../majom-wrapper/data-access/http-interceptor.js';
import { environment } from '../../../../config/environment.ts';
import { createIconButton, createTextButton } from '../primitives/index.ts';
import { createIcon } from '../../../../ui-lib/src/hud/icons.ts';
import { ExistingGoalPickerQueryModel } from './ExistingGoalPickerQueryModel.ts';

type ExistingGoalPickerLoadParams = {
  term: string;
  page: number;
  pageSize: number;
  tagIds: number[];
};

export class ExistingGoalPicker {
  private readonly picker: ExistingEntityPicker<'existing-goal', Goal>;
  private readonly tasksApi = new TasksApiService(
    new HttpInterceptorClient(environment.apiUrl)
  );
  private readonly queryModel = new ExistingGoalPickerQueryModel();
  private tagLoadSubscription: Subscription | null = null;
  private searchDebounce: number | null = null;

  constructor(
    loadGoalsPage: (
      params: ExistingGoalPickerLoadParams
    ) => Observable<ExistingPickerPage<Goal>>,
    pageSize: number = 30,
    runtime: AppRuntime = createAppRuntime()
  ) {
    this.picker = new ExistingEntityPicker<'existing-goal', Goal>(
      (term, page, nextPageSize) =>
        loadGoalsPage({
          term,
          page,
          pageSize: nextPageSize,
          tagIds: this.queryModel.getRequest().tagIds,
        }),
      {
        dragKind: 'existing-goal',
        searchMode: 'external',
        getTitle: (goal) => goal.title || '',
        getDescription: (goal) => goal.description,
        getStatus: (goal) => goal.status,
        getPriority: (goal) => goal.priority,
        getUpdatedAt: (goal) =>
          (goal as Goal & { updated_at?: unknown }).updated_at,
        getEmptyState: () => this.getEmptyState(runtime),
        getLoadErrorState: () => this.getLoadErrorState(runtime),
        onOpenControls: (api) => this.mountQuerySurface(api),
      },
      pageSize,
      runtime
    );
  }

  public open(options: ExistingEntityPickerOpenOptions<Goal>): void {
    this.picker.open(options);
  }

  public close(): void {
    this.picker.close();
  }

  private mountQuerySurface(
    api: ExistingEntityPickerControlsApi<Goal>
  ): () => void {
    this.queryModel.reset();
    this.queryModel.startTagLoading();

    const root = document.createElement('div');
    root.className = 'flex flex-col gap-2';
    root.dataset.role = 'goal-picker-query-root';

    const querySurface = document.createElement('div');
    querySurface.className =
      'rounded-[1.125rem] border border-slate-200 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
    querySurface.dataset.role = 'goal-picker-query-surface';

    const queryRow = document.createElement('div');
    queryRow.className = 'flex flex-wrap items-center gap-2';

    const searchIcon = document.createElement('span');
    searchIcon.className =
      'inline-flex shrink-0 items-center justify-center text-slate-400';
    searchIcon.dataset.role = 'goal-picker-query-search-icon';
    searchIcon.setAttribute('aria-hidden', 'true');
    searchIcon.appendChild(
      createIcon('magnifying-glass', { size: 15, strokeWidth: 1.9 })
    );

    const tokenWrap = document.createElement('div');
    tokenWrap.className = 'flex flex-wrap items-center gap-2';
    tokenWrap.dataset.role = 'goal-picker-query-tokens';

    const queryInput = document.createElement('input');
    queryInput.type = 'text';
    queryInput.className =
      'min-w-[10rem] flex-1 border-0 bg-transparent px-0 py-1 text-[14px] text-slate-900 outline-none placeholder:text-slate-400';
    queryInput.placeholder = api.runtime.i18n.t(
      'existingPicker.goalSearchOmniboxPlaceholder'
    );
    queryInput.autocomplete = 'off';
    queryInput.spellcheck = false;
    queryInput.dataset.role = 'goal-picker-query-input';

    const clearAllButton = createIconButton({
      icon: 'x-mark',
      size: 'sm',
      tone: 'text',
      className: 'hidden shrink-0',
      title: api.runtime.i18n.t('existingPicker.goalQueryClearAll'),
      ariaLabel: api.runtime.i18n.t('existingPicker.goalQueryClearAll'),
      onClick: () => {
        const request = this.queryModel.clearAll();
        this.clearSearchDebounce();
        queryInput.value = request.term;
        api.reload({ term: request.term });
        render();
        queryInput.focus();
      },
    });
    clearAllButton.dataset.role = 'goal-picker-query-clear-all';

    queryRow.append(searchIcon, tokenWrap, queryInput, clearAllButton);
    querySurface.appendChild(queryRow);

    const helperText = document.createElement('div');
    helperText.className = 'mt-2 hidden text-[11px] text-slate-500';
    helperText.dataset.role = 'goal-picker-query-helper';

    const summaryRow = document.createElement('div');
    summaryRow.className = 'hidden items-center justify-between gap-3 px-1';
    summaryRow.dataset.role = 'goal-picker-query-summary';

    const summaryLabel = document.createElement('div');
    summaryLabel.className = 'min-w-0 flex-1 text-[12px] font-medium text-slate-600';
    summaryLabel.dataset.role = 'goal-picker-query-summary-label';

    const summaryActions = document.createElement('div');
    summaryActions.className = 'flex shrink-0 items-center gap-2';
    summaryActions.dataset.role = 'goal-picker-query-summary-actions';

    summaryRow.append(summaryLabel, summaryActions);

    const suggestionsPanel = document.createElement('div');
    suggestionsPanel.className =
      'hidden overflow-hidden rounded-[1rem] border border-slate-200/80 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.06)]';
    suggestionsPanel.dataset.role = 'goal-picker-query-suggestions';

    const suggestionsHeader = document.createElement('div');
    suggestionsHeader.className =
      'border-b border-slate-100 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400';
    suggestionsHeader.textContent = api.runtime.i18n.t(
      'existingPicker.goalTagSuggestions'
    );

    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'flex flex-col py-1';
    suggestionsPanel.append(suggestionsHeader, suggestionsList);

    const stateMessage = document.createElement('div');
    stateMessage.className = 'hidden px-1 text-[11px] text-slate-500';
    stateMessage.dataset.role = 'goal-picker-query-state';

    root.append(querySurface, helperText, summaryRow, suggestionsPanel, stateMessage);
    api.controlsHost.appendChild(root);

    const render = (): void => {
      const snapshot = this.queryModel.getSnapshot();

      tokenWrap.innerHTML = '';
      snapshot.selectedTags.forEach((tag) => {
        tokenWrap.appendChild(this.createSelectedTagToken(tag, api.runtime, () => {
          const request = this.queryModel.removeTag(tag.id);
          this.clearSearchDebounce();
          api.reload({ term: request.term });
          render();
          queryInput.focus();
        }));
      });

      queryInput.value = snapshot.inputValue;
      clearAllButton.style.display = snapshot.hasActiveQuery ? '' : 'none';

      const helperMessage = this.getHelperMessage(snapshot, api.runtime);
      helperText.style.display = helperMessage ? 'block' : 'none';
      helperText.textContent = helperMessage;

      const summary = this.getResultSummary(snapshot, api.runtime);
      summaryActions.innerHTML = '';
      if (summary) {
        summaryRow.style.display = 'flex';
        summaryLabel.textContent = summary.label;
        if (summary.canClearText) {
          summaryActions.appendChild(
            createTextButton({
              text: api.runtime.i18n.t('existingPicker.goalSummaryClearText'),
              tone: 'text',
              className:
                'h-auto rounded-full px-0 py-0 text-[11px] font-medium text-slate-500 hover:text-slate-700',
              onClick: () => {
                const request = this.queryModel.clearText();
                this.clearSearchDebounce();
                queryInput.value = request.term;
                api.reload({ term: request.term });
                render();
                queryInput.focus();
              },
            })
          );
        }
        if (summary.canClearTags) {
          summaryActions.appendChild(
            createTextButton({
              text: api.runtime.i18n.t('existingPicker.goalSummaryClearTags'),
              tone: 'text',
              className:
                'h-auto rounded-full px-0 py-0 text-[11px] font-medium text-slate-500 hover:text-slate-700',
              onClick: () => {
                const request = this.queryModel.clearTags();
                this.clearSearchDebounce();
                api.reload({ term: request.term });
                render();
                queryInput.focus();
              },
            })
          );
        }
      } else {
        summaryRow.style.display = 'none';
        summaryLabel.textContent = '';
      }

      suggestionsList.innerHTML = '';
      snapshot.suggestedTags.forEach((tag) => {
        suggestionsList.appendChild(
          this.createSuggestionRow(tag, api.runtime, () => {
            const request = this.queryModel.applySuggestedTag(tag.id);
            this.clearSearchDebounce();
            api.reload({ term: request.term });
            render();
            queryInput.focus();
          })
        );
      });

      suggestionsPanel.style.display =
        snapshot.suggestedTags.length > 0 ? 'block' : 'none';

      stateMessage.style.display = snapshot.tagsLoadFailed ? 'block' : 'none';
      stateMessage.textContent = snapshot.tagsLoadFailed
        ? api.runtime.i18n.t('existingPicker.goalTagLoadFailed')
        : '';
    };

    const commitSearch = (mode: 'auto' | 'explicit' = 'explicit'): void => {
      const request = this.queryModel.commitInput(mode);
      api.reload({ term: request.term });
      render();
    };

    const scheduleSearch = (): void => {
      this.clearSearchDebounce();
      this.searchDebounce = window.setTimeout(() => {
        this.searchDebounce = null;
        commitSearch('auto');
      }, 220);
    };

    const handleInput = (): void => {
      this.queryModel.setInputValue(queryInput.value);
      render();
      scheduleSearch();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.clearSearchDebounce();
        commitSearch('explicit');
      }
    };

    const handleBlur = (): void => {
      const snapshot = this.queryModel.getSnapshot();
      if (snapshot.pendingExactTagId === null) return;
      this.clearSearchDebounce();
      commitSearch('explicit');
    };

    queryInput.addEventListener('input', handleInput);
    queryInput.addEventListener('keydown', handleKeyDown);
    queryInput.addEventListener('blur', handleBlur);

    this.tagLoadSubscription?.unsubscribe();
    this.tagLoadSubscription = this.tasksApi.getTags().subscribe({
      next: (tags) => {
        this.queryModel.resolveTags(tags);
        render();
      },
      error: () => {
        this.queryModel.failTags();
        render();
      },
    });

    render();
    queryInput.focus();

    return () => {
      queryInput.removeEventListener('input', handleInput);
      queryInput.removeEventListener('keydown', handleKeyDown);
      queryInput.removeEventListener('blur', handleBlur);
      this.tagLoadSubscription?.unsubscribe();
      this.tagLoadSubscription = null;
      this.clearSearchDebounce();
      this.queryModel.reset();
      root.remove();
    };
  }

  private createSelectedTagToken(
    tag: Tag,
    runtime: AppRuntime,
    onRemove: () => void
  ): HTMLButtonElement {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className =
      'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100';
    chip.dataset.role = 'goal-picker-query-tag-token';
    chip.dataset.tagId = String(tag.id);
    chip.setAttribute(
      'aria-label',
      runtime.i18n.t('existingPicker.goalTagRemove', { tag: tag.title })
    );
    chip.addEventListener('click', (event) => {
      event.preventDefault();
      onRemove();
    });

    const dot = document.createElement('span');
    dot.className = 'h-2 w-2 rounded-full';
    dot.style.backgroundColor = tag.color;

    const label = document.createElement('span');
    label.textContent = `#${tag.slug}`;

    const remove = document.createElement('span');
    remove.className = 'text-slate-400';
    remove.textContent = 'x';

    chip.append(dot, label, remove);
    return chip;
  }

  private createSuggestionRow(
    tag: Tag,
    runtime: AppRuntime,
    onSelect: () => void
  ): HTMLButtonElement {
    const row = document.createElement('button');
    row.type = 'button';
    row.className =
      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50';
    row.dataset.role = 'goal-picker-query-suggestion';
    row.dataset.tagId = String(tag.id);
    row.setAttribute(
      'aria-label',
      runtime.i18n.t('existingPicker.goalTagApply', { tag: tag.title })
    );
    row.addEventListener('click', (event) => {
      event.preventDefault();
      onSelect();
    });

    const dot = document.createElement('span');
    dot.className = 'mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full';
    dot.style.backgroundColor = tag.color;

    const textWrap = document.createElement('div');
    textWrap.className = 'min-w-0 flex-1';

    const title = document.createElement('div');
    title.className = 'truncate text-[13px] font-medium text-slate-800';
    title.textContent = `#${tag.slug}`;

    const subtitle = document.createElement('div');
    subtitle.className = 'mt-0.5 truncate text-[11px] text-slate-500';
    subtitle.textContent = tag.title;

    const badge = document.createElement('span');
    badge.className =
      'shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.06em] text-slate-500';
    badge.textContent = runtime.i18n.t('existingPicker.goalQueryUseTag');

    textWrap.append(title, subtitle);
    row.append(dot, textWrap, badge);
    return row;
  }

  private getHelperMessage(
    snapshot: ReturnType<ExistingGoalPickerQueryModel['getSnapshot']>,
    runtime: AppRuntime
  ): string {
    if (snapshot.pendingHashQuery && !snapshot.tagsLoading && !snapshot.tagsLoadFailed) {
      if (snapshot.suggestedTags.length === 0) {
        return runtime.i18n.t('existingPicker.goalQueryNoMatchingTags', {
          query: `#${snapshot.pendingHashQuery}`,
        });
      }
      if (snapshot.pendingExactTagId !== null) {
        return runtime.i18n.t('existingPicker.goalQueryHashCommitHint', {
          query: `#${snapshot.pendingHashQuery}`,
        });
      }
      return runtime.i18n.t('existingPicker.goalQueryHashSuggestionsHint');
    }
    return '';
  }

  private getResultSummary(
    snapshot: ReturnType<ExistingGoalPickerQueryModel['getSnapshot']>,
    runtime: AppRuntime
  ): { label: string; canClearText: boolean; canClearTags: boolean } | null {
    if (!snapshot.hasActiveQuery) return null;
    const hasText = snapshot.term.length > 0;
    const hasTags = snapshot.selectedTags.length > 0;
    const tags = this.formatTagSummary(snapshot.selectedTags);

    if (hasText && hasTags) {
      return {
        label: runtime.i18n.t('existingPicker.goalSummaryMixed', {
          term: snapshot.term,
          tags,
        }),
        canClearText: true,
        canClearTags: true,
      };
    }
    if (hasText) {
      return {
        label: runtime.i18n.t('existingPicker.goalSummaryText', {
          term: snapshot.term,
        }),
        canClearText: true,
        canClearTags: false,
      };
    }
    return {
      label: runtime.i18n.t('existingPicker.goalSummaryTags', {
        tags,
      }),
      canClearText: false,
      canClearTags: true,
    };
  }

  private getEmptyState(runtime: AppRuntime): { title: string; subtitle: string } | null {
    const snapshot = this.queryModel.getSnapshot();
    if (!snapshot.hasActiveQuery) return null;

    const tags = this.formatTagSummary(snapshot.selectedTags);
    if (snapshot.term && snapshot.selectedTags.length > 0) {
      return {
        title: runtime.i18n.t('existingPicker.goalEmptyMixed', {
          term: snapshot.term,
          tags,
        }),
        subtitle: runtime.i18n.t('existingPicker.goalEmptySubtitleMixed'),
      };
    }
    if (snapshot.selectedTags.length > 0) {
      return {
        title: runtime.i18n.t('existingPicker.goalEmptyTags', {
          tags,
        }),
        subtitle: runtime.i18n.t('existingPicker.goalEmptySubtitleTags'),
      };
    }
    return {
      title: runtime.i18n.t('existingPicker.goalEmptyText', {
        term: snapshot.term,
      }),
      subtitle: runtime.i18n.t('existingPicker.goalEmptySubtitleText'),
    };
  }

  private getLoadErrorState(runtime: AppRuntime): { title: string; subtitle: string } | null {
    const snapshot = this.queryModel.getSnapshot();
    if (!snapshot.hasActiveQuery) return null;

    const tags = this.formatTagSummary(snapshot.selectedTags);
    if (snapshot.term && snapshot.selectedTags.length > 0) {
      return {
        title: runtime.i18n.t('existingPicker.goalErrorMixed', {
          term: snapshot.term,
          tags,
        }),
        subtitle: runtime.i18n.t('existingPicker.goalErrorSubtitle'),
      };
    }
    if (snapshot.selectedTags.length > 0) {
      return {
        title: runtime.i18n.t('existingPicker.goalErrorTags', {
          tags,
        }),
        subtitle: runtime.i18n.t('existingPicker.goalErrorSubtitle'),
      };
    }
    return {
      title: runtime.i18n.t('existingPicker.goalErrorText', {
        term: snapshot.term,
      }),
      subtitle: runtime.i18n.t('existingPicker.goalErrorSubtitle'),
    };
  }

  private formatTagSummary(tags: Tag[]): string {
    if (tags.length === 0) return '';
    const visible = tags.slice(0, 2).map((tag) => `#${tag.slug}`);
    const hiddenCount = tags.length - visible.length;
    if (hiddenCount <= 0) {
      return visible.join(', ');
    }
    return `${visible.join(', ')} +${hiddenCount}`;
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounce === null) return;
    window.clearTimeout(this.searchDebounce);
    this.searchDebounce = null;
  }
}
