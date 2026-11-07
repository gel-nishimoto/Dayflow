import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.page').then((m) => m.NotificationsPage),
  },
  {
    path: '',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'tasks',
        loadComponent: () => import('./tasks/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./calendar/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];
