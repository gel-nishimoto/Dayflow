import { Component, Input, inject, signal } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, playOutline, pauseOutline, refreshOutline, trashOutline } from 'ionicons/icons';

import type { VideoAttachment } from '../../models/activity.model';

// Full-screen image or simulated video preview modal.
@Component({
  selector: 'app-photo-viewer',
  template: `
    <ion-content>
      <div class="viewer">
        <button type="button" class="close" aria-label="Close preview" (click)="close()">
          <ion-icon name="close-outline"></ion-icon>
        </button>

        @if (video) {
          <div class="video-card">
            @if (video.webPath) {
              <video class="video-player" [src]="video.webPath" controls playsinline></video>
            } @else {
              <div
                class="video-stage"
                role="button"
                tabindex="0"
                (click)="togglePlay()"
                (keydown.enter)="togglePlay()"
              >
                <img [src]="video.thumb" [alt]="video.title" />
                <div class="play-badge">
                  <ion-icon [name]="playing() ? 'pause-outline' : 'play-outline'"></ion-icon>
                </div>
              </div>
            }
            <div class="video-meta">
              <p class="v-title">{{ video.title }}</p>
              <p class="v-sub">
                {{ video.webPath ? 'Attached video clip' : (playing() ? 'Playing simulated video preview...' : 'Tap play to preview clip') }} ·
                {{ video.duration }}
              </p>
            </div>
          </div>
        } @else {
          <img class="full-img" [src]="src" alt="Attached photo" />
        }

        @if (allowEdit) {
          <div class="bottom-bar">
            @if (!video) {
              <button type="button" class="act-btn" (click)="replace()">
                <ion-icon name="refresh-outline"></ion-icon> Replace
              </button>
            }
            <button type="button" class="act-btn danger" (click)="remove()">
              <ion-icon name="trash-outline"></ion-icon> Remove
            </button>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: #111a27;
      }
      .viewer {
        position: relative;
        height: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
      }
      .full-img {
        max-width: 100%;
        max-height: 75vh;
        border-radius: 16px;
        object-fit: contain;
      }
      .video-card {
        width: 100%;
        max-width: 340px;
        background: #1d2a3d;
        border-radius: 20px;
        overflow: hidden;
        color: #fff;
      }
      .video-player {
        width: 100%;
        max-height: 48vh;
        border-radius: 20px 20px 0 0;
        background: #000;
        object-fit: contain;
        display: block;
      }
      .video-stage {
        position: relative;
        aspect-ratio: 1 / 1;
        cursor: pointer;
      }
      .video-stage img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .play-badge {
        position: absolute;
        inset: 0;
        margin: auto;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(57, 121, 216, 0.92);
        color: #fff;
        font-size: 30px;
        display: grid;
        place-items: center;
      }
      .video-meta {
        padding: 14px 16px;
      }
      .v-title {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
      }
      .v-sub {
        margin: 4px 0 0;
        font-size: 12px;
        color: #b8c7de;
      }
      .close {
        position: absolute;
        top: calc(16px + env(safe-area-inset-top));
        right: 16px;
        z-index: 2;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 0;
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
        font-size: 24px;
        display: grid;
        place-items: center;
      }
      .bottom-bar {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }
      .act-btn {
        height: 44px;
        padding: 0 18px;
        border-radius: 999px;
        border: 0;
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .act-btn.danger {
        background: #d64545;
      }
    `,
  ],
  imports: [IonContent, IonIcon],
})
export class PhotoViewerComponent {
  @Input() src = '';
  @Input() video?: VideoAttachment;
  @Input() allowEdit = false;

  private modalCtrl = inject(ModalController);
  playing = signal(false);

  constructor() {
    addIcons({ closeOutline, playOutline, pauseOutline, refreshOutline, trashOutline });
  }

  async togglePlay(): Promise<void> {
    if (this.video?.uri && Capacitor.isNativePlatform()) {
      try {
        await Camera.playVideo({ uri: this.video.uri });
        return;
      } catch (e) {
        console.warn('Native video playback failed, falling back to preview:', e);
      }
    }
    this.playing.update((v) => !v);
  }

  replace(): void {
    this.modalCtrl.dismiss(null, 'replace');
  }

  remove(): void {
    this.modalCtrl.dismiss(null, 'remove');
  }

  close(): void {
    this.modalCtrl.dismiss(null, 'close');
  }
}
