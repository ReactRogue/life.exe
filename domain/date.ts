/** Local-calendar date helpers. Keys are always `YYYY-MM-DD` in the device timezone. */

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function addDaysToKey(key: string, amount: number): string {
  return toDateKey(addDays(fromDateKey(key), amount));
}

/** Days from `a` to `b` (b - a), using UTC midnights to dodge DST. */
export function daysBetweenKeys(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const utcA = Date.UTC(ay, am - 1, ad);
  const utcB = Date.UTC(by, bm - 1, bd);
  return Math.round((utcB - utcA) / 86_400_000);
}

export function compareDateKeys(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

export function weekdayOfKey(key: string): number {
  return fromDateKey(key).getDay();
}

export function startOfWeek(date: Date, weekStart: 0 | 1 = 1): Date {
  const copy = startOfDay(date);
  const diff = (copy.getDay() - weekStart + 7) % 7;
  return addDays(copy, -diff);
}

export function startOfWeekKey(key: string, weekStart: 0 | 1 = 1): string {
  return toDateKey(startOfWeek(fromDateKey(key), weekStart));
}

export function weekDates(today: string, weekStart: 0 | 1 = 1): string[] {
  const start = startOfWeekKey(today, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDaysToKey(start, i));
}

export function dayRangeKeys(startKey: string, endKey: string): string[] {
  const total = daysBetweenKeys(startKey, endKey);
  if (total < 0) return [];
  return Array.from({ length: total + 1 }, (_, i) => addDaysToKey(startKey, i));
}

export function lastNDayKeys(count: number, today: string): string[] {
  return Array.from({ length: count }, (_, i) => addDaysToKey(today, i - (count - 1)));
}

export function isToday(key: string, today: string): boolean {
  return key === today;
}

export function isWeekendKey(key: string): boolean {
  const day = weekdayOfKey(key);
  return day === 0 || day === 6;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDateKey(key: string, format: 'short' | 'medium' | 'long' | 'day' = 'medium'): string {
  const date = fromDateKey(key);
  const month = MONTHS_SHORT[date.getMonth()];
  if (format === 'short') return `${month} ${date.getDate()}`;
  if (format === 'day') return `${date.getDate()}`;
  if (format === 'long') {
    return `${WEEKDAY_SHORT[date.getDay()]}, ${month} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return `${WEEKDAY_SHORT[date.getDay()]} ${month} ${date.getDate()}`;
}

export function formatMonthYear(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekday(key: string, style: 'narrow' | 'short' = 'short'): string {
  const day = weekdayOfKey(key);
  return style === 'narrow' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day] : WEEKDAY_SHORT[day];
}

export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${pad(minutes)} ${suffix}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${formatDateKey(toDateKey(date), 'short')} · ${formatClock(iso)}`;
}

export function relativeDayLabel(key: string, today: string): string {
  const diff = daysBetweenKeys(key, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < -1 && diff > -7) return `In ${Math.abs(diff)} days`;
  return formatDateKey(key, 'short');
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, now.getTime() - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateKey(toDateKey(new Date(then)), 'short');
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Still awake';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Late shift';
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function monthStartKey(year: number, monthIndex: number): string {
  return toDateKey(new Date(year, monthIndex, 1));
}

export function isFutureKey(key: string, today: string): boolean {
  return daysBetweenKeys(today, key) > 0;
}

export function isValidDateKey(value: string): boolean {
  return isDateKey(value);
}
