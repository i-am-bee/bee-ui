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

import { AppTemplate } from '@/modules/apps/types';
import { Dispatch, SetStateAction } from 'react';
import classes from './AppsOnboardingTemplateSelection.module.scss';
import { AppTemplateCard } from './AppTemplateCard';
import { BlankAppCard } from './BlankAppCard';

interface Props {
  templates?: AppTemplate[];
  selected: AppTemplate | null;
  onSelect: Dispatch<SetStateAction<AppTemplate | null>>;
}
export function AppsOnboardingTemplateSelection({
  templates,
  selected,
  onSelect,
}: Props) {
  return (
    <div>
      <h2 className={classes.heading}>App builder</h2>

      <div className={classes.grid}>
        <BlankAppCard
          selected={selected === null}
          onClick={() => onSelect(null)}
        />
      </div>

      {templates && templates.length > 0 && (
        <>
          <p className={classes.subheading}>Or select a template:</p>

          <div className={classes.grid}>
            {templates.map((template) => (
              <AppTemplateCard
                key={template.key}
                template={template}
                selected={template.key === selected?.key}
                onClick={() => onSelect(template)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
