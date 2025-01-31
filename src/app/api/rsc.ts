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

import { headers } from 'next/headers';
import { ensureAccessToken } from '../auth/rsc';
import { client } from './client';

// App dir, doesn't have a single entrypoint like a in pages _app.tsx
// where we could put it and have a global effect.
// One would think that global layout.tsx would be such entrypoint
// but in practice it's not, maybe nextjs imports a specific page
// first before a global layout I don't know.
// In any case RSC components need to import this file instead of ./index.ts
// IDEA: use webpack resolve for a RSC layer to alias ./index.ts to this file

client.use({
  async onRequest({ request }) {
    const correlationId = headers().get('x-correlation-id');
    if (correlationId) {
      request.headers.set('x-correlation-id', correlationId);
    }

    if (request.headers.get('authorization') == null) {
      const accessToken = await ensureAccessToken();
      request.headers.set('authorization', `Bearer ${accessToken}`);
    }

    return request;
  },
});

export * from './assistants';
export * from './projects';
export * from './threads';
export * from './threads-messages';
export * from './threads-runs';
export * from './users';
export * from './vector-stores';
