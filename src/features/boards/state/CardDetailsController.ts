import type {
  Card,
  CardCheckItem,
  CardChecklist,
  CardEntityLink,
  CardEntityLinkType,
  CardPlacement,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { BoardsCommandResult } from '../domain/types.ts';
import type {
  CardDetailsDraft,
  CardDetailsSessionState,
} from '../domain/cardDetailsSession.ts';
import { CardDetailsSessionController } from './CardDetailsSessionController.ts';

export type CardChecklistPanelStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'saving'
  | 'error';

export type CardChecklistPanelState = {
  cardId: Card['id'];
  status: CardChecklistPanelStatus;
  checklists: CardChecklist[];
  error: string | null;
};

export type CardDetailsEntityLinksStatus = 'idle' | 'saving' | 'error';

export type CardDetailsEntityLinksState = {
  cardId: Card['id'];
  status: CardDetailsEntityLinksStatus;
  error: string | null;
};

export type CardDetailsEntityLinkActionResult = {
  status: 'confirmed' | 'rejected' | 'ignored';
  shouldRefresh: boolean;
};

export type CardDetailsChecklistPorts = {
  loadChecklists: (cardId: Card['id']) => Promise<CardChecklist[]>;
  createChecklist: (
    cardId: Card['id'],
    title: string
  ) => Promise<BoardsCommandResult<CardChecklist | null>>;
  deleteChecklist: (
    checklistId: CardChecklist['id']
  ) => Promise<BoardsCommandResult>;
  createCheckItem: (
    checklistId: CardChecklist['id'],
    title: string
  ) => Promise<BoardsCommandResult<CardCheckItem | null>>;
  patchCheckItem: (
    itemId: CardCheckItem['id'],
    patch: { title?: string; state?: CardCheckItem['state'] }
  ) => Promise<BoardsCommandResult<CardCheckItem | null>>;
  deleteCheckItem: (
    itemId: CardCheckItem['id']
  ) => Promise<BoardsCommandResult>;
};

export type CardDetailsEntityLinkPorts = {
  createLink: (
    cardId: Card['id'],
    entityType: CardEntityLinkType,
    entityId: string
  ) => Promise<BoardsCommandResult<CardEntityLink | null>>;
  createEntityFromCard: (
    card: Card,
    entityType: CardEntityLinkType
  ) => Promise<BoardsCommandResult<CardEntityLink | null>>;
  deleteLink: (linkId: CardEntityLink['id']) => Promise<BoardsCommandResult>;
  deleteLinkedEntity: (
    card: Card,
    link: CardEntityLink
  ) => Promise<BoardsCommandResult>;
};

export class CardDetailsController {
  private activePlacement: CardPlacement['id'] | null = null;
  private readonly session = new CardDetailsSessionController();
  private checklistState: CardChecklistPanelState | null = null;
  private entityLinksState: CardDetailsEntityLinksState | null = null;
  private checklistLoadVersion = 0;
  private readonly hiddenCheckedChecklistIds = new Set<CardChecklist['id']>();
  private readonly expandedCheckItemComposerIds = new Set<
    CardChecklist['id']
  >();

  constructor(
    private readonly checklistPorts: CardDetailsChecklistPorts | null = null,
    private readonly entityLinkPorts: CardDetailsEntityLinkPorts | null = null
  ) {}

  public get activePlacementId(): CardPlacement['id'] | null {
    return this.activePlacement;
  }

  public get snapshot(): CardDetailsSessionState | null {
    return this.session.snapshot;
  }

  public get checklists(): CardChecklistPanelState | null {
    return this.checklistState;
  }

  public get entityLinks(): CardDetailsEntityLinksState | null {
    return this.entityLinksState;
  }

  public get isOpen(): boolean {
    return this.activePlacement !== null;
  }

  public open(
    card: Card,
    placementId: CardPlacement['id'],
    options: { isResolved: boolean }
  ): CardDetailsSessionState {
    this.activePlacement = placementId;
    const state = this.session.open(card, placementId, options);
    this.resetChecklistState(card.id);
    this.resetEntityLinksState(card.id);
    return state;
  }

  public close(): void {
    this.activePlacement = null;
    this.session.close();
    this.checklistState = null;
    this.entityLinksState = null;
    this.hiddenCheckedChecklistIds.clear();
    this.expandedCheckItemComposerIds.clear();
    this.invalidateChecklistLoads();
  }

  public resolveActivePlacement(placementId: CardPlacement['id']): void {
    if (!this.activePlacement) return;
    this.activePlacement = placementId;
  }

  public reconcile(
    card: Card,
    placementId: CardPlacement['id'],
    options: { isResolved: boolean }
  ): CardDetailsSessionState | null {
    if (!this.activePlacement) return null;
    const previousCardId = this.session.snapshot?.identity.cardId ?? null;
    this.activePlacement = placementId;
    const state = this.session.reconcile(card, placementId, options);
    if (previousCardId !== card.id) {
      this.resetChecklistState(card.id);
      this.resetEntityLinksState(card.id);
    }
    return state;
  }

  public updateDraft(
    patch: Partial<CardDetailsDraft>
  ): CardDetailsSessionState | null {
    return this.session.updateDraft(patch);
  }

  public queueSubmit(options: {
    closeAfterSubmit: boolean;
  }): CardDetailsSessionState | null {
    return this.session.queueSubmit(options);
  }

  public markSubmitted(): CardDetailsSessionState | null {
    return this.session.markSubmitted();
  }

  public updateRequestedTagIds(
    tagIds: number[]
  ): CardDetailsSessionState | null {
    return this.session.updateRequestedTagIds(tagIds);
  }

  public beginChecklistLoad(cardId: Card['id']): number {
    const version = this.nextChecklistLoadVersion();
    this.checklistState = {
      cardId,
      status: 'loading',
      checklists:
        this.checklistState?.cardId === cardId
          ? this.checklistState.checklists
          : [],
      error: null,
    };
    return version;
  }

  public applyChecklistLoadSuccess(
    version: number,
    cardId: Card['id'],
    checklists: CardChecklist[]
  ): boolean {
    if (!this.isCurrentChecklistLoad(version)) return false;
    this.checklistState = {
      cardId,
      status: 'ready',
      checklists,
      error: null,
    };
    return true;
  }

  public applyChecklistLoadError(
    version: number,
    cardId: Card['id'],
    error: string
  ): boolean {
    if (!this.isCurrentChecklistLoad(version)) return false;
    this.checklistState = {
      cardId,
      status: 'error',
      checklists: [],
      error,
    };
    return true;
  }

  public beginChecklistMutation(cardId: Card['id']): CardChecklistPanelState {
    const previous = this.checklistState;
    this.checklistState = {
      cardId,
      status: 'saving',
      checklists: previous?.cardId === cardId ? previous.checklists : [],
      error: null,
    };
    return this.checklistState;
  }

  public failChecklistMutation(cardId: Card['id'], error: string): void {
    const previous = this.checklistState;
    this.checklistState = {
      cardId,
      status: 'error',
      checklists: previous?.cardId === cardId ? previous.checklists : [],
      error,
    };
  }

  public isChecklistCheckedItemsHidden(
    checklistId: CardChecklist['id']
  ): boolean {
    return this.hiddenCheckedChecklistIds.has(checklistId);
  }

  public toggleChecklistCheckedItems(checklistId: CardChecklist['id']): void {
    if (this.hiddenCheckedChecklistIds.has(checklistId)) {
      this.hiddenCheckedChecklistIds.delete(checklistId);
      return;
    }
    this.hiddenCheckedChecklistIds.add(checklistId);
  }

  public isCheckItemComposerExpanded(
    checklistId: CardChecklist['id']
  ): boolean {
    return this.expandedCheckItemComposerIds.has(checklistId);
  }

  public expandCheckItemComposer(checklistId: CardChecklist['id']): void {
    this.expandedCheckItemComposerIds.add(checklistId);
  }

  public collapseCheckItemComposer(checklistId: CardChecklist['id']): void {
    this.expandedCheckItemComposerIds.delete(checklistId);
  }

  public async loadChecklists(cardId: Card['id']): Promise<boolean> {
    if (!this.checklistPorts) return false;
    const version = this.beginChecklistLoad(cardId);
    try {
      const checklists = await this.checklistPorts.loadChecklists(cardId);
      return this.applyChecklistLoadSuccess(version, cardId, checklists);
    } catch {
      return this.applyChecklistLoadError(
        version,
        cardId,
        'boards.cardBack.checklistsLoadFailed'
      );
    }
  }

  public async createChecklist(
    cardId: Card['id'],
    title: string
  ): Promise<boolean> {
    return this.runChecklistMutation(cardId, () =>
      this.requireChecklistPorts().createChecklist(cardId, title)
    );
  }

  public async deleteChecklist(
    cardId: Card['id'],
    checklistId: CardChecklist['id']
  ): Promise<boolean> {
    return this.runChecklistMutation(cardId, () =>
      this.requireChecklistPorts().deleteChecklist(checklistId)
    );
  }

  public async createCheckItem(
    cardId: Card['id'],
    checklistId: CardChecklist['id'],
    title: string
  ): Promise<boolean> {
    const updated = await this.runChecklistMutation(cardId, () =>
      this.requireChecklistPorts().createCheckItem(checklistId, title)
    );
    if (updated) {
      this.collapseCheckItemComposer(checklistId);
    }
    return updated;
  }

  public async patchCheckItem(
    cardId: Card['id'],
    itemId: CardCheckItem['id'],
    patch: { title?: string; state?: CardCheckItem['state'] }
  ): Promise<boolean> {
    return this.runChecklistMutation(cardId, () =>
      this.requireChecklistPorts().patchCheckItem(itemId, patch)
    );
  }

  public async deleteCheckItem(
    cardId: Card['id'],
    itemId: CardCheckItem['id']
  ): Promise<boolean> {
    return this.runChecklistMutation(cardId, () =>
      this.requireChecklistPorts().deleteCheckItem(itemId)
    );
  }

  public async createEntityLink(
    card: Card,
    entityType: CardEntityLinkType,
    entityId: string
  ): Promise<CardDetailsEntityLinkActionResult> {
    return this.runEntityLinkMutation(card.id, () =>
      this.requireEntityLinkPorts().createLink(card.id, entityType, entityId)
    );
  }

  public async createEntityFromCard(
    card: Card,
    entityType: CardEntityLinkType
  ): Promise<CardDetailsEntityLinkActionResult> {
    return this.runEntityLinkMutation(card.id, () =>
      this.requireEntityLinkPorts().createEntityFromCard(card, entityType)
    );
  }

  public async unlinkEntity(
    card: Card,
    link: CardEntityLink
  ): Promise<CardDetailsEntityLinkActionResult> {
    return this.runEntityLinkMutation(card.id, () =>
      this.requireEntityLinkPorts().deleteLink(link.id)
    );
  }

  public async deleteLinkedEntity(
    card: Card,
    link: CardEntityLink
  ): Promise<CardDetailsEntityLinkActionResult> {
    return this.runEntityLinkMutation(card.id, () =>
      this.requireEntityLinkPorts().deleteLinkedEntity(card, link)
    );
  }

  private resetChecklistState(cardId: Card['id']): void {
    this.checklistState = {
      cardId,
      status: 'idle',
      checklists: [],
      error: null,
    };
    this.hiddenCheckedChecklistIds.clear();
    this.expandedCheckItemComposerIds.clear();
    this.invalidateChecklistLoads();
  }

  private resetEntityLinksState(cardId: Card['id']): void {
    this.entityLinksState = {
      cardId,
      status: 'idle',
      error: null,
    };
  }

  private nextChecklistLoadVersion(): number {
    this.checklistLoadVersion += 1;
    return this.checklistLoadVersion;
  }

  private invalidateChecklistLoads(): void {
    this.checklistLoadVersion += 1;
  }

  private isCurrentChecklistLoad(version: number): boolean {
    return this.isOpen && version === this.checklistLoadVersion;
  }

  private async runChecklistMutation(
    cardId: Card['id'],
    action: () => Promise<BoardsCommandResult<unknown>>
  ): Promise<boolean> {
    this.beginChecklistMutation(cardId);
    try {
      const result = await action();
      if (!result.ok) {
        throw new Error(result.error.code);
      }
      return this.loadChecklists(cardId);
    } catch {
      this.failChecklistMutation(
        cardId,
        'boards.cardBack.checklistsSaveFailed'
      );
      return true;
    }
  }

  private async runEntityLinkMutation(
    cardId: Card['id'],
    action: () => Promise<BoardsCommandResult<unknown>>
  ): Promise<CardDetailsEntityLinkActionResult> {
    if (!this.isActiveResolvedCard(cardId)) {
      return { status: 'ignored', shouldRefresh: false };
    }
    this.entityLinksState = {
      cardId,
      status: 'saving',
      error: null,
    };
    try {
      const result = await action();
      if (!result.ok) {
        throw new Error(result.error.code);
      }
      this.entityLinksState = {
        cardId,
        status: 'idle',
        error: null,
      };
      return {
        status: 'confirmed',
        shouldRefresh: this.isActiveCard(cardId),
      };
    } catch {
      this.entityLinksState = {
        cardId,
        status: 'error',
        error: 'boards.cardLinks.saveFailed',
      };
      return {
        status: 'rejected',
        shouldRefresh: this.isActiveCard(cardId),
      };
    }
  }

  private isActiveCard(cardId: Card['id']): boolean {
    return this.isOpen && this.session.snapshot?.identity.cardId === cardId;
  }

  private isActiveResolvedCard(cardId: Card['id']): boolean {
    return (
      this.isActiveCard(cardId) &&
      this.session.snapshot?.identity.isResolved === true
    );
  }

  private requireChecklistPorts(): CardDetailsChecklistPorts {
    if (!this.checklistPorts) {
      throw new Error('Card details checklist ports are not configured.');
    }
    return this.checklistPorts;
  }

  private requireEntityLinkPorts(): CardDetailsEntityLinkPorts {
    if (!this.entityLinkPorts) {
      throw new Error('Card details entity link ports are not configured.');
    }
    return this.entityLinkPorts;
  }
}
