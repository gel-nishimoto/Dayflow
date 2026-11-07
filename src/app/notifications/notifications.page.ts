import { Component, inject } from '@angular/core';
import { IonContent, IonIcon, IonBackButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alarmOutline, flagOutline, alertCircleOutline, chevronBackOutline } from 'ionicons/icons';

import type { NotificationType } from '../models/notification.model';
import { ActivityStore } from '../services/activity-store';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-notifications',
  templateUrl: 'notifications.page.html',
  styleUrls: ['notifications.page.scss'],
  imports: [IonContent, IonIcon, IonBackButton],
})
export class NotificationsPage {
  store = inject(ActivityStore);
  private toast = inject(ToastService);

  icons: Record<NotificationType, string> = {
    upcoming: 'alarm-outline',
    deadline: 'flag-outline',
    overdue: 'alert-circle-outline',
  };

  constructor() {
    addIcons({ alarmOutline, flagOutline, alertCircleOutline, chevronBackOutline });
  }

  markAllRead() {
    this.store.markAllRead();
    this.toast.show('All notifications marked as read');
  }
}

