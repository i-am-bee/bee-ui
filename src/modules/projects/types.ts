import { Project } from '@/app/api/projects/types';

export type ProjectWithScope = Project & {
  readOnly?: boolean;
};
