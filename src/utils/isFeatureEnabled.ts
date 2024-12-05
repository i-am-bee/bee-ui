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

export const isFeatureEnabled = (() => {
  try {
    const allFeatures = JSON.parse(process.env.NEXT_PUBLIC_FEATURE_FLAGS ?? '');
    return (feature: FeatureName) =>
      feature in allFeatures ? !!allFeatures[feature] : false;
  } catch (err) {
    console.warn('Unable to parse feature flags!', err);
    return (_: string) => false;
  }
})();

export enum FeatureName {
  Knowledge = 'Knowledge',
  FunctionTools = 'FunctionTools',
  Observe = 'Observe',
  Files = 'Files',
  TextExtraction = 'TextExtraction',
  Projects = 'Projects',
}
