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

export function OnboardingModalFooter({
  nextButtonTitle = 'Start building',
  onNextClick,
  onBackClick,
}: {
  nextButtonTitle?: string;
  onNextClick: () => void;
  onBackClick?: () => void;
}) {
  return (
    <>
      {onBackClick && (
        <Button kind="ghost" onClick={() => onBackClick()}>
          Back
        </Button>
      )}

      <Button kind="secondary" renderIcon={ArrowRight} onClick={onNextClick}>
        {nextButtonTitle}
      </Button>
    </>
  );
}
