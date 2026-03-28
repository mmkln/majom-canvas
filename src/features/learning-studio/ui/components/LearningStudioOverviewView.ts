import type { AppRuntime } from '../../../../app-runtime/index.ts';
import { createIcon, type IconName } from '../../../../ui-lib/src/hud/icons.ts';
import {
  ActionButton,
  IconChip,
  IconButton,
  InlineTextEditor,
  InteractiveRow,
  PillBadge,
  rowMetaClass,
  rowTitleClass,
  sectionEmptyBodyClass,
  sectionEmptyTitleClass,
  SectionTitle,
  Surface,
} from './primitives/index.ts';
import type {
  LearningStudioOverviewModel,
  LearningStudioOverviewReadinessIssue,
} from './LearningStudioScreenModels.ts';

const MAX_VISIBLE_STRUCTURE_MODULES = 6;

type LearningStudioOverviewSavePayload = {
  title: string;
  description: string;
};

type LearningStudioOverviewViewOptions = {
  runtime: AppRuntime;
  course: LearningStudioOverviewModel;
  onOpenStage: (route: 'build' | 'preview') => void;
  onSaveOverview: (payload: LearningStudioOverviewSavePayload) => void;
  onSelectModule?: (moduleId: string) => void;
  onOpenSettings?: () => void;
  onPublishCourse?: () => void;
};

type ReadinessMessage = {
  severity: 'critical' | 'warning' | 'ready';
  typeLabel: string;
  title: string;
  description: string;
  icon: IconName;
};

type StructureModuleStatus = {
  label: string;
  labelClass: string;
  barClass: string;
  fillClass: string;
};

export class LearningStudioOverviewView {
  public readonly element: HTMLDivElement;
  private inlineDraft: LearningStudioOverviewSavePayload | null = null;

  constructor(private options: LearningStudioOverviewViewOptions) {
    this.element = document.createElement('div');
    this.element.className =
      'mx-auto flex w-full max-w-[1180px] flex-col gap-4 p-4 md:px-5 lg:px-6';
    this.render();
  }

  public update(options: LearningStudioOverviewViewOptions): void {
    if (this.options.course.courseId !== options.course.courseId) {
      this.inlineDraft = null;
    } else if (
      this.options.course.title !== options.course.title ||
      this.options.course.description !== options.course.description
    ) {
      this.inlineDraft = null;
    }
    this.options = options;
    this.render();
  }

  private render(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col gap-4';
    wrapper.dataset.role = 'learning-studio-overview';

    wrapper.append(
      this.renderPageMetaBar(),
      this.renderReadinessCard(),
      this.renderStructureCard(),
      this.renderFooter()
    );
    this.element.replaceChildren(wrapper);
  }

  private renderPageMetaBar(): HTMLElement {
    const bar = Surface({
      tone: 'card',
      padding: 'section',
      dataRole: 'learning-studio-overview-page-meta',
    });

    const row = document.createElement('div');
    row.className =
      'flex flex-wrap items-center justify-between gap-3 md:flex-nowrap';

    const left = document.createElement('div');
    left.className = 'flex min-w-0 flex-wrap items-center gap-2';
    left.append(this.createVersionBadge(), this.createLifecycleBadge());

    const right = Surface({
      tagName: 'div',
      tone: 'muted',
      radius: '2xl',
      className: 'flex shrink-0 items-center gap-2 p-1.5',
      dataRole: 'learning-studio-overview-actions-surface',
    });
    right.append(this.createSettingsButton(), this.createPublishButton());

    const content = document.createElement('div');
    content.className = 'mt-5 flex min-w-0 flex-col gap-2.5 md:mt-6';
    content.append(
      this.createCourseTitleEditor(),
      this.createCourseDescriptionEditor()
    );

    row.append(left, right);
    bar.append(row, content);
    return bar;
  }

  private renderReadinessCard(): HTMLElement {
    const { i18n } = this.options.runtime;
    const messages = this.buildReadinessMessages();
    const card = Surface({
      tone: 'card',
      padding: 'section',
      dataRole: 'learning-studio-overview-readiness',
    });

    card.append(
      SectionTitle({
        text: i18n.t('learningStudio.overview.readinessTitle'),
        tone: 'muted',
      })
    );

    const layout = document.createElement('div');
    layout.className = 'mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.8fr)]';
    layout.dataset.role = 'learning-studio-overview-readiness-layout';

    const messagesBlock = document.createElement('div');
    messagesBlock.className = 'grid gap-2.5';
    messagesBlock.dataset.role = 'learning-studio-overview-readiness-messages';

    messages.forEach((message) => {
      messagesBlock.append(this.renderReadinessMessage(message));
    });

    layout.append(messagesBlock, this.renderReadinessNextStepPanel());
    card.append(layout);
    return card;
  }

  private renderStructureCard(): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = Surface({
      tone: 'card',
      padding: 'section',
      dataRole: 'learning-studio-overview-structure',
    });

    const header = document.createElement('div');
    header.className = 'space-y-2';

    header.append(
      SectionTitle({
        text: i18n.t('learningStudio.overview.structureTitle'),
        tone: 'muted',
      })
    );
    card.append(header);

    if (this.options.course.structure.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'mt-4 px-1 py-5';

      const emptyTitle = document.createElement('h4');
      emptyTitle.className = sectionEmptyTitleClass;
      emptyTitle.textContent = i18n.t(
        'learningStudio.overview.structureEmptyTitle'
      );

      const emptyBody = document.createElement('p');
      emptyBody.className = `mt-2 ${sectionEmptyBodyClass}`;
      emptyBody.textContent = i18n.t(
        'learningStudio.overview.structureEmptyBody'
      );

      empty.append(emptyTitle, emptyBody);
      card.append(empty);
      return card;
    }

    const list = document.createElement('div');
    list.className = 'mt-5 grid gap-2';

    const visibleModules = this.options.course.structure.slice(
      0,
      MAX_VISIBLE_STRUCTURE_MODULES
    );

    visibleModules.forEach((module, index) => {
      const status = this.getStructureModuleStatus(module);
      const item = InteractiveRow({
        className:
          'grid grid-cols-[48px_minmax(0,1fr)_96px] items-center gap-4 px-3 py-4',
        dataRole: 'learning-studio-overview-structure-module',
        onClick: () => {
          if (this.options.onSelectModule) {
            this.options.onSelectModule(module.id);
            return;
          }
          this.options.onOpenStage('build');
        },
      });

      const details = document.createElement('div');
      details.className = 'min-w-0 self-center';

      const title = document.createElement('h4');
      title.className = rowTitleClass;
      title.dataset.role = 'learning-studio-overview-structure-module-title';
      title.textContent =
        module.title.trim().length > 0
          ? module.title
          : `${i18n.t('learningStudio.module.defaultTitle')} ${index + 1}`;

      const meta = document.createElement('div');
      meta.className = 'mt-2 flex flex-wrap items-center gap-3';

      const lessonCount = document.createElement('span');
      lessonCount.className = rowMetaClass;
      lessonCount.dataset.role =
        'learning-studio-overview-structure-module-lessons';
      lessonCount.textContent = i18n.t('learningStudio.overview.moduleLessons', {
        count: String(module.lessonCount),
      });

      const statusLabel = document.createElement('span');
      statusLabel.className = status.labelClass;
      statusLabel.dataset.role =
        'learning-studio-overview-structure-module-status';
      statusLabel.textContent = status.label;

      meta.append(lessonCount, statusLabel);
      details.append(title, meta);

      const order = document.createElement('div');
      order.className =
        'flex h-12 w-12 items-center justify-center self-center rounded-2xl bg-slate-100 text-sm font-semibold tracking-[0.08em] text-slate-500';
      order.dataset.role = 'learning-studio-overview-structure-module-order';
      order.textContent = String(index + 1).padStart(2, '0');

      const progressBar = document.createElement('div');
      progressBar.className =
        'flex h-2 w-full self-center overflow-hidden rounded-full bg-slate-200';
      progressBar.dataset.role = 'learning-studio-overview-structure-module-bar';

      const progressFill = document.createElement('div');
      progressFill.className = `h-full rounded-full ${status.barClass} ${status.fillClass}`;
      progressFill.dataset.role =
        'learning-studio-overview-structure-module-bar-fill';

      progressBar.append(progressFill);

      item.append(order, details, progressBar);
      list.append(item);
    });

    card.append(list);

    const hiddenModuleCount =
      this.options.course.structure.length - visibleModules.length;
    if (hiddenModuleCount > 0) {
      const more = document.createElement('p');
      more.className = 'mt-4 text-sm leading-6 text-slate-500';
      more.dataset.role = 'learning-studio-overview-structure-more';
      more.textContent = i18n.t(
        'learningStudio.overview.structureMoreModules',
        {
          count: String(hiddenModuleCount),
        }
      );
      card.append(more);
    }

    return card;
  }

  private getReadinessIssues(): LearningStudioOverviewReadinessIssue[] {
    return (this.options.course.readinessIssues ?? []).slice(0, 4);
  }

  private buildReadinessMessages(): ReadinessMessage[] {
    const { i18n } = this.options.runtime;
    const issues = this.getReadinessIssues();

    if (issues.length === 0) {
      return [
        {
          severity: 'ready',
          typeLabel: i18n.t('learningStudio.overview.issueTypeReady'),
          title: i18n.t('learningStudio.overview.readinessReadyTitle'),
          description: i18n.t('learningStudio.overview.readinessReadyBody'),
          icon: 'check-circle',
        },
      ];
    }

    return issues.map((issue) => ({
      severity:
        issue.kind === 'lessons_need_descriptions' ? 'warning' : 'critical',
      typeLabel: i18n.t(
        issue.kind === 'lessons_need_descriptions'
          ? 'learningStudio.overview.issueTypeWarning'
          : 'learningStudio.overview.issueTypeCritical'
      ),
      title: this.getReadinessIssueText(issue),
      description: this.getReadinessIssueDescription(issue),
      icon:
        issue.kind === 'lessons_need_descriptions'
          ? 'exclamation-circle'
          : 'shield-exclamation',
    }));
  }

  private getStructureModuleStatus(module: {
    lessonCount: number;
    warning?: 'needs_lessons' | null;
  }): StructureModuleStatus {
    const { i18n } = this.options.runtime;
    if (module.warning === 'needs_lessons' || module.lessonCount === 0) {
      return {
        label: i18n.t('learningStudio.overview.moduleNeedsLessons'),
        labelClass:
          'text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700',
        barClass: 'bg-amber-400',
        fillClass: 'w-2/5',
      };
    }

    return {
      label: i18n.t('learningStudio.overview.moduleReady'),
      labelClass:
        'text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700',
      barClass: 'bg-emerald-400',
      fillClass: 'w-full',
    };
  }

  private renderReadinessMessage(message: ReadinessMessage): HTMLElement {
    const item = document.createElement('article');
    item.className = this.getReadinessMessageClass(message.severity);
    item.dataset.role = 'learning-studio-overview-readiness-issue';
    item.dataset.severity = message.severity;

    const iconWrap = IconChip({
      icon: message.icon,
      tone: this.getReadinessMessageIconTone(message.severity),
      className: 'mt-0.5 h-9 w-9',
    });

    const copy = document.createElement('div');
    copy.className = 'min-w-0';

    const type = document.createElement('p');
    type.className = this.getReadinessMessageTypeClass(message.severity);
    type.textContent = message.typeLabel;

    const title = document.createElement('h4');
    title.className = `mt-1 ${rowTitleClass}`;
    title.dataset.role = 'learning-studio-overview-readiness-issue-title';
    title.textContent = message.title;

    const description = document.createElement('p');
    description.className = 'mt-1 text-[13px] leading-6 text-slate-500';
    description.dataset.role =
      'learning-studio-overview-readiness-issue-description';
    description.textContent = message.description;

    copy.append(type, title, description);
    item.append(iconWrap, copy);
    return item;
  }

  private createCourseTitleEditor(): HTMLElement {
    const { i18n } = this.options.runtime;
    return new InlineTextEditor({
      value: this.getInlineOverviewValue().title,
      placeholder: i18n.t('learningStudio.placeholders.courseTitle'),
      displayClassName:
        'text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl',
      inputClassName:
        'min-h-0 w-full resize-none overflow-hidden bg-transparent p-0 text-4xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300 md:text-5xl',
      emptyClassName: 'text-slate-300',
      displayDataRole: 'learning-studio-overview-course-title',
      editorDataRole: 'learning-studio-overview-course-title-editor',
      onCommit: (title) => this.saveInlineOverview({ title }),
    }).element;
  }

  private createCourseDescriptionEditor(): HTMLElement {
    const { i18n } = this.options.runtime;
    return new InlineTextEditor({
      value: this.getInlineOverviewValue().description,
      placeholder: i18n.t('learningStudio.placeholders.courseDescription'),
      multiline: true,
      displayClassName:
        'max-w-3xl whitespace-pre-wrap text-[15px] leading-7 text-slate-500 md:text-base',
      inputClassName:
        'min-h-0 w-full max-w-3xl resize-none overflow-hidden bg-transparent p-0 text-[15px] leading-7 text-slate-500 outline-none placeholder:text-slate-300 md:text-base',
      emptyClassName: 'text-slate-300',
      displayDataRole: 'learning-studio-overview-course-description',
      editorDataRole: 'learning-studio-overview-course-description-editor',
      onCommit: (description) => this.saveInlineOverview({ description }),
    }).element;
  }

  private getInlineOverviewValue(): LearningStudioOverviewSavePayload {
    return (
      this.inlineDraft ?? {
        title: this.options.course.title,
        description: this.options.course.description,
      }
    );
  }

  private saveInlineOverview(
    patch: Partial<LearningStudioOverviewSavePayload>
  ): void {
    const current = this.getInlineOverviewValue();
    const next = {
      title: (patch.title ?? current.title).trim(),
      description: (patch.description ?? current.description).trim(),
    };
    this.inlineDraft = next;
    this.options.onSaveOverview(next);
  }

  private createVersionBadge(): HTMLSpanElement {
    const badge = PillBadge({
      label: this.getVersionBadgeLabel(),
      tone: 'neutral',
      size: 'sm',
      dataRole: 'learning-studio-overview-version-badge',
    });
    return badge;
  }

  private createLifecycleBadge(): HTMLSpanElement {
    const badge = PillBadge({
      label: this.getWorkStatusLabel(),
      tone: this.getLifecycleBadgeTone(),
      size: 'sm',
      dataRole: 'learning-studio-overview-status-badge',
    });
    return badge;
  }

  private createSettingsButton(): HTMLButtonElement {
    const { i18n } = this.options.runtime;
    const button = IconButton({
      icon: 'cog-6-tooth',
      tone: 'ghost',
      size: 'sm',
      title: i18n.t('learningStudio.shell.settings'),
      ariaLabel: i18n.t('learningStudio.shell.settings'),
      dataRole: 'learning-studio-overview-open-settings',
      onClick: this.options.onOpenSettings,
    });
    return button;
  }

  private createPublishButton(): HTMLButtonElement {
    const { i18n } = this.options.runtime;
    const button = ActionButton({
      label: i18n.t('learningStudio.shell.publish'),
      tone: 'primary',
      size: 'sm',
      dataRole: 'learning-studio-overview-publish',
      onClick: this.options.onPublishCourse,
    });
    return button;
  }

  private getVersionBadgeLabel(): string {
    const { i18n } = this.options.runtime;
    return i18n.t('learningStudio.shell.versionState', {
      state: i18n.t(`learningStudio.status.${this.getVersionState()}`),
      version: String(this.getCurrentVersionNumber()),
    });
  }

  private getVersionState(): 'draft' | 'published' | 'archived' {
    if (this.options.course.lifecycleState === 'archived') {
      return 'archived';
    }
    if (
      this.options.course.lifecycleState === 'draft' ||
      this.options.course.hasUnpublishedChanges === true ||
      !this.options.course.latestPublishedVersionId
    ) {
      return 'draft';
    }
    return 'published';
  }

  private getCurrentVersionNumber(): number {
    const versionId = this.options.course.latestPublishedVersionId;
    const publishedVersion = versionId
      ? Number(versionId.match(/(\d+)(?!.*\d)/)?.[1] ?? '0')
      : 0;

    if (publishedVersion > 0) {
      return this.options.course.hasUnpublishedChanges
        ? publishedVersion + 1
        : publishedVersion;
    }

    return 1;
  }

  private getReadinessIssueText(
    issue: LearningStudioOverviewReadinessIssue
  ): string {
    const { i18n } = this.options.runtime;

    switch (issue.kind) {
      case 'missing_title':
        return i18n.t('learningStudio.overview.issueMissingTitle');
      case 'missing_description':
        return i18n.t('learningStudio.overview.issueMissingDescription');
      case 'missing_modules':
        return i18n.t('learningStudio.overview.issueMissingModules');
      case 'modules_need_lessons':
        return i18n.t('learningStudio.overview.issueModulesNeedLessons', {
          count: String(issue.count),
        });
      case 'lessons_need_descriptions':
        return i18n.t('learningStudio.overview.issueLessonsNeedDescriptions', {
          count: String(issue.count),
        });
    }
  }

  private getReadinessIssueDescription(
    issue: LearningStudioOverviewReadinessIssue
  ): string {
    const { i18n } = this.options.runtime;

    switch (issue.kind) {
      case 'missing_title':
      case 'missing_description':
        return i18n.t('learningStudio.overview.nextBuildReasonBasics');
      case 'missing_modules':
        return i18n.t('learningStudio.overview.nextBuildReasonMissingModules');
      case 'modules_need_lessons':
        return i18n.t(
          'learningStudio.overview.nextBuildReasonModulesNeedLessons',
          {
            count: String(issue.count),
          }
        );
      case 'lessons_need_descriptions':
        return i18n.t(
          'learningStudio.overview.issueLessonsNeedDescriptionsDetail',
          {
            count: String(issue.count),
          }
        );
    }
  }

  private getNextStepTitle(): string {
    return this.options.course.nextRecommendedRoute === 'build'
      ? this.options.runtime.i18n.t('learningStudio.overview.nextBuildTitle')
      : this.options.runtime.i18n.t('learningStudio.overview.nextLearnTitle');
  }

  private renderReadinessNextStepPanel(): HTMLElement {
    const { i18n } = this.options.runtime;
    const panel = Surface({
      tagName: 'aside',
      tone: 'dark',
      radius: '2xl',
      padding: 'section',
      className: 'flex min-h-[220px] flex-col justify-between',
      dataRole: 'learning-studio-overview-next-step-panel',
    });

    const copy = document.createElement('div');
    copy.className = 'min-w-0';

    const title = PillBadge({
      label: i18n.t('learningStudio.overview.nextTitle'),
      tone: 'inverted',
      size: 'sm',
      dataRole: 'learning-studio-overview-next-step-badge',
    });

    const heading = document.createElement('h4');
    heading.className =
      'mt-3.5 max-w-[18ch] text-lg font-semibold tracking-tight text-white md:text-[1.375rem]';
    heading.dataset.role = 'learning-studio-overview-next-step-title';
    heading.textContent = this.getNextStepTitle();

    copy.append(title, heading);

    const action = ActionButton({
      label: i18n.t('learningStudio.overview.startWorkCta'),
      tone: 'inverted',
      size: 'md',
      icon: 'arrow-right',
      iconPlacement: 'trailing',
      iconSize: 14,
      iconStrokeWidth: 2,
      className: 'self-start',
      dataRole: 'learning-studio-overview-next-step',
      onClick: () =>
        this.options.onOpenStage(this.options.course.nextRecommendedRoute),
    });
    panel.append(copy, action);
    return panel;
  }

  private renderFooter(): HTMLElement {
    const { i18n } = this.options.runtime;
    const footer = document.createElement('footer');
    footer.className = 'px-1 pb-2 pt-1';
    footer.dataset.role = 'learning-studio-overview-footer';

    const updated = document.createElement('p');
    updated.className = rowMetaClass;
    updated.dataset.role = 'learning-studio-overview-footer-updated';
    updated.textContent = i18n.t('learningStudio.overview.footerUpdatedAt', {
      date: this.formatOverviewDate(this.options.course.updatedAt),
    });

    footer.append(updated);
    return footer;
  }

  private formatOverviewDate(value: string): string {
    return this.options.runtime.i18n.formatDate(value, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private getReadinessMessageClass(
    severity: ReadinessMessage['severity']
  ): string {
    return 'flex items-start gap-4 rounded-[18px] bg-slate-50 px-4 py-4 md:px-5';
  }

  private getReadinessMessageIconTone(
    severity: ReadinessMessage['severity']
  ): 'danger' | 'warning' | 'success' {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'ready':
      default:
        return 'success';
    }
  }

  private getReadinessMessageTypeClass(
    severity: ReadinessMessage['severity']
  ): string {
    switch (severity) {
      case 'critical':
        return 'text-[11px] font-semibold tracking-[0.08em] text-rose-700';
      case 'warning':
        return 'text-[11px] font-semibold tracking-[0.08em] text-amber-700';
      case 'ready':
      default:
        return 'text-[11px] font-semibold tracking-[0.08em] text-emerald-700';
    }
  }

  private getLifecycleBadgeTone():
    | 'info'
    | 'warning'
    | 'success'
    | 'danger' {
    switch (this.getWorkStatusKind()) {
      case 'ready':
        return 'success';
      case 'review':
        return 'warning';
      case 'archived':
        return 'danger';
      case 'progress':
      default:
        return 'info';
    }
  }

  private getWorkStatusKind():
    | 'progress'
    | 'review'
    | 'ready'
    | 'archived' {
    if (this.options.course.lifecycleState === 'archived') {
      return 'archived';
    }

    const issues = this.getReadinessIssues();
    if (issues.length === 0) {
      return 'ready';
    }

    const hasCriticalIssue = issues.some(
      (issue) => issue.kind !== 'lessons_need_descriptions'
    );
    return hasCriticalIssue ? 'progress' : 'review';
  }

  private getWorkStatusLabel(): string {
    const { i18n } = this.options.runtime;
    switch (this.getWorkStatusKind()) {
      case 'ready':
        return i18n.t('learningStudio.overview.workStatusReady');
      case 'review':
        return i18n.t('learningStudio.overview.workStatusNeedsReview');
      case 'archived':
        return i18n.t('learningStudio.overview.workStatusArchived');
      case 'progress':
      default:
        return i18n.t('learningStudio.overview.workStatusInProgress');
    }
  }
}
