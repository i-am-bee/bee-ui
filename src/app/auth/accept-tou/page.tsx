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

import { AcceptToU } from '@/modules/auth/AcceptToU';
import { isAbsoluteUrl } from '@/utils/url';
import { redirect } from 'next/navigation';
import { SIGN_IN_PAGE } from '..';
import { getSession } from '../rsc';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AcceptToUPage(props: PageProps) {
  const searchParams = await props.searchParams;
  let callbackUrl = Array.isArray(searchParams.callbackUrl)
    ? searchParams.callbackUrl[0]
    : searchParams.callbackUrl;
  if (!callbackUrl || isAbsoluteUrl(callbackUrl)) {
    callbackUrl = '/';
  }

  const session = await getSession();

  if (!session) {
    redirect(`${SIGN_IN_PAGE}?callbackUrl=${callbackUrl}`);
  }

  // We intentionally don't check touAccepted in the session because it can be stale
  // because it's not possible to update session in RSC.
  // For client side, we should update the session in the API proxy if we receive TOU error
  // For the RSC, if we receive TOU error from api call in RSC, I see no other way but to redirect
  // to some wrapping route handler that updates the session and redirects to provided callback url

  return <AcceptToU session={session} callbackUrl={callbackUrl} />;
}
