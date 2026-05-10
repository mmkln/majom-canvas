import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.ts';
import type {
  Board,
  CardCheckItem,
  CardChecklist,
  CardEntityLink,
  BoardColumn,
  Card,
  CardPlacement,
} from '../interfaces/index.ts';
import type { PaginatedResponse } from './paginated-response.ts';

export type BoardCreatePayload = Pick<Board, 'title'> &
  Partial<Pick<Board, 'meta'>>;
export type BoardUpdatePayload = Partial<Pick<Board, 'title' | 'meta'>>;

export type BoardColumnCreatePayload = Pick<BoardColumn, 'board' | 'title'> &
  Partial<Pick<BoardColumn, 'order' | 'meta'>> &
  BoardColumnTargetPayload;
export type BoardColumnUpdatePayload = Partial<
  Pick<BoardColumn, 'board' | 'title' | 'order' | 'meta'>
> &
  BoardColumnTargetPayload;
export type BoardColumnTargetPayload = {
  before_column?: BoardColumn['id'] | null;
  after_column?: BoardColumn['id'] | null;
  position?: 'start' | 'end';
};

export type BoardCardCreatePayload = Pick<Card, 'column' | 'title'> &
  Partial<Pick<Card, 'description' | 'completedAt' | 'tag_ids' | 'meta'>> &
  BoardPlacementTargetPayload;
export type BoardCardUpdatePayload = Partial<
  Pick<Card, 'title' | 'description' | 'completedAt' | 'tag_ids' | 'meta'>
>;
export type CardChecklistCreatePayload = {
  title: string;
  position?: 'top' | 'bottom';
};
export type CardChecklistUpdatePayload = Partial<{
  title: string;
  before_checklist: CardChecklist['id'] | null;
  after_checklist: CardChecklist['id'] | null;
  position: 'top' | 'bottom';
}>;
export type CardCheckItemCreatePayload = {
  title: string;
  state?: CardCheckItem['state'];
  position?: 'top' | 'bottom';
};
export type CardCheckItemUpdatePayload = Partial<{
  title: string;
  state: CardCheckItem['state'];
  checklist: CardChecklist['id'];
  before_item: CardCheckItem['id'] | null;
  after_item: CardCheckItem['id'] | null;
  position: 'top' | 'bottom';
}>;
export type BoardCardEntityLinkCreatePayload = Pick<
  CardEntityLink,
  'card' | 'entity_type' | 'entity_id'
>;
export type BoardCardEntityLinkListParams = Partial<
  Pick<CardEntityLink, 'card' | 'entity_type' | 'entity_id'>
>;
export type BoardPlacementTargetPayload = {
  before_placement?: CardPlacement['id'] | null;
  after_placement?: CardPlacement['id'] | null;
  position?: 'top' | 'bottom';
};
export type BoardCardPlacementCreatePayload = Pick<
  CardPlacement,
  'card' | 'column'
> &
  BoardPlacementTargetPayload;
export type BoardCardPlacementUpdatePayload = Partial<
  Pick<CardPlacement, 'column' | 'archived'>
> &
  BoardPlacementTargetPayload;

function normalizeListResponse<T>(
  response: PaginatedResponse<T> | T[]
): T[] {
  return Array.isArray(response) ? response : response.results;
}

function encodeResourceId(id: string): string {
  return encodeURIComponent(String(id));
}

function buildCardEntityLinkQuery(
  params: BoardCardEntityLinkListParams = {}
): string {
  const query: string[] = [];
  if (params.card) {
    query.push(`card=${encodeURIComponent(params.card)}`);
  }
  if (params.entity_type) {
    query.push(`entity_type=${encodeURIComponent(params.entity_type)}`);
  }
  if (params.entity_id) {
    query.push(`entity_id=${encodeURIComponent(params.entity_id)}`);
  }
  return query.length ? `?${query.join('&')}` : '';
}

export class BoardsApiService {
  constructor(private readonly http: HttpInterceptorClient) {}

  public getBoards(): Observable<Board[]> {
    return this.http
      .get<PaginatedResponse<Board> | Board[]>('/boards/')
      .pipe(map(normalizeListResponse));
  }

  public createBoard(payload: BoardCreatePayload): Observable<Board> {
    return this.http.post<Board>('/boards/', payload);
  }

  public updateBoard(
    boardId: Board['id'],
    payload: BoardUpdatePayload
  ): Observable<Board> {
    return this.http.patch<Board>(
      `/boards/${encodeResourceId(boardId)}/`,
      payload
    );
  }

  public deleteBoard(boardId: Board['id']): Observable<void> {
    return this.http.delete<void>(`/boards/${encodeResourceId(boardId)}/`);
  }

  public createColumn(
    payload: BoardColumnCreatePayload
  ): Observable<BoardColumn> {
    return this.http.post<BoardColumn>('/columns/', payload);
  }

  public updateColumn(
    columnId: BoardColumn['id'],
    payload: BoardColumnUpdatePayload
  ): Observable<BoardColumn> {
    return this.http.patch<BoardColumn>(
      `/columns/${encodeResourceId(columnId)}/`,
      payload
    );
  }

  public deleteColumn(columnId: BoardColumn['id']): Observable<void> {
    return this.http.delete<void>(`/columns/${encodeResourceId(columnId)}/`);
  }

  public createCard(payload: BoardCardCreatePayload): Observable<Card> {
    return this.http.post<Card>('/cards/', payload);
  }

  public updateCard(
    cardId: Card['id'],
    payload: BoardCardUpdatePayload
  ): Observable<Card> {
    return this.http.patch<Card>(
      `/cards/${encodeResourceId(cardId)}/`,
      payload
    );
  }

  public deleteCard(cardId: Card['id']): Observable<void> {
    return this.http.delete<void>(`/cards/${encodeResourceId(cardId)}/`);
  }

  public getCardChecklists(cardId: Card['id']): Observable<CardChecklist[]> {
    return this.http.get<CardChecklist[]>(
      `/cards/${encodeResourceId(cardId)}/checklists/`
    );
  }

  public createCardChecklist(
    cardId: Card['id'],
    payload: CardChecklistCreatePayload
  ): Observable<CardChecklist> {
    return this.http.post<CardChecklist>(
      `/cards/${encodeResourceId(cardId)}/checklists/`,
      payload
    );
  }

  public updateCardChecklist(
    checklistId: CardChecklist['id'],
    payload: CardChecklistUpdatePayload
  ): Observable<CardChecklist> {
    return this.http.patch<CardChecklist>(
      `/card-checklists/${encodeResourceId(checklistId)}/`,
      payload
    );
  }

  public deleteCardChecklist(
    checklistId: CardChecklist['id']
  ): Observable<void> {
    return this.http.delete<void>(
      `/card-checklists/${encodeResourceId(checklistId)}/`
    );
  }

  public createCardCheckItem(
    checklistId: CardChecklist['id'],
    payload: CardCheckItemCreatePayload
  ): Observable<CardCheckItem> {
    return this.http.post<CardCheckItem>(
      `/card-checklists/${encodeResourceId(checklistId)}/items/`,
      payload
    );
  }

  public updateCardCheckItem(
    itemId: CardCheckItem['id'],
    payload: CardCheckItemUpdatePayload
  ): Observable<CardCheckItem> {
    return this.http.patch<CardCheckItem>(
      `/card-check-items/${encodeResourceId(itemId)}/`,
      payload
    );
  }

  public deleteCardCheckItem(itemId: CardCheckItem['id']): Observable<void> {
    return this.http.delete<void>(
      `/card-check-items/${encodeResourceId(itemId)}/`
    );
  }

  public getCardEntityLinks(
    params: BoardCardEntityLinkListParams = {}
  ): Observable<CardEntityLink[]> {
    return this.http
      .get<PaginatedResponse<CardEntityLink> | CardEntityLink[]>(
        `/card-entity-links/${buildCardEntityLinkQuery(params)}`
      )
      .pipe(map(normalizeListResponse));
  }

  public createCardEntityLink(
    payload: BoardCardEntityLinkCreatePayload
  ): Observable<CardEntityLink> {
    return this.http.post<CardEntityLink>('/card-entity-links/', payload);
  }

  public deleteCardEntityLink(
    linkId: CardEntityLink['id']
  ): Observable<void> {
    return this.http.delete<void>(
      `/card-entity-links/${encodeResourceId(linkId)}/`
    );
  }

  public createCardPlacement(
    payload: BoardCardPlacementCreatePayload
  ): Observable<CardPlacement> {
    return this.http.post<CardPlacement>('/card-placements/', payload);
  }

  public updateCardPlacement(
    placementId: CardPlacement['id'],
    payload: BoardCardPlacementUpdatePayload
  ): Observable<CardPlacement> {
    return this.http.patch<CardPlacement>(
      `/card-placements/${encodeResourceId(placementId)}/`,
      payload
    );
  }

  public deleteCardPlacement(placementId: CardPlacement['id']): Observable<void> {
    return this.http.delete<void>(
      `/card-placements/${encodeResourceId(placementId)}/`
    );
  }
}
