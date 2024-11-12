import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import mimeType from 'mime-types';

export function isMimeTypeReadable(mimeType: string) {
  return (
    mimeType.startsWith('text/') ||
    ALLOWED_MIME_TYPES.some((type) => type === mimeType)
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
export const ALLOWED_EXTENSIONS_OTHER = [
  'json',
  ...(isFeatureEnabled(FeatureName.TextExtraction)
    ? ALLOWED_EXTENSIONS_EXTRACTION
    : []),
];
export const ALLOWED_MIME_TYPES = [
  'text/*',
  ...ALLOWED_EXTENSIONS_OTHER.map((ext) => String(mimeType.lookup(ext))),
];

function getExtensionsReadable(extensions: string[]) {
  return extensions.map((extension) => `.${extension}`).join(', ');
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
