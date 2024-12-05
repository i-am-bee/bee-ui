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

import { redis, REMAINING_CAPACITY_KEY } from '@/redis';

import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const remainingCapacity = await redis.get(REMAINING_CAPACITY_KEY);
  if (!remainingCapacity) return NextResponse.json({ remainingCapacity: null });
  return NextResponse.json({ remainingCapacity: parseInt(remainingCapacity) });
}
