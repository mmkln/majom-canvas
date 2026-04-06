// src/core/ComponentFactory.ts
import { Button, ButtonProps } from '../components/Button.ts';
import { Input, InputProps } from '../components/Input.ts';
import { Textarea, TextareaProps } from '../components/Textarea.ts';
import { Checkbox, CheckboxProps } from '../components/Checkbox.ts';
import { SearchSelect, SearchSelectProps } from '../components/SearchSelect.ts';

// TODO: Call .createElement() on each component to create the actual DOM element
export class ComponentFactory {
  static createButton(props: ButtonProps): Button {
    return new Button(props);
  }

  static createInput(props: InputProps): Input {
    return new Input(props);
  }

  static createTextarea(props: TextareaProps): Textarea {
    return new Textarea(props);
  }

  static createCheckbox(props: CheckboxProps): Checkbox {
    return new Checkbox(props);
  }

  static createSearchSelect(props: SearchSelectProps): SearchSelect {
    return new SearchSelect(props);
  }
}
