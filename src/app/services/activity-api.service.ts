import type { HttpErrorResponse } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { catchError, map, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import type { Activity, CategoryItem } from '../models/activity.model';
import type { AppNotification } from '../models/notification.model';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  phone: string;
  school: string;
  dailyReminder: boolean;
  soundAlerts: boolean;
}

@Injectable({ providedIn: 'root' })
export class ActivityApiService {
  http = inject(HttpClient); // inject
  url = environment.apiUrl; // endpoint (base URL of the PHP backend)

  // ---- 1. ACTIVITIES ----
  getActivities(): Observable<Activity[]> {
    return this.http.get<ApiResponse<Activity[]>>(`${this.url}/activities.php`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch activities');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  getActivityById(id: number): Observable<Activity> {
    return this.http.get<ApiResponse<Activity>>(`${this.url}/activities.php?id=${id}`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || `Activity #${id} not found`);
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  createActivity(activity: Omit<Activity, 'id'>): Observable<Activity> {
    return this.http.post<ApiResponse<Activity>>(`${this.url}/activities.php`, activity).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to create activity');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  updateActivity(id: number, activity: Activity): Observable<Activity> {
    return this.http.put<ApiResponse<Activity>>(`${this.url}/activities.php?id=${id}`, activity).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to update activity');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/activities.php?id=${id}`).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to delete activity');
        }
        return void 0;
      }),
      catchError(this.handleError),
    );
  }

  // ---- 2. CATEGORIES ----
  getCategories(): Observable<CategoryItem[]> {
    return this.http.get<ApiResponse<CategoryItem[]>>(`${this.url}/categories.php`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch categories');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  createCategory(category: CategoryItem): Observable<CategoryItem> {
    return this.http.post<ApiResponse<CategoryItem>>(`${this.url}/categories.php`, category).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to create category');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  updateCategory(id: string, category: CategoryItem): Observable<CategoryItem> {
    return this.http.put<ApiResponse<CategoryItem>>(`${this.url}/categories.php?id=${encodeURIComponent(id)}`, category).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to update category');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/categories.php?id=${encodeURIComponent(id)}`,).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to delete category');
        }
        return void 0;
      }),
      catchError(this.handleError),
    );
  }

  // ---- 3. NOTIFICATIONS ----
  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<ApiResponse<AppNotification[]>>(`${this.url}/notifications.php`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch notifications');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  createNotification(notification: Omit<AppNotification, 'id'>): Observable<AppNotification> {
    return this.http.post<ApiResponse<AppNotification>>(`${this.url}/notifications.php`, notification).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to create notification');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  markNotificationRead(id: number): Observable<AppNotification> {
    return this.http.put<ApiResponse<AppNotification>>(`${this.url}/notifications.php?id=${id}`, {}).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to mark notification read');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.url}/notifications.php?action=mark-all-read`, {}).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to mark all notifications read');
        }
        return void 0;
      }),
      catchError(this.handleError),
    );
  }

  // ---- 4. USER PROFILE & AUTH ----
  login(credentials: { email: string; password: string }): Observable<UserProfile> {
    return this.http
      .post<ApiResponse<UserProfile>>(`${this.url}/auth.php?action=login`, credentials)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Login failed');
          }
          return res.data;
        }),
        catchError(this.handleError),
      );
  }

  register(data: {
    email: string;
    password: string;
    name?: string;
    school?: string;
    phone?: string;
  }): Observable<UserProfile> {
    return this.http
      .post<ApiResponse<UserProfile>>(`${this.url}/auth.php?action=register`, data)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Registration failed');
          }
          return res.data;
        }),
        catchError(this.handleError),
      );
  }

  getProfile(userId?: number): Observable<UserProfile> {
    const query = userId ? `?user_id=${userId}` : '';
    return this.http.get<ApiResponse<UserProfile>>(`${this.url}/profile.php${query}`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch profile');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    const query = profile.id ? `?user_id=${profile.id}` : '';
    return this.http.put<ApiResponse<UserProfile>>(`${this.url}/profile.php${query}`, profile).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to update profile');
        }
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected server error occurred.';
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.error?.errors) {
      message = Object.values(error.error.errors).join(' ');
    } else if (error.status === 0) {
      message = 'Cannot reach backend server. Please verify PHP RESTful API is running.';
    } else if (error.status === 200) {
      message = 'Server returned an unexpected (non-JSON) response.';
    }
    return throwError(() => new Error(message));
  }
}
