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

import Redis from 'ioredis';

export const REDIS_URL = process.env.REDIS_URL ?? '';
const REDIS_CA_CERT = process.env.REDIS_CA_CERT ?? '';
export const REMAINING_CAPACITY_KEY = 'remainingCapacity';

export const redis = new Redis(REDIS_URL, {
  commandTimeout: 10_000,
  tls: REDIS_URL.startsWith('rediss')
    ? {
        ca: Buffer.from(REDIS_CA_CERT),
      }
    : undefined,
});
