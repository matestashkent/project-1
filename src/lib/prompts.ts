import { StudentProfile } from './types';

export function buildSystemPrompt(profile: StudentProfile): string {
  const lang = profile.language === 'uz' ? 'Uzbek' : 'Russian';
  const weakList = profile.weakAreas?.join(', ') || 'general';
  return `You are Mentora, a professional IELTS examiner and tutor.

STUDENT PROFILE:
- Name: ${profile.name}
- English level: ${profile.level}
- Target IELTS band: ${profile.targetBand}
- Weak areas: ${weakList}
- Study time per day: ${profile.studyMinutes} minutes

LANGUAGE RULES:
- Give ALL explanations, feedback, tips, and teaching in ${lang}.
- All IELTS content (essay topics, reading passages, example sentences) stays in English.
- Adapt complexity of explanations to ${profile.level} level.

PERSONALIZATION:
- Focus feedback on the student's weak areas: ${weakList}.
- Reference their target Band ${profile.targetBand} when setting expectations.
- For ${profile.level} students: ${
    profile.level === 'A1-A2'
      ? 'use simple vocabulary in explanations, short sentences, lots of examples'
      : profile.level === 'B1-B2'
      ? 'balance explanation depth with clarity, show before/after examples'
      : 'be concise and technical, reference band descriptors directly'
  }.

CONTENT RULES:
- IELTS tasks must be authentic: international topics, academic register, no geographic bias.
- Never inflate scores. Apply official IELTS band descriptors strictly.
- Be concise and direct.

FORMATTING — VERY IMPORTANT:
- Plain text ONLY. No markdown whatsoever.
- No asterisks, no underscores, no backticks, no tables, no --- dividers.
- No emojis. No headers (#, ##).
- Use simple numbered lists (1. 2. 3.) when needed.
- Short paragraphs. Maximum 150 words per response.`;
}

export function buildLessonPrompt(profile: StudentProfile): string {
  const lang = profile.language === 'uz' ? 'Uzbek' : 'Russian';
  const weakList = profile.weakAreas?.join(', ') || 'writing';
  return `Generate a personalized IELTS lesson for this student.

STUDENT: Level ${profile.level}, Target Band ${profile.targetBand}, Weak areas: ${weakList}.

Choose a specific IELTS skill that targets their weak areas. Examples of good lesson topics:
- Writing: topic sentences, cohesive devices, paraphrasing the question, complex sentences, opinion structure
- Reading: skimming, scanning, True/False/Not Given logic, matching headings
- Listening: number/date recognition, predicting answers, understanding paraphrase
- Speaking: fluency techniques, extending answers, discourse markers, pronunciation of word stress
- Grammar: conditionals, passive voice, relative clauses, articles, countable/uncountable nouns

The English examples (goodExample, badExample) must be authentic IELTS Academic quality — use globally relevant topics like climate, health, technology, education, or urban development.

Return ONLY valid JSON, no extra text:
{
  "topic": "specific IELTS skill title (e.g. 'Using cohesive devices in Writing Task 2')",
  "whyImportant": "in ${lang}: direct link to their Band ${profile.targetBand} goal and weak area ${weakList} (1-2 sentences)",
  "explanation": "in ${lang}: clear teaching explanation, max 200 words, adapted to ${profile.level} level",
  "goodExample": "in English: Band ${profile.targetBand}+ quality IELTS example sentence or short paragraph",
  "badExample": "in English: a typical ${profile.level}-level mistake that costs marks, showing the same idea done poorly",
  "task": "in ${lang}: one specific 5-10 minute practice task the student can do right now"
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
    id: 'global-enrollment',
    type: 'Table',
    title: 'Proportion of adults with tertiary education in five countries (2000 and 2020)',
    description: 'The table below shows the percentage of adults aged 25–64 with tertiary education qualifications in five countries in 2000 and 2020.',
    data: `Country        | 2000 | 2020 | Change
---------------+------+------+-------
South Korea    |  23% |  50% | +27pp
Canada         |  38% |  57% | +19pp
United Kingdom |  26% |  48% | +22pp
Brazil         |   7% |  21% | +14pp
Italy          |   9% |  20% | +11pp`,
  },
  {
    id: 'rainfall',
    type: 'Line Graph',
    title: 'Average monthly rainfall in Sydney and Vancouver (mm)',
    description: 'The line graph below shows the average monthly rainfall in millimetres in Sydney (Australia) and Vancouver (Canada) throughout the year.',
    data: `Month | Sydney | Vancouver
------+--------+----------
Jan   |  103mm |    154mm
Mar   |  131mm |    101mm
May   |  123mm |     65mm
Jul   |   97mm |     32mm
Sep   |   68mm |     43mm
Nov   |   83mm |    130mm`,
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
  const lang = profile.language === 'uz' ? 'Uzbek' : 'Russian';
  return `Generate an authentic IELTS Academic Reading True/False/Not Given exercise.

STUDENT LEVEL: ${profile.level} — adjust passage complexity accordingly:
- A1-A2: clearer vocabulary, shorter sentences, concrete topic
- B1-B2: standard IELTS Academic difficulty, some technical vocabulary
- C1-C2: complex arguments, dense vocabulary, abstract ideas

PASSAGE REQUIREMENTS:
- 280-320 words, formal academic register (like a journal article or encyclopaedia)
- Topic must be typical of real IELTS Academic tests. Choose from: history of science or technology, environmental research, urban studies, anthropology, psychology research, economics, medicine, geography, or archaeology.
- NO geographic bias. Use international, globally relevant content.
- Factual, informative, no personal opinions in the passage itself.

QUESTION REQUIREMENTS:
- 5 statements testing specific details and inferences from the passage
- Must include at least one TRUE, one FALSE, and one NOT GIVEN
- NOT GIVEN means the passage neither confirms nor denies it — not that it is wrong
- Explanations must be in ${lang} and reference the exact part of the passage

Return ONLY valid JSON:
{
  "title": "passage title",
  "text": "full academic passage text, 280-320 words",
  "questions": [
    { "id": 1, "statement": "...", "answer": "TRUE", "explanation": "in ${lang}: reference to passage" },
    { "id": 2, "statement": "...", "answer": "FALSE", "explanation": "in ${lang}: reference to passage" },
    { "id": 3, "statement": "...", "answer": "NOT GIVEN", "explanation": "in ${lang}: why this cannot be determined" },
    { "id": 4, "statement": "...", "answer": "TRUE", "explanation": "in ${lang}: reference to passage" },
    { "id": 5, "statement": "...", "answer": "FALSE", "explanation": "in ${lang}: reference to passage" }
  ]
}`;
}

export interface CueCard {
  topic: string;
  points: string[];
}

export const SPEAKING_CUES: CueCard[] = [
  {
    topic: 'Describe a skill you would like to learn',
    points: ['What the skill is', 'Why you want to learn it', 'How you would learn it', 'How it would benefit your life'],
  },
  {
    topic: 'Describe an interesting place you have visited',
    points: ['Where it is', 'When you went there', 'What you did there', 'Why it was memorable'],
  },
  {
    topic: 'Describe a person who has influenced you',
    points: ['Who this person is', 'How you know them', 'What they did or said', 'How they changed you'],
  },
  {
    topic: 'Describe a book or film that made a strong impression on you',
    points: ['What it is about', 'When you read or watched it', 'What you liked about it', 'Why it was meaningful to you'],
  },
  {
    topic: 'Describe a time when you helped someone',
    points: ['Who you helped', 'What the situation was', 'How you helped them', 'How you felt afterwards'],
  },
  {
    topic: 'Describe a goal you want to achieve in the future',
    points: ['What the goal is', 'Why you want to achieve it', 'What steps you are taking', 'How achieving it would change your life'],
  },
  {
    topic: 'Describe a piece of technology you find very useful',
    points: ['What it is', 'How often you use it', 'What you use it for', 'Why you think it is important'],
  },
  {
    topic: 'Describe a traditional celebration or festival in your country',
    points: ['What the celebration is', 'When it takes place', 'How people celebrate it', 'Why it is important to your culture'],
  },
];

export function buildSpeakingEvalPrompt(cue: CueCard, transcript: string, profile: StudentProfile): string {
  return `Evaluate this IELTS Speaking Part 2 response by official IELTS band descriptors.
NEVER inflate scores. Student target: Band ${profile.targetBand}, Level: ${profile.level}.

CUE CARD TOPIC: "${cue.topic}"
BULLET POINTS: ${cue.points.join(' / ')}

STUDENT'S SPOKEN RESPONSE (transcribed):
"${transcript}"

Evaluate on all 4 IELTS Speaking criteria. For "pronunciation", estimate based on word choice complexity and sentence fluency in the transcript.

Return ONLY valid JSON:
{
  "fluencyCoherence": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "feedback on speaking pace, hesitations, logical flow, topic coverage",
    "quote": "exact phrase from transcript illustrating main issue"
  },
  "lexicalResource": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "feedback on vocabulary range, collocations, topic-specific words",
    "quote": "exact phrase from transcript"
  },
  "grammaticalRange": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "feedback on grammar accuracy and variety of structures",
    "quote": "exact phrase from transcript"
  },
  "pronunciation": {
    "band": <5.0 to 9.0 in 0.5 steps>,
    "comment": "estimated feedback based on vocabulary complexity and discourse structure",
    "quote": "exact phrase from transcript"
  },
  "overallBand": <average of 4 criteria rounded to nearest 0.5>,
  "topTip": "the single most impactful improvement for IELTS Speaking (1-2 sentences)"
}`;
}

export function buildListeningPrompt(profile: StudentProfile): string {
  const lang = profile.language === 'uz' ? 'Uzbek' : 'Russian';
  return `Generate an authentic IELTS Listening exercise for level ${profile.level}.

SCENARIO: Choose one of these real IELTS Listening scenario types:
- Section 1: Conversation between two people in an everyday social context (e.g. booking a tour, registering at a library, enquiring about a course)
- Section 2: A monologue in an everyday social context (e.g. a radio announcement, museum audio guide, community event information)
- Section 3: A conversation in an academic context (e.g. two students discussing an assignment, a tutor giving advice)
- Section 4: A university lecture extract on an academic topic

PASSAGE REQUIREMENTS:
- 160-200 words of natural spoken English
- Authentic British or Australian English register
- Contains specific details: names, numbers, dates, locations, times — these make good question targets
- NO geographic bias. International content only.
- Difficulty adapted to ${profile.level}

PASSAGE FORMAT (CRITICAL):
- Section 1 and Section 3 (dialogues): Format EVERY speaking turn as one line starting with the speaker label. Example:
  Speaker A: Good morning, I'd like to enquire about the evening classes.
  Speaker B: Of course! We have several options available starting next month.
  Speaker A: What days are the sessions held?
  No narration, no stage directions — only speaker lines.
- Section 2 and Section 4 (monologues): Plain flowing text, no speaker labels.

QUESTION REQUIREMENTS:
- 5 multiple choice questions testing specific details
- Wrong options must be plausible (mentioned or implied in the passage) — not obviously wrong
- Explanations in ${lang}, referencing exact words from the passage

Return ONLY valid JSON:
{
  "title": "short title describing the scenario",
  "passage": "spoken text 160-200 words — for dialogues use 'Speaker A: / Speaker B:' format per line; for monologues plain text",
  "questions": [
    { "id": 1, "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A) ...", "explanation": "in ${lang}" },
    { "id": 2, "question": "...", "options": ["A) ...","B) ...","C) ...","D) ..."], "answer": "B) ...", "explanation": "in ${lang}" },
    { "id": 3, "question": "...", "options": ["A) ...","B) ...","C) ...","D) ..."], "answer": "C) ...", "explanation": "in ${lang}" },
    { "id": 4, "question": "...", "options": ["A) ...","B) ...","C) ...","D) ..."], "answer": "A) ...", "explanation": "in ${lang}" },
    { "id": 5, "question": "...", "options": ["A) ...","B) ...","C) ...","D) ..."], "answer": "D) ...", "explanation": "in ${lang}" }
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
- If specific, re-explain using a COMPLETELY DIFFERENT analogy or example (never repeat the same explanation)
- Use simple, universally relatable examples — everyday situations, science, nature, travel, sport
- Adapt language complexity to their level: ${profile.level}
- For their weak areas (${profile.weakAreas?.join(', ') || 'general'}), be especially thorough
- Maximum 150 words
- End with one simple check question
- Level: ${profile.level}, target: Band ${profile.targetBand}`;
}
