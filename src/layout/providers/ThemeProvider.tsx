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

import { useAfterMount } from '@/hooks/useAfterMount';
import { noop } from '@/utils/helpers';
import { usePrefix } from '@carbon/react';
import {
  PropsWithChildren,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { STORAGE_KEY, useUserSetting } from '../hooks/useUserSetting';

export enum Theme {
  System = 'system',
  Light = 'light',
  Dark = 'dark',
}

enum CarbonTheme {
  Light = 'white',
  Dark = 'g90',
}

type AppliedTheme = Exclude<Theme, Theme.System>;

interface ThemeContextValue {
  theme: Theme;
  appliedTheme?: AppliedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: Theme.System,
  setTheme: noop,
});

interface Props {
  nonce?: string;
}

export function ThemeProvider({ children, nonce }: PropsWithChildren<Props>) {
  const prefix = usePrefix();
  const MATCH_MEDIA = '(prefers-color-scheme: dark)';
  const DEFAULT_THEME = Theme.System;
  const THEMES = useMemo(
    () => ({
      [Theme.Dark]: `${prefix}--${CarbonTheme.Dark}`,
      [Theme.Light]: `${prefix}--${CarbonTheme.Light}`,
    }),
    [prefix],
  );
  const [appliedTheme, setAppliedTheme] = useState<AppliedTheme>();
  const { getUserSetting, setUserSetting } = useUserSetting();
  const storedTheme = getUserSetting('theme');

  const theme =
    (storedTheme && storedTheme in THEMES) || storedTheme === Theme.System
      ? storedTheme
      : DEFAULT_THEME;

  const getSystemTheme = () =>
    (window.matchMedia(MATCH_MEDIA).matches ? 'dark' : 'light') as Exclude<
      Theme,
      Theme.System
    >;

  const applyTheme = useCallback(
    (themeName: Theme) => {
      const html = document.documentElement;
      const theme = themeName === Theme.System ? getSystemTheme() : themeName;
      const classes = Object.keys(THEMES).map(
        (theme) => THEMES[theme as AppliedTheme],
      );

      setAppliedTheme(theme);

      html.classList.remove(...classes);
      html.classList.add(`${THEMES[theme]}`);
    },
    [THEMES],
  );

  const setTheme = useCallback(
    (theme: Theme) => {
      setUserSetting('theme', theme);
      applyTheme(theme);
    },
    [setUserSetting, applyTheme],
  );

  const handleThemeChange = useCallback(() => {
    if (theme === Theme.System) {
      applyTheme(theme);
    }
  }, [theme, applyTheme]);

  useEffect(() => {
    const matchMedia = window.matchMedia(MATCH_MEDIA);

    matchMedia.addEventListener('change', handleThemeChange);

    return () => {
      matchMedia.removeEventListener('change', handleThemeChange);
    };
  }, [handleThemeChange]);

  // Ensure the theme is applied. Fixes the bug with theme
  // not being applied on not-found.tsx pages (the standalone script,
  // that should do so below is not being run). I couldn't find out why.
  useAfterMount(() => applyTheme(theme), [applyTheme, theme]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => applyTheme(theme), []);

  const contextValue = useMemo(
    () => ({
      theme,
      appliedTheme,
      setTheme,
    }),
    [theme, appliedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeScript
        nonce={nonce}
        storageKey={STORAGE_KEY}
        themes={THEMES}
        defaultTheme={DEFAULT_THEME}
      />

      {children}
    </ThemeContext.Provider>
  );
}

interface ThemeScriptProps {
  storageKey: string;
  themes: { [key in AppliedTheme]: string };
  defaultTheme: Theme;
  nonce?: string;
}

function ThemeScript({ nonce, ...props }: ThemeScriptProps) {
  const scriptArgs = JSON.stringify({ ...props });

  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(${script.toString()})(${scriptArgs})`,
      }}
    />
  );
}

export function useTheme() {
  const context = use(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

const script = ({ storageKey, themes, defaultTheme }: ThemeScriptProps) => {
  const getSystemTheme = () =>
    (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light') as AppliedTheme;

  const applyTheme = (themeName: Theme) => {
    const html = document.documentElement;
    const theme = themeName === Theme.System ? getSystemTheme() : themeName;
    const classes = Object.keys(themes).map(
      (theme) => themes[theme as AppliedTheme],
    );

    html.classList.remove(...classes);
    html.classList.add(`${themes[theme]}`);
  };

  try {
    const storedTheme: Theme = JSON.parse(
      localStorage.getItem(storageKey) || `{}`,
    )['theme'];
    const theme =
      storedTheme in themes || storedTheme === Theme.System
        ? storedTheme
        : defaultTheme;

    applyTheme(theme);
  } catch (error) {}
};
