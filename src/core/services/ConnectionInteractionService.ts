// src/core/services/ConnectionInteractionService.ts
import { Scene } from '../scene/Scene.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type { ConnectionPoint } from '../interfaces/shape.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import { Task } from '../../elements/Task.ts';
import { Story } from '../../elements/Story.ts';
import { getOrderedConnectables } from '../utils/connectableUtils.ts';
import type { IConnection } from '../interfaces/connection.ts';
import { historyService } from './HistoryService.ts';
import { ConnectCommand } from '../commands/ConnectCommand.ts';

export class ConnectionInteractionService {
  private creating = false;
  private startShape: IConnectable | null = null;
  private startPoint: ConnectionPoint | null = null;
  private tempLine: { startX: number; startY: number; endX: number; endY: number } | null = null;

  constructor(private scene: Scene, private panZoom: PanZoomManager) {}

  /** Hit test existing connections */
  public hitTest(x: number, y: number): IConnection | null {
    const planningEls = this.scene.getElements().filter(isPlanningElement) as IPlanningElement[];
    const connectables: IConnectable[] = [...this.scene.getShapes(), ...planningEls];
    const connections = this.scene.getConnections();
    for (let i = connections.length - 1; i >= 0; i--) {
      const conn = connections[i];
      // use fixed screen-pixel tolerance (5px)
      const tol = 5 / this.panZoom.scale;
      if (conn.isNearPoint(x, y, connectables, tol)) {
        return conn;
      }
    }
    return null;
  }

  /** Start drawing a new connection */
  public start(x: number, y: number): boolean {
    const connectables = getOrderedConnectables(this.scene);
    const hit = this.findPoint(x, y, connectables);
    if (!hit) return false;
    this.creating = true;
    this.startShape = hit.shape;
    this.startPoint = hit.point;
    this.tempLine = { startX: hit.point.x, startY: hit.point.y, endX: x, endY: y };
    this.scene.changes.next();
    return true;
  }

  /** Update the temporary connection line */
  public update(x: number, y: number): boolean {
    if (!this.creating || !this.tempLine) return false;
    this.tempLine.endX = x;
    this.tempLine.endY = y;
    this.scene.changes.next();
    return true;
  }

  /** Finish and execute the connection command */
  public finish(): boolean {
    if (!this.creating || !this.startShape || !this.tempLine) return false;
    let target: IConnectable | null = null;
    const connectables = getOrderedConnectables(this.scene);
    const x = this.tempLine.endX, y = this.tempLine.endY;
    // Try connection point hit
    target = this.findPoint(x, y, connectables)?.shape || null;
    // Fallback to contains hit
    if (!target) {
      for (let i = connectables.length - 1; i >= 0; i--) {
        const el = connectables[i];
        if (el !== this.startShape && el.contains(x, y)) {
          target = el;
          break;
        }
      }
    }
    if (target) {
      const src = this.startShape;
      const dst = target;
      const invalid = (src instanceof Story && dst instanceof Task && src.tasks.some(t => t.id === dst.id))
        || (src instanceof Task && dst instanceof Story && dst.tasks.some(t => t.id === src.id));
      if (!invalid) {
        historyService.execute(new ConnectCommand(this.scene, src.id, dst.id));
      }
    }
    this.creating = false;
    this.startShape = null;
    this.startPoint = null;
    this.tempLine = null;
    this.scene.changes.next();
    return true;
  }

  /** Check if a connection is being created */
  public isCreating(): boolean {
    return this.creating;
  }

  /** Cancel in-progress connection drawing */
  public cancel(): void {
    this.creating = false;
    this.startShape = null;
    this.startPoint = null;
    this.tempLine = null;
    this.scene.changes.next();
  }

  /** Get the temporary line for rendering */
  public getTemporaryLine(): { startX: number; startY: number; endX: number; endY: number } | null {
    return this.tempLine;
  }

  /** Internal helper to find a connection point on shapes */
  private findPoint(x: number, y: number, elements: IConnectable[]): { shape: IConnectable; point: ConnectionPoint } | null {
    for (let i = elements.length - 1; i >= 0; i--) {
      const shape = elements[i];
      const points = shape.getConnectionPoints();
      for (const point of points) {
        const dx = x - point.x;
        const dy = y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 8 / this.panZoom.scale) {
          return { shape, point };
        }
      }
    }
    return null;
  }
}
