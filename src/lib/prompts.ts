import { StudentProfile } from './types';

export function buildSystemPrompt(profile: StudentProfile): string {
  const lang = profile.language === 'uz' ? 'Uzbek' : 'Russian';
  return `You are Mentora, a strict but supportive IELTS tutor AI.
Student: ${profile.name}, Level: ${profile.level}, Target Band: ${profile.targetBand}.
Language: Always respond in ${lang} unless the student writes in a different language.
Rules: Never inflate scores. Use Central Asia/Uzbekistan-relevant examples. Be concise and direct.

FORMATTING — VERY IMPORTANT:
- Plain text ONLY. No markdown whatsoever.
- No asterisks (*bold*, **bold**), no underscores, no backticks.
- No tables (no | symbols).
- No --- dividers.
- No emojis.
- No headers (#, ##).
- Use simple numbered lists (1. 2. 3.) or letters (A) B) C)) when needed.
- Short paragraphs separated by a blank line. Maximum 150 words per response.`;
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

export interface Task1Data {
  id: string;
  type: 'Bar Chart' | 'Line Graph' | 'Pie Chart' | 'Table';
  title: string;
  description: string;
  data: string;
}

export const TASK1_TASKS: Task1Data[] = [
  {
    id: 'energy-2019',
    type: 'Bar Chart',
    title: 'Electricity production by source in three countries (2019)',
    description: 'The bar chart below shows the percentage of electricity produced from different energy sources in Australia, Germany, and Kazakhstan in 2019.',
    data: `Source     | Australia | Germany | Kazakhstan
-----------+-----------+---------+-----------
Coal       |    56%    |   29%   |    75%
Gas        |    22%    |   15%   |    18%
Nuclear    |     0%    |   12%   |     0%
Wind       |     7%    |   24%   |     1%
Solar      |     8%    |    8%   |     1%
Other      |     7%    |   12%   |     5%`,
  },
  {
    id: 'internet-users',
    type: 'Line Graph',
    title: 'Internet users as a % of population by region (2000–2020)',
    description: 'The line graph below shows the percentage of the population using the internet in four world regions from 2000 to 2020.',
    data: `Year | N. America | Europe | Asia | Africa
-----+------------+--------+------+-------
2000 |    43%     |  24%   |  4%  |   1%
2005 |    67%     |  45%   |  9%  |   2%
2010 |    78%     |  65%   | 22%  |   8%
2015 |    88%     |  78%   | 38%  |  20%
2020 |    91%     |  87%   | 55%  |  40%`,
  },
  {
    id: 'transport-co2',
    type: 'Bar Chart',
    title: 'Average CO₂ emissions per km by transport type in the EU (2020)',
    description: 'The bar chart below shows the average CO₂ emissions (grams per kilometre per passenger) for different modes of transport in the EU in 2020.',
    data: `Transport Mode      | CO₂ (g/km/passenger)
--------------------+---------------------
Domestic Flight     |         255
Petrol Car (solo)   |         192
Diesel Car (solo)   |         171
Motorbike           |         103
Bus                 |          89
Electric Car        |          53
Train               |          41
Bicycle / Walking   |           0`,
  },
  {
    id: 'uzbekistan-enrollment',
    type: 'Table',
    title: 'Students enrolled in higher education in Uzbekistan by subject (2015 and 2022)',
    description: 'The table below shows the number of students enrolled in higher education in Uzbekistan by subject area in 2015 and 2022.',
    data: `Subject Area          |  2015   |  2022   | Change
----------------------+---------+---------+--------
Engineering & Tech.   |  45,200 |  89,400 | +97.8%
Economics & Business  |  38,600 |  72,100 | +86.8%
Medicine & Health     |  22,300 |  48,700 |+118.4%
Education             |  31,500 |  41,200 | +30.8%
Natural Sciences      |  12,800 |  19,600 | +53.1%
Arts & Humanities     |   9,400 |  10,200 |  +8.5%
TOTAL                 | 159,800 | 281,200 | +76.0%`,
  },
  {
    id: 'temperatures',
    type: 'Line Graph',
    title: 'Average monthly temperatures in Tashkent and London (°C)',
    description: 'The line graph below shows the average monthly temperatures in Tashkent (Uzbekistan) and London (UK) throughout the year.',
    data: `Month | Tashkent | London
------+----------+-------
Jan   |    2°C   |   5°C
Mar   |   11°C   |   7°C
May   |   23°C   |  13°C
Jul   |   32°C   |  19°C
Sep   |   24°C   |  15°C
Nov   |    9°C   |   8°C`,
  },
  {
    id: 'leisure-time',
    type: 'Pie Chart',
    title: 'How working adults spend leisure time per week (hours): UK, USA, Kazakhstan',
    description: 'The pie charts below show how working adults in the UK, USA, and Kazakhstan spend their average leisure time per week.',
    data: `Activity         |  UK   |  USA  | Kazakhstan
-----------------+-------+-------+-----------
Watching TV      | 15.2h | 18.4h |    12.1h
Social Media     |  6.3h |  8.1h |     9.4h
Reading          |  4.1h |  2.8h |     3.2h
Exercise / Sport |  3.8h |  4.2h |     2.9h
Socialising      |  5.2h |  4.6h |     8.1h
Gaming           |  2.4h |  3.9h |     4.3h
Other hobbies    |  3.0h |  2.0h |     2.0h
TOTAL            | 40.0h | 44.0h |    42.0h`,
  },
];

export function buildTask1CheckPrompt(task: Task1Data, response: string, profile: StudentProfile): string {
  return `Evaluate this IELTS Writing Task 1 response strictly by official IELTS band descriptors.
NEVER inflate scores. Student target: Band ${profile.targetBand}, Level: ${profile.level}.

TASK TYPE: ${task.type}
TASK: "${task.description}"
DATA PROVIDED TO STUDENT:
${task.data}

STUDENT RESPONSE:
"${response}"

Task Achievement for Task 1 means: key features selected and highlighted, overview/summary present, relevant comparisons made, no personal opinion given.

Return ONLY valid JSON:
{
  "taskAchievement": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "feedback on key features coverage, overview, and comparisons",
    "quote": "exact quote from response illustrating the main issue"
  },
  "coherenceCohesion": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "feedback on logical organisation and cohesive devices",
    "quote": "exact quote from response"
  },
  "lexicalResource": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "feedback on data-description vocabulary (e.g. rose sharply, peaked at, accounted for)",
    "quote": "exact quote from response"
  },
  "grammaticalRange": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "feedback on grammar accuracy and range of structures",
    "quote": "exact quote from response"
  },
  "overallBand": <average of 4 criteria rounded to nearest 0.5>,
  "topTip": "the single most impactful improvement for IELTS Task 1 (1-2 sentences)"
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
    .map(m => `${m.role === 'user' ? 'Student' : 'Mentora'}: ${m.content}`)
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
