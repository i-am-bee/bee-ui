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

import classes from './Spinner.module.scss';

export function Spinner() {
  return (
    <svg version="1.1" className={classes.root} viewBox="0 0 20 20">
      <path d="M5.2,10.6c0,1.1-0.9,2-2,2s-2.5-0.9-2.5-2s1.4-2,2.5-2S5.2,9.5,5.2,10.6z" />
      <path d="M13.2,9.5c0,1.7-1.3,3.1-3,3.1c-1.7,0-3-1.4-3-3.1c0-1.7,1.3-3.9,3-3.9C11.9,5.6,13.2,7.8,13.2,9.5z" />
      <path d="M18.8,11.7c-0.6,0.9-1.8,1.2-2.8,0.6c-0.9-0.6-1.2-1.8-0.6-2.8c0.6-0.9,2.1-1.6,3-1C19.4,9.1,19.4,10.8,18.8,11.7z" />
    </svg>
  );
}
