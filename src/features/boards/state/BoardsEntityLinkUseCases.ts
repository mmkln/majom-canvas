import type {
  Card,
  CardEntityLink,
  CardEntityLinkType,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { BoardsCommandResult } from '../domain/types.ts';
import {
  createBoardsCommandFailure,
  createBoardsCommandSuccess,
} from '../domain/boardsCommandResult.ts';

export type BoardsLinkedEntity = {
  id: number | string;
  uuid?: string | null;
};

export type BoardsEntityLinkUseCasePorts = {
  createTask: (payload: {
    title: string;
    description: string;
    is_standalone: true;
  }) => Promise<BoardsLinkedEntity>;
  createStory: (payload: {
    title: string;
    description: string;
  }) => Promise<BoardsLinkedEntity>;
  createGoal: (payload: {
    title: string;
    description: string;
  }) => Promise<BoardsLinkedEntity>;
  deleteTask: (id: string) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  createCardEntityLink: (
    cardId: Card['id'],
    entityType: CardEntityLinkType,
    entityId: string
  ) => Promise<BoardsCommandResult<CardEntityLink | null>>;
  reloadBoards: () => Promise<void>;
};

export class BoardsEntityLinkUseCases {
  constructor(private readonly ports: BoardsEntityLinkUseCasePorts) {}

  public async createEntityFromCard(
    card: Card,
    entityType: CardEntityLinkType
  ): Promise<BoardsCommandResult<CardEntityLink | null>> {
    try {
      const entity = await this.createEntity(card, entityType);
      return this.ports.createCardEntityLink(
        card.id,
        entityType,
        getLinkedEntityPublicId(entity)
      );
    } catch {
      return createBoardsCommandFailure();
    }
  }

  public async deleteLinkedEntity(
    link: CardEntityLink
  ): Promise<BoardsCommandResult> {
    try {
      if (link.entity_type === 'task') {
        await this.ports.deleteTask(link.entity_id);
      } else if (link.entity_type === 'story') {
        await this.ports.deleteStory(link.entity_id);
      } else {
        await this.ports.deleteGoal(link.entity_id);
      }
      await this.ports.reloadBoards();
      return createBoardsCommandSuccess();
    } catch {
      return createBoardsCommandFailure();
    }
  }

  private createEntity(
    card: Card,
    entityType: CardEntityLinkType
  ): Promise<BoardsLinkedEntity> {
    const basePayload = {
      title: card.title.trim(),
      description: getCardEntityDescription(card.description),
    };
    if (entityType === 'task') {
      return this.ports.createTask({
        ...basePayload,
        is_standalone: true,
      });
    }
    if (entityType === 'story') {
      return this.ports.createStory(basePayload);
    }
    return this.ports.createGoal(basePayload);
  }
}

function getCardEntityDescription(
  description: string | null | undefined
): string {
  return description?.trim() ?? '';
}

function getLinkedEntityPublicId(entity: BoardsLinkedEntity): string {
  return entity.uuid ?? String(entity.id);
}
