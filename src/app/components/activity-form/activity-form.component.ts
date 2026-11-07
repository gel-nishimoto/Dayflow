import type { OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  bookOutline,
  bulbOutline,
  calendarOutline,
  cameraOutline,
  cartOutline,
  chatbubblesOutline,
  chevronForwardOutline,
  closeCircle,
  closeOutline,
  documentTextOutline,
  fitnessOutline,
  flaskOutline,
  folderOpenOutline,
  homeOutline,
  imageOutline,
  informationCircleOutline,
  laptopOutline,
  locationOutline,
  notificationsOutline,
  peopleOutline,
  personOutline,
  playCircle,
  pricetagOutline,
  schoolOutline,
  videocamOutline,
} from 'ionicons/icons';

import type {
  Activity,
  ActivityStatus,
  CategoryItem,
  ReminderReference,
  VideoAttachment,
} from '../../models/activity.model';
import { REMINDER_PRESETS, STATUSES, formatReminderInterval } from '../../models/activity.model';
import type { Place } from '../../data/sample-media';
import { ActivityStore } from '../../services/activity-store';
import { ToastService } from '../../services/toast.service';
import { isoOffset, thisWeekIso, todayIso } from '../../utils/date-utils';
import type { MediaSheetResult } from '../camera-sheet/camera-sheet.component';
import { CameraSheetComponent } from '../camera-sheet/camera-sheet.component';
import { CategorySheetComponent } from '../category-sheet/category-sheet.component';
import { LocationSheetComponent } from '../location-sheet/location-sheet.component';
import { MapPlaceholderComponent } from '../map-placeholder/map-placeholder.component';
import { PhotoViewerComponent } from '../photo-viewer/photo-viewer.component';

interface FormModel {
  title: string;
  description: string;
  date: string;
  time: string;
  deadline: string;
  category: string;
  status: ActivityStatus;
  reminder: boolean;
  reminderMinutes: number;
  reminderRef: ReminderReference;
  photos: string[];
  video?: VideoAttachment;
  locationName?: string;
  locationAddress?: string;
}

@Component({
  selector: 'app-activity-form',
  templateUrl: 'activity-form.component.html',
  styleUrls: ['activity-form.component.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    IonToggle,
    MapPlaceholderComponent,
  ],
})
export class ActivityFormComponent implements OnInit {
  @Input() activity?: Activity;
  @Input() defaultDate?: string;

  store = inject(ActivityStore);
  private modalCtrl = inject(ModalController);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  statuses = STATUSES;
  reminderPresets = REMINDER_PRESETS;
  submitted = false;
  customDateMode = false;
  customReminderMode = false;
  customMinutesInput = 45;

  quickCategoryNames = ['Assignments', 'Projects', 'Examinations', 'Research', 'Personal'];

  form: FormModel = {
    title: '',
    description: '',
    date: todayIso(),
    time: '09:00',
    deadline: '',
    category: 'Assignments',
    status: 'pending',
    reminder: true,
    reminderMinutes: 15,
    reminderRef: 'time',
    photos: [],
  };

  constructor() {
    addIcons({
      addOutline,
      bookOutline,
      bulbOutline,
      calendarOutline,
      cameraOutline,
      cartOutline,
      chatbubblesOutline,
      chevronForwardOutline,
      closeCircle,
      closeOutline,
      documentTextOutline,
      fitnessOutline,
      flaskOutline,
      folderOpenOutline,
      homeOutline,
      imageOutline,
      informationCircleOutline,
      laptopOutline,
      locationOutline,
      notificationsOutline,
      peopleOutline,
      personOutline,
      playCircle,
      pricetagOutline,
      schoolOutline,
      videocamOutline,
    });
  }

  get isEdit(): boolean {
    return !!this.activity;
  }

  get titleError(): boolean {
    return this.submitted && !this.form.title.trim();
  }

  get deadlineError(): boolean {
    return this.submitted && !!this.form.deadline && this.form.deadline < this.form.date;
  }

  get hasLocation(): boolean {
    return !!this.form.locationName;
  }

  get selectedCategoryItem(): CategoryItem {
    return this.store.getCategoryByName(this.form.category);
  }

  get hasAttachments(): boolean {
    return this.form.photos.length > 0 || !!this.form.video;
  }

  get attachmentCapacityText(): string {
    if (this.form.video) {
      return '1 of 1 video attached';
    }
    return `${this.form.photos.length} of 5 photos attached`;
  }

  get activeDateShortcut(): 'today' | 'tomorrow' | 'week' | 'custom' {
    if (this.customDateMode) return 'custom';
    if (this.form.date === isoOffset(0)) return 'today';
    if (this.form.date === isoOffset(1)) return 'tomorrow';
    if (this.form.date === thisWeekIso()) return 'week';
    return 'custom';
  }

  get canRemindByTime(): boolean {
    return !!this.form.time;
  }

  get canRemindByDeadline(): boolean {
    return !!this.form.deadline;
  }

  get canConfigureReminder(): boolean {
    return this.canRemindByTime || this.canRemindByDeadline;
  }

  get reminderSummaryText(): string {
    const minutes = this.customReminderMode ? Math.max(1, Number(this.customMinutesInput) || 1) : this.form.reminderMinutes;
    const interval = formatReminderInterval(minutes);
    const refLabel = this.form.reminderRef === 'deadline' ? 'Deadline' : 'Scheduled Time';
    return `Remind me ${interval} (${refLabel})`;
  }

  ngOnInit(): void {
    if (this.activity) {
      const a = this.activity;
      this.form = {
        title: a.title,
        description: a.description,
        date: a.date,
        time: a.time ?? '',
        deadline: a.deadline ?? '',
        category: a.category,
        status: a.status,
        reminder: a.reminder,
        reminderMinutes: a.reminderMinutes ?? 15,
        reminderRef: a.reminderRef ?? (a.time ? 'time' : 'deadline'),
        photos: a.photos ? [...a.photos] : [],
        video: a.video ? { ...a.video } : undefined,
        locationName: a.locationName,
        locationAddress: a.locationAddress,
      };
      const isPreset = REMINDER_PRESETS.some((p) => p.minutes === this.form.reminderMinutes);
      if (!isPreset) {
        this.customReminderMode = true;
        this.customMinutesInput = this.form.reminderMinutes;
      }
      this.syncReminderRef();
    } else if (this.defaultDate) {
      this.form.date = this.defaultDate;
    }
  }

  // ---- Schedule Date Shortcuts ----
  setDateShortcut(kind: 'today' | 'tomorrow' | 'week' | 'custom', dateInput?: HTMLInputElement): void {
    if (kind === 'today') {
      this.customDateMode = false;
      this.form.date = isoOffset(0);
    } else if (kind === 'tomorrow') {
      this.customDateMode = false;
      this.form.date = isoOffset(1);
    } else if (kind === 'week') {
      this.customDateMode = false;
      this.form.date = thisWeekIso();
    } else {
      this.customDateMode = true;
      dateInput?.focus();
    }
  }

  onScheduleChange(): void {
    this.syncReminderRef();
  }

  clearTime(): void {
    this.form.time = '';
    this.syncReminderRef();
  }

  clearDeadline(): void {
    this.form.deadline = '';
    this.syncReminderRef();
  }

  private syncReminderRef(): void {
    if (this.form.reminderRef === 'time' && !this.canRemindByTime && this.canRemindByDeadline) {
      this.form.reminderRef = 'deadline';
    } else if (this.form.reminderRef === 'deadline' && !this.canRemindByDeadline && this.canRemindByTime) {
      this.form.reminderRef = 'time';
    }
  }

  // ---- Photo & Video Attachments (Simulated) ----
  async openPhotoAttachment(replaceIndex?: number): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CameraSheetComponent,
      componentProps: {
        photoCount: this.form.photos.length,
        hasVideo: !!this.form.video,
        replaceIndex,
      },
      breakpoints: [0, 0.85],
      initialBreakpoint: 0.85,
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss<MediaSheetResult>();
    if (role === 'attach' && data) {
      if (data.kind === 'photo' && data.photo) {
        if (replaceIndex !== undefined) {
          this.form.photos = this.form.photos.map((p, idx) => (idx === replaceIndex ? data.photo! : p));
          this.toast.show('Photo replaced (demo)');
        } else if (this.form.photos.length < 5 && !this.form.video) {
          this.form.photos = [...this.form.photos, data.photo];
          this.toast.show(`Photo attached (${this.form.photos.length} of 5)`);
        }
      } else if (data.kind === 'video' && data.video && this.form.photos.length === 0) {
        this.form.video = data.video;
        this.toast.show('Sample video attached (demo)');
      }
      this.cdr.markForCheck();
    }
  }

  removePhotoAt(index: number, event?: Event): void {
    event?.stopPropagation();
    this.form.photos = this.form.photos.filter((_, i) => i !== index);
    this.toast.show('Photo removed');
  }

  removeVideo(event?: Event): void {
    event?.stopPropagation();
    this.form.video = undefined;
    this.toast.show('Video removed');
  }

  async previewPhotoAt(index: number): Promise<void> {
    const src = this.form.photos[index];
    if (!src) return;
    const modal = await this.modalCtrl.create({
      component: PhotoViewerComponent,
      componentProps: { src, allowEdit: true },
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'remove') {
      this.removePhotoAt(index);
      this.cdr.markForCheck();
    } else if (role === 'replace') {
      await this.openPhotoAttachment(index);
    }
  }

  async previewVideo(): Promise<void> {
    if (!this.form.video) return;
    const modal = await this.modalCtrl.create({
      component: PhotoViewerComponent,
      componentProps: { video: this.form.video, allowEdit: true },
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'remove') {
      this.removeVideo();
      this.cdr.markForCheck();
    }
  }

  // ---- Location Selection (Simulated) ----
  async openLocation(): Promise<void> {
    const initial: Place | undefined = this.hasLocation
      ? { name: this.form.locationName!, address: this.form.locationAddress ?? '' }
      : undefined;
    const modal = await this.modalCtrl.create({
      component: LocationSheetComponent,
      componentProps: { initial },
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95,
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss<Place>();
    if (role === 'confirm' && data) {
      this.form.locationName = data.name;
      this.form.locationAddress = data.address;
      this.toast.show('Location selected (demo)');
      this.cdr.markForCheck();
    }
  }

  removeLocation(): void {
    this.form.locationName = undefined;
    this.form.locationAddress = undefined;
    this.toast.show('Location removed');
  }

  // ---- Category Selection & Management ----
  selectQuickCategory(name: string): void {
    this.form.category = name;
  }

  async openCategoryModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CategorySheetComponent,
      componentProps: { mode: 'select', selected: this.form.category },
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss<string>();
    if (role === 'select' && data) {
      this.form.category = data;
    } else if (!this.store.categories().some((c) => c.name === this.form.category)) {
      this.form.category = 'Others';
    }
    this.cdr.markForCheck();
  }

  // ---- Reminder Selection ----
  selectPresetMinutes(minutes: number): void {
    this.customReminderMode = false;
    this.form.reminderMinutes = minutes;
  }

  enableCustomReminder(): void {
    this.customReminderMode = true;
    this.form.reminderMinutes = Math.max(1, Number(this.customMinutesInput) || 45);
  }

  onCustomMinutesChange(val: number): void {
    this.customMinutesInput = val;
    this.form.reminderMinutes = Math.max(1, Number(val) || 1);
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.submitted = true;
    if (this.titleError || this.deadlineError || !this.form.date) return;

    const finalMinutes = this.customReminderMode
      ? Math.max(1, Number(this.customMinutesInput) || 15)
      : this.form.reminderMinutes;

    const reminderEnabled = this.form.reminder && this.canConfigureReminder;

    const payload: Omit<Activity, 'id'> & { id?: number } = {
      id: this.activity?.id,
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      date: this.form.date,
      time: this.form.time || undefined,
      deadline: this.form.deadline || undefined,
      category: this.form.category,
      status: this.form.status,
      reminder: reminderEnabled,
      reminderMinutes: reminderEnabled ? finalMinutes : undefined,
      reminderRef: reminderEnabled ? this.form.reminderRef : undefined,
      photos: this.form.photos.length ? [...this.form.photos] : undefined,
      video: this.form.video ? { ...this.form.video } : undefined,
      locationName: this.form.locationName,
      locationAddress: this.form.locationAddress,
    };

    this.modalCtrl.dismiss(payload, 'save');
  }
}
