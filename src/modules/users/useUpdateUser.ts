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

import { updateUser } from '@/app/api/users';
import { UserUpdateBody } from '@/app/api/users/types';
import { encodeMetadata } from '@/app/api/utils';
import { UserMetadata } from '@/store/user-profile/types';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useUpdateUser() {
  const { data: session, update: updateSession } = useSession();

  const mutation = useMutation({
    mutationFn: (body?: UserUpdateBody) => updateUser(body),
    onSuccess: (result) => {
      updateSession({
        ...session,
        userProfile: {
          ...session?.userProfile,
          metadata: encodeMetadata<UserMetadata>(result?.metadata),
        },
      });
    },
    meta: {
      errorToast: false,
    },
  });

  return mutation;
}
