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

import { Theme } from '@/layout/providers/ThemeProvider';
import useLocalStorageState from 'use-local-storage-state';

export const STORAGE_KEY = '@bee/USER_SETTING';

export type UserSetting = {
  chatDebugMode?: boolean;
  theme?: Theme;
  sidebarPinned?: boolean;
};

export function useUserSetting() {
  const [userSetting, setUserSetting] = useLocalStorageState<UserSetting>(
    STORAGE_KEY,
    {
      defaultValue: {},
    },
  );

  const set = <K extends keyof UserSetting>(key: K, value: UserSetting[K]) => {
    setUserSetting((setting) => ({
      ...setting,
      [key]: value,
    }));
  };

  const get = <K extends keyof UserSetting>(key: K): UserSetting[K] => {
    return userSetting[key];
  };

  return { getUserSetting: get, setUserSetting: set };
}
