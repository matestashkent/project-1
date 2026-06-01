import { StudentProfile } from './types';
import { DbUser } from './userContext';

export function profileFromDbUser(user: DbUser): StudentProfile {
  return {
    name: user.name,
    language: user.language as StudentProfile['language'],
    level: user.level as StudentProfile['level'],
    targetBand: user.targetBand,
    examIn: user.examIn,
    studyMinutes: user.studyMinutes,
    weakAreas: user.weakAreas as StudentProfile['weakAreas'],
    createdAt: '',
    lastActive: '',
    streak: user.streak,
    lessonsCompleted: user.lessonsCompleted,
    writingSubmissions: user.writingSubmissions,
    mockExamsCompleted: user.mockExamsCompleted,
    writingBands: user.writingBands.map(b => ({
      date: typeof b.date === 'string' ? b.date : new Date(b.date).toISOString(),
      band: b.band,
    })),
    readingScores: [],
  };
}
