import type {
  Card,
  CardPlacement,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  createCardDetailsSession,
  markCardDetailsSubmitted,
  queueCardDetailsSubmit,
  reconcileCardDetailsSession,
  updateCardDetailsDraft,
  updateCardDetailsRequestedTagIds,
  type CardDetailsDraft,
  type CardDetailsSessionState,
} from '../domain/cardDetailsSession.ts';

export class CardDetailsSessionController {
  private state: CardDetailsSessionState | null = null;

  public get snapshot(): CardDetailsSessionState | null {
    return this.state;
  }

  public open(
    card: Card,
    placementId: CardPlacement['id'],
    options: { isResolved: boolean }
  ): CardDetailsSessionState {
    this.state = createCardDetailsSession(card, placementId, options);
    return this.state;
  }

  public close(): void {
    this.state = null;
  }

  public updateDraft(
    patch: Partial<CardDetailsDraft>
  ): CardDetailsSessionState | null {
    if (!this.state) return null;
    this.state = updateCardDetailsDraft(this.state, patch);
    return this.state;
  }

  public reconcile(
    card: Card,
    placementId: CardPlacement['id'],
    options: { isResolved: boolean }
  ): CardDetailsSessionState | null {
    if (!this.state) return null;
    this.state = reconcileCardDetailsSession(
      this.state,
      card,
      placementId,
      options
    );
    return this.state;
  }

  public queueSubmit(options: {
    closeAfterSubmit: boolean;
  }): CardDetailsSessionState | null {
    if (!this.state) return null;
    this.state = queueCardDetailsSubmit(this.state, options);
    return this.state;
  }

  public markSubmitted(): CardDetailsSessionState | null {
    if (!this.state) return null;
    this.state = markCardDetailsSubmitted(this.state);
    return this.state;
  }

  public updateRequestedTagIds(
    tagIds: number[]
  ): CardDetailsSessionState | null {
    if (!this.state) return null;
    this.state = updateCardDetailsRequestedTagIds(this.state, tagIds);
    return this.state;
  }
}
