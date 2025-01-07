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

import { createApiErrorResponse } from '@/app/api/server-utils';
import { auth } from '@/app/auth';
import { DUMMY_JWT_TOKEN } from '@/utils/constants';
import httpProxy from 'http-proxy';
import { NextApiRequest, NextApiResponse } from 'next';
import { JWT } from 'next-auth/jwt';
import http from 'node:http';
import https from 'node:https';

// Use custom agent to enable keep alive for better perf
const agentOptions = {
  keepAlive: true,
  keepAliveMsecs: 60 * 1000, // 1 minute
};

const agents: Record<string, any> = {
  http: new http.Agent(agentOptions),
  https: new https.Agent(agentOptions),
};
const target = new URL(process.env.API_URL!);

const proxy = httpProxy.createProxy({
  target,
  changeOrigin: true,
  xfwd: true,
  agent: agents[target.protocol],
});

// Use api route in pages dir instead of app route handler
// because here we can access raw node request and response
// so we can use http-proxy package, which handles correctly
// request cancellation.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  let accessToken = DUMMY_JWT_TOKEN;
  if (!accessToken) {
    const session = await auth(req, res);
    if (!session) {
      return res.status(401).json(createApiErrorResponse('auth_error'));
    }
    accessToken = session.access_token;
  }

  // Rewrite path
  let { path } = req.query;
  if (!path) path = [];
  if (!Array.isArray(path)) path = [path];
  if (!new RegExp('^v\\d+|observe$').test(path[0])) {
    res
      .status(404)
      .json(createApiErrorResponse('not_found', 'Route is not available'));
  }

  // Setup extra headers, authorization and x-correlation-id
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
  };

  let search = '';
  const searchStart = req.url?.indexOf('?');
  if (searchStart != null && searchStart >= 0) {
    const params = new URLSearchParams(req.url?.substring(searchStart + 1));
    if (params.has('project')) {
      headers['X-Project'] = params.get('project') ?? '';
      params.delete('project');
    }
    if (params.has('organization')) {
      headers['X-Organization'] = params.get('organization') ?? '';
      params.delete('organization');
    }

    search = `?${params.toString()}`;
  }
  req.url = '/' + path.join('/') + search;

  // x-correlation-id is initialized in next middleware
  let corelationId = req.headers['x-correlation-id'];
  if (Array.isArray(corelationId)) corelationId = corelationId[0];
  if (corelationId) {
    headers['x-correlation-id'] = corelationId;
  }

  proxy.web(
    req,
    res,
    {
      headers,
    },
    (err: NodeJS.ErrnoException) => {
      if (err.code === 'ECONNREFUSED') {
        res
          .status(503)
          .json(
            createApiErrorResponse(
              'service_unavailable',
              'Service Unavailable',
            ),
          );
      } else if (err.code === 'ECONNRESET') {
        res
          .status(504)
          .json(createApiErrorResponse('service_unavailable', err.message));
      } else {
        res
          .status(500)
          .json(createApiErrorResponse('internal_server_error', err.message));
      }
    },
  );
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
  },
};
