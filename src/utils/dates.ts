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

export function getLocaleDateString(
  date: Date | string | number,
  locales: Intl.LocalesArgument = 'en-US',
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObject =
    date instanceof Date
      ? date
      : new Date(Number.isInteger(date) ? Number(date) * 1000 : date);
  return dateObject.toLocaleString(locales, options);
}

export function addDaysToDate(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
