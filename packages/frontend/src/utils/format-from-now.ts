import { formatDistanceToNowStrict } from 'date-fns';

export function formatFromNow(date: Date | string | number): string {
  if (!date) {
    return '';
  }

  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    roundingMethod: 'trunc',
  });
}
