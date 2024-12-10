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

import Illustration from './illustration.svg';
import classes from './AppsOnboardingIntro.module.scss';

export function AppsOnboardingIntro() {
  return (
    <div>
      <div className={classes.illustration}>
        <Illustration />
      </div>

      <h2 className={classes.heading}>Apps</h2>

      <div className={classes.content}>
        <p>
          With Bee, you can chat to build reusable apps to automate simple,
          everyday business tasks. Explore examples, start building, and share
          your apps with others.
        </p>
      </div>
    </div>
  );
}
