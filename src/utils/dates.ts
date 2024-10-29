export function getLocaleDateString(
  date: Date | string | number,
  locales: Intl.LocalesArgument = 'en-US',
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObject = date instanceof Date ? date : new Date(date);
  return dateObject.toLocaleString(locales, options);
}
