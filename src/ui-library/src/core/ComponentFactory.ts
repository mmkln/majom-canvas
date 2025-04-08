// src/core/ComponentFactory.ts
import { Button, ButtonProps } from '../components/Button';
import { Input, InputProps } from '../components/Input';
import { Checkbox, CheckboxProps } from '../components/Checkbox';

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
}
