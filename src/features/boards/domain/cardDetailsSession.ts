import type {
  Card,
  CardPlacement,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { BoardCardPatch } from './types.ts';
import {
  getBoardCardTagIds,
  haveSameBoardCardTagIds,
  normalizeBoardCardTagIds,
} from './cardTags.ts';

export type CardDetailsDraft = {
  title: string;
  description: string;
  tagIds: number[];
};

export type CardDetailsDirtyState = {
  title: boolean;
  description: boolean;
  tagIds: boolean;
};

export type CardDetailsIdentity = {
  cardId: Card['id'];
  placementId: CardPlacement['id'];
  isResolved: boolean;
};

export type CardDetailsSessionState = {
  identity: CardDetailsIdentity;
  base: CardDetailsDraft;
  draft: CardDetailsDraft;
  dirty: CardDetailsDirtyState;
  requested: {
    tagIds: number[];
  };
  pendingSubmit: boolean;
  closeAfterSubmit: boolean;
  error: string | null;
};

type CardDetailsDraftPatch = Partial<CardDetailsDraft>;

export function createCardDetailsSession(
  card: Card,
  placementId: CardPlacement['id'],
  options: { isResolved: boolean }
): CardDetailsSessionState {
  const base = readCardDetailsDraft(card);
  return {
    identity: {
      cardId: card.id,
      placementId,
      isResolved: options.isResolved,
    },
    base,
    draft: cloneDraft(base),
    dirty: createCleanDirtyState(),
    requested: {
      tagIds: [...base.tagIds],
    },
    pendingSubmit: false,
    closeAfterSubmit: false,
    error: null,
  };
}

export function updateCardDetailsDraft(
  session: CardDetailsSessionState,
  patch: CardDetailsDraftPatch
): CardDetailsSessionState {
  const draft = {
    ...session.draft,
    ...patch,
    tagIds:
      patch.tagIds !== undefined
        ? normalizeBoardCardTagIds(patch.tagIds)
        : session.draft.tagIds,
  };
  return {
    ...session,
    draft,
    dirty: createDirtyState(session.base, draft),
  };
}

export function reconcileCardDetailsSession(
  session: CardDetailsSessionState,
  card: Card,
  placementId: CardPlacement['id'],
  options: { isResolved: boolean }
): CardDetailsSessionState {
  const base = readCardDetailsDraft(card);
  const draft = mergeDraftWithBase(session, base);
  return {
    ...session,
    identity: {
      cardId: card.id,
      placementId,
      isResolved: options.isResolved,
    },
    base,
    draft,
    dirty: createDirtyState(base, draft),
    requested: {
      tagIds: haveSameBoardCardTagIds(session.requested.tagIds, base.tagIds)
        ? [...base.tagIds]
        : [...session.requested.tagIds],
    },
  };
}

export function queueCardDetailsSubmit(
  session: CardDetailsSessionState,
  options: { closeAfterSubmit: boolean }
): CardDetailsSessionState {
  return {
    ...session,
    pendingSubmit: true,
    closeAfterSubmit: options.closeAfterSubmit,
    error: null,
  };
}

export function markCardDetailsSubmitted(
  session: CardDetailsSessionState
): CardDetailsSessionState {
  return {
    ...session,
    pendingSubmit: false,
    closeAfterSubmit: false,
    dirty: createCleanDirtyState(),
    base: cloneDraft(session.draft),
    requested: {
      tagIds: [...session.draft.tagIds],
    },
    error: null,
  };
}

export function updateCardDetailsRequestedTagIds(
  session: CardDetailsSessionState,
  tagIds: number[]
): CardDetailsSessionState {
  return {
    ...session,
    requested: {
      tagIds: normalizeBoardCardTagIds(tagIds),
    },
  };
}

export function createCardDetailsPatch(
  session: CardDetailsSessionState
): BoardCardPatch {
  const patch: BoardCardPatch = {};
  const title = session.draft.title.trim();
  if (session.dirty.title && title !== session.base.title) {
    patch.title = title;
  }
  if (
    session.dirty.description &&
    session.draft.description !== session.base.description
  ) {
    patch.description = session.draft.description;
  }
  if (
    session.dirty.tagIds &&
    !haveSameBoardCardTagIds(session.draft.tagIds, session.base.tagIds) &&
    !haveSameBoardCardTagIds(session.draft.tagIds, session.requested.tagIds)
  ) {
    patch.tag_ids = [...session.draft.tagIds];
  }
  return patch;
}

export function hasCardDetailsPatch(patch: BoardCardPatch): boolean {
  return (
    patch.title !== undefined ||
    patch.description !== undefined ||
    patch.tag_ids !== undefined
  );
}

export function hasRequestedCardDetailsTagIds(
  session: CardDetailsSessionState,
  tagIds: number[]
): boolean {
  return haveSameBoardCardTagIds(session.requested.tagIds, tagIds);
}

function readCardDetailsDraft(card: Card): CardDetailsDraft {
  return {
    title: card.title,
    description: card.description ?? '',
    tagIds: getBoardCardTagIds(card),
  };
}

function cloneDraft(draft: CardDetailsDraft): CardDetailsDraft {
  return {
    title: draft.title,
    description: draft.description,
    tagIds: [...draft.tagIds],
  };
}

function createCleanDirtyState(): CardDetailsDirtyState {
  return {
    title: false,
    description: false,
    tagIds: false,
  };
}

function createDirtyState(
  base: CardDetailsDraft,
  draft: CardDetailsDraft
): CardDetailsDirtyState {
  return {
    title: draft.title.trim() !== base.title,
    description: draft.description !== base.description,
    tagIds: !haveSameBoardCardTagIds(draft.tagIds, base.tagIds),
  };
}

function mergeDraftWithBase(
  session: CardDetailsSessionState,
  base: CardDetailsDraft
): CardDetailsDraft {
  return {
    title: session.dirty.title ? session.draft.title : base.title,
    description: session.dirty.description
      ? session.draft.description
      : base.description,
    tagIds: session.dirty.tagIds ? [...session.draft.tagIds] : [...base.tagIds],
  };
}
