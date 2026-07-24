import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type IDateOption =
  | '7d'
  | '30d'
  | 'currentMonth'
  | 'pastFullMonth'
  | '3m'
  | 'ytd'
  | 'ly'
  | 'custom'
  | 'all';

export function generateDateRange(days: IDateOption): { from: string; to: string } {
  if (days == 'all') {
    return {
      from: '',
      to: '',
    };
  }
  const to = new Date();
  const from = new Date();
  switch (days) {
    case '7d':
      from.setDate(to.getDate() - 7);
      break;
    case '30d':
      from.setDate(to.getDate() - 30);
      break;
    case 'currentMonth':
      from.setMonth(to.getMonth());
      from.setDate(1);
      break;
    case 'pastFullMonth':
      from.setMonth(to.getMonth() - 1);
      from.setDate(1);
      to.setDate(0);
      break;
    case '3m':
      from.setMonth(to.getMonth() - 3);
      break;
    case 'ytd':
      from.setMonth(0);
      from.setDate(1);
      break;
    case 'ly':
      from.setFullYear(to.getFullYear() - 1);
      from.setMonth(0);
      from.setDate(1);
      to.setFullYear(to.getFullYear() - 1);
      to.setMonth(11);
      to.setDate(31);
      break;
    case 'custom':
      // Handle custom date range logic here if needed
      break;
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}
