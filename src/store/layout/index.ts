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

import { lens } from '@dhmk/zustand-lens';
import { useStore } from '..';
import { StoreSelector } from '../types';
import { LayoutSlice, LayoutState } from './types';

const DEFAULT_STATE: LayoutState = {
  sidebarVisible: true,
};

export const layoutSlice = (initialState?: Partial<LayoutState>) =>
  lens<LayoutSlice>((set, get) => ({
    ...DEFAULT_STATE,
    ...initialState,
    actions: {
      setLayout: (value) => set(value),
    },
  }));

export const useLayout: StoreSelector<LayoutState> = (selector) =>
  useStore((state) => selector(state.layout));

export const useLayoutActions = () => useStore((state) => state.layout.actions);
