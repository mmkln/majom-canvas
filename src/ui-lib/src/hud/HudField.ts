import {
  HUD_FIELD_CLASS,
  HUD_FIELD_ERROR_CLASS,
  HUD_FIELD_HINT_CLASS,
  HUD_FIELD_LABEL_BASE_CLASS,
  HUD_FIELD_LABEL_DEFAULT_CLASS,
  HUD_FIELD_LABEL_DISABLED_CLASS,
  HUD_FIELD_LABEL_ERROR_CLASS,
  HUD_FIELD_LABEL_MUTED_CLASS,
  HUD_FIELD_REQUIRED_MARK_CLASS,
} from './classNames.ts';

export type HudFieldTone = 'default' | 'muted';

type HudFieldOptions = {
  label: string;
  control?: HTMLElement;
  className?: string;
  tone?: HudFieldTone;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
};

type HudFieldState = Partial<
  Pick<
    HudFieldOptions,
    'tone' | 'required' | 'invalid' | 'disabled' | 'hint' | 'error'
  >
>;

type HudField = {
  element: HTMLDivElement;
  label: HTMLLabelElement;
  controlContainer: HTMLDivElement;
  setControl: (control: HTMLElement) => void;
  setState: (state: HudFieldState) => void;
};

let fieldIdCounter = 0;

function nextId(prefix: string): string {
  fieldIdCounter += 1;
  return `${prefix}-${fieldIdCounter}`;
}

function ensureControlId(control: HTMLElement): string {
  if (control.id) return control.id;
  const id = nextId('hud-field-control');
  control.id = id;
  return id;
}

function findPrimaryFormControl(control: HTMLElement): HTMLElement | null {
  if (control.matches('input, select, textarea')) {
    return control;
  }
  const nested = control.querySelector('input, select, textarea');
  return nested instanceof HTMLElement ? nested : null;
}

function connectLabelToControl(
  label: HTMLLabelElement,
  control: HTMLElement
): void {
  const primaryControl = findPrimaryFormControl(control);
  if (primaryControl) {
    const controlId = ensureControlId(primaryControl);
    label.htmlFor = controlId;
    return;
  }

  const controlId = ensureControlId(control);
  const labelledBy = control.getAttribute('aria-labelledby');
  if (labelledBy && labelledBy.length > 0) {
    label.id = labelledBy.split(/\s+/)[0] ?? labelledBy;
  } else {
    label.id = nextId('hud-field-label');
  }
  control.setAttribute('aria-labelledby', label.id);
}

function mergeDescribedBy(
  control: HTMLElement,
  previousManagedIds: string[],
  nextManagedIds: string[]
): void {
  const existingIds = (control.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((id) => !previousManagedIds.includes(id));

  const finalIds = [...existingIds, ...nextManagedIds];
  if (finalIds.length > 0) {
    control.setAttribute('aria-describedby', finalIds.join(' '));
  } else {
    control.removeAttribute('aria-describedby');
  }
}

export function createHudField(options: HudFieldOptions): HudField {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'HudField');
  element.className = `${HUD_FIELD_CLASS} ${options.className ?? ''}`.trim();

  const label = document.createElement('label');
  const controlContainer = document.createElement('div');
  const meta = document.createElement('div');
  const hintId = nextId('hud-field-hint');
  const errorId = nextId('hud-field-error');

  element.append(label, controlContainer, meta);

  let controlEl: HTMLElement | null = null;
  let managedDescribedByIds: string[] = [];
  const state: Required<
    Pick<HudFieldOptions, 'tone' | 'required' | 'invalid' | 'disabled'>
  > &
    Pick<HudFieldOptions, 'hint' | 'error'> = {
    tone: options.tone ?? 'default',
    required: options.required ?? false,
    invalid: options.invalid ?? false,
    disabled: options.disabled ?? false,
    hint: options.hint,
    error: options.error,
  };

  const renderLabel = (): void => {
    const labelToneClass =
      state.invalid || Boolean(state.error)
        ? HUD_FIELD_LABEL_ERROR_CLASS
        : state.disabled
          ? HUD_FIELD_LABEL_DISABLED_CLASS
          : state.tone === 'muted'
            ? HUD_FIELD_LABEL_MUTED_CLASS
            : HUD_FIELD_LABEL_DEFAULT_CLASS;

    label.className = `${HUD_FIELD_LABEL_BASE_CLASS} ${labelToneClass}`;
    label.replaceChildren(document.createTextNode(options.label));
    if (state.required) {
      const mark = document.createElement('span');
      mark.className = HUD_FIELD_REQUIRED_MARK_CLASS;
      mark.textContent = '*';
      mark.setAttribute('aria-hidden', 'true');
      label.appendChild(mark);
    }
  };

  const renderMeta = (): void => {
    meta.replaceChildren();
    const hasError = Boolean(state.error && state.error.trim().length > 0);
    const hasHint = Boolean(state.hint && state.hint.trim().length > 0);

    if (hasError) {
      const errorEl = document.createElement('div');
      errorEl.id = errorId;
      errorEl.className = HUD_FIELD_ERROR_CLASS;
      errorEl.textContent = state.error ?? '';
      meta.appendChild(errorEl);
    } else if (hasHint) {
      const hintEl = document.createElement('div');
      hintEl.id = hintId;
      hintEl.className = HUD_FIELD_HINT_CLASS;
      hintEl.textContent = state.hint ?? '';
      meta.appendChild(hintEl);
    }
  };

  const applyControlState = (): void => {
    if (!controlEl) return;
    const targetControl = findPrimaryFormControl(controlEl) ?? controlEl;
    if ('disabled' in targetControl) {
      (targetControl as HTMLInputElement).disabled = state.disabled;
    }

    const hasError = Boolean(state.error && state.error.trim().length > 0);
    const invalid = state.invalid || hasError;
    if (invalid) {
      targetControl.setAttribute('aria-invalid', 'true');
    } else {
      targetControl.removeAttribute('aria-invalid');
    }

    const hasHint = Boolean(state.hint && state.hint.trim().length > 0);
    const describedByIds: string[] = [];
    if (hasError) describedByIds.push(errorId);
    else if (hasHint) describedByIds.push(hintId);
    mergeDescribedBy(targetControl, managedDescribedByIds, describedByIds);
    managedDescribedByIds = describedByIds;

    renderMeta();
  };

  const setControl = (control: HTMLElement): void => {
    controlContainer.replaceChildren(control);
    controlEl = control;
    connectLabelToControl(label, control);
    applyControlState();
  };

  const setState = (nextState: HudFieldState): void => {
    if (Object.prototype.hasOwnProperty.call(nextState, 'tone')) {
      state.tone = nextState.tone ?? state.tone;
    }
    if (Object.prototype.hasOwnProperty.call(nextState, 'required')) {
      state.required = nextState.required ?? state.required;
    }
    if (Object.prototype.hasOwnProperty.call(nextState, 'invalid')) {
      state.invalid = nextState.invalid ?? state.invalid;
    }
    if (Object.prototype.hasOwnProperty.call(nextState, 'disabled')) {
      state.disabled = nextState.disabled ?? state.disabled;
    }
    if (Object.prototype.hasOwnProperty.call(nextState, 'hint')) {
      state.hint = nextState.hint;
    }
    if (Object.prototype.hasOwnProperty.call(nextState, 'error')) {
      state.error = nextState.error;
    }
    renderLabel();
    applyControlState();
  };

  renderLabel();
  renderMeta();
  if (options.control) {
    setControl(options.control);
  }

  return { element, label, controlContainer, setControl, setState };
}
