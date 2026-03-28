import { createModalShell } from '../../../../ui-lib/src/components/Modal.ts';
import { LearningStudioBuildInspectorView } from './LearningStudioBuildInspectorView.ts';

type LearningStudioBuildDetailsModalOptions = ConstructorParameters<
  typeof LearningStudioBuildInspectorView
>[0] & {
  title: string;
  onClose: () => void;
};

export class LearningStudioBuildDetailsModal {
  private overlay: HTMLDivElement | null = null;
  private inspector: LearningStudioBuildInspectorView;

  constructor(private options: LearningStudioBuildDetailsModalOptions) {
    this.inspector = new LearningStudioBuildInspectorView({
      ...options,
      showHeader: false,
    });
    this.mount();
  }

  public update(options: LearningStudioBuildDetailsModalOptions): void {
    this.options = options;
    this.inspector.update({
      ...options,
      showHeader: false,
    });
  }

  public destroy(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  private mount(): void {
    const { overlay, body, footer, divider } = createModalShell(
      this.options.title,
      {
        onClose: () => {
          this.options.onClose();
        },
        intent: 'form',
      }
    );

    overlay.dataset.role = 'learning-studio-build-details-modal';
    body.className = 'min-h-0 max-h-[75vh] overflow-auto p-0';
    body.append(this.inspector.element);
    divider.classList.add('hidden');
    footer.classList.add('hidden');

    this.overlay = overlay;
  }
}
