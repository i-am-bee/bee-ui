import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { MouseEventHandler } from 'react';
import classes from './AppTemplateCard.module.scss';
import { AppTemplate } from '../types';
import { AppIcon } from '../AppIcon';

interface Props {
  template: AppTemplate;
  selected?: boolean;
  onClick?: MouseEventHandler;
}

export function AppTemplateCard({ template, selected, onClick }: Props) {
  const { name, description } = template;

  return (
    <CardsListItem
      className={classes.root}
      title={name ?? ''}
      icon={<AppIcon name={template.uiMetadata.icon} size="md" />}
      onClick={onClick}
      selected={selected}
      canHover
    >
      {description && (
        <div className={classes.body}>
          <p>{description}</p>
        </div>
      )}
    </CardsListItem>
  );
}
