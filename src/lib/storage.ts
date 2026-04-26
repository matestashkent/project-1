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

const CHAT_KEY = 'mentora_chat_history';

export function getChatHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: Array<{ role: 'user' | 'assistant'; content: string }>): void {
  // Keep last 100 messages to avoid filling up storage
  const trimmed = messages.slice(-100);
  localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
}

export function clearChatHistory(): void {
  localStorage.removeItem(CHAT_KEY);
}
