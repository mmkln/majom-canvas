import { InlineTextEditor } from '../../../../ui-lib/src/components/InlineTextEditor.ts';
import { createField } from '../primitives/index.ts';

export type InlineFieldMode = 'view' | 'edit';

export type PlanningTitleFieldOptions = {
  label: string;
  placeholder: string;
  previewAriaLabel: string;
  emptyPreviewAriaLabel: string;
  getValue: () => string;
  setValue: (value: string) => void;
};

export type PlanningTitleFieldController = {
  field: ReturnType<typeof createField>;
  setMode: (mode: InlineFieldMode, options?: { focus?: boolean }) => void;
  focusInput: (options?: { select?: boolean }) => void;
  focusPreview: () => void;
  setRequiredError: (message: string) => void;
};

export type PlanningDescriptionFieldOptions = {
  label: string;
  placeholder: string;
  previewAriaLabel: string;
  emptyPreviewAriaLabel: string;
  getValue: () => string;
  setValue: (value: string) => void;
};

export type PlanningDescriptionFieldController = {
  field: ReturnType<typeof createField>;
  setMode: (mode: InlineFieldMode, options?: { focus?: boolean }) => void;
};

export function buildPlanningTitleField(
  options: PlanningTitleFieldOptions
): PlanningTitleFieldController {
  const field = createField({
    label: options.label,
    required: true,
  });
  const editor = new InlineTextEditor({
    value: options.getValue(),
    placeholder: options.placeholder,
    displayClassName:
      'rounded-md px-3 py-2 text-[14px] leading-6 tracking-tight text-slate-900 whitespace-pre-wrap break-words transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80',
    emptyDisplayClassName:
      'h-10 rounded-md px-2 py-1 text-center text-[12px] italic leading-5 text-slate-400 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80',
    inputClassName:
      'w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] leading-6 tracking-tight text-slate-900 outline-none placeholder:text-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-inset focus:ring-indigo-200/80',
    displayAriaLabel: (hasValue) =>
      hasValue ? options.previewAriaLabel : options.emptyPreviewAriaLabel,
    normalizeValue: (value) => value.trim(),
    onInput: (value) => {
      if (value.trim().length > 0) {
        field.setState({ invalid: false, error: undefined });
      }
    },
    onCommit: (value) => {
      options.setValue(value);
      if (value.trim().length > 0) {
        field.setState({ invalid: false, error: undefined });
      }
    },
  });
  field.setControl(editor.element);

  function setMode(
    nextMode: InlineFieldMode,
    modeOptions: { focus?: boolean } = {}
  ): void {
    const shouldFocus = modeOptions.focus ?? true;
    if (nextMode === 'edit') {
      editor.setValue(options.getValue());
      editor.startEditing({ focus: shouldFocus, select: true });
      return;
    }
    editor.setValue(options.getValue());
    editor.showDisplay({ focus: shouldFocus });
  }

  return {
    field,
    setMode,
    focusInput: ({ select = false } = {}) => {
      editor.startEditing({ focus: true, select });
    },
    focusPreview: () => editor.focusDisplay(),
    setRequiredError: (message: string) => {
      field.setState({ invalid: true, error: message });
    },
  };
}

export function buildPlanningDescriptionField(
  options: PlanningDescriptionFieldOptions
): PlanningDescriptionFieldController {
  const field = createField({ label: options.label });
  const editor = new InlineTextEditor({
    value: options.getValue(),
    placeholder: options.placeholder,
    multiline: true,
    editorRows: 6,
    displayClassName:
      'max-h-56 overflow-y-auto rounded-md px-3 py-2 text-[13px] leading-6 tracking-[0.005em] whitespace-pre-wrap break-words text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80',
    emptyDisplayClassName:
      'h-12 rounded-md px-3 py-2 text-center text-[12px] italic leading-5 text-slate-400 flex items-center justify-center transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80',
    inputClassName:
      'min-h-[144px] w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-base leading-6 tracking-[0.005em] text-slate-800 outline-none placeholder:text-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-inset focus:ring-indigo-200/80 md:text-[13px]',
    displayAriaLabel: (hasValue) =>
      hasValue ? options.previewAriaLabel : options.emptyPreviewAriaLabel,
    onCommit: (value) => {
      options.setValue(value);
    },
  });
  field.setControl(editor.element);

  function setMode(
    nextMode: InlineFieldMode,
    modeOptions: { focus?: boolean } = {}
  ): void {
    const shouldFocus = modeOptions.focus ?? true;
    if (nextMode === 'edit') {
      editor.setValue(options.getValue());
      editor.startEditing({ focus: shouldFocus });
      return;
    }
    editor.setValue(options.getValue());
    editor.showDisplay({ focus: shouldFocus });
  }

  return { field, setMode };
}
