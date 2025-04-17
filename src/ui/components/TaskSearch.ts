import { PlatformTask } from '../../majom-wrapper/interfaces/index.js';
import { SearchSelect, SelectItem } from '../../ui-lib/src/components/SearchSelect.js';

export interface TaskSearchProps {
  tasks: PlatformTask[];
  onSelect: (selectedItem: string) => void;
  placeholder?: string;
  className?: string;
}

export class TaskSearchComponent extends SearchSelect {
  constructor(props: TaskSearchProps) {
    const items: SelectItem[] = props.tasks.map((task) => ({
      label: `${task.title}`,
      value: String(task.id)
    }));
    super({
      items,
      placeholder: 'Search task..',
      className: 'mt-2',
      onSelect: props.onSelect
    });
  }
}

