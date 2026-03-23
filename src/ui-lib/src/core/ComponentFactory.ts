// src/core/ComponentFactory.ts
import { twMerge } from 'tailwind-merge';
import { Button, ButtonProps } from '../components/Button.ts';
import { Input, InputProps } from '../components/Input.ts';
import { Textarea, TextareaProps } from '../components/Textarea.ts';
import { Checkbox, CheckboxProps } from '../components/Checkbox.ts';
import { SearchSelect, SearchSelectProps } from '../components/SearchSelect.js';
import { Select, SelectProps } from '../components/Select.ts';

const FACTORY_TEXTAREA_DEFAULT_CLASS =
  'rounded-xl border-slate-200 bg-white px-3.5 py-3 text-[13px] leading-6 tracking-[0.005em] text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.04)] focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-300';

// TODO: Call .createElement() on each component to create the actual DOM element
export class ComponentFactory {
  static createButton(props: ButtonProps): Button {
    return new Button(props);
  }

  static createInput(props: InputProps): Input {
    return new Input(props);
  }

  static createTextarea(props: TextareaProps): Textarea {
    const variant = props.variant ?? 'default';
    const className =
      variant === 'default'
        ? twMerge(FACTORY_TEXTAREA_DEFAULT_CLASS, props.className ?? '')
        : props.className;

    return new Textarea({
      ...props,
      className,
    });
  }

  static createCheckbox(props: CheckboxProps): Checkbox {
    return new Checkbox(props);
  }

  static createSearchSelect(props: SearchSelectProps): SearchSelect {
    return new SearchSelect(props);
  }

  static createSelect(props: SelectProps): Select {
    return new Select(props);
  }
}
