import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonFab, IonFabButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notificationsOutline, add, checkmarkCircle, sunnyOutline } from 'ionicons/icons';

import { ProgressCardComponent } from '../components/progress-card/progress-card.component';
import { TaskItemComponent } from '../components/task-item/task-item.component';
import { ActivityActions } from '../services/activity-actions';
import { ActivityStore } from '../services/activity-store';
import { byDateTime, todayIso } from '../utils/date-utils';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, IonIcon, IonFab, IonFabButton, DatePipe, TaskItemComponent, ProgressCardComponent],
})
export class HomePage {
  store = inject(ActivityStore);
  actions = inject(ActivityActions);
  private router = inject(Router);

  today = new Date();
  greeting = this.getGreeting();

  // Only today's tasks; the Home screen shows just the first four.
  todayTasks = computed(() =>
    this.store
      .activities()
      .filter((a) => a.date === todayIso())
      .sort(byDateTime),
  );
  visibleTasks = computed(() => this.todayTasks().slice(0, 4));
  doneCount = computed(() => this.todayTasks().filter((t) => t.status === 'completed').length);

  constructor() {
    addIcons({ notificationsOutline, add, checkmarkCircle, sunnyOutline });
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  seeAll() {
    this.router.navigateByUrl('/tasks');
  }

  openNotifications() {
    this.router.navigateByUrl('/notifications');
  }
}
