import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.ts';
import type {
  Board,
  BoardColumn,
  Card,
  CardPlacement,
} from '../interfaces/index.ts';
import type { PaginatedResponse } from './paginated-response.ts';

export type BoardCreatePayload = Pick<Board, 'title'>;
export type BoardUpdatePayload = Partial<BoardCreatePayload>;

export type BoardColumnCreatePayload = Pick<BoardColumn, 'board' | 'title'> &
  Partial<Pick<BoardColumn, 'order'>> &
  BoardColumnTargetPayload;
export type BoardColumnUpdatePayload = Partial<
  Pick<BoardColumn, 'board' | 'title' | 'order'>
> &
  BoardColumnTargetPayload;
export type BoardColumnTargetPayload = {
  before_column?: BoardColumn['id'] | null;
  after_column?: BoardColumn['id'] | null;
  position?: 'start' | 'end';
};

export type BoardCardCreatePayload = Pick<Card, 'column' | 'title'> &
  Partial<Pick<Card, 'description' | 'tag_ids'>> &
  BoardPlacementTargetPayload;
export type BoardCardUpdatePayload = Partial<
  Pick<Card, 'title' | 'description' | 'tag_ids'>
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
