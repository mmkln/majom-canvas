export type HudOverlayKind = 'board-selector' | 'canvas-menu' | 'board-details';

export type HudOverlaySnapshot = {
  ownerId: string;
  kind: HudOverlayKind;
  payload?: unknown;
};

type HudOverlayDescriptor = HudOverlaySnapshot & {
  onForceClose?: () => void;
};

/**
 * Keeps a single active HUD overlay at a time on mobile.
 */
export class HudOverlayCoordinator {
  private active: HudOverlayDescriptor | null = null;

  public open(descriptor: HudOverlayDescriptor): void {
    const current = this.active;
    const sameOwner = current?.ownerId === descriptor.ownerId;
    const sameKind = current?.kind === descriptor.kind;
    if (current && (!sameOwner || !sameKind)) {
      current.onForceClose?.();
    }
    this.active = descriptor;
  }

  public close(ownerId: string, kind?: HudOverlayKind): void {
    if (!this.active) return;
    if (this.active.ownerId !== ownerId) return;
    if (kind && this.active.kind !== kind) return;
    this.active = null;
  }

  public clear(): void {
    this.active = null;
  }

  public getActive(): HudOverlaySnapshot | null {
    if (!this.active) return null;
    return {
      ownerId: this.active.ownerId,
      kind: this.active.kind,
      payload: this.active.payload,
    };
  }
}
