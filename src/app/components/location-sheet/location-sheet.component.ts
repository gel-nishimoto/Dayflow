import type { OnInit} from '@angular/core';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchOutline, navigateOutline, locationOutline, checkmarkCircle } from 'ionicons/icons';

import type { Place} from '../../data/sample-media';
import { CURRENT_LOCATION, SAMPLE_PLACES } from '../../data/sample-media';
import { MapPlaceholderComponent } from '../map-placeholder/map-placeholder.component';

// Simulated location picker (add) or viewer (readOnly). No GPS and no real map.
@Component({
  selector: 'app-location-sheet',
  templateUrl: 'location-sheet.component.html',
  styleUrls: ['location-sheet.component.scss'],
  imports: [FormsModule, IonContent, IonIcon, MapPlaceholderComponent],
})
export class LocationSheetComponent implements OnInit {
  @Input() readOnly = false;
  @Input() initial?: Place;
  @Input() useCurrent = false; // open with the demo current location pre-selected

  private modalCtrl = inject(ModalController);

  query = signal('');
  selected = signal<Place | null>(null);

  results = computed(() => {
    const q = this.query().trim().toLowerCase();
    return SAMPLE_PLACES.filter((p) => !q || (p.name + p.address).toLowerCase().includes(q));
  });

  constructor() {
    addIcons({ searchOutline, navigateOutline, locationOutline, checkmarkCircle });
  }

  ngOnInit() {
    if (this.initial) this.selected.set(this.initial);
    if (this.useCurrent) this.selected.set(CURRENT_LOCATION);
  }

  pick(place: Place) {
    this.selected.set(place);
  }

  useCurrentLocation() {
    this.selected.set(CURRENT_LOCATION);
  }

  confirm() {
    this.modalCtrl.dismiss(this.selected(), 'confirm');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}

