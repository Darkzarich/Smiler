import { formatDistanceStrict } from 'date-fns';

export function formatFromNow(
  date: Date | string | number,
  now: Date | string | number = Date.now(),
): string {
  if (!date) {
    return '';
  }

  return formatDistanceStrict(date, now, {
    addSuffix: true,
    roundingMethod: 'trunc',
  });
}
