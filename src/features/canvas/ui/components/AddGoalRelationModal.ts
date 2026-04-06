import type { Goal } from '../../../../majom-wrapper/interfaces/index.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../../ui-lib/src/components/Modal.ts';
import { SearchDropdownSelect } from '../../../../ui-lib/src/components/SearchDropdownSelect.ts';
import { StaticDropdownSelect } from '../../../../ui-lib/src/components/StaticDropdownSelect.ts';
import {
  createBadge,
  createField,
  createFormMessage,
  createTextButton,
  setTextButtonState,
} from '../primitives/index.ts';
import { createIcon } from '../icons.ts';
import { AddGoalRelationController, type AddGoalRelationSearchPage, type AddGoalRelationSelection } from '../addGoalRelationController.ts';
import {
  getGoalRelationSemanticOptions,
  type GoalRelationSemanticOption,
} from '../goalRelationSemantics.ts';

type AddGoalRelationModalOptions = {
  currentGoalTitle: string;
  runtime?: AppRuntime;
  searchGoals: (
    term: string,
    page: number,
    pageSize: number
  ) => Promise<AddGoalRelationSearchPage>;
  validateSelection: (
    selection: AddGoalRelationSelection
  ) => Promise<string | null>;
  onCreate: (selection: {
    targetGoal: Goal;
    semantic: GoalRelationSemanticOption;
  }) => Promise<void>;
  onCreated?: () => void;
};

export class AddGoalRelationModal {
  private overlay: HTMLDivElement | null = null;

  constructor(private readonly options: AddGoalRelationModalOptions) {}

  public show(): void {
    const runtime = this.options.runtime ?? createAppRuntime();
    const relationOptions = getGoalRelationSemanticOptions(runtime);
    const controller = new AddGoalRelationController({
      validateSelection: this.options.validateSelection,
      createSelection: this.options.onCreate,
      validationFailedMessage: runtime.i18n.t(
        'planningDetails.goal.addRelation.createFailed'
      ),
      createFailedMessage: runtime.i18n.t(
        'planningDetails.goal.addRelation.createFailed'
      ),
    });
    const getGoalTitle = (goal: Goal): string =>
      goal.title?.trim() || runtime.i18n.t('existingPicker.untitled.goal');

    const { overlay, container, body, footer } = createModalShell(
      runtime.i18n.t('planningDetails.goal.addRelation.title'),
      {
        onClose: () => {
          close();
        },
        intent: 'form',
        zIndex: 280,
      }
    );
    this.overlay = overlay;
    container.style.width = 'min(36rem, calc(100vw - 2rem))';
    container.style.maxWidth = '36rem';

    const content = document.createElement('div');
    content.className = 'space-y-5';
    body.appendChild(content);

    const currentGoalField = createField({
      label: runtime.i18n.t('planningDetails.goal.addRelation.currentGoal'),
    });
    const currentGoalValue = document.createElement('div');
    currentGoalValue.className =
      'rounded-2xl bg-slate-100/80 px-3.5 py-3 text-sm font-medium text-slate-700';
    currentGoalValue.textContent = this.options.currentGoalTitle;
    currentGoalField.setControl(currentGoalValue);
    content.appendChild(currentGoalField.element);

    const relationField = createField({
      label: runtime.i18n.t('planningDetails.goal.addRelation.relation'),
    });
    const getRelationIconClassName = (
      option: (typeof relationOptions)[number] | null
    ): string =>
      option?.value === 'relates_to' ? 'shrink-0 text-slate-500' : 'shrink-0';

    const relationSelect = new StaticDropdownSelect({
      value: null as (typeof relationOptions)[number] | null,
      placeholder: runtime.i18n.t('planningDetails.goal.addRelation.relation'),
      items: relationOptions,
      portalTarget: overlay,
      getKey: (option) => option.value,
      getLabel: (option) => option.label,
      renderTriggerLeading: (option) => {
        const selected = option;
        const leadingIcon = createIcon(selected?.icon ?? 'chevron-down', {
          size: 14,
          strokeWidth: 1.9,
        });
        leadingIcon.className.baseVal = selected
          ? getRelationIconClassName(selected)
          : 'shrink-0 text-slate-400';
        leadingIcon.setAttribute('aria-hidden', 'true');

        if (selected) {
          return createBadge({
            label: '',
            tone: 'neutral',
            leading: leadingIcon,
            className:
              `h-7 w-7 shrink-0 justify-center rounded-lg px-0 py-0 ${selected.className}`.trim(),
          });
        }

        const placeholder = document.createElement('div');
        placeholder.className =
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100';
        placeholder.appendChild(leadingIcon);
        return placeholder;
      },
      renderOptionLeading: (option) => {
        const icon = createIcon(option.icon, { size: 14, strokeWidth: 1.9 });
        icon.className.baseVal = getRelationIconClassName(option);
        icon.setAttribute('aria-hidden', 'true');
        return createBadge({
          label: '',
          tone: 'neutral',
          leading: icon,
          className:
            `h-7 w-7 shrink-0 justify-center rounded-lg px-0 py-0 ${option.className}`.trim(),
        });
      },
      onSelect: (option) => {
        controller.setSemantic(option.value);
      },
    });
    relationField.setControl(relationSelect.element);
    content.appendChild(relationField.element);

    const goalField = createField({
      label: runtime.i18n.t('planningDetails.goal.addRelation.targetGoal'),
    });
    const goalSelect = new SearchDropdownSelect<Goal>({
      placeholder: runtime.i18n.t('planningDetails.goal.addRelation.chooseGoal'),
      searchPlaceholder: runtime.i18n.t(
        'planningDetails.goal.addRelation.searchPlaceholder'
      ),
      clearSearchLabel: runtime.i18n.t(
        'planningDetails.goal.addRelation.clearSearch'
      ),
      loadingLabel: runtime.i18n.t(
        'planningDetails.goal.addRelation.searchLoading'
      ),
      emptyLabel: runtime.i18n.t('planningDetails.goal.addRelation.searchEmpty'),
      hintLabel: runtime.i18n.t('planningDetails.goal.addRelation.searchHint'),
      errorFallbackLabel: runtime.i18n.t(
        'planningDetails.goal.addRelation.searchFailed'
      ),
      portalTarget: overlay,
      value: null,
      getKey: (goal) => goal.uuid ?? String(goal.id),
      getLabel: (goal) => getGoalTitle(goal),
      loadPage: this.options.searchGoals,
      onSelect: (goal) => {
        controller.selectGoal(goal);
      },
    });
    goalField.setControl(goalSelect.element);
    content.appendChild(goalField.element);

    const message = createFormMessage();
    message.element.classList.add('hidden');
    content.appendChild(message.element);

    const cancelButton = createTextButton({
      text: runtime.i18n.t('common.cancel'),
      tone: 'text',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        close();
      },
    });
    const createButton = createTextButton({
      text: runtime.i18n.t('planningDetails.goal.addRelation.create'),
      tone: 'primary',
      disabled: true,
      className: getModalActionButtonClass('default'),
      onClick: async () => {
        const result = await controller.submit();
        if (!result.ok) return;
        this.options.onCreated?.();
        close();
      },
    });
    const actionsRow = createModalActionRow({ variant: 'confirm' });
    actionsRow.append(cancelButton, createButton);
    footer.appendChild(actionsRow);

    const syncMessage = (): void => {
      const state = controller.getState();
      const nextMessage = state.createError ?? state.validationError;
      if (nextMessage) {
        message.element.classList.remove('hidden');
        message.setState({ tone: 'error', message: nextMessage });
        return;
      }
      message.clear();
    };

    const syncCreateButton = (): void => {
      const state = controller.getState();
      setTextButtonState(createButton, {
        disabled: !state.canSubmit,
        loading: state.isSubmitting,
      });
    };

    const render = (): void => {
      const state = controller.getState();
      goalSelect.setSelected(state.selectedGoal);
      relationSelect.setSelected(
        relationOptions.find((option) => option.value === state.selectedSemantic) ??
          null
      );
      syncMessage();
      syncCreateButton();
    };

    const subscription = controller.state$.subscribe(() => {
      render();
    });

    const close = (): void => {
      subscription.unsubscribe();
      relationSelect.destroy();
      goalSelect.destroy();
      controller.destroy();
      this.overlay?.remove();
      this.overlay = null;
    };

    render();
  }
}
