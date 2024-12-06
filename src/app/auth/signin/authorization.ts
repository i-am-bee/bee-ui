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

import { User } from 'next-auth';
import { redis, REDIS_URL } from '@/redis';

export const dynamic = 'force-dynamic';

const EMAIL_FIELD = 'email';

const USER_KEY_PREFIX = 'user:';
const USER_WAIT_LIST_KEY = 'usersWaitlist';
const Status = {
  ADMITTED: 'admitted',
  REJECTED: 'rejected',
} as const;

const TIMEOUT_MILLISECONDS = 5_000;
const POLL_INTERVAL_MILLISECONDS = 1_000;

/**
 * Performs authorization against Redis cache managed by an external job
 * See https://github.ibm.com/Incubation/bee-jobs/blob/main/authorization/README.md
 * @param user
 * @returns
 */
export const authorizeUser = async (user: User) => {
  if (!REDIS_URL) return;

  const email = user[EMAIL_FIELD];
  if (!email) throw new Error(`User is missing ${EMAIL_FIELD}`);

  let requested = false;
  const signal = AbortSignal.timeout(TIMEOUT_MILLISECONDS);
  while (!signal.aborted) {
    const value = await redis.get(`${USER_KEY_PREFIX}${user[EMAIL_FIELD]}`);
    if (value !== null) {
      switch (value) {
        case Status.ADMITTED:
          return true; // success
        default:
          throw new Error('Unauthorized');
      }
    }
    if (!requested) {
      const tail = await redis.lrange(USER_WAIT_LIST_KEY, -1, -1); // check tail to avoid pollution
      if (tail.at(0) !== email) await redis.rpush(USER_WAIT_LIST_KEY, email);
      requested = true;
    }
    await new Promise((res) => setTimeout(res, POLL_INTERVAL_MILLISECONDS)); // sleep
  }
  throw new Error('Unauthorized');
};
