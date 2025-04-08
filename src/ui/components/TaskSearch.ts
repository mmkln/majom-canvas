import { PlatformTask } from '../../majom-wrapper/interfaces/index.js';
import { SearchSelect } from '../../ui-library/src/components/SearchSelect.js';

export interface TaskSearchProps {
  tasks: PlatformTask[];
  placeholder?: string;
  className?: string;
  onSelect?: (selectedItem: PlatformTask) => void;
}

export class TaskSearchComponent extends SearchSelect {
  constructor(props:TaskSearchProps ) {
    const items = props.tasks.map((task) => task.title);
    super({
      items,
      placeholder: 'Search task..',
      className: 'mt-2'
    });
  }
}

