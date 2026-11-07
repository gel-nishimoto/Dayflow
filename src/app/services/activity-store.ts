import { Injectable, computed, signal } from '@angular/core';

import { SAMPLE_ACTIVITIES } from '../data/sample-activities';
import { SAMPLE_NOTIFICATIONS } from '../data/sample-notifications';
import type { Activity, ActivityStatus, CategoryItem } from '../models/activity.model';
import { DEFAULT_CATEGORIES } from '../models/activity.model';
import type { AppNotification } from '../models/notification.model';

// Shared in-memory state so every screen sees the same sample data.
// Nothing is saved: a page refresh restores the original sample data.
@Injectable({ providedIn: 'root' })
export class ActivityStore {
  activities = signal<Activity[]>(SAMPLE_ACTIVITIES);
  categories = signal<CategoryItem[]>(DEFAULT_CATEGORIES);
  notifications = signal<AppNotification[]>(SAMPLE_NOTIFICATIONS);

  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  private nextId = 100;
  private nextCatId = 100;

  add(data: Omit<Activity, 'id'>): void {
    this.activities.update((list) => [...list, { ...data, id: this.nextId++ }]);
  }

  update(activity: Activity): void {
    this.activities.update((list) => list.map((a) => (a.id === activity.id ? activity : a)));
  }

  remove(id: number): void {
    this.activities.update((list) => list.filter((a) => a.id !== id));
  }

  setStatus(id: number, status: ActivityStatus): void {
    this.activities.update((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  // ---- Category Management (in-memory only) ----
  getCategoryByName(name: string): CategoryItem {
    return (
      this.categories().find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? {
        id: 'fallback',
        name,
        group: 'Personal',
        icon: 'pricetag-outline',
        color: '#3979D8',
      }
    );
  }

  countActivitiesUsingCategory(categoryName: string): number {
    return this.activities().filter((a) => a.category.toLowerCase() === categoryName.toLowerCase()).length;
  }

  addCategory(data: Omit<CategoryItem, 'id'>): CategoryItem {
    const created: CategoryItem = { ...data, id: `cat-custom-${this.nextCatId++}` };
    this.categories.update((list) => [...list, created]);
    return created;
  }

  updateCategory(updated: CategoryItem): void {
    const existing = this.categories().find((c) => c.id === updated.id);
    this.categories.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
    if (existing && existing.name !== updated.name) {
      this.activities.update((list) =>
        list.map((a) => (a.category === existing.name ? { ...a, category: updated.name } : a)),
      );
    }
  }

  deleteCategory(id: string): void {
    const target = this.categories().find((c) => c.id === id);
    if (!target) return;
    this.categories.update((list) => list.filter((c) => c.id !== id));
    // Reassign affected activities to 'Others'
    this.activities.update((list) =>
      list.map((a) => (a.category === target.name ? { ...a, category: 'Others' } : a)),
    );
  }

  markRead(id: number): void {
    this.notifications.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }
}
