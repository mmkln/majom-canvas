import type { TimeCluster, TimeClusteringStateSnapshot } from '../../domain/types.ts';
import type { TimeClusteringSuggestion } from '../../services/TimeClusteringSuggestionService.ts';
import type { TimeClusteringStore } from '../../state/TimeClusteringStore.ts';

interface TimeClusteringRootViewOptions {
  store: TimeClusteringStore;
  onRefreshSuggestions: () => Promise<TimeClusteringSuggestion[]>;
}

function uniqueId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `cluster_${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
}

function formatMinute(minute: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, minute));
  const hours = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const mins = Math.floor(clamped % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${mins}`;
}

function parseMinute(value: string): number {
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw ?? 0);
  const minutes = Number(minutesRaw ?? 0);
  return Math.max(0, Math.min(24 * 60, hours * 60 + minutes));
}

function dayOffsetDateKey(baseDateKey: string, offset: number): string {
  const date = new Date(`${baseDateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return baseDateKey;
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class TimeClusteringRootView {
  private readonly store: TimeClusteringStore;
  private readonly onRefreshSuggestions: () => Promise<TimeClusteringSuggestion[]>;
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly workspaceMain: HTMLDivElement;
  private readonly dateInput: HTMLInputElement;
  private readonly modeLabel: HTMLSpanElement;
  private readonly layoutLabel: HTMLSpanElement;
  private readonly statsLabel: HTMLParagraphElement;
  private readonly dayList: HTMLDivElement;
  private readonly weekList: HTMLDivElement;
  private readonly warningsList: HTMLUListElement;
  private readonly duplicateTargetInput: HTMLInputElement;
  private readonly newTitleInput: HTMLInputElement;
  private readonly newColorInput: HTMLInputElement;
  private readonly newStartInput: HTMLInputElement;
  private readonly newEndInput: HTMLInputElement;
  private readonly newParallelizableInput: HTMLInputElement;
  private readonly suggestionsList: HTMLDivElement;
  private readonly expandButton: HTMLButtonElement;
  private readonly dayModeButton: HTMLButtonElement;
  private readonly weekModeButton: HTMLButtonElement;
  private disposeStoreSubscription: (() => void) | null = null;

  constructor(options: TimeClusteringRootViewOptions) {
    this.store = options.store;
    this.onRefreshSuggestions = options.onRefreshSuggestions;

    this.root = document.createElement('div');
    this.root.className = 'h-full w-full bg-zinc-950 text-zinc-100';

    this.panel = document.createElement('div');
    this.panel.className = 'h-full overflow-auto border-r border-zinc-800 bg-zinc-950 p-4';

    this.workspaceMain = document.createElement('div');
    this.workspaceMain.className = 'flex h-full flex-1 items-center justify-center p-8 text-zinc-400';
    this.workspaceMain.textContent =
      'Main workspace area. Open Time Clustering in fullscreen for full week planning.';

    const layout = document.createElement('div');
    layout.className = 'flex h-full w-full';

    const header = document.createElement('div');
    header.className = 'mb-4 flex flex-wrap items-center gap-2';

    const title = document.createElement('h2');
    title.className = 'mr-3 text-lg font-semibold';
    title.textContent = 'Time Clustering';

    this.layoutLabel = document.createElement('span');
    this.layoutLabel.className = 'rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300';

    this.modeLabel = document.createElement('span');
    this.modeLabel.className = 'rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300';

    this.dayModeButton = document.createElement('button');
    this.dayModeButton.className = 'rounded bg-zinc-800 px-3 py-1 text-sm';
    this.dayModeButton.textContent = 'Day';
    this.dayModeButton.onclick = () => this.store.setViewMode('day-compact');

    this.weekModeButton = document.createElement('button');
    this.weekModeButton.className = 'rounded bg-zinc-800 px-3 py-1 text-sm';
    this.weekModeButton.textContent = 'Week';
    this.weekModeButton.onclick = () => this.store.setViewMode('week-fullscreen');

    this.expandButton = document.createElement('button');
    this.expandButton.className = 'rounded bg-indigo-600 px-3 py-1 text-sm font-medium';
    this.expandButton.onclick = () => {
      const snapshot = this.store.getSnapshot();
      const nextLayout = snapshot.layoutMode === 'docked-left' ? 'fullscreen' : 'docked-left';
      this.store.setLayoutMode(nextLayout);
      if (nextLayout === 'fullscreen') {
        this.store.setViewMode('week-fullscreen');
      } else {
        this.store.setViewMode('day-compact');
      }
    };

    const prevDayButton = document.createElement('button');
    prevDayButton.className = 'rounded bg-zinc-800 px-3 py-1 text-sm';
    prevDayButton.textContent = '←';
    prevDayButton.onclick = () => {
      this.store.setSelectedDate(dayOffsetDateKey(this.store.getSnapshot().selectedDateKey, -1));
    };

    this.dateInput = document.createElement('input');
    this.dateInput.type = 'date';
    this.dateInput.className = 'rounded bg-zinc-900 px-3 py-1 text-sm';
    this.dateInput.onchange = () => {
      if (this.dateInput.value) {
        this.store.setSelectedDate(this.dateInput.value);
      }
    };

    const nextDayButton = document.createElement('button');
    nextDayButton.className = 'rounded bg-zinc-800 px-3 py-1 text-sm';
    nextDayButton.textContent = '→';
    nextDayButton.onclick = () => {
      this.store.setSelectedDate(dayOffsetDateKey(this.store.getSnapshot().selectedDateKey, 1));
    };

    header.append(
      title,
      this.layoutLabel,
      this.modeLabel,
      this.dayModeButton,
      this.weekModeButton,
      this.expandButton,
      prevDayButton,
      this.dateInput,
      nextDayButton
    );

    this.statsLabel = document.createElement('p');
    this.statsLabel.className = 'mb-3 text-sm text-zinc-400';

    const createForm = document.createElement('div');
    createForm.className = 'mb-4 flex flex-wrap items-center gap-2 rounded bg-zinc-900/70 p-3';

    this.newTitleInput = document.createElement('input');
    this.newTitleInput.placeholder = 'Cluster title';
    this.newTitleInput.className = 'min-w-36 rounded bg-zinc-800 px-3 py-2 text-base';

    this.newColorInput = document.createElement('input');
    this.newColorInput.placeholder = 'Color token';
    this.newColorInput.value = 'violet';
    this.newColorInput.className = 'w-28 rounded bg-zinc-800 px-3 py-2 text-base';

    this.newStartInput = document.createElement('input');
    this.newStartInput.type = 'time';
    this.newStartInput.value = '09:00';
    this.newStartInput.className = 'rounded bg-zinc-800 px-3 py-2 text-base';

    this.newEndInput = document.createElement('input');
    this.newEndInput.type = 'time';
    this.newEndInput.value = '10:00';
    this.newEndInput.className = 'rounded bg-zinc-800 px-3 py-2 text-base';

    const parallelLabel = document.createElement('label');
    parallelLabel.className = 'flex items-center gap-2 text-sm text-zinc-300';
    this.newParallelizableInput = document.createElement('input');
    this.newParallelizableInput.type = 'checkbox';
    parallelLabel.append(this.newParallelizableInput, document.createTextNode('Parallelizable'));

    const addClusterButton = document.createElement('button');
    addClusterButton.className = 'rounded bg-indigo-600 px-3 py-2 text-sm font-medium';
    addClusterButton.textContent = 'Add cluster';
    addClusterButton.onclick = () => {
      const selectedDateKey = this.store.getSnapshot().selectedDateKey;
      this.store.createCluster(selectedDateKey, {
        id: uniqueId(),
        title: this.newTitleInput.value.trim() || 'Untitled cluster',
        colorToken: this.newColorInput.value.trim() || 'violet',
        startMinute: parseMinute(this.newStartInput.value),
        endMinute: parseMinute(this.newEndInput.value),
        parallelizable: this.newParallelizableInput.checked,
      });
    };

    createForm.append(
      this.newTitleInput,
      this.newColorInput,
      this.newStartInput,
      this.newEndInput,
      parallelLabel,
      addClusterButton
    );

    const duplicateBar = document.createElement('div');
    duplicateBar.className = 'mb-4 flex flex-wrap items-center gap-2';

    this.duplicateTargetInput = document.createElement('input');
    this.duplicateTargetInput.type = 'date';
    this.duplicateTargetInput.className = 'rounded bg-zinc-900 px-3 py-2 text-base';

    const duplicateButton = document.createElement('button');
    duplicateButton.className = 'rounded bg-zinc-800 px-3 py-2 text-sm';
    duplicateButton.textContent = 'Duplicate selected day → target';
    duplicateButton.onclick = () => {
      const sourceDateKey = this.store.getSnapshot().selectedDateKey;
      const targetDateKey = this.duplicateTargetInput.value || sourceDateKey;
      this.store.duplicateDayOneOff(sourceDateKey, targetDateKey);
      this.store.setSelectedDate(targetDateKey);
    };

    const refreshSuggestionsButton = document.createElement('button');
    refreshSuggestionsButton.className = 'rounded bg-zinc-800 px-3 py-2 text-sm';
    refreshSuggestionsButton.textContent = 'Refresh suggestions';
    refreshSuggestionsButton.onclick = async () => {
      await this.renderSuggestions();
    };

    duplicateBar.append(this.duplicateTargetInput, duplicateButton, refreshSuggestionsButton);

    this.dayList = document.createElement('div');
    this.dayList.className = 'mb-4 space-y-2';

    this.weekList = document.createElement('div');
    this.weekList.className = 'mb-4 hidden space-y-2';

    const warningsTitle = document.createElement('h3');
    warningsTitle.className = 'mt-4 text-sm font-semibold text-amber-300';
    warningsTitle.textContent = 'Warnings';
    this.warningsList = document.createElement('ul');
    this.warningsList.className = 'mb-4 list-disc pl-5 text-sm text-amber-200';

    const suggestionsTitle = document.createElement('h3');
    suggestionsTitle.className = 'text-sm font-semibold text-zinc-200';
    suggestionsTitle.textContent = 'AI suggestions';
    this.suggestionsList = document.createElement('div');
    this.suggestionsList.className = 'space-y-2';

    this.panel.append(
      header,
      this.statsLabel,
      createForm,
      duplicateBar,
      this.dayList,
      this.weekList,
      warningsTitle,
      this.warningsList,
      suggestionsTitle,
      this.suggestionsList
    );

    layout.append(this.panel, this.workspaceMain);
    this.root.append(layout);
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.root);
    this.disposeStoreSubscription = this.store.subscribe((snapshot) => {
      this.renderSnapshot(snapshot);
    });
    this.renderSnapshot(this.store.getSnapshot());
    void this.renderSuggestions();
  }

  public unmount(): void {
    this.disposeStoreSubscription?.();
    this.disposeStoreSubscription = null;
    this.root.remove();
  }

  private renderSnapshot(snapshot: TimeClusteringStateSnapshot): void {
    this.modeLabel.textContent = snapshot.viewMode;
    this.layoutLabel.textContent = snapshot.layoutMode;
    this.expandButton.textContent =
      snapshot.layoutMode === 'docked-left' ? 'Expand to fullscreen' : 'Collapse to left island';

    this.dateInput.value = snapshot.selectedDateKey;
    this.duplicateTargetInput.value ||= snapshot.selectedDateKey;

    const selectedPlan = snapshot.plansByDate[snapshot.selectedDateKey];
    const selectedClusters = selectedPlan?.clusters ?? [];

    this.statsLabel.textContent = `Date: ${snapshot.selectedDateKey} • Planned days: ${Object.keys(snapshot.plansByDate).length} • Clusters today: ${selectedClusters.length}`;

    this.dayList.innerHTML = '';
    selectedClusters
      .slice()
      .sort((a, b) => a.startMinute - b.startMinute)
      .forEach((cluster) => {
        this.dayList.append(this.renderClusterRow(snapshot.selectedDateKey, cluster));
      });

    this.weekList.innerHTML = '';
    const weekDateKeys = Array.from({ length: 7 }).map((_, index) =>
      dayOffsetDateKey(snapshot.weekAnchorDateKey, index)
    );
    weekDateKeys.forEach((dateKey) => {
      const item = document.createElement('div');
      item.className = 'rounded bg-zinc-900/70 px-3 py-2 text-sm';
      const count = snapshot.plansByDate[dateKey]?.clusters.length ?? 0;
      item.textContent = `${dateKey}: ${count} cluster(s)`;
      this.weekList.appendChild(item);
    });

    const isDayMode = snapshot.viewMode === 'day-compact';
    this.dayList.classList.toggle('hidden', !isDayMode);
    this.weekList.classList.toggle('hidden', isDayMode);

    const isDocked = snapshot.layoutMode === 'docked-left';
    this.panel.style.width = isDocked ? '380px' : '100%';
    this.dayModeButton.disabled = false;
    this.weekModeButton.disabled = false;
    this.workspaceMain.style.display = isDocked ? 'flex' : 'none';

    this.warningsList.innerHTML = '';
    if (snapshot.lastWarnings.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No warnings';
      this.warningsList.appendChild(li);
      return;
    }

    snapshot.lastWarnings.forEach((warning) => {
      const li = document.createElement('li');
      li.textContent = `Collision: ${warning.sourceClusterId} ↔ ${warning.targetClusterId}`;
      this.warningsList.appendChild(li);
    });
  }

  private renderClusterRow(dateKey: string, cluster: TimeCluster): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'flex flex-wrap items-center gap-2 rounded bg-zinc-900/70 px-3 py-2';

    const name = document.createElement('span');
    name.className = 'min-w-40 text-sm font-medium';
    name.textContent = `${cluster.title} (${cluster.colorToken})`;

    const time = document.createElement('span');
    time.className = 'text-sm text-zinc-300';
    time.textContent = `${formatMinute(cluster.startMinute)}–${formatMinute(cluster.endMinute)}`;

    const parallel = document.createElement('span');
    parallel.className = 'text-xs text-zinc-400';
    parallel.textContent = cluster.parallelizable ? 'parallelizable' : 'exclusive';

    const shiftButton = document.createElement('button');
    shiftButton.className = 'rounded bg-zinc-800 px-2 py-1 text-xs';
    shiftButton.textContent = '+30m';
    shiftButton.onclick = () => {
      this.store.updateCluster(dateKey, cluster.id, {
        startMinute: cluster.startMinute + 30,
        endMinute: cluster.endMinute + 30,
      });
    };

    const deleteButton = document.createElement('button');
    deleteButton.className = 'rounded bg-rose-700 px-2 py-1 text-xs';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => {
      this.store.deleteCluster(dateKey, cluster.id);
    };

    row.append(name, time, parallel, shiftButton, deleteButton);
    return row;
  }

  private async renderSuggestions(): Promise<void> {
    const suggestions = await this.onRefreshSuggestions();
    this.suggestionsList.innerHTML = '';

    if (suggestions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-sm text-zinc-400';
      empty.textContent = 'No suggestion actions right now.';
      this.suggestionsList.appendChild(empty);
      return;
    }

    suggestions.forEach((suggestion) => {
      const card = document.createElement('div');
      card.className = 'rounded bg-zinc-900/70 p-3';

      const title = document.createElement('p');
      title.className = 'text-sm font-semibold';
      title.textContent = suggestion.title;

      const description = document.createElement('p');
      description.className = 'mt-1 text-sm text-zinc-300';
      description.textContent = suggestion.description;

      const applyButton = document.createElement('button');
      applyButton.className = 'mt-2 rounded bg-emerald-700 px-2 py-1 text-xs';
      applyButton.textContent = 'Apply';
      applyButton.onclick = () => {
        this.store.applySuggestionAction(suggestion.action);
      };

      card.append(title, description, applyButton);
      this.suggestionsList.append(card);
    });
  }
}
