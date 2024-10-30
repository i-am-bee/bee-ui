export function capitalizeFirstLetter(message: string) {
  return message.charAt(0).toUpperCase() + message.slice(1);
}

export function truncateCenter(
  string: string,
  maxLength: number,
  separator: string = '...',
) {
  if (!string || string.length <= maxLength) return string;

  const partLength = Math.floor((maxLength - separator.length) / 2);

  return (
    string.substring(0, partLength) +
    separator +
    string.substring(string.length - partLength)
  );
}
