import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonSpinner, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  logInOutline,
  mailOutline,
  personAddOutline,
  personOutline,
  schoolOutline,
  sparklesOutline,
} from 'ionicons/icons';

import type { UserProfile } from '../../services/activity-api.service';
import { ActivityApiService } from '../../services/activity-api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login-modal',
  templateUrl: 'login-modal.component.html',
  styleUrls: ['login-modal.component.scss'],
  imports: [FormsModule, IonContent, IonIcon, IonSpinner],
})
export class LoginModalComponent {
  private modalCtrl = inject(ModalController);
  private api = inject(ActivityApiService);
  private toast = inject(ToastService);

  mode = signal<'login' | 'register'>('login');
  email = '';
  password = '';
  name = '';
  school = '';

  showPassword = signal<boolean>(false);
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor() {
    addIcons({
      closeOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      logInOutline,
      personAddOutline,
      personOutline,
      schoolOutline,
      sparklesOutline,
    });
  }

  setMode(m: 'login' | 'register'): void {
    this.mode.set(m);
    this.errorMessage.set('');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  fillDemoAccount(): void {
    this.mode.set('login');
    this.email = 'student@dayflow.app';
    this.password = 'password123';
    this.errorMessage.set('');
  }

  submit(): void {
    const email = this.email.trim();
    const password = this.password;

    if (!email) {
      this.errorMessage.set('Please enter your email address.');
      return;
    }
    if (!password) {
      this.errorMessage.set('Please enter your password.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    if (this.mode() === 'login') {
      this.api.login({ email, password }).subscribe({
        next: (user: UserProfile) => {
          this.submitting.set(false);
          this.toast.show(`Welcome back, ${user.name || 'Student'}!`);
          this.modalCtrl.dismiss(user, 'login');
        },
        error: (err: Error) => {
          this.submitting.set(false);
          this.errorMessage.set(err.message || 'Login failed. Please verify credentials.');
        },
      });
    } else {
      const name = this.name.trim() || 'Student User';
      const school = this.school.trim();

      this.api.register({ email, password, name, school }).subscribe({
        next: (user: UserProfile) => {
          this.submitting.set(false);
          this.toast.show(`Account created! Welcome, ${user.name}!`);
          this.modalCtrl.dismiss(user, 'login');
        },
        error: (err: Error) => {
          this.submitting.set(false);
          this.errorMessage.set(err.message || 'Registration failed.');
        },
      });
    }
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
