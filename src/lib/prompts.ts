import { StudentProfile } from './types';

export function buildSystemPrompt(profile: StudentProfile): string {
  const lang = profile.language === 'uz' ? 'Uzbek' : 'Russian';
  return `You are Устоз (Ustad), a strict but supportive IELTS tutor AI.
Student: ${profile.name}, Level: ${profile.level}, Target Band: ${profile.targetBand}.
Language: Always respond in ${lang} unless the student writes in a different language.
Rules: Never inflate scores. Use Central Asia/Uzbekistan-relevant examples. Be concise and direct.`;
}

export function buildLessonPrompt(profile: StudentProfile): string {
  return `Generate a personalized IELTS Writing lesson for this student.
Weak areas: ${profile.weakAreas.join(', ')}. Level: ${profile.level}. Target: Band ${profile.targetBand}.

Return ONLY valid JSON, no extra text:
{
  "topic": "specific lesson title",
  "whyImportant": "why this directly improves their IELTS band (1-2 sentences)",
  "explanation": "clear explanation, max 200 words, adapted to level ${profile.level}",
  "goodExample": "example that would score Band ${profile.targetBand}+, in quotes",
  "badExample": "low-scoring example that shows common mistakes, in quotes",
  "task": "one specific practice task the student can do right now"
}`;
}

export function buildWritingCheckPrompt(prompt: string, essay: string, profile: StudentProfile): string {
  return `Evaluate this IELTS Writing Task 2 essay strictly by official IELTS band descriptors.
NEVER inflate scores. Student target: Band ${profile.targetBand}, Level: ${profile.level}.

TASK PROMPT: "${prompt}"

STUDENT ESSAY:
"${essay}"

Return ONLY valid JSON:
{
  "taskAchievement": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "specific actionable feedback",
    "quote": "exact quote from essay illustrating the main issue"
  },
  "coherenceCohesion": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "specific actionable feedback",
    "quote": "exact quote from essay"
  },
  "lexicalResource": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "specific actionable feedback",
    "quote": "exact quote from essay"
  },
  "grammaticalRange": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "specific actionable feedback",
    "quote": "exact quote from essay"
  },
  "overallBand": <average of 4 criteria rounded to nearest 0.5>,
  "topTip": "the single most impactful improvement for next time (1-2 sentences)"
}`;
}

export function buildReadingPrompt(profile: StudentProfile): string {
  return `Generate an IELTS Academic Reading exercise for level ${profile.level}.

Return ONLY valid JSON:
{
  "title": "passage title",
  "text": "academic reading passage, 250-300 words, formal style on a topic relevant to Central Asia or international education",
  "questions": [
    {
      "id": 1,
      "statement": "statement based on the passage for True/False/Not Given",
      "answer": "TRUE",
      "explanation": "brief explanation with reference to the text"
    },
    {
      "id": 2,
      "statement": "another statement",
      "answer": "FALSE",
      "explanation": "brief explanation"
    },
    {
      "id": 3,
      "statement": "another statement",
      "answer": "NOT GIVEN",
      "explanation": "brief explanation"
    },
    {
      "id": 4,
      "statement": "another statement",
      "answer": "TRUE",
      "explanation": "brief explanation"
    },
    {
      "id": 5,
      "statement": "another statement",
      "answer": "FALSE",
      "explanation": "brief explanation"
    }
  ]
}`;
}

export function buildChatPrompt(
  lessonContent: string,
  chatHistory: Array<{ role: string; content: string }>,
  studentMessage: string,
  profile: StudentProfile
): string {
  const history = chatHistory
    .map(m => `${m.role === 'user' ? 'Student' : 'Устоз'}: ${m.content}`)
    .join('\n');

  return `The student is studying this lesson:
---
${lessonContent}
---

${history ? `Conversation so far:\n${history}\n\n` : ''}Student's message: "${studentMessage}"

Instructions:
- If the message is vague ("not understanding", "confusing"), ask what specifically is unclear using A/B/C/D choice buttons
- If specific, re-explain using a COMPLETELY DIFFERENT analogy (never repeat the same explanation)
- Use examples from Uzbekistan/Central Asia context when relevant
- Maximum 150 words
- End with one simple check question
- Level: ${profile.level}, target: Band ${profile.targetBand}`;
}
