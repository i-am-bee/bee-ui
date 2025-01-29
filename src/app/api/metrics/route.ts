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

import { api } from '@opentelemetry/sdk-node';
import { NextResponse } from 'next/server';
import { CounterType } from './types';

const meter = api.metrics.getMeter('bee-ui');

const buildAnAppCounter = meter.createCounter(CounterType.BUILD_AN_APP);
const chatWithAgentCounter = meter.createCounter(CounterType.CHAT_WITH_AGENT);
const createAnAgentCounter = meter.createCounter(CounterType.CREATE_AN_AGENT);

export async function POST(req: Request) {
  try {
    const { type }: { type: CounterType } = await req.json();

    switch (type) {
      case CounterType.BUILD_AN_APP:
        buildAnAppCounter.add(1);
        break;
      case CounterType.CHAT_WITH_AGENT:
        chatWithAgentCounter.add(1);
        break;
      case CounterType.CREATE_AN_AGENT:
        createAnAgentCounter.add(1);
        break;
      default:
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      error: 'Capturing click metric failed.',
    });
  }
}
