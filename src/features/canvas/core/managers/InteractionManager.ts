import { PanZoomManager } from './PanZoomManager.ts';
import { Scene } from '../scene/Scene.ts';
import { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type { IConnection } from '../interfaces/connection.ts';
import {
  AllowAllRelationPolicy,
  type ConnectableOrderResolver,
  type DragGroupResolver,
  InteractionRuntime,
  type InteractionCommandSink,
  type InteractionEventSink,
  type RelationPolicy,
  type TopElementResolver,
} from 'majom-canvas-core';
import {
  createDefaultConnectionInteractionAdapter,
} from '../adapters/ConnectionInteractionAdapter.ts';
import {
  noopConnectionLifecycleAdapter,
  type ConnectionLifecycleAdapter,
} from '../adapters/ConnectionLifecycleAdapter.ts';
import {
  NoopTaskDropPreviewAdapter,
  type StoryDropPlan,
  type StoryResizePreview,
  type TaskDropPlaceholder,
  type TaskDropPreviewAdapter,
  type TaskReflowPreview,
} from '../adapters/TaskDropPreviewAdapter.ts';
import {
  NoopTaskStoryLayoutAdapter,
  type TaskStoryLayoutAdapter,
} from '../adapters/TaskStoryLayoutAdapter.ts';
import {
  NoopStoryResizeLayoutAdapter,
  type ResizableCanvasElement,
  type StoryResizeLayoutAdapter,
} from '../adapters/StoryResizeLayoutAdapter.ts';

type TopHitCandidate = ICanvasElement & {
  contains(px: number, py: number): boolean;
};

type InteractionSemantics = {
  isTaskElement?: (element: ICanvasElement | null) => boolean;
  isResizableElement?: (
    element: ICanvasElement
  ) => element is ResizableCanvasElement;
};

const noopInteractionEventSink: InteractionEventSink<ICanvasElement> = {};
const noopInteractionCommandSink: InteractionCommandSink = {};

export class InteractionManager extends InteractionRuntime<
  ICanvasElement,
  IConnectable,
  IConnection,
  PanZoomManager,
  TaskDropPlaceholder,
  StoryDropPlan,
  StoryResizePreview,
  TaskReflowPreview
> {
  constructor(
    canvas: HTMLCanvasElement,
    scene: Scene,
    panZoom: PanZoomManager,
    relationPolicy: RelationPolicy<IConnectable> =
      new AllowAllRelationPolicy<IConnectable>(),
    connectionLifecycleAdapter: ConnectionLifecycleAdapter =
      noopConnectionLifecycleAdapter,
    taskDropPreviewAdapter: TaskDropPreviewAdapter =
      new NoopTaskDropPreviewAdapter(),
    taskStoryLayoutAdapter: TaskStoryLayoutAdapter =
      new NoopTaskStoryLayoutAdapter(),
    storyResizeLayoutAdapter: StoryResizeLayoutAdapter =
      new NoopStoryResizeLayoutAdapter(),
    dragGroupResolver: DragGroupResolver<ICanvasElement>,
    topElementResolver: TopElementResolver<TopHitCandidate>,
    connectableOrderResolver: ConnectableOrderResolver<IConnectable>,
    semantics: InteractionSemantics = {},
    interactionEventSink: InteractionEventSink<ICanvasElement> =
      noopInteractionEventSink,
    interactionCommandSink: InteractionCommandSink =
      noopInteractionCommandSink
  ) {
    super({
      canvas,
      scene,
      panZoom,
      connectionInteraction: createDefaultConnectionInteractionAdapter({
        scene,
        panZoom,
        relationPolicy,
        lifecycleAdapter: connectionLifecycleAdapter,
      }),
      taskDropPreviewAdapter,
      taskStoryLayoutAdapter,
      storyResizeLayoutAdapter,
      dragGroupResolver,
      topElementResolver,
      connectableOrderResolver,
      semantics,
      interactionEventSink,
      interactionCommandSink,
    });
  }
}

export type { InteractionCommandSink, InteractionEventSink };

