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

import { withLenses } from '@dhmk/zustand-lens';
import { useContext } from 'react';
import { create, useStore as useZustandStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StoreContext } from './StoreProvider';
import { InitialStoreState, StoreState } from './types';
import { userProfileSlice } from './user-profile';
import { layoutSlice } from './layout';

export const createStore = (initialState?: InitialStoreState) =>
  create<StoreState>()(
    immer(
      withLenses(() => {
        return {
          userProfile: userProfileSlice(initialState?.userProfile),
          layout: layoutSlice(initialState?.layout),
        };
      }),
    ),
  );

export const useStore = <T>(selector: (store: StoreState) => T): T => {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error(`useStore must be used within StoreProvider`);
  }

  return useZustandStore(storeContext, selector);
};
