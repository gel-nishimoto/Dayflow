import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonToggle, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  callOutline,
  schoolOutline,
  createOutline,
  lockClosedOutline,
  helpCircleOutline,
  informationCircleOutline,
  chevronForwardOutline,
  logOutOutline,
} from 'ionicons/icons';

import { ActivityStore } from '../services/activity-store';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [IonContent, IonIcon, IonToggle, FormsModule],
})
export class ProfilePage {
  private alertCtrl = inject(AlertController);
  private toast = inject(ToastService);
  private store = inject(ActivityStore);

  name = signal('Angel Reyes');
  initials = computed(() =>
    this.name()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );
  completed = computed(() => this.store.activities().filter((a) => a.status === 'completed').length);

  info = [
    { icon: 'mail-outline', label: 'Email', value: 'angel.reyes@email.com' },
    { icon: 'call-outline', label: 'Phone', value: '+63 912 345 6789' },
    { icon: 'school-outline', label: 'School', value: 'Sample University' },
  ];

  dailyReminder = true;
  soundAlerts = false;

  constructor() {
    addIcons({
      mailOutline,
      callOutline,
      schoolOutline,
      createOutline,
      lockClosedOutline,
      helpCircleOutline,
      informationCircleOutline,
      chevronForwardOutline,
      logOutOutline,
    });
  }

  onPreference(label: string, on: boolean) {
    this.toast.show(`${label} ${on ? 'on' : 'off'}`);
  }

  async editProfile() {
    const alert = await this.alertCtrl.create({
      header: 'Edit Profile',
      inputs: [{ name: 'name', type: 'text', value: this.name(), placeholder: 'Full name' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (v) => {
            if (v.name?.trim()) {
              this.name.set(v.name.trim());
              this.toast.show('Profile updated');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async changePassword() {
    const alert = await this.alertCtrl.create({
      header: 'Change Password',
      inputs: [
        { name: 'current', type: 'password', placeholder: 'Current password' },
        { name: 'next', type: 'password', placeholder: 'New password' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Update', handler: () => this.toast.show('Password updated (demo only)') },
      ],
    });
    await alert.present();
  }

  async showInfo(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Log out?',
      message: 'You will be signed out of this demo.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Log out', role: 'destructive', handler: () => this.toast.show('Logged out (demo only)') },
      ],
    });
    await alert.present();
  }
}

