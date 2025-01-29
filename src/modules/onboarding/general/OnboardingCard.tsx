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

import { SkeletonPlaceholder, SkeletonText } from '@carbon/react';
import clsx from 'clsx';
import { ReactNode } from 'react';
import classes from './OnboardingCard.module.scss';

interface Props {
  heading: string;
  description: string;
  image: ReactNode;
  onClick: () => void;
}

export function OnboardingCard({
  heading,
  description,
  image,
  onClick,
}: Props) {
  return (
    <article className={classes.root}>
      <div className={classes.image}>{image}</div>
      <h4 className={classes.heading}>
        <button onClick={onClick} type="button" className={classes.button}>
          {heading}
        </button>
      </h4>
      <p className={classes.description}>{description}</p>
    </article>
  );
}

OnboardingCard.Skeleton = function Skeleton() {
  return (
    <article className={clsx(classes.root, classes.skeleton)}>
      <SkeletonPlaceholder className={classes.image} />
      <SkeletonText className={classes.heading} />
      <SkeletonText paragraph lineCount={3} className={classes.description} />
    </article>
  );
};
