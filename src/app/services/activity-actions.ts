import { Injectable, inject } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';

import { ActivityDetailComponent } from '../components/activity-detail/activity-detail.component';
import { ActivityFormComponent } from '../components/activity-form/activity-form.component';
import type { Activity } from '../models/activity.model';

import { ActivityStore } from './activity-store';
import { ToastService } from './toast.service';

// UI flows shared by Home, My Tasks and Calendar: form, details, delete confirmation.
@Injectable({ providedIn: 'root' })
export class ActivityActions {
  private store = inject(ActivityStore);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toast = inject(ToastService);

  // Add (no activity) or Edit (with activity) form.
  async openForm(activity?: Activity, defaultDate?: string): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ActivityFormComponent,
      componentProps: { activity, defaultDate },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save') return;

    if (activity) {
      this.store.update(data);
      if (!this.store.isDueTomorrow(data)) {
        await this.toast.show('Activity updated');
      }
    } else {
      this.store.add(data);
      if (!this.store.isDueTomorrow(data)) {
        await this.toast.show('Activity added');
      }
    }
  }

  async openDetail(activity: Activity): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ActivityDetailComponent,
      componentProps: { activityId: activity.id },
      // Full height so the pinned Edit/Delete footer is always on screen.
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'edit') await this.openForm(activity);
    if (role === 'delete') await this.confirmDelete(activity);
  }

  async confirmDelete(activity: Activity): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete activity?',
      message: `"${activity.title}" will be removed from your list.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.store.remove(activity.id);
            this.toast.show('Activity deleted');
          },
        },
      ],
    });
    await alert.present();
  }

  // Circle tap: completed <-> pending
  toggle(activity: Activity): void {
    const done = activity.status !== 'completed';
    this.store.setStatus(activity.id, done ? 'completed' : 'pending');
    this.toast.show(done ? 'Marked as completed' : 'Moved back to pending');
  }
}

