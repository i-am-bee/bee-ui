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

'use client';

import { createContext, PropsWithChildren, useRef } from 'react';
import { createStore } from '.';
import { InitialStoreState, Store } from './types';

export const StoreContext = createContext<Store | null>(null);

export const StoreProvider = ({
  children,
  ...props
}: PropsWithChildren<InitialStoreState>) => {
  const storeRef = useRef<Store>();

  if (!storeRef.current) {
    storeRef.current = createStore(props);
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
};
