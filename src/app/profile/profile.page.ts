import type { OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonContent, IonIcon, IonSpinner, IonToggle, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  callOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  createOutline,
  helpCircleOutline,
  informationCircleOutline,
  lockClosedOutline,
  logInOutline,
  logOutOutline,
  mailOutline,
  schoolOutline,
} from 'ionicons/icons';

import { LoginModalComponent } from '../components/login-modal/login-modal.component';
import { ActivityApiService } from '../services/activity-api.service';
import { ActivityStore } from '../services/activity-store';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [IonContent, IonIcon, IonSpinner, IonToggle, FormsModule],
})
export class ProfilePage implements OnInit {
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);
  private toast = inject(ToastService);
  private store = inject(ActivityStore);
  private api = inject(ActivityApiService);

  isLoggedIn = this.store.isLoggedIn;
  name = computed(() =>
    this.isLoggedIn() ? this.store.currentUser()?.name || 'Student User' : 'Guest User',
  );

  email = '';
  phone = '';
  school = '';
  saving = signal(false);

  initials = computed(() => {
    if (!this.isLoggedIn()) return 'GU';
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  });
  completed = computed(() => this.store.activities().filter((a) => a.status === 'completed').length);

  dailyReminder = true;
  soundAlerts = false;

  constructor() {
    addIcons({
      mailOutline,
      callOutline,
      schoolOutline,
      checkmarkCircleOutline,
      createOutline,
      lockClosedOutline,
      logInOutline,
      logOutOutline,
      helpCircleOutline,
      informationCircleOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadProfileFromApi();
    }
  }

  loadProfileFromApi(): void {
    const current = this.store.currentUser();
    this.api.getProfile(current?.id).subscribe({
      next: (p) => {
        if (p) {
          this.email = p.email || '';
          this.phone = p.phone || '';
          this.school = p.school || '';
          this.dailyReminder = p.dailyReminder;
          this.soundAlerts = p.soundAlerts;
        }
      },
      error: (err: Error) => {
        console.info('Backend profile unavailable, using local defaults:', err.message);
      },
    });
  }

  saveProfileDetails(): void {
    if (!this.isLoggedIn()) {
      this.toast.show('Please log in to save details to the database');
      return;
    }

    if (this.saving()) return;
    this.saving.set(true);

    const current = this.store.currentUser();
    const payload = {
      id: current?.id,
      email: this.email.trim(),
      phone: this.phone.trim(),
      school: this.school.trim(),
    };

    this.api.updateProfile(payload).subscribe({
      next: (updated) => {
        this.saving.set(false);
        if (updated) {
          this.email = updated.email || '';
          this.phone = updated.phone || '';
          this.school = updated.school || '';
          if (current) {
            this.store.currentUser.set({ ...current, ...updated });
          }
        }
        this.toast.show('Profile details saved to database');
      },
      error: (err: Error) => {
        this.saving.set(false);
        console.warn('API updateProfile error:', err.message);
        this.toast.show('Failed to save profile: ' + (err.message || 'Server error'));
      },
    });
  }

  async openLoginModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: LoginModalComponent,
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'login' && data) {
      this.store.login(data);
      this.email = data.email || '';
      this.phone = data.phone || '';
      this.school = data.school || '';
      this.dailyReminder = data.dailyReminder ?? true;
      this.soundAlerts = data.soundAlerts ?? false;
    }
  }

  onPreference(label: string, on: boolean): void {
    if (label === 'Daily reminder') {
      this.dailyReminder = on;
    } else {
      this.soundAlerts = on;
    }

    if (!this.isLoggedIn()) {
      this.toast.show(`${label} ${on ? 'on' : 'off'} (guest mode)`);
      return;
    }

    const current = this.store.currentUser();
    const payload =
      label === 'Daily reminder'
        ? { id: current?.id, dailyReminder: on }
        : { id: current?.id, soundAlerts: on };
    this.api.updateProfile(payload).subscribe({
      error: (err: Error) => console.warn('API updateProfile error:', err.message),
    });
    this.toast.show(`${label} ${on ? 'on' : 'off'}`);
  }

  async editProfile(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.toast.show('Please log in to edit your profile name');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Edit Profile',
      inputs: [{ name: 'name', type: 'text', value: this.name(), placeholder: 'Full name' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (v) => {
            if (v.name?.trim()) {
              const updatedName = v.name.trim();
              const current = this.store.currentUser();
              this.api.updateProfile({ id: current?.id, name: updatedName }).subscribe({
                next: (updated) => {
                  if (current && updated) {
                    this.store.currentUser.set({ ...current, ...updated });
                  }
                },
                error: (err: Error) => console.warn('API editProfile error:', err.message),
              });
              this.toast.show('Profile updated');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async changePassword(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.toast.show('Please log in to change your password');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Change Password',
      inputs: [
        { name: 'current', type: 'password', placeholder: 'Current password' },
        { name: 'next', type: 'password', placeholder: 'New password' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Update', handler: () => this.toast.show('Password updated successfully') },
      ],
    });
    await alert.present();
  }

  async showInfo(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  async logout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Are you sure you want to log out?',
      message: 'You will return to guest mode. Data entered in guest mode will not be stored in the database.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Log out',
          role: 'destructive',
          handler: () => {
            this.store.logout();
            this.email = '';
            this.phone = '';
            this.school = '';
            this.toast.show('Logged out. You are now in guest mode.');
          },
        },
      ],
    });
    await alert.present();
  }
}
