import { BehaviorSubject } from 'rxjs';
import type { Goal } from '../../../majom-wrapper/interfaces/index.ts';
import type { GoalRelationSemanticOption } from './goalRelationSemantics.ts';

export type AddGoalRelationSelection = {
  targetGoal: Goal;
  semantic: GoalRelationSemanticOption;
};

export type AddGoalRelationSearchPage = {
  items: Goal[];
  hasMore: boolean;
};

export type AddGoalRelationState = {
  selectedSemantic: GoalRelationSemanticOption | null;
  selectedGoal: Goal | null;
  validationLoading: boolean;
  validationError: string | null;
  createError: string | null;
  isSubmitting: boolean;
  canSubmit: boolean;
};

type AddGoalRelationControllerOptions = {
  validateSelection: (
    selection: AddGoalRelationSelection
  ) => Promise<string | null>;
  createSelection: (selection: AddGoalRelationSelection) => Promise<void>;
  validationFailedMessage: string;
  createFailedMessage: string;
};

const INITIAL_STATE: AddGoalRelationState = {
  selectedSemantic: null,
  selectedGoal: null,
  validationLoading: false,
  validationError: null,
  createError: null,
  isSubmitting: false,
  canSubmit: false,
};

export class AddGoalRelationController {
  private readonly stateSubject = new BehaviorSubject<AddGoalRelationState>(
    INITIAL_STATE
  );
  private validationToken = 0;

  public readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly options: AddGoalRelationControllerOptions) {}

  public getState(): AddGoalRelationState {
    return this.stateSubject.value;
  }

  public setSemantic(semantic: GoalRelationSemanticOption): void {
    this.patchState({
      selectedSemantic: semantic,
      createError: null,
    });
    void this.validateSelection();
  }

  public selectGoal(goal: Goal): void {
    this.patchState({
      selectedGoal: goal,
      createError: null,
    });
    void this.validateSelection();
  }

  public clearGoal(): void {
    this.patchState({
      selectedGoal: null,
      validationError: null,
      validationLoading: false,
      createError: null,
    });
    this.validationToken += 1;
  }

  public async submit(): Promise<{ ok: true } | { ok: false; message: string }> {
    const selection = this.getReadySelection();
    const state = this.stateSubject.value;
    if (!selection || state.validationLoading || state.isSubmitting) {
      return {
        ok: false,
        message: state.validationError ?? this.options.createFailedMessage,
      };
    }

    this.patchState({
      isSubmitting: true,
      createError: null,
    });
    try {
      await this.options.createSelection(selection);
      this.patchState({
        isSubmitting: false,
        createError: null,
      });
      return { ok: true };
    } catch (error) {
      const message = this.resolveErrorMessage(
        error,
        this.options.createFailedMessage
      );
      this.patchState({
        isSubmitting: false,
        createError: message,
      });
      return { ok: false, message };
    }
  }

  public destroy(): void {
    this.validationToken += 1;
    this.stateSubject.complete();
  }

  private async validateSelection(): Promise<void> {
    const selection = this.getReadySelection();
    const token = ++this.validationToken;
    if (!selection) {
      this.patchState({
        validationLoading: false,
        validationError: null,
      });
      return;
    }
    this.patchState({
      validationLoading: true,
      validationError: null,
    });
    try {
      const validationError = await this.options.validateSelection(selection);
      if (token !== this.validationToken) return;
      this.patchState({
        validationLoading: false,
        validationError,
      });
    } catch (error) {
      if (token !== this.validationToken) return;
      this.patchState({
        validationLoading: false,
        validationError: this.resolveErrorMessage(
          error,
          this.options.validationFailedMessage
        ),
      });
    }
  }

  private getReadySelection(): AddGoalRelationSelection | null {
    const { selectedGoal, selectedSemantic } = this.stateSubject.value;
    if (!selectedGoal || !selectedSemantic) return null;
    return {
      targetGoal: selectedGoal,
      semantic: selectedSemantic,
    };
  }

  private patchState(patch: Partial<AddGoalRelationState>): void {
    const nextState = {
      ...this.stateSubject.value,
      ...patch,
    };
    nextState.canSubmit =
      nextState.selectedSemantic !== null &&
      nextState.selectedGoal !== null &&
      !nextState.validationLoading &&
      !nextState.validationError &&
      !nextState.isSubmitting;
    this.stateSubject.next(nextState);
  }

  private resolveErrorMessage(
    error: unknown,
    fallbackMessage: string
  ): string {
    return error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallbackMessage;
  }
}
