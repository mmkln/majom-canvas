import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { CopyCommand } from '../commands/CopyCommand.ts';
import { DeleteCommand } from '../commands/DeleteCommand.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import type { PlanningElement } from './SelectionContext.ts';
import { ConnectionCreationService } from './ConnectionCreationService.ts';
import { ConnectionRemovalService } from './ConnectionRemovalService.ts';
import { notify } from './NotificationService.ts';
import { GoalElement } from '../../elements/GoalElement.ts';

type GoalTagUpdateMode = 'add' | 'remove' | 'replace';
type GoalTagCatalogItem = {
  id: number;
  title: string;
};

function normalizeGoalTagIds(tagIds: Iterable<number> | undefined): number[] {
  return [...new Set(tagIds ?? [])].sort((left, right) => left - right);
}

function areGoalTagIdsEqual(left: number[], right: number[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function resolveGoalTagIds(
  currentIds: number[],
  selectedIds: number[],
  mode: GoalTagUpdateMode
): number[] {
  if (mode === 'replace') {
    return normalizeGoalTagIds(selectedIds);
  }

  const nextIds = new Set(currentIds);
  if (mode === 'add') {
    selectedIds.forEach((id) => nextIds.add(id));
  } else {
    selectedIds.forEach((id) => nextIds.delete(id));
  }
  return normalizeGoalTagIds(nextIds);
}

function resolveGoalTagTitles(
  goal: GoalElement,
  nextIds: number[],
  tagCatalog: ReadonlyArray<GoalTagCatalogItem>
): string[] {
  const catalogTitles = new Map(tagCatalog.map((tag) => [tag.id, tag.title]));
  const currentTitles = new Map<number, string>();
  [...(goal.tagIds ?? [])].forEach((id, index) => {
    const title = goal.tags?.[index];
    if (title) {
      currentTitles.set(id, title);
    }
  });

  const nextTitles: string[] = [];
  nextIds.forEach((id) => {
    const title = catalogTitles.get(id) ?? currentTitles.get(id);
    if (title) {
      nextTitles.push(title);
    }
  });
  return nextTitles;
}

export class BulkActionsController {
  private readonly connectionCreationService: ConnectionCreationService;
  private readonly connectionRemovalService: ConnectionRemovalService;

  constructor(private readonly scene: Scene) {
    this.connectionCreationService = new ConnectionCreationService(scene);
    this.connectionRemovalService = new ConnectionRemovalService(scene);
  }

  public copy(elements: PlanningElement[]): void {
    if (elements.length === 0) return;
    historyService.execute(new CopyCommand(this.scene, elements));
  }

  public removeFromCanvas(elements: PlanningElement[]): void {
    if (elements.length === 0) return;
    historyService.execute(new DeleteCommand(this.scene, elements));
  }

  public deletePermanently(elements: PlanningElement[]): void {
    if (elements.length === 0) return;
    elements.forEach((element) => {
      window.dispatchEvent(
        new CustomEvent('elementDeleteRequested', {
          detail: { element },
        })
      );
    });
  }

  public updateStatus(
    elements: PlanningElement[],
    status: ElementStatus
  ): void {
    if (elements.length === 0) return;
    // TODO: replace per-element PATCH with bulk endpoints:
    // /tasks/bulk/, /stories/bulk/, /goals/bulk/ (ids + patch payload).
    elements.forEach((element) => {
      if (element.status === status) return;
      element.status = status;
      window.dispatchEvent(
        new CustomEvent('elementDetailsEdited', {
          detail: { element, patch: { status } },
        })
      );
    });
    this.scene.changes.next();
  }

  public updateGoalTags(
    elements: PlanningElement[],
    options: {
      mode: GoalTagUpdateMode;
      tagIds: number[];
      tagCatalog: ReadonlyArray<GoalTagCatalogItem>;
    }
  ): void {
    if (elements.length === 0) return;
    const goals = elements.filter(
      (element): element is GoalElement => element instanceof GoalElement
    );
    if (goals.length !== elements.length) {
      return;
    }

    const selectedTagIds = normalizeGoalTagIds(options.tagIds);
    let changed = false;
    goals.forEach((goal) => {
      const currentIds = normalizeGoalTagIds(goal.tagIds);
      const nextIds = resolveGoalTagIds(
        currentIds,
        selectedTagIds,
        options.mode
      );
      if (areGoalTagIdsEqual(currentIds, nextIds)) {
        return;
      }
      const nextTitles = resolveGoalTagTitles(goal, nextIds, options.tagCatalog);
      goal.tagIds = [...nextIds];
      goal.tags = nextTitles;
      window.dispatchEvent(
        new CustomEvent('elementDetailsEdited', {
          detail: { element: goal, patch: { tagIds: nextIds } },
        })
      );
      changed = true;
    });
    if (changed) {
      this.scene.changes.next();
    }
  }

  public getEligibleLinkSourcesToTarget(
    elements: PlanningElement[],
    target: PlanningElement
  ): PlanningElement[] {
    return elements.filter((element) =>
      this.connectionCreationService.canCreate(element, target, {
        preventDuplicates: true,
      })
    );
  }

  public getEligibleLinkTargetsFromSource(
    source: PlanningElement,
    elements: PlanningElement[]
  ): PlanningElement[] {
    return elements.filter((element) =>
      this.connectionCreationService.canCreate(source, element, {
        preventDuplicates: true,
      })
    );
  }

  public getRedirectableLinkSourcesToTarget(
    elements: PlanningElement[],
    target: PlanningElement
  ): PlanningElement[] {
    return elements.filter((element) =>
      this.connectionCreationService.canRedirect(element, target)
    );
  }

  public getRedirectableLinkTargetsFromSource(
    source: PlanningElement,
    elements: PlanningElement[]
  ): PlanningElement[] {
    return elements.filter((element) =>
      this.connectionCreationService.canRedirect(source, element)
    );
  }

  public hasConnectionsForElement(element: PlanningElement): boolean {
    return this.connectionRemovalService.hasConnectionsForElement(element);
  }

  public hasConnectionsForElements(elements: PlanningElement[]): boolean {
    return this.connectionRemovalService.hasConnectionsForElements(elements);
  }

  public hasConnectionsBetweenElementAndTargets(
    source: PlanningElement,
    elements: PlanningElement[]
  ): boolean {
    return this.connectionRemovalService.hasConnectionsBetweenElementAndTargets(
      source,
      elements
    );
  }

  public connectToTarget(
    elements: PlanningElement[],
    target: PlanningElement
  ): void {
    if (elements.length === 0) return;
    const result = this.connectionCreationService.createManyToTarget(
      elements,
      target,
      {
        preventDuplicates: true,
      }
    );
    if (result.createdPlans.length > 0) {
      return;
    }
    notify('No new links could be created for the current selection.', 'info');
  }

  public connectFromSourceToTargets(
    source: PlanningElement,
    elements: PlanningElement[]
  ): void {
    if (elements.length === 0) return;
    const result = this.connectionCreationService.createFromSourceToManyTargets(
      source,
      elements,
      {
        preventDuplicates: true,
      }
    );
    if (result.createdPlans.length > 0) {
      return;
    }
    notify('No new links could be created for the current selection.', 'info');
  }

  public redirectToTarget(
    elements: PlanningElement[],
    target: PlanningElement
  ): void {
    if (elements.length === 0) return;
    const result = this.connectionCreationService.redirectManyToTarget(
      elements,
      target
    );
    if (result.redirectedPlans.length > 0) {
      return;
    }
    notify('No links could be redirected for the current selection.', 'info');
  }

  public redirectFromSourceToTargets(
    source: PlanningElement,
    elements: PlanningElement[]
  ): void {
    if (elements.length === 0) return;
    const result = this.connectionCreationService.redirectFromSourceToManyTargets(
      source,
      elements
    );
    if (result.redirectedPlans.length > 0) {
      return;
    }
    notify('No links could be redirected for the current selection.', 'info');
  }

  public removeConnectionsForElement(element: PlanningElement): void {
    const result = this.connectionRemovalService.removeConnectionsForElement(
      element
    );
    if (result.removedConnections.length > 0) {
      return;
    }
    notify('No links found for this item.', 'info');
  }

  public removeConnectionsForElements(elements: PlanningElement[]): void {
    if (elements.length === 0) return;
    const result =
      this.connectionRemovalService.removeConnectionsForElements(elements);
    if (result.removedConnections.length > 0) {
      return;
    }
    notify('No links found for the current selection.', 'info');
  }

  public removeConnectionsBetweenElementAndTargets(
    source: PlanningElement,
    elements: PlanningElement[]
  ): void {
    if (elements.length === 0) return;
    const result =
      this.connectionRemovalService.removeConnectionsBetweenElementAndTargets(
        source,
        elements
      );
    if (result.removedConnections.length > 0) {
      return;
    }
    notify('No links found for the current selection.', 'info');
  }

  public canConnectToTarget(
    elements: PlanningElement[],
    target: PlanningElement
  ): boolean {
    return this.connectionCreationService.canCreateManyToTarget(
      elements,
      target,
      { preventDuplicates: true }
    );
  }

  public canConnectFromSourceToTargets(
    source: PlanningElement,
    elements: PlanningElement[]
  ): boolean {
    return this.connectionCreationService.canCreateFromSourceToManyTargets(
      source,
      elements,
      { preventDuplicates: true }
    );
  }

  public canRedirectToTarget(
    elements: PlanningElement[],
    target: PlanningElement
  ): boolean {
    return this.connectionCreationService.canRedirectManyToTarget(
      elements,
      target
    );
  }

  public canRedirectFromSourceToTargets(
    source: PlanningElement,
    elements: PlanningElement[]
  ): boolean {
    return this.connectionCreationService.canRedirectFromSourceToManyTargets(
      source,
      elements
    );
  }
}
