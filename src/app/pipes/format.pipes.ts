import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

import { fromIso, isoOffset } from '../utils/date-utils';

// "14:30" -> "2:30 PM"
@Pipe({ name: 'time12' })
export class Time12Pipe implements PipeTransform {
  transform(value?: string): string {
    if (!value) return '';
    const [h, m] = value.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }
}

// "2026-11-09" -> "Tomorrow" / "Nov 12"
@Pipe({ name: 'dateLabel' })
export class DateLabelPipe implements PipeTransform {
  transform(iso?: string): string {
    if (!iso) return '';
    if (iso === isoOffset(0)) return 'Today';
    if (iso === isoOffset(1)) return 'Tomorrow';
    if (iso === isoOffset(-1)) return 'Yesterday';
    return fromIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
