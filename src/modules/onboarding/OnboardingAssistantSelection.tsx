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
import { AssistantCard } from '../assistants/library/AssistantCard';
import { Assistant } from '../assistants/types';
import classes from './OnboardingAssistantSelection.module.scss';
import { StartFromScratchCard } from './StartFromScratchCard';

interface Props {
  assistants?: Assistant[];
  selected: Assistant | null;
  onSelect: Dispatch<SetStateAction<Assistant | null>>;
}
export function OnboardingAssistantSelection({
  assistants,
  selected,
  onSelect,
}: Props) {
  return (
    <div>
      <h2 className={classes.heading}>Build a bee</h2>

      <div className={classes.grid}>
        <StartFromScratchCard
          selected={selected === null}
          onClick={() => onSelect(null)}
        />
      </div>

      {assistants && assistants.length > 0 && (
        <>
          <p className={classes.subheading}>Or select a template:</p>

          <div className={classes.grid}>
            {assistants.map((assistant) => (
              <AssistantCard
                key={assistant.id}
                assistant={assistant}
                selected={assistant.id === selected?.id}
                onClick={() => onSelect(assistant)}
                hideActions
                canHover
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
    onBackClick: () => void;
    onNextClick: () => void;
  }) {
    return (
      <>
        <Button kind="ghost" onClick={onBackClick}>
          Back
        </Button>

        <Button kind="secondary" renderIcon={ArrowRight} onClick={onNextClick}>
          Start building
        </Button>
      </>
    );
  };
