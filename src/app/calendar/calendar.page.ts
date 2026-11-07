import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonFab, IonFabButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, chevronBackOutline, chevronForwardOutline, calendarClearOutline } from 'ionicons/icons';

import { TaskItemComponent } from '../components/task-item/task-item.component';
import { ActivityActions } from '../services/activity-actions';
import { ActivityStore } from '../services/activity-store';
import { addDays, byDateTime, fromIso, startOfWeek, toIso, todayIso } from '../utils/date-utils';

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss'],
  imports: [IonContent, IonIcon, IonFab, IonFabButton, TaskItemComponent],
})
export class CalendarPage {
  store = inject(ActivityStore);
  actions = inject(ActivityActions);

  selected = signal(todayIso());
  today = todayIso();

  monthLabel = computed(() =>
    fromIso(this.selected()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  // The 7 days of the week that contains the selected date.
  days = computed(() => {
    const start = startOfWeek(fromIso(this.selected()));
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const iso = toIso(d);
      return {
        iso,
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        num: d.getDate(),
        hasActivity: this.store.activities().some((a) => a.date === iso),
      };
    });
  });

  selectedLabel = computed(() =>
    fromIso(this.selected()).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
  );

  items = computed(() =>
    this.store
      .activities()
      .filter((a) => a.date === this.selected())
      .sort(byDateTime),
  );

  constructor() {
    addIcons({ add, chevronBackOutline, chevronForwardOutline, calendarClearOutline });
  }

  // Previous/next moves the selected date by one week.
  shiftWeek(weeks: number) {
    this.selected.set(toIso(addDays(fromIso(this.selected()), weeks * 7)));
  }
}

