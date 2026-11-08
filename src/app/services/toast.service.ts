import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationType } from '@capacitor/haptics';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alarmOutline, closeOutline, notificationsOutline } from 'ionicons/icons';

import { HapticsService } from './haptics.service';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastCtrl = inject(ToastController);
  private router = inject(Router);
  private haptics = inject(HapticsService);

  constructor() {
    addIcons({ alarmOutline, closeOutline, notificationsOutline });
  }

  async show(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1800,
      position: 'top',
      cssClass: 'app-toast',
    });
    await toast.present();
  }

  async triggerNotificationHaptic(): Promise<void> {
    await this.haptics.notification(NotificationType.Warning);
  }

  async showDueTomorrowPopup(taskTitle: string, dueDateDisplay: string = 'Tomorrow'): Promise<void> {
    // Dismiss any existing toast first so the due-tomorrow popup is clear and at the top
    try {
      const active = await this.toastCtrl.getTop();
      if (active) {
        await active.dismiss();
      }
    } catch {
      // Ignored
    }

    // Trigger universal Capacitor haptics & device vibration
    await this.haptics.notification(NotificationType.Warning);

    const toast = await this.toastCtrl.create({
      header: 'Task Due Tomorrow',
      message: `"${taskTitle}" is due ${dueDateDisplay}.`,
      icon: 'alarm-outline',
      position: 'top',
      duration: 5000,
      cssClass: 'due-tomorrow-toast',
      buttons: [
        {
          text: 'View',
          role: 'info',
          handler: () => {
            void this.router.navigateByUrl('/notifications');
          },
        },
        {
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });

    await toast.present();

    // Enforce automatic disappearance after exactly 5 seconds
    const autoDismissTimer = setTimeout(() => {
      try {
        void toast.dismiss();
      } catch {
        // Ignored if already dismissed
      }
    }, 5000);

    void toast.onDidDismiss().then(() => {
      clearTimeout(autoDismissTimer);
    });
  }
}

