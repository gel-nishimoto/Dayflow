export type NotificationType = 'upcoming' | 'deadline' | 'overdue';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  time: string; // display text, e.g. "10 min ago"
  read: boolean;
}

