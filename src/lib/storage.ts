import { StudentProfile } from './types';

const KEY = 'ustoz_profile';

export function getProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProfile(profile: StudentProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function updateProfile(updates: Partial<StudentProfile>): StudentProfile | null {
  const profile = getProfile();
  if (!profile) return null;
  const updated = { ...profile, ...updates, lastActive: new Date().toISOString() };
  saveProfile(updated);
  return updated;
}

export function addWritingBand(band: number): void {
  const profile = getProfile();
  if (!profile) return;
  const bands = [...(profile.writingBands || []), { date: new Date().toISOString(), band }];
  updateProfile({ writingBands: bands, writingSubmissions: (profile.writingSubmissions || 0) + 1 });
}

export function addReadingScore(percent: number): void {
  const profile = getProfile();
  if (!profile) return;
  const scores = [...(profile.readingScores || []), { date: new Date().toISOString(), percent }];
  updateProfile({ readingScores: scores });
}

export function incrementLessons(): void {
  const profile = getProfile();
  if (!profile) return;
  updateProfile({ lessonsCompleted: (profile.lessonsCompleted || 0) + 1 });
}

export function clearProfile(): void {
  localStorage.removeItem(KEY);
}
