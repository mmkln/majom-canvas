import type { AppRuntime } from '../../../../app-runtime/index.ts';
import type {
  LearningStudioBuildInspectorModel,
  LearningStudioBuildModel,
} from './LearningStudioScreenModels.ts';

type LearningStudioBuildInspectorViewOptions = {
  runtime: AppRuntime;
  build: LearningStudioBuildModel;
  showHeader?: boolean;
  onUpdateModuleTitle: (moduleId: string, title: string) => void;
  onUpdateModuleDescription: (moduleId: string, description: string) => void;
  onUpdateUnitTitle: (unitId: string, title: string) => void;
  onUpdateUnitDescription: (unitId: string, description: string) => void;
  onUpdateUnitObjective: (unitId: string, objective: string) => void;
  onTogglePrerequisite: (unitId: string, prerequisiteId: string) => void;
  onAddLessonBlock: (
    unitId: string,
    type:
      | 'intro'
      | 'concept'
      | 'example'
      | 'instruction'
      | 'summary'
      | 'exercise_ref'
      | 'checkpoint_ref'
  ) => void;
  onUpdateLessonBlockType: (
    unitId: string,
    blockId: string,
    type:
      | 'intro'
      | 'concept'
      | 'example'
      | 'instruction'
      | 'summary'
      | 'exercise_ref'
      | 'checkpoint_ref'
  ) => void;
  onUpdateLessonBlockText: (
    unitId: string,
    blockId: string,
    text: string
  ) => void;
  onUpdateLessonBlockReference: (
    unitId: string,
    blockId: string,
    refUnitId: string
  ) => void;
  onMoveLessonBlock: (
    unitId: string,
    blockId: string,
    direction: -1 | 1
  ) => void;
  onRemoveLessonBlock: (unitId: string, blockId: string) => void;
};

const LESSON_TEXT_BLOCK_TYPES = [
  'intro',
  'concept',
  'example',
  'instruction',
  'summary',
] as const;

const LESSON_BLOCK_TYPES = [
  ...LESSON_TEXT_BLOCK_TYPES,
  'exercise_ref',
  'checkpoint_ref',
] as const;

type LessonBlockType = (typeof LESSON_BLOCK_TYPES)[number];

export class LearningStudioBuildInspectorView {
  public readonly element: HTMLDivElement;

  constructor(private options: LearningStudioBuildInspectorViewOptions) {
    this.element = document.createElement('div');
    this.element.className = 'h-full min-h-0';
    this.render();
  }

  public update(options: LearningStudioBuildInspectorViewOptions): void {
    this.options = options;
    this.render();
  }

  private render(): void {
    const { i18n } = this.options.runtime;
    const aside = document.createElement('aside');
    aside.className = 'flex h-full min-h-0 flex-col bg-white';
    aside.dataset.role = 'learning-studio-build-inspector';

    const body = document.createElement('div');
    body.className = 'min-h-0 flex-1 overflow-auto px-4 py-4';

    switch (this.options.build.inspector.kind) {
      case 'course':
        body.append(this.renderCourseInspector(this.options.build.inspector));
        break;
      case 'module':
        body.append(this.renderModuleInspector(this.options.build.inspector));
        break;
      case 'unit':
        body.append(this.renderUnitInspector(this.options.build.inspector));
        break;
    }

    if (this.options.showHeader ?? true) {
      const header = document.createElement('div');
      header.className = 'border-b border-slate-200 px-4 py-3';

      const title = document.createElement('h3');
      title.className = 'text-sm font-semibold text-slate-950';
      title.textContent = i18n.t('learningStudio.authoring.inspectorTitle');

      header.append(title);
      aside.append(header);
    }

    aside.append(body);
    this.element.replaceChildren(aside);
  }

  private renderCourseInspector(
    inspector: Extract<LearningStudioBuildInspectorModel, { kind: 'course' }>
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'space-y-4';

    const title = document.createElement('h4');
    title.className = 'text-base font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.build.inspectorCourseTitle');

    const list = document.createElement('div');
    list.className = 'space-y-2 text-sm text-slate-600';

    [
      i18n.t('learningStudio.home.courseStatsModules', {
        count: String(inspector.moduleCount),
      }),
      i18n.t('learningStudio.home.courseStatsUnits', {
        count: String(inspector.unitCount),
      }),
      inspector.missingModules
        ? i18n.t('learningStudio.build.readinessMissingLessons')
        : i18n.t('learningStudio.build.courseHasStructure'),
      inspector.missingDescriptions > 0
        ? i18n.t('learningStudio.build.courseMissingDescriptions', {
            count: String(inspector.missingDescriptions),
          })
        : i18n.t('learningStudio.build.courseDescriptionsReady'),
    ].forEach((text) => {
      const line = document.createElement('p');
      line.textContent = text;
      list.append(line);
    });

    section.append(title, list);
    return section;
  }

  private renderModuleInspector(
    inspector: Extract<LearningStudioBuildInspectorModel, { kind: 'module' }>
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'space-y-4';

    const title = document.createElement('h4');
    title.className = 'text-base font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.build.inspectorModuleTitle');

    const meta = document.createElement('p');
    meta.className = 'text-sm text-slate-600';
    meta.textContent = i18n.t('learningStudio.overview.moduleLessons', {
      count: String(inspector.lessonCount),
    });

    section.append(
      title,
      this.createTextInput(
        i18n.t('learningStudio.fields.title'),
        inspector.title,
        'learning-studio-build-inspector-module-title',
        (value) => this.options.onUpdateModuleTitle(inspector.id, value)
      ),
      this.createTextArea(
        i18n.t('learningStudio.fields.description'),
        inspector.description,
        'learning-studio-build-inspector-module-description',
        (value) => this.options.onUpdateModuleDescription(inspector.id, value)
      ),
      meta
    );

    return section;
  }

  private renderUnitInspector(
    inspector: Extract<LearningStudioBuildInspectorModel, { kind: 'unit' }>
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'space-y-4';

    const badge = document.createElement('span');
    badge.className =
      'inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600';
    badge.textContent = this.getUnitTypeLabel(inspector.type);

    const title = document.createElement('h4');
    title.className = 'text-base font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.build.inspectorUnitTitle');

    section.append(
      badge,
      title,
      this.createTextInput(
        i18n.t('learningStudio.fields.title'),
        inspector.title,
        'learning-studio-build-inspector-unit-title',
        (value) => this.options.onUpdateUnitTitle(inspector.id, value)
      ),
      this.createTextArea(
        i18n.t('learningStudio.fields.description'),
        inspector.description,
        'learning-studio-build-inspector-unit-description',
        (value) => this.options.onUpdateUnitDescription(inspector.id, value)
      ),
      this.createTextArea(
        i18n.t('learningStudio.fields.objective'),
        inspector.objective,
        'learning-studio-build-inspector-unit-objective',
        (value) => this.options.onUpdateUnitObjective(inspector.id, value)
      )
    );

    if (inspector.type === 'lesson') {
      section.append(this.renderLessonContent(inspector));
      section.append(this.renderPrerequisites(inspector));
    }

    return section;
  }

  private renderPrerequisites(
    inspector: Extract<LearningStudioBuildInspectorModel, { kind: 'unit' }>
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'space-y-3 border-t border-slate-200 pt-4';

    const title = document.createElement('h5');
    title.className = 'text-sm font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.build.prerequisitesTitle');

    section.append(title);

    if (inspector.availablePrerequisites.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-sm text-slate-500';
      empty.textContent = i18n.t('learningStudio.build.prerequisitesEmpty');
      section.append(empty);
      return section;
    }

    const list = document.createElement('div');
    list.className = 'space-y-2';

    inspector.availablePrerequisites.forEach((lesson) => {
      const label = document.createElement('label');
      label.className = 'flex items-start gap-3 text-sm text-slate-700';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = inspector.prerequisiteLessonIds.includes(lesson.id);
      input.dataset.role = `learning-studio-build-prerequisite-${inspector.id}-${lesson.id}`;
      input.addEventListener('change', () => {
        this.options.onTogglePrerequisite(inspector.id, lesson.id);
      });

      const text = document.createElement('span');
      text.textContent = lesson.title;

      label.append(input, text);
      list.append(label);
    });

    section.append(list);
    return section;
  }

  private renderLessonContent(
    inspector: Extract<LearningStudioBuildInspectorModel, { kind: 'unit' }>
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'space-y-3 border-t border-slate-200 pt-4';
    section.dataset.role = `learning-studio-build-content-${inspector.id}`;

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between gap-3';

    const title = document.createElement('h5');
    title.className = 'text-sm font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.build.contentTitle');

    const addControls = document.createElement('div');
    addControls.className = 'flex items-center gap-2';

    const addType = document.createElement('select');
    addType.className =
      'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
    addType.dataset.role = `learning-studio-build-content-add-type-${inspector.id}`;

    this.getAvailableBlockTypes(inspector).forEach((type) => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = this.getBlockTypeLabel(type);
      addType.append(option);
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className =
      'rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';
    addButton.dataset.role = `learning-studio-build-content-add-${inspector.id}`;
    addButton.textContent = i18n.t('learningStudio.build.blockAdd');
    addButton.addEventListener('click', () => {
      this.options.onAddLessonBlock(
        inspector.id,
        addType.value as LessonBlockType
      );
    });

    addControls.append(addType, addButton);
    header.append(title, addControls);
    section.append(header);

    if (inspector.blocks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-sm text-slate-500';
      empty.textContent = i18n.t('learningStudio.build.contentEmpty');
      section.append(empty);
      return section;
    }

    const list = document.createElement('div');
    list.className = 'divide-y divide-slate-200';

    inspector.blocks
      .slice()
      .sort((left, right) => left.order - right.order)
      .forEach((block, index) => {
        const item = document.createElement('section');
        item.className = 'space-y-2 py-3';
        item.dataset.role = `learning-studio-build-block-${inspector.id}-${block.id}`;

        const row = document.createElement('div');
        row.className = 'flex items-center gap-2';

        const type = document.createElement('select');
        type.className =
          'min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
        type.dataset.role = `learning-studio-build-block-type-${block.id}`;

        LESSON_BLOCK_TYPES.forEach((value) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = this.getBlockTypeLabel(value);
          option.disabled =
            (value === 'exercise_ref' &&
              inspector.availableExerciseRefs.length === 0) ||
            (value === 'checkpoint_ref' &&
              inspector.availableCheckpointRefs.length === 0);
          option.selected = block.type === value;
          type.append(option);
        });
        type.addEventListener('change', () => {
          this.options.onUpdateLessonBlockType(
            inspector.id,
            block.id,
            type.value as LessonBlockType
          );
        });

        row.append(
          type,
          this.createActionButton(
            i18n.t('learningStudio.build.blockMoveUp'),
            () => this.options.onMoveLessonBlock(inspector.id, block.id, -1),
            index === 0
          ),
          this.createActionButton(
            i18n.t('learningStudio.build.blockMoveDown'),
            () => this.options.onMoveLessonBlock(inspector.id, block.id, 1),
            index === inspector.blocks.length - 1
          ),
          this.createActionButton(
            i18n.t('learningStudio.build.blockRemove'),
            () => this.options.onRemoveLessonBlock(inspector.id, block.id),
            false,
            true
          )
        );

        item.append(row);

        if ('text' in block) {
          const text = document.createElement('textarea');
          text.rows = 3;
          text.value = block.text;
          text.dataset.role = `learning-studio-build-block-text-${block.id}`;
          text.className =
            'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
          text.addEventListener('change', () => {
            this.options.onUpdateLessonBlockText(
              inspector.id,
              block.id,
              text.value.trim()
            );
          });
          item.append(text);
        } else {
          const refSelect = document.createElement('select');
          refSelect.className =
            'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
          refSelect.dataset.role = `learning-studio-build-block-ref-${block.id}`;

          const refs =
            block.type === 'exercise_ref'
              ? inspector.availableExerciseRefs
              : inspector.availableCheckpointRefs;

          if (refs.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = i18n.t(
              'learningStudio.build.blockReferenceUnavailable'
            );
            refSelect.append(option);
            refSelect.disabled = true;
          } else {
            refs.forEach((ref) => {
              const option = document.createElement('option');
              option.value = ref.id;
              option.textContent = ref.title;
              option.selected = ref.id === block.refUnitId;
              refSelect.append(option);
            });
            refSelect.addEventListener('change', () => {
              this.options.onUpdateLessonBlockReference(
                inspector.id,
                block.id,
                refSelect.value
              );
            });
          }

          item.append(refSelect);
        }

        list.append(item);
      });

    section.append(list);
    return section;
  }

  private createTextInput(
    labelText: string,
    value: string,
    dataRole: string,
    onCommit: (value: string) => void
  ): HTMLElement {
    const field = document.createElement('label');
    field.className = 'grid gap-1.5';

    const label = document.createElement('span');
    label.className = 'text-xs font-medium uppercase tracking-[0.08em] text-slate-500';
    label.textContent = labelText;

    const input = document.createElement('input');
    input.value = value;
    input.dataset.role = dataRole;
    input.className =
      'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
    input.addEventListener('change', () => {
      onCommit(input.value.trim());
    });

    field.append(label, input);
    return field;
  }

  private createTextArea(
    labelText: string,
    value: string,
    dataRole: string,
    onCommit: (value: string) => void
  ): HTMLElement {
    const field = document.createElement('label');
    field.className = 'grid gap-1.5';

    const label = document.createElement('span');
    label.className = 'text-xs font-medium uppercase tracking-[0.08em] text-slate-500';
    label.textContent = labelText;

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.rows = 4;
    textarea.dataset.role = dataRole;
    textarea.className =
      'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
    textarea.addEventListener('change', () => {
      onCommit(textarea.value.trim());
    });

    field.append(label, textarea);
    return field;
  }

  private createActionButton(
    label: string,
    onClick: () => void,
    disabled = false,
    danger = false
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.disabled = disabled;
    button.textContent = label;
    button.className = `rounded-md px-2 py-1 text-xs font-medium transition ${
      danger
        ? 'text-rose-600 hover:bg-rose-50'
        : 'text-slate-600 hover:bg-slate-100'
    } disabled:cursor-not-allowed disabled:opacity-40`;
    button.addEventListener('click', onClick);
    return button;
  }

  private getAvailableBlockTypes(
    inspector: Extract<LearningStudioBuildInspectorModel, { kind: 'unit' }>
  ): LessonBlockType[] {
    const types: LessonBlockType[] = [...LESSON_TEXT_BLOCK_TYPES];
    if (inspector.availableExerciseRefs.length > 0) {
      types.push('exercise_ref');
    }
    if (inspector.availableCheckpointRefs.length > 0) {
      types.push('checkpoint_ref');
    }
    return types;
  }

  private getBlockTypeLabel(type: LessonBlockType): string {
    const { i18n } = this.options.runtime;
    switch (type) {
      case 'intro':
        return i18n.t('learningStudio.build.blockTypeIntro');
      case 'concept':
        return i18n.t('learningStudio.build.blockTypeConcept');
      case 'example':
        return i18n.t('learningStudio.build.blockTypeExample');
      case 'instruction':
        return i18n.t('learningStudio.build.blockTypeInstruction');
      case 'summary':
        return i18n.t('learningStudio.build.blockTypeSummary');
      case 'exercise_ref':
        return i18n.t('learningStudio.build.blockTypeExerciseRef');
      case 'checkpoint_ref':
        return i18n.t('learningStudio.build.blockTypeCheckpointRef');
    }
  }

  private getUnitTypeLabel(type: 'lesson' | 'exercise' | 'checkpoint'): string {
    const { i18n } = this.options.runtime;
    switch (type) {
      case 'exercise':
        return i18n.t('learningStudio.lesson.defaultExerciseTitle');
      case 'checkpoint':
        return i18n.t('learningStudio.lesson.defaultCheckpointTitle');
      case 'lesson':
      default:
        return i18n.t('learningStudio.lesson.defaultLessonTitle');
    }
  }
}
