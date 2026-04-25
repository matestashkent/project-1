export type Language = 'ru' | 'uz';
export type Level = 'A1-A2' | 'B1-B2' | 'C1-C2';
export type WeakArea = 'writing' | 'reading' | 'listening' | 'speaking';

export interface StudentProfile {
  name: string;
  language: Language;
  level: Level;
  targetBand: number;
  examIn: string;
  studyMinutes: number;
  weakAreas: WeakArea[];
  createdAt: string;
  lastActive: string;
  streak: number;
  lessonsCompleted: number;
  writingSubmissions: number;
  mockExamsCompleted: number;
  writingBands: Array<{ date: string; band: number }>;
  readingScores: Array<{ date: string; percent: number }>;
}

export interface Lesson {
  topic: string;
  whyImportant: string;
  explanation: string;
  goodExample: string;
  badExample: string;
  task: string;
}

export interface WritingFeedback {
  taskAchievement: { band: number; comment: string; quote: string };
  coherenceCohesion: { band: number; comment: string; quote: string };
  lexicalResource: { band: number; comment: string; quote: string };
  grammaticalRange: { band: number; comment: string; quote: string };
  overallBand: number;
  topTip: string;
}

export interface ReadingQuestion {
  id: number;
  statement: string;
  answer: 'TRUE' | 'FALSE' | 'NOT GIVEN';
  explanation: string;
}

export interface ReadingPassage {
  title: string;
  text: string;
  questions: ReadingQuestion[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
