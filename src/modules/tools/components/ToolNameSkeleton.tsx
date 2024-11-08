import { SkeletonText } from '@carbon/react';
import classes from './ToolNameSkeleton.module.scss';

export function ToolNameSkeleton() {
  return (
    <SkeletonText
      width={LOADING_TOOL_NAME_WIDTH}
      className={classes.skeleton}
    />
  );
}

const LOADING_TOOL_NAME_WIDTH = '5rem';
