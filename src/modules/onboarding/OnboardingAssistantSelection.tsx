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

import { Button } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import { Dispatch, SetStateAction } from 'react';
import { AssistantTemplateCard } from '../assistants/library/AssistantTemplateCard';
import { AssistantTemplate } from '../assistants/types';
import classes from './OnboardingAssistantSelection.module.scss';
import { StartFromScratchCard } from './StartFromScratchCard';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props {
  templates?: AssistantTemplate[];
  selected: AssistantTemplate | null;
  onSelect: Dispatch<SetStateAction<AssistantTemplate | null>>;
}
export function OnboardingAssistantSelection({
  templates,
  selected,
  onSelect,
}: Props) {
  const { project, organization } = useProjectContext();

  return (
    <div>
      <div className={classes.grid}>
        <StartFromScratchCard
          selected={selected === null}
          onClick={() => onSelect(null)}
        />
      </div>

      {templates && templates.length > 0 && (
        <>
          <p className={classes.subheading}>Or select a template:</p>

          <div className={classes.grid}>
            {templates.map((template) => (
              <AssistantTemplateCard
                organization={organization}
                project={project}
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

OnboardingAssistantSelection.Footer =
  function OnboardingAssistantSelectionFooter({
    onBackClick,
    onNextClick,
  }: {
    onBackClick?: () => void;
    onNextClick: () => void;
  }) {
    return (
      <>
        {onBackClick && (
          <Button kind="ghost" onClick={onBackClick}>
            Back
          </Button>
        )}

        <Button kind="secondary" renderIcon={ArrowRight} onClick={onNextClick}>
          Start building
        </Button>
      </>
    );
  };
