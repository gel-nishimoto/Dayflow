import { Component, Input, inject, signal } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  imagesOutline,
  videocamOutline,
  closeOutline,
  playCircleOutline,
  informationCircleOutline,
} from 'ionicons/icons';

import { nextSamplePhoto, nextSampleVideo } from '../../data/sample-media';
import type { VideoAttachment } from '../../models/activity.model';

export interface MediaSheetResult {
  kind: 'photo' | 'video';
  photo?: string;
  video?: VideoAttachment;
}

// Simulated media attachment modal (Up to 5 photos OR 1 video; never mixed).
@Component({
  selector: 'app-camera-sheet',
  templateUrl: 'camera-sheet.component.html',
  styleUrls: ['camera-sheet.component.scss'],
  imports: [IonContent, IonIcon],
})
export class CameraSheetComponent {
  @Input() photoCount = 0;
  @Input() hasVideo = false;
  @Input() replaceIndex?: number; // set when replacing an existing photo

  private modalCtrl = inject(ModalController);

  mode = signal<'menu' | 'camera'>('menu');
  captured = signal<string | null>(null);

  constructor() {
    addIcons({
      cameraOutline,
      imagesOutline,
      videocamOutline,
      closeOutline,
      playCircleOutline,
      informationCircleOutline,
    });
  }

  get canAddPhoto(): boolean {
    if (this.replaceIndex !== undefined) return true;
    return !this.hasVideo && this.photoCount < 5;
  }

  get canAddVideo(): boolean {
    if (this.replaceIndex !== undefined) return false;
    return !this.hasVideo && this.photoCount === 0;
  }

  get capacityLabel(): string {
    if (this.replaceIndex !== undefined) {
      return `Replacing photo #${this.replaceIndex + 1}`;
    }
    if (this.hasVideo) {
      return '1 of 1 video attached (maximum reached)';
    }
    return `${this.photoCount} of 5 photos attached`;
  }

  openViewfinder(): void {
    if (!this.canAddPhoto) return;
    this.mode.set('camera');
    this.captured.set(null);
  }

  capture(): void {
    this.captured.set(nextSamplePhoto());
  }

  retake(): void {
    this.captured.set(null);
  }

  useCapturedPhoto(): void {
    const img = this.captured();
    if (!img) return;
    const res: MediaSheetResult = { kind: 'photo', photo: img };
    this.modalCtrl.dismiss(res, 'attach');
  }

  pickSamplePhoto(): void {
    if (!this.canAddPhoto) return;
    const res: MediaSheetResult = { kind: 'photo', photo: nextSamplePhoto() };
    this.modalCtrl.dismiss(res, 'attach');
  }

  pickSampleVideo(): void {
    if (!this.canAddVideo) return;
    const res: MediaSheetResult = { kind: 'video', video: nextSampleVideo() };
    this.modalCtrl.dismiss(res, 'attach');
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
