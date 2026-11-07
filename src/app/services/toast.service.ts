import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastCtrl = inject(ToastController);

  async show(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1800,
      position: 'top',
      cssClass: 'app-toast',
    });
    await toast.present();
  }
}

