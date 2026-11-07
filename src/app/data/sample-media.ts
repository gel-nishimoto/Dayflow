import type { VideoAttachment } from '../models/activity.model';

// Temporary sample media for the simulated camera, video, and location UI.

function svgUri(from: string, to: string, shape: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/>` +
    `<stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="400" height="400" fill="url(#g)"/>${shape}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export const SAMPLE_PHOTOS: string[] = [
  // 1. Lecture notes / document
  svgUri(
    '#EAF2FF',
    '#6D9EEB',
    '<rect x="70" y="60" width="260" height="280" rx="22" fill="#ffffff" opacity="0.92"/>' +
      '<rect x="105" y="105" width="140" height="16" rx="8" fill="#3979D8"/>' +
      '<rect x="105" y="145" width="190" height="12" rx="6" fill="#6D9EEB"/>' +
      '<rect x="105" y="175" width="175" height="12" rx="6" fill="#6D9EEB"/>' +
      '<rect x="105" y="205" width="150" height="12" rx="6" fill="#6D9EEB"/>' +
      '<text x="200" y="295" text-anchor="middle" fill="#3979D8" font-family="sans-serif" font-size="18" font-weight="700">Math Notes p.1</text>',
  ),
  // 2. Whiteboard diagram
  svgUri(
    '#6D9EEB',
    '#3979D8',
    '<rect x="55" y="75" width="290" height="210" rx="18" fill="#ffffff" opacity="0.9"/>' +
      '<circle cx="145" cy="165" r="36" fill="#EAF2FF" stroke="#3979D8" stroke-width="6"/>' +
      '<rect x="215" y="130" width="85" height="70" rx="12" fill="#EAF2FF" stroke="#3979D8" stroke-width="6"/>' +
      '<text x="200" y="340" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">Whiteboard Diagram</text>',
  ),
  // 3. Textbook chapter reference
  svgUri(
    '#D8E8FF',
    '#5B8EE0',
    '<rect x="65" y="80" width="130" height="220" rx="12" fill="#ffffff" opacity="0.92"/>' +
      '<rect x="205" y="80" width="130" height="220" rx="12" fill="#ffffff" opacity="0.92"/>' +
      '<rect x="85" y="115" width="90" height="10" rx="5" fill="#3979D8"/>' +
      '<rect x="85" y="140" width="80" height="8" rx="4" fill="#8995A7"/>' +
      '<rect x="225" y="115" width="90" height="10" rx="5" fill="#3979D8"/>' +
      '<rect x="225" y="140" width="80" height="8" rx="4" fill="#8995A7"/>' +
      '<text x="200" y="348" text-anchor="middle" fill="#26354A" font-family="sans-serif" font-size="18" font-weight="700">Chapter 3 Excerpt</text>',
  ),
  // 4. Lab apparatus photo
  svgUri(
    '#E8F5EC',
    '#6D9EEB',
    '<circle cx="200" cy="185" r="85" fill="#ffffff" opacity="0.9"/>' +
      '<path d="M175 130 L175 165 L145 225 L255 225 L225 165 L225 130 Z" fill="#3979D8" opacity="0.85"/>' +
      '<text x="200" y="335" text-anchor="middle" fill="#26354A" font-family="sans-serif" font-size="18" font-weight="700">Lab Setup Photo</text>',
  ),
  // 5. Study group handout
  svgUri(
    '#3979D8',
    '#26354A',
    '<rect x="80" y="75" width="240" height="210" rx="20" fill="#ffffff" opacity="0.92"/>' +
      '<circle cx="135" cy="140" r="18" fill="#3979D8"/>' +
      '<rect x="168" y="128" width="110" height="12" rx="6" fill="#26354A"/>' +
      '<rect x="168" y="148" width="80" height="10" rx="5" fill="#8995A7"/>' +
      '<rect x="115" y="195" width="170" height="12" rx="6" fill="#6D9EEB"/>' +
      '<text x="200" y="340" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">Project Handout</text>',
  ),
];

let photoCounter = 0;
export function nextSamplePhoto(): string {
  return SAMPLE_PHOTOS[photoCounter++ % SAMPLE_PHOTOS.length];
}

export const SAMPLE_VIDEOS: VideoAttachment[] = [
  {
    thumb: svgUri(
      '#26354A',
      '#3979D8',
      '<rect x="55" y="85" width="290" height="190" rx="20" fill="#ffffff" opacity="0.16"/>' +
        '<rect x="90" y="120" width="160" height="14" rx="7" fill="#EAF2FF" opacity="0.85"/>' +
        '<rect x="90" y="150" width="220" height="10" rx="5" fill="#EAF2FF" opacity="0.6"/>' +
        '<text x="200" y="335" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">Presentation Rehearsal.mp4</text>',
    ),
    title: 'Presentation Rehearsal.mp4',
    duration: '0:48',
  },
  {
    thumb: svgUri(
      '#1F2B3D',
      '#4A78D0',
      '<circle cx="200" cy="180" r="75" fill="#ffffff" opacity="0.18"/>' +
        '<text x="200" y="335" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">Lecture Demo Clip.mp4</text>',
    ),
    title: 'Lecture Demo Clip.mp4',
    duration: '1:15',
  },
];

let videoCounter = 0;
export function nextSampleVideo(): VideoAttachment {
  return SAMPLE_VIDEOS[videoCounter++ % SAMPLE_VIDEOS.length];
}

export interface Place {
  name: string;
  address: string;
}

export const SAMPLE_PLACES: Place[] = [
  { name: 'Central Library', address: '2nd Floor Study Hall, University Ave' },
  { name: 'Science Building Lab 302', address: 'Science Wing, Campus Drive' },
  { name: 'Student Union Room B', address: 'Main Campus Plaza' },
  { name: 'Coffee Hub Study Lounge', address: '5 Orchard Road, Near Gate 2' },
  { name: 'City Gym', address: '88 Rizal Street, Makati' },
];

export const CURRENT_LOCATION: Place = {
  name: 'Current location selected (demo only)',
  address: 'Campus Academic Center, Simulated GPS',
};
