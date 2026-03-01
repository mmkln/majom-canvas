import {
  modalService,
  type OverlayIntent,
  type OverlayPresentation,
} from './ModalService.ts';
import { resolveOverlayPresentation } from './overlayPolicy.ts';

export type OverlayControllerConfig = {
  intent: OverlayIntent;
  source: string;
};

export type OverlayControllerOpenOptions = {
  presentation?: OverlayPresentation;
  registerInService?: boolean;
  blocking?: boolean;
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  restoreFocusTo?: HTMLElement | null;
};

export class OverlayController {
  private overlayId: string | null = null;
  private lastPresentation: OverlayPresentation = 'dialog';

  constructor(private readonly config: OverlayControllerConfig) {}

  public resolvePresentation(
    preferredPresentation?: OverlayPresentation
  ): OverlayPresentation {
    const presentation = resolveOverlayPresentation({
      intent: this.config.intent,
      preferredPresentation,
    });
    this.lastPresentation = presentation;
    return presentation;
  }

  public open(options: OverlayControllerOpenOptions = {}): OverlayPresentation {
    const presentation = this.resolvePresentation(options.presentation);
    const registerInService = options.registerInService ?? true;
    if (!registerInService) {
      this.close();
      return presentation;
    }

    this.close();
    this.overlayId = modalService.open({
      intent: this.config.intent,
      presentation,
      blocking: options.blocking ?? true,
      dismissOnBackdrop: options.dismissOnBackdrop ?? true,
      dismissOnEscape: options.dismissOnEscape ?? true,
      restoreFocusTo: options.restoreFocusTo ?? null,
      source: this.config.source,
    });
    return presentation;
  }

  public close(): void {
    if (!this.overlayId) return;
    modalService.close(this.overlayId);
    this.overlayId = null;
  }

  public getOverlayId(): string | null {
    return this.overlayId;
  }

  public getLastPresentation(): OverlayPresentation {
    return this.lastPresentation;
  }
}
