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
import Bee from './Bee.svg';
import classes from './StartFromScratchCard.module.scss';

interface Props {
  selected?: boolean;
  onClick: () => void;
}

export function StartFromScratchCard({ onClick, selected }: Props) {
  return (
    <CardsListItem
      title="Start from scratch"
      onClick={onClick}
      selected={selected}
      canHover
    >
      <div className={classes.body}>
        <p>Create an agent from scratch</p>

        <span className={classes.illustration}>
          <Bee />
        </span>
      </div>
    </CardsListItem>
  );
}
