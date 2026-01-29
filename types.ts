
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  createdAt: number;
}

export interface Checklist {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export enum FilterType {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}
