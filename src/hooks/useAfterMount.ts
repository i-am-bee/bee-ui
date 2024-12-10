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

import { DependencyList, EffectCallback, useEffect, useState } from 'react';

export function useAfterMount(effect: EffectCallback, deps?: DependencyList) {
  const [initialMount, setInitialMount] = useState(true);

  useEffect(() => {
    if (initialMount) return setInitialMount(false);

    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
