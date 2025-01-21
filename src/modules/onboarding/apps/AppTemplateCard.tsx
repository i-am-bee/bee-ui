/**
 * Copyright 2024 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { AppIcon } from '@/modules/apps/AppIcon';
import { AppTemplate } from '@/modules/apps/types';
import { MouseEventHandler } from 'react';
import classes from './AppTemplateCard.module.scss';

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
