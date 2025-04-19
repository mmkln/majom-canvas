// src/core/ComponentFactory.ts
import { Button, ButtonProps } from '../components/Button.ts';
import { Input, InputProps } from '../components/Input.ts';
import { Checkbox, CheckboxProps } from '../components/Checkbox.ts';
import { SearchSelect, SearchSelectProps } from '../components/SearchSelect.js';
import { Select, SelectProps } from '../components/Select.ts';

export class ComponentFactory {
  static createButton(props: ButtonProps): Button {
    return new Button(props);
  }

  static createInput(props: InputProps): Input {
    return new Input(props);
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
