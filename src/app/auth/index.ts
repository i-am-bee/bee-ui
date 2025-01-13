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

import { UserMetadata, UserProfileState } from '@/store/user-profile/types';
import { checkErrorCode } from '@/utils/handleApiError';
import NextAuth from 'next-auth';
import type { OAuthConfig } from 'next-auth/providers';
import * as z from 'zod';
import { ApiError, HttpError } from '../api/errors';
import { createUser, readUser } from '../api/users';
import { UserEntity } from '../api/users/types';
import {
  decodeEntityWithMetadata,
  encodeMetadata,
  maybeGetJsonBody,
} from '../api/utils';
import { noop } from '@/utils/helpers';

const AUTH_PROVIDER_ID = process.env.NEXT_PUBLIC_AUTH_PROVIDER_ID!;
const AUTH_PROVIDER_NAME = process.env.AUTH_PROVIDER_NAME!;
const AUTH_WELL_KNOWN = process.env.AUTH_WELL_KNOWN!;
const AUTH_ISSUER = process.env.AUTH_ISSUER!;
const AUTH_TOKEN_ENDPOINT = process.env.AUTH_TOKEN_ENDPOINT!;
const AUTH_REVOKE_ENDPOINT = process.env.AUTH_REVOKE_ENPOINT!;
const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID!;
const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET!;

type Profile = {
  sub: string;
  email: string;
  name: string;
  family_name?: string;
  given_name?: string;
};

const provider: OAuthConfig<Profile> = {
  id: AUTH_PROVIDER_ID,
  name: AUTH_PROVIDER_NAME,
  type: 'oidc',
  wellKnown: AUTH_WELL_KNOWN,
  issuer: AUTH_ISSUER,
  clientId: AUTH_CLIENT_ID,
  clientSecret: AUTH_CLIENT_SECRET,
  authorization: { params: { scope: 'openid email profile fmaas peri' } },
  token: {
    async conform(response: Response) {
      if (!response.ok || response.bodyUsed) {
        return response;
      }
      try {
        const data = await response.json();
        // Next-auth@5 needs to have "bearer" in token_type, but ISV returns "jwt" so replace it
        data.token_type = 'bearer';
        return Response.json(data, { headers: response.headers });
      } catch {
        return response;
      }
    },
  },
  profile(profile) {
    return {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      lastName: profile.family_name,
      firstName: profile.given_name,
    };
  },
};

const authResult = NextAuth(() => ({
  providers: [provider],
  trustHost: true,

  // These need to be set manually although these are the defaults
  // because of bug in next-auth@5 when these are not defaulted
  // in the case of auth function usage in middleware
  basePath: '/api/auth',
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
    // Refresh token lifetime
    maxAge: 604800,
  },
  pages: {
    signIn: SIGN_IN_PAGE,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.access_token || !account?.id_token) return false;

      try {
        await authorizeUser(account.id_token);
      } catch (err) {
        return `${SIGN_IN_PAGE}?error=unauthorized`;
      }

      try {
        const result = await readUser(account.access_token);
        if (result) {
          user.userEntity = decodeEntityWithMetadata<UserEntity>(result);
          return true;
        }
      } catch (error) {
        console.log('bagr', { error });

        if (
          error instanceof TypeError &&
          checkErrorCode(error) === 'ECONNREFUSED'
        ) {
          return `${SIGN_IN_PAGE}?error=service_unavailable`;
        }
      }

      try {
        const result = await createUser(account.access_token, {
          name: user.name ?? undefined,
          metadata: encodeMetadata<UserMetadata>({
            email: user.email ?? '',
          }),
        });
        if (result) {
          user.userEntity = decodeEntityWithMetadata<UserEntity>(result);
        }
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.code === 'auth_error') {
          if (error.message)
            return `${SIGN_IN_PAGE}?error=${encodeURIComponent(error.message)}`;
        }

        return `${SIGN_IN_PAGE}?error=service_unavailable`;
      }
    },
    async jwt({ token: oldToken, account, user, trigger }) {
      const token = { ...oldToken };
      if (account) {
        if (!account.access_token) throw new Error('Missing access_token');
        if (!account.refresh_token) throw new Error('Missing refresh_token');
        if (!account.expires_at) throw new Error('Missing expiration');

        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = account.expires_at;
      }

      let userEntity = user?.userEntity;

      if (trigger === 'update') {
        // On session update, refresh a user
        const result = await readUser(token.access_token);
        if (result) {
          userEntity = decodeEntityWithMetadata<UserEntity>(result);
        }
      }

      if (user) {
        token.first_name = user.firstName ?? '';
        token.last_name = user.lastName ?? '';
      }

      if (userEntity) {
        token.userEntity = userEntity;
      }

      const exp = token?.expires_at;
      const isExpired = exp && exp < Date.now() / 1000;

      // Refresh the access token if necessary
      // https://authjs.dev/guides/basics/refresh-token-rotation#implementation
      if (isExpired) {
        const { accessToken, refreshToken, expiresIn } =
          await refreshAccessToken(token.refresh_token);

        token.access_token = accessToken;
        token.expires_at = Math.floor(Date.now() / 1000 + expiresIn);

        if (refreshToken) {
          token.refresh_token = refreshToken;
        }
      }

      return token;
    },
    session({ session, token }) {
      session.access_token = token.access_token;
      session.userProfile = {
        id: token.userEntity.id,
        name: token.name ?? '',
        email: token.email ?? '',
        firstName: token.first_name,
        lastName: token.last_name,
        metadata: token.userEntity.uiMetadata,
        default_organization: token.userEntity.default_organization,
        default_project: token.userEntity.default_project,
      };

      return session;
    },
  },
  events: {
    /** @ts-expect-error: next-auth@5 types are wrong here */
    signOut({ token }) {
      // ISV doesn't support revocation of JWT access tokens at the moment
      const data = new URLSearchParams({
        client_id: AUTH_CLIENT_ID,
        client_secret: AUTH_CLIENT_SECRET,
        token: token.refreshToken,
      });
      fetch(AUTH_REVOKE_ENDPOINT, {
        method: 'POST',
        body: data,
      }).catch(noop);
    },
  },
}));

export const SIGN_IN_PAGE = '/auth/signin';
export const ACCEPT_TOU_PAGE = '/auth/accept-tou';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  unstable_update: updateSession,
} = authResult;

const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch(AUTH_TOKEN_ENDPOINT, {
    body: new URLSearchParams({
      client_id: AUTH_CLIENT_ID,
      client_secret: AUTH_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    method: 'POST',
  });

  if (response.ok) {
    const res = refreshAccessTokenSchema.safeParse(await response.json());
    if (res.success) {
      return {
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token,
        expiresIn: res.data.expires_in,
      };
    }
    throw new Error('Failed to refresh access token', {
      cause: res.error,
    });
  }
  throw new Error('Failed to refresh access token', {
    cause: new HttpError(response, await maybeGetJsonBody(response)),
  });
};

const refreshAccessTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
});

declare module 'next-auth' {
  interface Session {
    access_token: string;
    userProfile: UserProfileState;
  }
  interface User {
    firstName?: string;
    lastName?: string;
    userEntity?: UserEntity;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    first_name: string;
    last_name: string;
    userEntity: UserEntity;
  }
}

const authorizeUser = async (idToken: string) => {
  const result = await fetch(
    new URL('/api/authorization', process.env.NEXTAUTH_URL),
    {
      headers: { Authorization: `Bearer ${idToken}` },
    },
  );
  if (!result.ok) throw new Error('Unauthorized');
};
