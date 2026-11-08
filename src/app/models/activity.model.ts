export type ActivityStatus = 'pending' | 'ongoing' | 'completed' | 'cancelled';
export type CategoryGroup = 'Academic' | 'Personal';
export type ReminderReference = 'time' | 'deadline';

export interface CategoryItem {
  id: string;
  name: string;
  group: CategoryGroup;
  icon: string;
  color: string;
}

export interface VideoAttachment {
  thumb: string;
  title: string;
  duration: string;
  uri?: string;
  webPath?: string;
}

export interface Place {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD (Required)
  time?: string; // HH:mm (Optional)
  deadline?: string; // YYYY-MM-DD (Optional)
  category: string;
  status: ActivityStatus;
  reminder: boolean;
  reminderMinutes?: number; // e.g. 5, 10, 15, 30, 60, 120, 1440, or custom
  reminderRef?: ReminderReference;
  // Optional attachments (up to 5 attachments overall)
  photos?: string[];
  video?: VideoAttachment;
  videos?: VideoAttachment[];
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
}

export const STATUSES: ActivityStatus[] = ['pending', 'ongoing', 'completed', 'cancelled'];

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  // ACADEMIC
  { id: 'cat-assignments', name: 'Assignments', group: 'Academic', icon: 'document-text-outline', color: '#3979D8' },
  { id: 'cat-projects', name: 'Projects', group: 'Academic', icon: 'folder-open-outline', color: '#2B6CB0' },
  { id: 'cat-examinations', name: 'Examinations', group: 'Academic', icon: 'school-outline', color: '#D97706' },
  { id: 'cat-research', name: 'Research', group: 'Academic', icon: 'flask-outline', color: '#6D9EEB' },
  { id: 'cat-readings', name: 'Readings', group: 'Academic', icon: 'book-outline', color: '#2F8F55' },
  { id: 'cat-school-act', name: 'School Activities', group: 'Academic', icon: 'people-outline', color: '#4A78D0' },
  // PERSONAL
  { id: 'cat-personal', name: 'Personal', group: 'Personal', icon: 'person-outline', color: '#3979D8' },
  { id: 'cat-errands', name: 'Errands', group: 'Personal', icon: 'cart-outline', color: '#5A7D9A' },
  { id: 'cat-health', name: 'Health', group: 'Personal', icon: 'fitness-outline', color: '#2F8F55' },
  { id: 'cat-household', name: 'Household', group: 'Personal', icon: 'home-outline', color: '#B7791F' },
  { id: 'cat-meetings', name: 'Meetings', group: 'Personal', icon: 'chatbubbles-outline', color: '#6D9EEB' },
  { id: 'cat-others', name: 'Others', group: 'Personal', icon: 'pricetag-outline', color: '#8995A7' },
];

export const CATEGORY_ICONS: string[] = [
  'document-text-outline',
  'folder-open-outline',
  'school-outline',
  'flask-outline',
  'book-outline',
  'people-outline',
  'person-outline',
  'cart-outline',
  'fitness-outline',
  'home-outline',
  'chatbubbles-outline',
  'pricetag-outline',
  'bulb-outline',
  'laptop-outline',
];

export const CATEGORY_COLORS: string[] = [
  '#3979D8',
  '#6D9EEB',
  '#2F8F55',
  '#D97706',
  '#5A7D9A',
  '#8995A7',
];

export const REMINDER_PRESETS: { label: string; minutes: number }[] = [
  { label: '5 minutes before', minutes: 5 },
  { label: '10 minutes before', minutes: 10 },
  { label: '15 minutes before', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '2 hours before', minutes: 120 },
  { label: '1 day before', minutes: 1440 },
];

export function formatReminderInterval(minutes?: number): string {
  const m = minutes ?? 15;
  if (m === 1440) return '1 day before';
  if (m === 120) return '2 hours before';
  if (m === 60) return '1 hour before';
  return `${m} ${m === 1 ? 'minute' : 'minutes'} before`;
}
