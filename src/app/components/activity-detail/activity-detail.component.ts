import { Component, Input, inject } from '@angular/core';
import { IonContent, IonFooter, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  bulbOutline,
  calendarOutline,
  cartOutline,
  chatbubblesOutline,
  closeOutline,
  documentTextOutline,
  expandOutline,
  fitnessOutline,
  flagOutline,
  flaskOutline,
  folderOpenOutline,
  homeOutline,
  laptopOutline,
  locationOutline,
  notificationsOutline,
  peopleOutline,
  personOutline,
  playCircle,
  pricetagOutline,
  schoolOutline,
  timeOutline,
  videocamOutline,
} from 'ionicons/icons';

import type { Activity, ActivityStatus, CategoryItem, VideoAttachment } from '../../models/activity.model';
import { STATUSES, formatReminderInterval } from '../../models/activity.model';
import { DateLabelPipe, Time12Pipe } from '../../pipes/format.pipes';
import { ActivityStore } from '../../services/activity-store';
import { ToastService } from '../../services/toast.service';
import { LocationSheetComponent } from '../location-sheet/location-sheet.component';
import { MapPlaceholderComponent } from '../map-placeholder/map-placeholder.component';
import { PhotoViewerComponent } from '../photo-viewer/photo-viewer.component';

// Task details modal organized into 5 clear sections.
@Component({
  selector: 'app-activity-detail',
  templateUrl: 'activity-detail.component.html',
  styleUrls: ['activity-detail.component.scss'],
  imports: [IonContent, IonFooter, IonIcon, DateLabelPipe, Time12Pipe, MapPlaceholderComponent],
})
export class ActivityDetailComponent {
  @Input() activityId!: number;

  private store = inject(ActivityStore);
  private modalCtrl = inject(ModalController);
  private toast = inject(ToastService);

  statuses = STATUSES;

  constructor() {
    addIcons({
      bookOutline,
      bulbOutline,
      calendarOutline,
      cartOutline,
      chatbubblesOutline,
      closeOutline,
      documentTextOutline,
      expandOutline,
      fitnessOutline,
      flagOutline,
      flaskOutline,
      folderOpenOutline,
      homeOutline,
      laptopOutline,
      locationOutline,
      notificationsOutline,
      peopleOutline,
      personOutline,
      playCircle,
      pricetagOutline,
      schoolOutline,
      timeOutline,
      videocamOutline,
    });
  }

  get activity(): Activity | undefined {
    return this.store.activities().find((a) => a.id === this.activityId);
  }

  getCategoryMeta(name: string): CategoryItem {
    return this.store.getCategoryByName(name);
  }

  formatReminder(a: Activity): string {
    return formatReminderInterval(a.reminderMinutes);
  }

  setStatus(status: ActivityStatus): void {
    this.store.setStatus(this.activityId, status);
    this.toast.show(`Status changed to ${status}`);
  }

  async openPhoto(src: string): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PhotoViewerComponent,
      componentProps: { src },
    });
    await modal.present();
  }

  async openVideo(video: VideoAttachment): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PhotoViewerComponent,
      componentProps: { video },
    });
    await modal.present();
  }

  async viewLocation(name: string, address: string): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: LocationSheetComponent,
      componentProps: { readOnly: true, initial: { name, address } },
      breakpoints: [0, 0.8],
      initialBreakpoint: 0.8,
    });
    await modal.present();
  }

  edit(): void {
    this.modalCtrl.dismiss(null, 'edit');
  }

  delete(): void {
    this.modalCtrl.dismiss(null, 'delete');
  }

  close(): void {
    this.modalCtrl.dismiss(null, 'close');
  }
}
