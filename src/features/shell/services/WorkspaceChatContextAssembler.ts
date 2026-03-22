import type {
  WorkspaceChatCanvasElement,
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatConnectionEdge,
} from '../workspaceChatEvents.ts';
import {
  capitalizeWorkspaceChatValue,
  summarizeWorkspaceChatCanvas,
} from './WorkspaceChatContent.ts';
import type {
  WorkspaceChatAssembledContext,
  WorkspaceChatFocusItem,
  WorkspaceChatMemoryState,
  WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';
import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';
import { resolveWorkspaceChatProfile } from './WorkspaceChatProfileResolver.ts';

type AssembleParams = {
  prompt: string;
  snapshot: WorkspaceChatCanvasSnapshot | null;
  memory: WorkspaceChatMemoryState;
  contextMode: WorkspaceChatContextMode;
  profile?: WorkspaceChatProfile;
};

const MAX_CHILDREN = 6;
const MAX_SIBLINGS = 5;
const MAX_RELATED = 6;
const MAX_QUERY_MATCHES = 4;
const MAX_RECENT_ACTIVITY = 5;

export class WorkspaceChatContextAssembler {
  public assemble(params: AssembleParams): WorkspaceChatAssembledContext {
    const profile =
      params.profile ?? resolveWorkspaceChatProfile(params.prompt, params.snapshot);
    if (!params.snapshot) {
      return {
        profile,
        contextMode: params.contextMode,
        rawSnapshot: null,
        contextSummary: 'No active canvas context is available right now.',
        workspaceSummary: 'No active canvas context is available right now.',
        selection: [],
        focus: null,
        viewportItems: [],
        recentActivity: [],
        memory: params.memory,
        queryMatches: [],
      };
    }

    const snapshot = params.snapshot;
    const elementsById = new Map(snapshot.elements.map((item) => [item.id, item]));
    const selection = snapshot.selectionIds
      .map((id) => elementsById.get(id))
      .filter((item): item is WorkspaceChatCanvasElement => Boolean(item));
    const viewportItems = snapshot.viewport
      ? snapshot.viewport.visibleElementIds
          .map((id) => elementsById.get(id))
          .filter((item): item is WorkspaceChatCanvasElement => Boolean(item))
      : [];
    const queryMatches = this.findQueryMatches(
      params.prompt,
      snapshot.elements,
      selection
    );
    const focusElement = this.resolveFocusElement(
      params.prompt,
      profile,
      snapshot,
      selection,
      queryMatches,
      elementsById
    );
    const focus = focusElement
      ? this.buildFocusItem(focusElement, snapshot, elementsById)
      : null;

    return {
      profile,
      contextMode: params.contextMode,
      rawSnapshot: snapshot,
      contextSummary: this.buildContextSummary(
        params.contextMode,
        profile,
        snapshot,
        selection,
        focus,
        viewportItems,
        queryMatches
      ),
      workspaceSummary: summarizeWorkspaceChatCanvas(snapshot),
      selection,
      focus,
      viewportItems,
      recentActivity: this.pickRelevantRecentActivity(snapshot, focus, selection),
      memory: params.memory,
      queryMatches,
    };
  }

  private resolveFocusElement(
    prompt: string,
    profile: WorkspaceChatProfile,
    snapshot: WorkspaceChatCanvasSnapshot,
    selection: WorkspaceChatCanvasElement[],
    queryMatches: WorkspaceChatCanvasElement[],
    elementsById: Map<string, WorkspaceChatCanvasElement>
  ): WorkspaceChatCanvasElement | null {
    if (selection.length === 1) {
      return selection[0];
    }
    if (snapshot.focusId) {
      const focused = elementsById.get(snapshot.focusId);
      if (focused) return focused;
    }
    if (queryMatches.length > 0) {
      return queryMatches[0];
    }
    if (
      profile === 'review-selection' ||
      profile === 'breakdown' ||
      profile === 'dependency-review' ||
      profile === 'readiness-check'
    ) {
      return selection[0] ?? null;
    }
    if (profile === 'summarize') {
      return snapshot.elements.find((item) => item.kind === 'goal') ?? null;
    }
    const normalizedPrompt = prompt.toLowerCase();
    const kindMatch = snapshot.elements.find((item) =>
      normalizedPrompt.includes(item.kind)
    );
    return kindMatch ?? null;
  }

  private buildFocusItem(
    element: WorkspaceChatCanvasElement,
    snapshot: WorkspaceChatCanvasSnapshot,
    elementsById: Map<string, WorkspaceChatCanvasElement>
  ): WorkspaceChatFocusItem {
    const parent = element.parentId ? elementsById.get(element.parentId) ?? null : null;
    const children = element.childIds
      .map((id) => elementsById.get(id))
      .filter((item): item is WorkspaceChatCanvasElement => Boolean(item))
      .slice(0, MAX_CHILDREN);
    const siblings = parent
      ? parent.childIds
          .filter((id) => id !== element.id)
          .map((id) => elementsById.get(id))
          .filter((item): item is WorkspaceChatCanvasElement => Boolean(item))
          .slice(0, MAX_SIBLINGS)
      : [];
    const related = this.getRelatedElements(element.id, snapshot.connections, elementsById)
      .slice(0, MAX_RELATED);
    return {
      item: element,
      parent,
      children,
      siblings,
      related,
    };
  }

  private getRelatedElements(
    elementId: string,
    connections: WorkspaceChatConnectionEdge[],
    elementsById: Map<string, WorkspaceChatCanvasElement>
  ): Array<{ item: WorkspaceChatCanvasElement; relationType: string }> {
    const related: Array<{ item: WorkspaceChatCanvasElement; relationType: string }> = [];
    connections.forEach((connection) => {
      const otherId =
        connection.fromId === elementId
          ? connection.toId
          : connection.toId === elementId
            ? connection.fromId
            : null;
      if (!otherId) return;
      const other = elementsById.get(otherId);
      if (!other) return;
      related.push({ item: other, relationType: connection.relationType });
    });
    return related;
  }

  private findQueryMatches(
    prompt: string,
    elements: WorkspaceChatCanvasElement[],
    selection: WorkspaceChatCanvasElement[]
  ): WorkspaceChatCanvasElement[] {
    const normalizedPrompt = prompt.trim().toLowerCase();
    if (normalizedPrompt.length < 3) return [];
    const candidates = [...selection, ...elements.filter((item) => !selection.some((selected) => selected.id === item.id))];
    return candidates
      .filter((item) => {
        const title = item.title.trim().toLowerCase();
        return title.length >= 3 && normalizedPrompt.includes(title);
      })
      .slice(0, MAX_QUERY_MATCHES);
  }

  private buildContextSummary(
    contextMode: WorkspaceChatContextMode,
    profile: WorkspaceChatProfile,
    snapshot: WorkspaceChatCanvasSnapshot,
    selection: WorkspaceChatCanvasElement[],
    focus: WorkspaceChatFocusItem | null,
    viewportItems: WorkspaceChatCanvasElement[],
    queryMatches: WorkspaceChatCanvasElement[]
  ): string {
    const lines = [`Profile: ${profile}.`, summarizeWorkspaceChatCanvas(snapshot)];
    if (focus) {
      lines.push(
        `Primary focus: ${capitalizeWorkspaceChatValue(focus.item.kind)} "${focus.item.title || 'Untitled'}".`
      );
      if (focus.parent) {
        lines.push(
          `Parent: ${capitalizeWorkspaceChatValue(focus.parent.kind)} "${focus.parent.title || 'Untitled'}".`
        );
      }
      if (focus.children.length > 0) {
        lines.push(
          `Children in scope: ${focus.children
            .map((item) => `"${item.title || 'Untitled'}"`)
            .join(', ')}.`
        );
      }
    }

    if (selection.length > 1) {
      lines.push(`Selection size: ${selection.length}.`);
      const selectionClusterSummary = this.buildSelectionClusterSummary(
        selection,
        snapshot
      );
      if (selectionClusterSummary) {
        lines.push(selectionClusterSummary);
      }
    } else if (!focus && selection.length > 0) {
      lines.push(`Selection size: ${selection.length}.`);
    }

    if (contextMode === 'viewport' && viewportItems.length > 0) {
      lines.push(`Visible area contributes ${viewportItems.length} items to context.`);
    }
    if (queryMatches.length > 0) {
      lines.push(
        `Prompt matches: ${queryMatches
          .map((item) => `"${item.title || 'Untitled'}"`)
          .join(', ')}.`
      );
    }
    return lines.join(' ');
  }

  private buildSelectionClusterSummary(
    selection: WorkspaceChatCanvasElement[],
    snapshot: WorkspaceChatCanvasSnapshot
  ): string | null {
    if (selection.length < 2) return null;
    const sameKind = selection.every((item) => item.kind === selection[0]?.kind);
    const parentIds = new Set(selection.map((item) => item.parentId ?? ''));
    if (parentIds.size === 1 && selection[0]?.parentId) {
      const parent = snapshot.elements.find(
        (item) => item.id === selection[0]?.parentId
      );
      if (parent) {
        return `Selection forms one ${parent.kind} cluster under "${parent.title || 'Untitled'}".`;
      }
    }

    const clusterRoots = new Set(
      selection.map((item) => this.resolveClusterRootId(item, snapshot))
    );
    if (clusterRoots.size === 1) {
      return 'Selection stays within one goal cluster.';
    }
    if (sameKind) {
      return `Selection contains ${selection.length} ${selection[0]?.kind}s across multiple areas.`;
    }
    return 'Selection is mixed across disconnected areas of the canvas.';
  }

  private resolveClusterRootId(
    item: WorkspaceChatCanvasElement,
    snapshot: WorkspaceChatCanvasSnapshot
  ): string {
    const elementsById = new Map(snapshot.elements.map((entry) => [entry.id, entry]));
    let current: WorkspaceChatCanvasElement | undefined = item;
    while (current?.parentId) {
      current = elementsById.get(current.parentId);
    }
    return current?.id ?? item.id;
  }

  private pickRelevantRecentActivity(
    snapshot: WorkspaceChatCanvasSnapshot,
    focus: WorkspaceChatFocusItem | null,
    selection: WorkspaceChatCanvasElement[]
  ) {
    if (snapshot.recentActivity.length === 0) return [];
    const relevantIds = new Set<string>();
    selection.forEach((item) => relevantIds.add(item.id));
    if (focus) {
      relevantIds.add(focus.item.id);
      focus.children.forEach((item) => relevantIds.add(item.id));
      focus.siblings.forEach((item) => relevantIds.add(item.id));
      if (focus.parent) {
        relevantIds.add(focus.parent.id);
      }
    }
    const prioritized = snapshot.recentActivity.filter((item) =>
      item.entityIds.some((id) => relevantIds.has(id))
    );
    const fallback = snapshot.recentActivity.filter(
      (item) => !prioritized.some((prioritizedItem) => prioritizedItem.id === item.id)
    );
    return [...prioritized, ...fallback].slice(0, MAX_RECENT_ACTIVITY);
  }
}
