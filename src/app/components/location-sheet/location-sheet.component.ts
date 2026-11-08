import type { AfterViewInit, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Component, Input, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import type { Position } from '@capacitor/geolocation';
import { Geolocation } from '@capacitor/geolocation';
import { IonContent, IonIcon, IonSpinner, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowForwardOutline,
  checkmarkCircle,
  closeCircle,
  closeOutline,
  locateOutline,
  location,
  locationOutline,
  navigateOutline,
  searchOutline,
} from 'ionicons/icons';
import * as L from 'leaflet';

import type { Place } from '../../models/activity.model';
import { ToastService } from '../../services/toast.service';

const DEFAULT_COORDS: [number, number] = [14.5995, 120.9842];
const DEFAULT_LOCATION: Place = {
  name: 'Current Location',
  address: 'GPS Pinpointed Location',
  lat: DEFAULT_COORDS[0],
  lng: DEFAULT_COORDS[1],
};

@Component({
  selector: 'app-location-sheet',
  templateUrl: 'location-sheet.component.html',
  styleUrls: ['location-sheet.component.scss'],
  imports: [FormsModule, IonContent, IonIcon, IonSpinner],
})
export class LocationSheetComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() readOnly = false;
  @Input() initial?: Place;
  @Input() useCurrent = false;

  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('mapWrapper', { static: false }) mapWrapper?: ElementRef<HTMLDivElement>;

  private readonly stopDragHandler = (e: Event): void => {
    e.stopPropagation();
  };

  private modalCtrl = inject(ModalController);
  private toast = inject(ToastService);

  private map?: L.Map;
  private marker?: L.Marker;

  query = signal<string>('');
  selected = signal<Place | null>(null);
  locating = signal<boolean>(false);
  searching = signal<boolean>(false);
  resolvingAddress = signal<boolean>(false);
  permissionDenied = signal<boolean>(false);

  suggestedPlaces: Place[] = [];

  filteredSuggestedPlaces = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.suggestedPlaces;
    return this.suggestedPlaces.filter(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    );
  });

  constructor() {
    addIcons({
      searchOutline,
      navigateOutline,
      locationOutline,
      location,
      checkmarkCircle,
      closeOutline,
      closeCircle,
      arrowForwardOutline,
      locateOutline,
      alertCircleOutline,
    });
  }

  ngOnInit(): void {
    if (this.initial) {
      this.selected.set(this.initial);
      this.query.set(this.initial.name);
    } else if (this.useCurrent) {
      this.selected.set(DEFAULT_LOCATION);
      this.query.set(DEFAULT_LOCATION.name);
    }
  }

  ngAfterViewInit(): void {
    this.attachDragPrevention();
    // Delay initialization slightly to let Ionic modal animation render DOM
    setTimeout(() => {
      this.initMap();
    }, 150);
  }

  ngOnDestroy(): void {
    this.detachDragPrevention();
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  // Prevent map gestures from bubbling up and moving the Ionic sheet modal
  stopSheetDrag(event: Event): void {
    event.stopPropagation();
  }

  private attachDragPrevention(): void {
    const targets = [this.mapWrapper?.nativeElement, this.mapContainer?.nativeElement];
    for (const el of targets) {
      if (el) {
        el.addEventListener('touchstart', this.stopDragHandler, { passive: false });
        el.addEventListener('mousedown', this.stopDragHandler);
        el.addEventListener('pointerdown', this.stopDragHandler);
      }
    }
  }

  private detachDragPrevention(): void {
    const targets = [this.mapWrapper?.nativeElement, this.mapContainer?.nativeElement];
    for (const el of targets) {
      if (el) {
        el.removeEventListener('touchstart', this.stopDragHandler);
        el.removeEventListener('mousedown', this.stopDragHandler);
        el.removeEventListener('pointerdown', this.stopDragHandler);
      }
    }
  }

  get selectedCoordsText(): string {
    const sel = this.selected();
    if (sel?.lat !== undefined && sel?.lng !== undefined) {
      return `${sel.lat.toFixed(4)}°, ${sel.lng.toFixed(4)}°`;
    }
    return '';
  }

  // ---- Map Setup ----
  private initMap(): void {
    if (!this.mapContainer?.nativeElement || this.map) return;

    const initialLat = this.selected()?.lat ?? DEFAULT_COORDS[0];
    const initialLng = this.selected()?.lng ?? DEFAULT_COORDS[1];

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: !this.readOnly,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    const pinIcon = this.createPinIcon();

    this.marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: !this.readOnly,
    }).addTo(this.map);

    if (!this.readOnly) {
      // 1. Move pin when user drags the marker
      this.marker.on('dragend', async () => {
        if (!this.marker) return;
        const pos = this.marker.getLatLng();
        await this.onPinRelocated(pos.lat, pos.lng);
      });

      // 2. Move pin when user taps anywhere on the map
      this.map.on('click', async (e: L.LeafletMouseEvent) => {
        if (!this.marker || !this.map) return;
        this.marker.setLatLng(e.latlng);
        await this.onPinRelocated(e.latlng.lat, e.latlng.lng);
      });
    }

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);

    // If no initial location was provided and not in readOnly, pinpoint current location via Capacitor Geolocation
    if (!this.initial && !this.readOnly) {
      void this.locateCurrentPosition(false);
    }
  }

  private createPinIcon(): L.DivIcon {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="pin-marker-wrapper">
          <div class="pin-icon-circle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" width="18px" height="18px">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="pin-pulse"></div>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
    });
  }

  // Pinpoint current GPS location using Capacitor Geolocation
  async locateCurrentPosition(showToast = true): Promise<void> {
    this.locating.set(true);
    try {
      // Check and request location permission before the device can access the user's location
      const hasPermission = await this.checkAndRequestLocationPermission(showToast);
      if (!hasPermission) {
        return;
      }

      const coords = await this.getCurrentCoordinates(showToast);
      if (coords) {
        this.relocatePin(coords.lat, coords.lng, true);
        await this.onPinRelocated(coords.lat, coords.lng, 'Current Location');
        if (showToast) {
          await this.toast.show('Pinpointed current location');
        }
      }
    } catch (e) {
      console.warn('locateCurrentPosition error:', e);
    } finally {
      this.locating.set(false);
    }
  }

  // Explicitly type the location: when entered, the pin relocates
  async searchAndRelocate(): Promise<void> {
    const rawQuery = this.query().trim();
    if (!rawQuery) return;

    this.searching.set(true);
    try {
      const match = await this.geocodeLocation(rawQuery);
      if (match) {
        this.relocatePin(match.lat, match.lng, true);
        this.selected.set({
          name: match.name,
          address: match.address,
          lat: match.lat,
          lng: match.lng,
        });
        await this.toast.show(`Pin relocated to ${match.name}`);
      } else {
        // If not found in geocoders, keep pin position but update the name to user's typed input
        const currentPin = this.marker?.getLatLng();
        const lat = currentPin?.lat ?? DEFAULT_COORDS[0];
        const lng = currentPin?.lng ?? DEFAULT_COORDS[1];
        this.selected.set({
          name: rawQuery,
          address: this.selected()?.address || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
          lat,
          lng,
        });
        await this.toast.show(`Location name set to "${rawQuery}"`);
      }
    } catch (err) {
      console.warn('Search and relocate error:', err);
    } finally {
      this.searching.set(false);
    }
  }

  // Tap on a suggested place chip/item
  pickSuggestedPlace(p: Place): void {
    if (p.lat !== undefined && p.lng !== undefined) {
      this.relocatePin(p.lat, p.lng, true);
      this.selected.set(p);
      this.query.set(p.name);
    }
  }

  clearQuery(): void {
    this.query.set('');
  }

  confirm(): void {
    const chosen = this.selected();
    if (chosen) {
      this.modalCtrl.dismiss(chosen, 'confirm');
    }
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  // Relocate the Leaflet marker and pan the map
  private relocatePin(lat: number, lng: number, fly = false): void {
    if (!this.marker || !this.map) return;
    this.marker.setLatLng([lat, lng]);
    if (fly) {
      this.map.flyTo([lat, lng], 16, { duration: 0.8 });
    } else {
      this.map.panTo([lat, lng]);
    }
  }

  // Handle pin movement (dragged or map clicked)
  private async onPinRelocated(lat: number, lng: number, defaultName?: string): Promise<void> {
    this.resolvingAddress.set(true);
    try {
      const resolved = await this.reverseGeocode(lat, lng);
      const name = defaultName || resolved.name;
      this.selected.set({
        name,
        address: resolved.address,
        lat,
        lng,
      });
      this.query.set(name);
    } finally {
      this.resolvingAddress.set(false);
    }
  }

  /**
   * Request and verify location permission before the device can access the user's location.
   * On native platforms, uses Capacitor Geolocation plugin (checkPermissions & requestPermissions).
   * On web platforms, queries the browser permissions API.
   */
  async checkAndRequestLocationPermission(showToast = true): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Geolocation.checkPermissions();
        if (status.location === 'granted' || status.coarseLocation === 'granted') {
          this.permissionDenied.set(false);
          return true;
        }

        const requested = await Geolocation.requestPermissions({
          permissions: ['location', 'coarseLocation'],
        });

        if (requested.location === 'granted' || requested.coarseLocation === 'granted') {
          this.permissionDenied.set(false);
          return true;
        }

        this.permissionDenied.set(true);
        if (showToast) {
          await this.toast.show('Location Permission Denied.');
        }
        return false;
      } catch (err) {
        console.warn('Geolocation check/request permissions error on native:', err);
        this.permissionDenied.set(true);
        if (showToast) {
          await this.toast.show('Location Permission Denied.');
        }
        return false;
      }
    }

    // Web / browser platform
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const queryStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (queryStatus.state === 'denied') {
          this.permissionDenied.set(true);
          if (showToast) {
            await this.toast.show('Location Permission Denied.');
          }
          return false;
        }
      } catch {
        // Fallback for browsers that do not support permissions query for geolocation
      }
    }

    this.permissionDenied.set(false);
    return true;
  }

  // Access device GPS location using Capacitor Geolocation plugin (Universal format)
  async getCurrentPosition(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }): Promise<Position> {
    return Geolocation.getCurrentPosition(options);
  }

  private async getCurrentCoordinates(showToast = true): Promise<{ lat: number; lng: number } | null> {
    try {
      // Universal Capacitor Geolocation.getCurrentPosition format
      const coordinates: Position = await this.getCurrentPosition();

      this.permissionDenied.set(false);
      return {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      };
    } catch (err: unknown) {
      console.warn('Geolocation.getCurrentPosition failed:', err);
      const errorObj = err as { code?: number; message?: string };
      if (errorObj?.code === 1 || errorObj?.message?.toLowerCase().includes('denied')) {
        this.permissionDenied.set(true);
        if (showToast) {
          await this.toast.show('Location Permission Denied.');
        }
      } else if (showToast) {
        await this.toast.show('Could not retrieve current location.');
      }
      return null;
    }
  }

  // Geocodes a text query into coordinates
  private async geocodeLocation(query: string): Promise<{ name: string; address: string; lat: number; lng: number } | null> {
    const q = query.trim().toLowerCase();

    // 1. Check suggested places for instant match
    const local = this.suggestedPlaces.find(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    );
    if (local && local.lat !== undefined && local.lng !== undefined) {
      return {
        name: local.name,
        address: local.address,
        lat: local.lat,
        lng: local.lng,
      };
    }

    // 2. Check if user typed coordinates directly, e.g. "14.5995, 120.9842"
    const coordPattern = /^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/;
    const coordMatch = query.match(coordPattern);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const rev = await this.reverseGeocode(lat, lng);
        return { name: rev.name, address: rev.address, lat, lng };
      }
    }

    // 3. Try online OpenStreetMap Nominatim geocoding (works on devices with internet)
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const parts = (item.display_name || '').split(',');
          const name = parts[0]?.trim() || query;
          const address = item.display_name || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
          return { name, address, lat, lng };
        }
      }
    } catch {
      // Offline or network error handled gracefully
    }

    return null;
  }

  // Reverse geocodes coordinates into an address/name
  private async reverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string }> {
    // 1. Try online Nominatim reverse geocode
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data) {
          const addr = data.address || {};
          const building = addr.building || addr.amenity || addr.shop || addr.office;
          const road = addr.road || addr.pedestrian || addr.street;
          const suburb = addr.suburb || addr.neighbourhood || addr.city_district;
          const city = addr.city || addr.town || addr.village || addr.municipality;

          const name =
            building ||
            (road ? (suburb ? `${road}, ${suburb}` : road) : city || `Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
          const address = data.display_name || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
          return { name, address };
        }
      }
    } catch {
      // Offline fallback
    }

    // 2. Nearest suggested place if nearby
    const nearest = this.findNearestPlace(lat, lng);
    if (nearest) {
      return { name: nearest.name, address: nearest.address };
    }

    // 3. Fallback coordinate label
    return {
      name: `Pinned Location`,
      address: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    };
  }

  private findNearestPlace(lat: number, lng: number): Place | null {
    let closest: Place | null = null;
    let minDist = 0.015; // ~1.5 km
    for (const p of this.suggestedPlaces) {
      if (p.lat !== undefined && p.lng !== undefined) {
        const dist = Math.hypot(p.lat - lat, p.lng - lng);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
    }
    return closest;
  }
}
