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
import { PreferencesSection, PreferencesLayout } from './PreferencesLayout';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  RadioButton,
  RadioButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Toggle,
} from '@carbon/react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ChangeEvent, useId, useMemo } from 'react';
import { getLocaleDateString } from '@/utils/dates';
import { Theme, useTheme } from '@/layout/providers/ThemeProvider';
import { Laptop, Moon, Sun } from '@carbon/react/icons';
import classes from './SystemPreferences.module.scss';
import { useUserSetting } from '@/layout/hooks/useUserSetting';

export function SystemPreferences() {
  const { project } = useAppContext();
  const id = useId();
  const { getUserSetting, setUserSetting } = useUserSetting();
  const { theme, setTheme } = useTheme();

  return (
    <PreferencesLayout section={PreferencesSection.SystemPreferences}>
      <div className={classes.root}>
        <Toggle
          size="sm"
          labelText="Debug mode"
          id={`${id}:assistant-plan-always-visible`}
          toggled={getUserSetting('chatDebugMode')}
          onToggle={(value) => {
            setUserSetting('chatDebugMode', value);
          }}
        />

        <RadioButtonGroup
          legendText="Theme"
          name="theme"
          className={classes.themeToggle}
          onChange={(theme) => setTheme(theme as Theme)}
          valueSelected={theme}
        >
          {THEMES.map(({ name, label, icon: Icon }) => (
            <RadioButton
              key={name}
              labelText={
                <>
                  <Icon size={18} /> {label}
                </>
              }
              value={name}
            />
          ))}
        </RadioButtonGroup>
      </div>
    </PreferencesLayout>
  );
}

const THEMES = [
  {
    name: Theme.System,
    label: 'Sync with system',
    icon: Laptop,
  },
  {
    name: Theme.Light,
    label: 'Light',
    icon: Sun,
  },
  {
    name: Theme.Dark,
    label: 'Dark',
    icon: Moon,
  },
];
