import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Universal Haptics Service for Capacitor Haptics plugin.
 * Provides standard, unified methods for notification, impact, and vibration feedback.
 */
@Injectable({
  providedIn: 'root',
})
export class HapticsService {
  /**
   * Universal format for triggering notification haptic feedback.
   * Dispatches Capacitor Haptics notification, physical vibration pulse, and browser vibration fallback.
   * Types: NotificationType.Warning, NotificationType.Success, NotificationType.Error
   */
  async notification(type: NotificationType = NotificationType.Warning): Promise<void> {
    // 1. Native Capacitor notification haptics
    try {
      await Haptics.notification({ type });
    } catch {
      // Ignored if unsupported on current platform
    }

    // 2. Physical device vibration via Capacitor (400ms pulse)
    try {
      await Haptics.vibrate({ duration: 400 });
    } catch {
      // Ignored if unsupported
    }

    // 3. Direct browser Vibration API fallback (for phone testing via ionic serve --external)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 100, 300]);
      } catch {
        // Ignored if blocked by browser policy
      }
    }
  }

  /**
   * Universal format for triggering impact haptic feedback.
   * Styles: ImpactStyle.Heavy, ImpactStyle.Medium, ImpactStyle.Light
   */
  async impact(style: ImpactStyle = ImpactStyle.Heavy): Promise<void> {
    try {
      await Haptics.impact({ style });
    } catch {
      // Ignored if unsupported
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(150);
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Universal format for vibrating the device.
   */
  async vibrate(duration = 400): Promise<void> {
    try {
      await Haptics.vibrate({ duration });
    } catch {
      // Ignored if unsupported
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignored
      }
    }
  }
}
