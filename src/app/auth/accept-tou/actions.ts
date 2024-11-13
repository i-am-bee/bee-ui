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

'use server';

import { createProject, updateUser } from '@/app/api/rsc';
import { encodeMetadata } from '@/app/api/utils';
import { UserMetadata } from '@/store/user-profile/types';
import { updateSession } from '..';
import { ensureSession } from '../rsc';

export async function acceptTou(prevState: any, formData: FormData) {
  if (formData.get('accept') !== 'yes') {
    return {
      error: 'tou-not-accepted',
      message: 'ToU not accepted',
    };
  }

  // outside of try/catch because it can redirect which mustn't be in try/catch
  const session = await ensureSession();
  const defaultProject =
    session.userProfile.metadata?.default_project ??
    (
      await createProject({
        name: `${session.userProfile.firstName}'s personal`,
        visibility: 'private',
      })
    )?.id;

  const err = await updateUser({
    metadata: encodeMetadata<UserMetadata>({
      ...session.userProfile.metadata,
      email: session.userProfile.email,
      tou_accepted_at: Math.floor(Date.now() / 1000),
      default_project: defaultProject,
    }),
  }).then(
    () => null,
    (err) => {
      console.error('Error accepting ToU', err);
      return {
        error: 'api-error',
        message: err instanceof Error ? err.message : String(err),
      };
    },
  );
  if (err != null) return err;

  // refresh session user and redirect to callback url
  await updateSession({});
  return { success: true };
}
