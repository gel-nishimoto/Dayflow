import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { location } from 'ionicons/icons';

// Stand-in for a real map (Leaflet will replace this later).
@Component({
  selector: 'app-map-placeholder',
  template: `
    <div class="map" [class.tall]="tall()">
      <ion-icon name="location" class="pin"></ion-icon>
      @if (label()) {
        <span class="tag">{{ label() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .map {
        position: relative;
        height: 96px;
        border-radius: 14px;
        overflow: hidden;
        display: grid;
        place-items: center;
        background-color: var(--app-light-blue);
        background-image:
          linear-gradient(rgba(109, 158, 235, 0.25) 1px, transparent 1px),
          linear-gradient(90deg, rgba(109, 158, 235, 0.25) 1px, transparent 1px);
        background-size: 24px 24px;
      }
      .map.tall {
        height: 180px;
      }
      .pin {
        font-size: 34px;
        color: var(--app-primary);
        filter: drop-shadow(0 4px 6px rgba(57, 121, 216, 0.35));
      }
      .tag {
        position: absolute;
        left: 8px;
        right: 8px;
        bottom: 8px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        color: var(--app-text);
        font-size: 11px;
        font-weight: 600;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
  imports: [IonIcon],
})
export class MapPlaceholderComponent {
  label = input('');
  tall = input(false);

  constructor() {
    addIcons({ location });
  }
}

