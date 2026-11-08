import { Injectable, computed, inject, signal } from '@angular/core';

import type { Activity, ActivityStatus, CategoryItem } from '../models/activity.model';
import { DEFAULT_CATEGORIES } from '../models/activity.model';
import type { AppNotification } from '../models/notification.model';
import { isoOffset } from '../utils/date-utils';

import type { UserProfile } from './activity-api.service';
import { ActivityApiService } from './activity-api.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class ActivityStore {
  private api = inject(ActivityApiService);
  private toast = inject(ToastService);

  isLoggedIn = signal<boolean>(false);
  currentUser = signal<UserProfile | null>(null);

  userName = computed(() => {
    if (!this.isLoggedIn()) {
      return 'Guest';
    }
    return this.currentUser()?.name?.trim() || 'User';
  });

  activities = signal<Activity[]>([]);
  categories = signal<CategoryItem[]>(DEFAULT_CATEGORIES);
  notifications = signal<AppNotification[]>([]);
  backendConnected = signal<boolean>(false);

  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  private nextId = 100;
  private nextCatId = 100;
  private notifiedTaskKeys = new Set<string>();

  constructor() {
    // By default, user is logged out (guest mode).
    // In guest mode, activities and categories are kept in-memory only and never sent to database.
  }

  isDueTomorrow(activity: { date?: string; deadline?: string; status?: string }): boolean {
    if (activity.status === 'completed' || activity.status === 'cancelled') {
      return false;
    }
    const tomorrow = isoOffset(1);
    return activity.deadline === tomorrow || activity.date === tomorrow;
  }

  login(user: UserProfile): void {
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
    this.loadActivities();
    this.loadCategories();
    this.loadNotifications();
  }

  logout(): void {
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.activities.set([]);
    this.notifications.set([]);
    this.categories.set(DEFAULT_CATEGORIES);
    this.backendConnected.set(false);
    this.notifiedTaskKeys.clear();
  }

  // ---- 1. Activities Sync ----
  loadActivities(): void {
    if (!this.isLoggedIn()) return;

    this.api.getActivities().subscribe({
      next: (list) => {
        if (Array.isArray(list)) {
          this.activities.set(list);
          this.backendConnected.set(true);
          this.scanDueTomorrowActivities(list);
        }
      },
      error: (err: Error) => {
        this.backendConnected.set(false);
        console.info('Backend API unavailable, operating with local data:', err.message);
      },
    });
  }

  add(data: Omit<Activity, 'id'>): void {
    const tempId = this.nextId++;
    const optimistic: Activity = { ...data, id: tempId };
    this.activities.update((list) => [optimistic, ...list]);
    this.checkAndNotifyDueTomorrow(optimistic, true);

    // Guest mode: data is not stored in the database
    if (!this.isLoggedIn()) return;

    this.api.createActivity(data).subscribe({
      next: (created) => {
        this.backendConnected.set(true);
        this.activities.update((list) => list.map((a) => (a.id === tempId ? created : a)));
      },
      error: (err: Error) => {
        console.warn('API create error (kept in memory):', err.message);
      },
    });
  }

  update(activity: Activity): void {
    this.activities.update((list) => list.map((a) => (a.id === activity.id ? activity : a)));
    this.checkAndNotifyDueTomorrow(activity, true);

    // Guest mode: data is not stored in the database
    if (!this.isLoggedIn()) return;

    this.api.updateActivity(activity.id, activity).subscribe({
      next: (updated) => {
        this.backendConnected.set(true);
        this.activities.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
      },
      error: (err: Error) => {
        console.warn('API update error (kept in memory):', err.message);
      },
    });
  }

  remove(id: number): void {
    this.activities.update((list) => list.filter((a) => a.id !== id));

    // Guest mode: data is not stored in the database
    if (!this.isLoggedIn()) return;

    this.api.deleteActivity(id).subscribe({
      next: () => {
        this.backendConnected.set(true);
      },
      error: (err: Error) => {
        console.warn('API delete error (removed from memory):', err.message);
      },
    });
  }

  setStatus(id: number, status: ActivityStatus): void {
    const target = this.activities().find((a) => a.id === id);
    if (!target) return;
    this.update({ ...target, status });
  }

  // ---- 2. Category Management Sync ----
  loadCategories(): void {
    if (!this.isLoggedIn()) return;

    this.api.getCategories().subscribe({
      next: (list) => {
        if (Array.isArray(list) && list.length > 0) {
          this.categories.set(list);
        }
      },
      error: (err: Error) => {
        console.info('Backend categories unavailable, using local defaults:', err.message);
      },
    });
  }

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

    if (!this.isLoggedIn()) return created;

    this.api.createCategory(created).subscribe({
      next: (saved) => {
        this.categories.update((list) => list.map((c) => (c.id === created.id ? saved : c)));
      },
      error: (err: Error) => {
        console.warn('API addCategory error (saved in memory):', err.message);
      },
    });

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

    if (!this.isLoggedIn()) return;

    this.api.updateCategory(updated.id, updated).subscribe({
      error: (err: Error) => {
        console.warn('API updateCategory error:', err.message);
      },
    });
  }

  deleteCategory(id: string): void {
    const target = this.categories().find((c) => c.id === id);
    if (!target) return;
    this.categories.update((list) => list.filter((c) => c.id !== id));
    // Reassign affected activities to 'Others'
    this.activities.update((list) =>
      list.map((a) => (a.category === target.name ? { ...a, category: 'Others' } : a)),
    );

    if (!this.isLoggedIn()) return;

    this.api.deleteCategory(id).subscribe({
      error: (err: Error) => {
        console.warn('API deleteCategory error:', err.message);
      },
    });
  }

  // ---- 3. Notifications Sync ----
  loadNotifications(): void {
    if (!this.isLoggedIn()) return;

    this.api.getNotifications().subscribe({
      next: (list) => {
        if (Array.isArray(list) && list.length > 0) {
          this.notifications.set(list);
        }
      },
      error: (err: Error) => {
        console.info('Backend notifications unavailable:', err.message);
      },
    });
  }

  addNotification(data: Omit<AppNotification, 'id'>): void {
    const tempId = this.nextId++;
    const optimistic: AppNotification = { ...data, id: tempId };
    this.notifications.update((list) => [optimistic, ...list]);

    // Guest mode: data is not stored in the database
    if (!this.isLoggedIn()) return;

    this.api.createNotification(data).subscribe({
      next: (created) => {
        this.notifications.update((list) => list.map((n) => (n.id === tempId ? created : n)));
      },
      error: (err: Error) => {
        console.warn('API createNotification error (saved in memory):', err.message);
      },
    });
  }

  checkAndNotifyDueTomorrow(activity: Activity, forceAlert = false): void {
    if (!this.isDueTomorrow(activity)) return;

    const tomorrow = isoOffset(1);
    const sessionKey = `${activity.id || activity.title}_${tomorrow}`;

    const notifTitle = `Deadline Tomorrow: ${activity.title}`;
    const alreadyStored = this.notifications().some(
      (n) => n.title.toLowerCase() === notifTitle.toLowerCase() || n.title.includes(activity.title),
    );

    if (!alreadyStored) {
      const dueDate = activity.deadline || activity.date;
      this.addNotification({
        type: 'deadline',
        title: notifTitle,
        description: `Task "${activity.title}" is due tomorrow (${dueDate}). Remember to complete or submit on time!`,
        time: 'Due tomorrow',
        read: false,
      });
    }

    if (forceAlert || !this.notifiedTaskKeys.has(sessionKey)) {
      this.notifiedTaskKeys.add(sessionKey);
      const dueDate = activity.deadline || activity.date;
      void this.toast.showDueTomorrowPopup(activity.title, dueDate);
    }
  }

  scanDueTomorrowActivities(activities: Activity[]): void {
    const dueTasks = activities.filter((a) => this.isDueTomorrow(a));
    if (dueTasks.length === 0) return;

    const tomorrow = isoOffset(1);
    let newlyNotifiedCount = 0;
    let firstDueTask: Activity | null = null;

    for (const task of dueTasks) {
      const sessionKey = `${task.id || task.title}_${tomorrow}`;
      const notifTitle = `Deadline Tomorrow: ${task.title}`;
      const alreadyInList = this.notifications().some(
        (n) => n.title.toLowerCase() === notifTitle.toLowerCase() || n.title.includes(task.title),
      );

      if (!alreadyInList) {
        const dueDate = task.deadline || task.date;
        this.addNotification({
          type: 'deadline',
          title: notifTitle,
          description: `Task "${task.title}" is due tomorrow (${dueDate}). Remember to complete or submit on time!`,
          time: 'Due tomorrow',
          read: false,
        });
      }

      if (!this.notifiedTaskKeys.has(sessionKey)) {
        this.notifiedTaskKeys.add(sessionKey);
        newlyNotifiedCount++;
        if (!firstDueTask) {
          firstDueTask = task;
        }
      }
    }

    if (newlyNotifiedCount > 0 && firstDueTask) {
      if (newlyNotifiedCount === 1) {
        void this.toast.showDueTomorrowPopup(firstDueTask.title, firstDueTask.deadline || firstDueTask.date);
      } else {
        void this.toast.showDueTomorrowPopup(
          `${newlyNotifiedCount} Tasks`,
          `${newlyNotifiedCount} tasks are due tomorrow`,
        );
      }
    }
  }

  markRead(id: number): void {
    this.notifications.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));

    if (!this.isLoggedIn()) return;

    this.api.markNotificationRead(id).subscribe({
      error: (err: Error) => {
        console.warn('API markNotificationRead error:', err.message);
      },
    });
  }

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));

    if (!this.isLoggedIn()) return;

    this.api.markAllNotificationsRead().subscribe({
      error: (err: Error) => {
        console.warn('API markAllNotificationsRead error:', err.message);
      },
    });
  }
}
