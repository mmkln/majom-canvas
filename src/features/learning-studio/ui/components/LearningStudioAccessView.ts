import { Button } from '../../../../ui-lib/src/components/Button.ts';
import type { AppRuntime } from '../../../../app-runtime/index.ts';

export type LearningStudioAccessParticipantStatus =
  | 'active'
  | 'pending'
  | 'revoked';

export type LearningStudioAccessParticipant = {
  id: string;
  name: string;
  email?: string;
  role: 'learner' | 'viewer' | 'editor';
  status: LearningStudioAccessParticipantStatus;
  joinedAt?: string;
};

export type LearningStudioAccessViewOptions = {
  runtime: AppRuntime;
  courseTitle: string;
  shareLink?: string;
  participants: LearningStudioAccessParticipant[];
  onInviteLearner?: () => void;
  onCopyShareLink?: () => void;
  onRevokeAccess?: (participantId: string) => void;
};

export class LearningStudioAccessView {
  public readonly element: HTMLDivElement;

  constructor(private options: LearningStudioAccessViewOptions) {
    this.element = document.createElement('div');
    this.element.className =
      'rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
    this.render();
  }

  public update(options: LearningStudioAccessViewOptions): void {
    this.options = options;
    this.render();
  }

  private render(): void {
    const { i18n } = this.options.runtime;

    const header = document.createElement('div');
    header.className = 'space-y-1';
    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.access.title');
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm leading-6 text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.access.subtitle', {
      courseTitle: this.options.courseTitle,
    });
    header.append(title, subtitle);

    const shareCard = document.createElement('section');
    shareCard.className =
      'mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3';

    const shareLabel = document.createElement('p');
    shareLabel.className = 'text-sm font-medium text-slate-700';
    shareLabel.textContent = i18n.t('learningStudio.access.shareLinkLabel');

    const shareValue = document.createElement('p');
    shareValue.className =
      'break-all rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700';
    shareValue.textContent =
      this.options.shareLink ?? i18n.t('learningStudio.access.shareLinkFallback');

    const shareActions = document.createElement('div');
    shareActions.className = 'flex flex-wrap gap-2';
    const inviteButton = new Button({
      text: i18n.t('learningStudio.access.inviteCta'),
      variant: 'accent',
      size: 'sm',
      onClick: () => this.options.onInviteLearner?.(),
    });
    const copyButton = new Button({
      text: i18n.t('learningStudio.access.copyLinkCta'),
      variant: 'secondary',
      size: 'sm',
      onClick: () => this.options.onCopyShareLink?.(),
    });
    shareActions.append(inviteButton.getElement(), copyButton.getElement());

    const note = document.createElement('p');
    note.className = 'text-sm leading-6 text-slate-600';
    note.textContent = i18n.t('learningStudio.access.localPrototypeNotice');

    shareCard.append(shareLabel, shareValue, shareActions, note);

    const listHeader = document.createElement('div');
    listHeader.className = 'mt-5 flex items-center justify-between gap-3';
    const listTitle = document.createElement('h3');
    listTitle.className = 'text-base font-semibold text-slate-950';
    listTitle.textContent = i18n.t('learningStudio.access.participantsTitle');
    const listCount = document.createElement('p');
    listCount.className = 'text-sm text-slate-500';
    listCount.textContent = i18n.t('learningStudio.access.participantsCount', {
      count: String(this.options.participants.length),
    });
    listHeader.append(listTitle, listCount);

    const list = document.createElement('div');
    list.className = 'mt-3 space-y-3';

    if (this.options.participants.length === 0) {
      const empty = document.createElement('p');
      empty.className =
        'rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm leading-6 text-slate-600';
      empty.textContent = i18n.t('learningStudio.access.participantsEmpty');
      list.append(empty);
    } else {
      this.options.participants.forEach((participant) => {
        const row = document.createElement('article');
        row.className =
          'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between';

        const info = document.createElement('div');
        info.className = 'min-w-0 space-y-1';
        const name = document.createElement('p');
        name.className = 'text-sm font-semibold text-slate-950';
        name.textContent = participant.name;
        const meta = document.createElement('p');
        meta.className = 'text-xs uppercase tracking-[0.14em] text-slate-500';
        meta.textContent = [
          i18n.t(`learningStudio.access.role.${participant.role}`),
          i18n.t(`learningStudio.access.status.${participant.status}`),
          participant.email ?? '',
        ]
          .filter((value) => value.length > 0)
          .join(' · ');
        info.append(name, meta);

        const actions = document.createElement('div');
        actions.className = 'flex flex-wrap gap-2';
        const revokeButton = new Button({
          text: i18n.t('learningStudio.access.revokeCta'),
          variant: 'ghost',
          size: 'sm',
          disabled: participant.status === 'revoked',
          onClick: () => this.options.onRevokeAccess?.(participant.id),
        });
        actions.append(revokeButton.getElement());

        row.append(info, actions);
        list.append(row);
      });
    }

    this.element.replaceChildren(header, shareCard, listHeader, list);
  }
}
