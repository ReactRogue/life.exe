import { describe, expect, it } from 'vitest';
import {
  addDaysToKey,
  daysBetweenKeys,
  isDateKey,
  isFutureKey,
  lastNDayKeys,
  relativeDayLabel,
  relativeTime,
  startOfWeekKey,
  weekdayOfKey,
  weekDates,
} from '../date';

describe('date helpers', () => {
  it('validates date keys strictly', () => {
    expect(isDateKey('2026-10-22')).toBe(true);
    expect(isDateKey('2026-13-01')).toBe(false);
    expect(isDateKey('22-10-2026')).toBe(false);
    expect(isDateKey('')).toBe(false);
  });

  it('moves across month and year boundaries', () => {
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysToKey('2026-03-01', 365)).toBe('2027-03-01');
  });

  it('counts whole days between keys', () => {
    expect(daysBetweenKeys('2026-10-20', '2026-10-22')).toBe(2);
    expect(daysBetweenKeys('2026-10-22', '2026-10-20')).toBe(-2);
    expect(daysBetweenKeys('2026-10-22', '2026-10-22')).toBe(0);
  });

  it('honours the configured week start', () => {
    const monday = startOfWeekKey('2026-10-22', 1);
    expect(weekdayOfKey(monday)).toBe(1);
    const sunday = startOfWeekKey('2026-10-22', 0);
    expect(weekdayOfKey(sunday)).toBe(0);
    expect(weekDates('2026-10-22', 1)).toHaveLength(7);
    expect(weekDates('2026-10-22', 1)[0]).toBe(monday);
  });

  it('returns day windows ending on the given day', () => {
    const keys = lastNDayKeys(7, '2026-10-22');
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-10-16');
    expect(keys[6]).toBe('2026-10-22');
  });

  it('detects future days only', () => {
    expect(isFutureKey('2026-10-23', '2026-10-22')).toBe(true);
    expect(isFutureKey('2026-10-22', '2026-10-22')).toBe(false);
    expect(isFutureKey('2026-10-21', '2026-10-22')).toBe(false);
  });

  it('labels days relative to today', () => {
    expect(relativeDayLabel('2026-10-22', '2026-10-22')).toBe('Today');
    expect(relativeDayLabel('2026-10-21', '2026-10-22')).toBe('Yesterday');
    expect(relativeDayLabel('2026-10-18', '2026-10-22')).toBe('4 days ago');
  });

  it('formats relative timestamps', () => {
    const now = new Date('2026-10-22T12:00:00Z');
    expect(relativeTime(new Date('2026-10-22T11:59:40Z').toISOString(), now)).toBe('just now');
    expect(relativeTime(new Date('2026-10-22T11:40:00Z').toISOString(), now)).toBe('20m ago');
    expect(relativeTime(new Date('2026-10-22T08:00:00Z').toISOString(), now)).toBe('4h ago');
    expect(relativeTime(new Date('2026-10-20T12:00:00Z').toISOString(), now)).toBe('2d ago');
    expect(relativeTime('not-a-date', now)).toBe('');
  });
});
