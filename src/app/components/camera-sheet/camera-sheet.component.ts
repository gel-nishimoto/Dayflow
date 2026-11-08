import { Component, Input, inject, signal } from '@angular/core';
import type { MediaResult } from '@capacitor/camera';
import {
  Camera,
  CameraResultType,
  CameraSource,
  MediaType,
} from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  closeOutline,
  imagesOutline,
  informationCircleOutline,
  videocamOutline,
} from 'ionicons/icons';

import type { VideoAttachment } from '../../models/activity.model';
import { ToastService } from '../../services/toast.service';

const VIDEO_DEFAULT_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="#26354A"/>' +
      '<circle cx="200" cy="200" r="54" fill="#3979D8" opacity="0.9"/>' +
      '<polygon points="188,175 228,200 188,225" fill="#ffffff"/>' +
      '</svg>',
  );

export interface MediaSheetResult {
  kind: 'photo' | 'video' | 'multiple';
  photo?: string;
  photos?: string[];
  video?: VideoAttachment;
}

@Component({
  selector: 'app-camera-sheet',
  templateUrl: 'camera-sheet.component.html',
  styleUrls: ['camera-sheet.component.scss'],
  imports: [IonContent, IonIcon],
})
export class CameraSheetComponent {
  @Input() attachmentCount = 0;
  @Input() photoCount = 0;
  @Input() videoCount = 0;
  @Input() hasVideo = false;
  @Input() replaceIndex?: number;

  private modalCtrl = inject(ModalController);
  private toast = inject(ToastService);

  imageUrl: string | undefined;
  loading = signal<boolean>(false);

  constructor() {
    addIcons({
      cameraOutline,
      imagesOutline,
      videocamOutline,
      closeOutline,
      informationCircleOutline,
    });
  }

  get currentAttachmentCount(): number {
    if (this.attachmentCount > 0) return this.attachmentCount;
    const vCount = this.videoCount > 0 ? this.videoCount : this.hasVideo ? 1 : 0;
    return this.photoCount + vCount;
  }

  get canAddPhoto(): boolean {
    if (this.replaceIndex !== undefined) return true;
    return this.currentAttachmentCount < 5;
  }

  get canAddVideo(): boolean {
    if (this.replaceIndex !== undefined) return false;
    return this.currentAttachmentCount < 5;
  }

  get capacityLabel(): string {
    if (this.replaceIndex !== undefined) {
      return `Replacing photo #${this.replaceIndex + 1}`;
    }
    return `${this.currentAttachmentCount} of 5 attachments`;
  }

  // 1. Take Photo: requests camera permission, opens phone camera, attaches photo (universal Capacitor format)
  async takePhoto(): Promise<void> {
    if (!this.canAddPhoto) {
      await this.toast.show('Maximum of 5 attachments reached');
      return;
    }

    const hasPermission = await this.checkAndRequestPermission('camera');
    if (!hasPermission) return;

    try {
      this.loading.set(true);

      // Universal Capacitor Camera.getPhoto format
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      this.imageUrl = image.webPath;
      if (!this.imageUrl) return;

      await this.modalCtrl.dismiss(
        { kind: 'photo', photo: this.imageUrl } as MediaSheetResult,
        'attach',
      );
    } catch (err: unknown) {
      if (!this.isUserCancellation(err)) {
        console.error('takePhoto failed:', err);
        const msg = err instanceof Error ? err.message : 'Failed to capture photo';
        await this.toast.show(msg);
      }
    } finally {
      this.loading.set(false);
    }
  }

  // Universal takePicture alias
  async takePicture(): Promise<void> {
    return this.takePhoto();
  }

  // 2. Choose From Gallery: requests gallery permission, opens phone gallery, attaches photo(s)
  async chooseFromGallery(): Promise<void> {
    if (!this.canAddPhoto) {
      await this.toast.show('Maximum of 5 attachments reached');
      return;
    }

    const hasPermission = await this.checkAndRequestPermission('photos');
    if (!hasPermission) return;

    const remaining = Math.max(1, 5 - this.currentAttachmentCount);
    const allowMultiple = this.replaceIndex === undefined && remaining > 1;

    try {
      this.loading.set(true);

      if (allowMultiple) {
        // Multi-image selection via Camera.pickImages
        const galleryResult = await Camera.pickImages({
          quality: 90,
          limit: remaining,
        });

        if (!galleryResult?.photos || galleryResult.photos.length === 0) {
          return;
        }

        const selectedPhotos = galleryResult.photos
          .map((item) => item.webPath)
          .filter((url): url is string => !!url);

        if (selectedPhotos.length === 0) return;

        if (selectedPhotos.length === 1) {
          this.imageUrl = selectedPhotos[0];
          await this.modalCtrl.dismiss(
            { kind: 'photo', photo: this.imageUrl } as MediaSheetResult,
            'attach',
          );
        } else {
          await this.modalCtrl.dismiss(
            { kind: 'multiple', photos: selectedPhotos } as MediaSheetResult,
            'attach',
          );
        }
      } else {
        // Universal single image selection via Camera.getPhoto
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos,
        });

        this.imageUrl = image.webPath;
        if (!this.imageUrl) return;

        await this.modalCtrl.dismiss(
          { kind: 'photo', photo: this.imageUrl } as MediaSheetResult,
          'attach',
        );
      }
    } catch (err: unknown) {
      if (!this.isUserCancellation(err)) {
        console.error('chooseFromGallery failed:', err);
        const msg = err instanceof Error ? err.message : 'Failed to choose from gallery';
        await this.toast.show(msg);
      }
    } finally {
      this.loading.set(false);
    }
  }

  // 3. Record Video: requests camera permission, allows recording video using device camera
  async recordVideo(): Promise<void> {
    if (!this.canAddVideo) {
      await this.toast.show('Maximum of 5 attachments reached');
      return;
    }

    const hasPermission = await this.checkAndRequestPermission('camera');
    if (!hasPermission) return;

    try {
      this.loading.set(true);
      let media: MediaResult;
      if (Capacitor.isNativePlatform()) {
        media = await Camera.recordVideo({
          saveToGallery: false,
          includeMetadata: true,
          isPersistent: true,
        });
      } else {
        media = await this.recordVideoWeb();
      }

      const uri = media.uri;
      const webPath = media.webPath || (media.uri ? Capacitor.convertFileSrc(media.uri) : undefined);
      const thumb =
        media.thumbnail?.startsWith('data:')
          ? media.thumbnail
          : media.thumbnail
            ? `data:image/jpeg;base64,${media.thumbnail}`
            : webPath || (uri ? Capacitor.convertFileSrc(uri) : VIDEO_DEFAULT_THUMB);

      const durationSec = media.metadata?.duration;
      const duration = durationSec ? this.formatDuration(durationSec) : '0:15';

      const videoAttachment: VideoAttachment = {
        thumb,
        title: 'Recorded Video',
        duration,
        uri,
        webPath,
      };

      await this.modalCtrl.dismiss(
        { kind: 'video', video: videoAttachment } as MediaSheetResult,
        'attach'
      );
    } catch (err: unknown) {
      if (!this.isUserCancellation(err)) {
        console.error('recordVideo failed:', err);
        const msg = err instanceof Error ? err.message : 'Failed to record video';
        await this.toast.show(msg);
      }
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  // Permission handling using Capacitor Camera plugin
  private async checkAndRequestPermission(type: 'camera' | 'photos'): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    try {
      const status = await Camera.checkPermissions();
      const current = type === 'camera' ? status.camera : status.photos;
      if (current === 'granted' || current === 'limited') {
        return true;
      }

      const requested = await Camera.requestPermissions({ permissions: [type] });
      const result = type === 'camera' ? requested.camera : requested.photos;
      if (result === 'granted' || result === 'limited') {
        return true;
      }

      const label = type === 'camera' ? 'Camera' : 'Gallery';
      await this.toast.show(`${label} permission denied. Please allow access in device settings.`);
      return false;
    } catch (err) {
      console.warn(`Error requesting ${type} permission:`, err);
      return false;
    }
  }

  private resolveMediaUrl(result: { webPath?: string; uri?: string; thumbnail?: string }): string {
    if (result.webPath) {
      return result.webPath;
    }
    if (result.uri) {
      return Capacitor.convertFileSrc(result.uri);
    }
    if (result.thumbnail) {
      return result.thumbnail.startsWith('data:')
        ? result.thumbnail
        : `data:image/jpeg;base64,${result.thumbnail}`;
    }
    return '';
  }

  private formatDuration(seconds?: number): string {
    const total = Math.round(seconds || 0);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private isUserCancellation(err: unknown): boolean {
    if (!err) return false;
    const errorObj = err as { message?: string; errorMessage?: string; code?: string };
    const msg = (errorObj.message || errorObj.errorMessage || '').toLowerCase();
    const code = errorObj.code || '';
    return (
      code === 'OS-PLUG-CAMR-0006' ||
      code === 'OS-PLUG-CAMR-0020' ||
      code === 'OS-PLUG-CAMR-0017' ||
      code === 'OS-PLUG-CAMR-0008' ||
      msg.includes('cancel') ||
      msg.includes('user cancelled') ||
      msg.includes('no file selected') ||
      msg.includes('no files selected')
    );
  }

  // Web fallback for recording video in desktop browser testing
  private async recordVideoWeb(): Promise<MediaResult> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.capture = 'environment';
      input.hidden = true;
      document.body.appendChild(input);

      const cleanup = (): void => {
        input.remove();
      };

      input.onchange = async (): Promise<void> => {
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          reject(new Error('User cancelled'));
          return;
        }
        try {
          const webPath = URL.createObjectURL(file);
          const [thumb, duration] = await Promise.all([
            this.extractVideoThumbnail(webPath),
            this.extractVideoDuration(webPath),
          ]);
          cleanup();
          resolve({
            type: MediaType.Video,
            webPath,
            thumbnail: thumb,
            saved: false,
            metadata: {
              duration,
              format: file.type || 'video/mp4',
              size: file.size,
            },
          });
        } catch (e) {
          cleanup();
          reject(e);
        }
      };

      input.oncancel = (): void => {
        cleanup();
        reject(new Error('User cancelled'));
      };

      input.click();
    });
  }

  private extractVideoThumbnail(url: string): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = (): void => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      };

      video.onseeked = (): void => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
            return;
          }
        } catch {
          // Canvas export fallback
        }
        resolve(VIDEO_DEFAULT_THUMB);
      };

      video.onerror = (): void => {
        resolve(VIDEO_DEFAULT_THUMB);
      };
    });
  }

  private extractVideoDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = (): void => {
        resolve(Math.round(video.duration || 15));
      };
      video.onerror = (): void => {
        resolve(15);
      };
    });
  }
}
