import {
  createInkstoneEditor,
  createInkstoneMarkdownEngine,
  createInkstoneMirrorRenderer,
  type InkstoneEditorHandle,
} from '@majom/inkstone';

const notesBodyEngine = createInkstoneMarkdownEngine({
  normalizeLineEndings: true,
});
const notesBodyMirrorRenderer = createInkstoneMirrorRenderer();

export function createNotesBodyEditor(options: {
  value: string;
  placeholder: string;
  mobile?: boolean;
  onChange: (value: string) => void;
}): InkstoneEditorHandle {
  return createInkstoneEditor({
    value: options.value,
    placeholder: options.placeholder,
    hostClassName: options.mobile
      ? 'flex min-h-[20rem] flex-1'
      : 'flex min-h-0 flex-1',
    inputClassName: options.mobile
      ? 'min-h-[20rem] flex-1 resize-none bg-transparent p-0 text-[1rem] leading-8 text-slate-700 outline-none placeholder:text-slate-350'
      : 'min-h-[20rem] flex-1 resize-none bg-transparent p-0 text-[0.95rem] leading-7 text-slate-700 outline-none placeholder:text-slate-350',
    paddingBottom: options.mobile
      ? 'max(8rem, env(safe-area-inset-bottom))'
      : undefined,
    enableMarkdownShortcuts: true,
    engine: notesBodyEngine,
    mirrorRenderer: notesBodyMirrorRenderer,
    onChange: options.onChange,
  });
}
