import { IconButton } from '@carbon/react';
import { Close } from '@carbon/react/icons';
import { ComponentProps, HTMLProps } from 'react';
import classes from './ClearButton.module.scss';
import clsx from 'clsx';

interface Props extends Partial<ComponentProps<typeof IconButton>> {}

export function ClearButton({ className, ...props }: Props) {
  return (
    <IconButton
      kind="ghost"
      wrapperClasses={clsx(classes.button, className)}
      size="sm"
      label="Clear"
      autoAlign
      {...props}
    >
      <Close />
    </IconButton>
  );
}
