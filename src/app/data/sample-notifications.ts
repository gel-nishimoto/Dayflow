import type { AppNotification } from '../models/notification.model';

export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    type: 'upcoming',
    title: 'Team stand-up starts soon',
    description: 'Your meeting begins in 30 minutes.',
    time: '10 min ago',
    read: false,
  },
  {
    id: 2,
    type: 'deadline',
    title: 'Deadline approaching',
    description: 'Submit project proposal is due today at 12:00 PM.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    type: 'overdue',
    title: 'Task overdue',
    description: 'Pay electricity bill was due yesterday.',
    time: 'Yesterday',
    read: false,
  },
  {
    id: 4,
    type: 'upcoming',
    title: 'Dentist appointment',
    description: 'Scheduled in 2 days at 3:00 PM.',
    time: '2 days ago',
    read: true,
  },
];

