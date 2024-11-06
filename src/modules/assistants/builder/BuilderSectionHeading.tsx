import { Button } from '@carbon/react';
import { ComponentProps, ComponentType, ReactElement } from 'react';
import classes from './BuilderSectionHeading.module.scss';
import { Add } from '@carbon/react/icons';

interface Props {
  title: string;
  buttonProps?: ComponentProps<typeof Button>;
}
export function BuilderSectionHeading({ title, buttonProps }: Props) {
  return (
    <div className={classes.root}>
      <h2>{title}</h2>
      <Button kind="ghost" size="md" renderIcon={Add} {...buttonProps} />
    </div>
  );
}
