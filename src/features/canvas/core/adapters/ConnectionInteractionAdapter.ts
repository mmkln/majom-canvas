import type { Scene } from '../scene/Scene.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import type { IConnection } from '../interfaces/connection.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type {
  ConnectionInteractionAdapter,
  TempConnectionLine,
  RelationPolicy,
} from 'majom-canvas-core';
import { AllowAllRelationPolicy } from 'majom-canvas-core';
import { ConnectionInteractionService } from '../services/ConnectionInteractionService.ts';
import {
  noopConnectionLifecycleAdapter,
  type ConnectionLifecycleAdapter,
} from './ConnectionLifecycleAdapter.ts';

type DefaultConnectionInteractionAdapterOptions = {
  scene: Scene;
  panZoom: PanZoomManager;
  relationPolicy?: RelationPolicy<IConnectable>;
  lifecycleAdapter?: ConnectionLifecycleAdapter;
};

class ServiceBackedConnectionInteractionAdapter
  implements ConnectionInteractionAdapter<IConnection>
{
  private readonly service: ConnectionInteractionService;

  constructor(options: DefaultConnectionInteractionAdapterOptions) {
    this.service = new ConnectionInteractionService(
      options.scene,
      options.panZoom,
      options.relationPolicy,
      options.lifecycleAdapter
    );
  }

  public hitTest(x: number, y: number): IConnection | null {
    return this.service.hitTest(x, y);
  }

  public start(x: number, y: number): boolean {
    return this.service.start(x, y);
  }

  public update(x: number, y: number): boolean {
    return this.service.update(x, y);
  }

  public finish(): boolean {
    return this.service.finish();
  }

  public isCreating(): boolean {
    return this.service.isCreating();
  }

  public cancel(): void {
    this.service.cancel();
  }

  public getTemporaryLine(): TempConnectionLine | null {
    return this.service.getTemporaryLine();
  }
}

export function createDefaultConnectionInteractionAdapter(
  options: DefaultConnectionInteractionAdapterOptions
): ConnectionInteractionAdapter<IConnection> {
  return new ServiceBackedConnectionInteractionAdapter({
    scene: options.scene,
    panZoom: options.panZoom,
    relationPolicy:
      options.relationPolicy ?? new AllowAllRelationPolicy<IConnectable>(),
    lifecycleAdapter: options.lifecycleAdapter ?? noopConnectionLifecycleAdapter,
  });
}

