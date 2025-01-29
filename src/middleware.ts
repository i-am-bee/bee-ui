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

import { auth } from '@/app/auth';
import { NextMiddleware, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { commonRoutes } from './routes';
import { DUMMY_JWT_TOKEN, USERCONTENT_SITE_URL } from './utils/constants';

const middleware: NextMiddleware = async (request, ev) => {
  const correlationId = uuid();

  const onEnd = () => {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const csp = getCspHeader(nonce);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-correlation-id', correlationId);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', csp);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('Content-Security-Policy', csp);
    return response;
  };

  // For protected pages run an next-auth middleware too
  if (!DUMMY_JWT_TOKEN && protectedPages.test(request.nextUrl.pathname)) {
    return (
      // wrong types, auth returns Promise<Function> instead of Functon
      (
        await auth((req, ctx) => {
          const session = req.auth;
          // If there's some problem in the auth middleware, sadly instead of throwing
          // or returning the 500 response, it continues with a session as string with http status :(
          if (!session || typeof session !== 'object') {
            const { pathname, search, origin, basePath } = req.nextUrl;
            const redirectUrl = new URL(
              `${basePath}${commonRoutes.signIn()}`,
              origin,
            );
            redirectUrl.searchParams.set(
              'callbackUrl',
              `${basePath}${pathname}${search}`,
            );
            return NextResponse.redirect(redirectUrl);
          } else {
            // check if tou accepted
            if (!Boolean(session.userProfile.metadata?.tou_accepted_at)) {
              const { pathname, search, origin, basePath } = req.nextUrl;
              const redirectUrl = new URL(
                `${basePath}${commonRoutes.termsOfUse()}`,
                origin,
              );
              redirectUrl.searchParams.set(
                'callbackUrl',
                `${basePath}${pathname}${search}`,
              );
              return NextResponse.redirect(redirectUrl);
            }
          }
          return onEnd();
        })
      )(request, ev as any)
    );
  } else {
    return onEnd();
  }
};

export default middleware;

export const protectedPages = /^(?!\/auth(\/|$)|\/api(\/|$)).*$/; // all pages except /auth or /api

export const config = {
  // ignore _next/static, _next/image and any url with an extension, which are files in public folder
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};

const getCspHeader = (nonce: string) => {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === 'production' ? '' : `'unsafe-eval'`
    };
    style-src 'self' 'nonce-${nonce}';
    img-src * blob: data: www.ibm.com/;
    font-src 'self';
    object-src 'none';
    frame-src ${USERCONTENT_SITE_URL};
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
  `;

  return cspHeader.replace(/\s{2,}/g, ' ').trim();
};
