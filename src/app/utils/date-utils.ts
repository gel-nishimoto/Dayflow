import type { Activity } from '../models/activity.model';

const pad = (n: number): string => String(n).padStart(2, '0');

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function isoOffset(n: number): string {
  return toIso(addDays(new Date(), n));
}

export function thisWeekIso(): string {
  const now = new Date();
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
  return toIso(addDays(now, daysUntilSaturday >= 2 ? daysUntilSaturday : 3));
}

export function startOfWeek(d: Date): Date {
  return addDays(d, -d.getDay());
}

export function byDateTime(a: Activity, b: Activity): number {
  return `${a.date}${a.time ?? '23:59'}`.localeCompare(`${b.date}${b.time ?? '23:59'}`);
}
