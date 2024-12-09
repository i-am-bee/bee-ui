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
