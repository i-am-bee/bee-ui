import { Dispatch, SetStateAction } from 'react';
import classes from './AppsOnboardingTemplateSelection.module.scss';
import { useAppContext } from '@/layout/providers/AppProvider';
import { AppTemplate } from '../types';
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
