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

import mimeType from 'mime-types';

export function isMimeTypeReadable(
  mimeType: string,
  extractionEnabled: boolean,
) {
  return (
    mimeType.startsWith('text/') ||
    getAllowedMimeTypes(extractionEnabled).some((type) => type === mimeType)
  );
}

export const ALLOWED_EXTENSIONS_EXTRACTION = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'tiff',
  'bmp',
  'gif',
  'doc',
  'docx',
  'pptx',
  'ppt',
];

function getExtensionsReadable(extensions: string[]) {
  return extensions.map((extension) => `.${extension}`).join(', ');
}

export function getAllowedMimeTypes(extractionEnabled: boolean) {
  const allowedExtensions = [
    'json',
    ...(extractionEnabled ? ALLOWED_EXTENSIONS_EXTRACTION : []),
  ];

  return [
    'text/*',
    ...allowedExtensions.map((ext) => String(mimeType.lookup(ext))),
  ];
}

export const HUMAN_ALLOWED_EXTENSIONS_TEXT_EXAMPLE = getExtensionsReadable([
  'txt',
  'md',
  'html',
  'csv',
  'json',
]);
export const HUMAN_ALLOWED_EXTENSIONS_EXTRACTION = getExtensionsReadable(
  ALLOWED_EXTENSIONS_EXTRACTION,
);
