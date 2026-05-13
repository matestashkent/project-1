export interface VocabWord {
  id: string;
  word: string;
  type: 'noun' | 'verb' | 'adj' | 'adv' | 'phrase' | 'conj';
  definition: string; // Russian
  example: string;    // English IELTS-style sentence
  topic: string;
}

export const VOCAB_WORDS: VocabWord[] = [
  // Environment
  { id: 'e1', word: 'biodiversity', type: 'noun', definition: 'биоразнообразие — разнообразие живых организмов', example: 'Deforestation poses a serious threat to biodiversity in tropical regions.', topic: 'Environment' },
  { id: 'e2', word: 'emissions', type: 'noun', definition: 'выбросы (газов, углекислого газа)', example: 'Governments must reduce carbon emissions to combat climate change.', topic: 'Environment' },
  { id: 'e3', word: 'sustainable', type: 'adj', definition: 'устойчивый, экологически сбалансированный', example: 'Sustainable farming practices can protect soil quality for future generations.', topic: 'Environment' },
  { id: 'e4', word: 'renewable', type: 'adj', definition: 'возобновляемый (об источнике энергии)', example: 'Investing in renewable energy is essential for reducing fossil fuel dependency.', topic: 'Environment' },
  { id: 'e5', word: 'deforestation', type: 'noun', definition: 'вырубка лесов', example: 'Deforestation in the Amazon is accelerating at an alarming rate.', topic: 'Environment' },
  { id: 'e6', word: 'conservation', type: 'noun', definition: 'охрана природы, сохранение', example: 'Wildlife conservation efforts have helped increase tiger populations.', topic: 'Environment' },
  { id: 'e7', word: 'contaminate', type: 'verb', definition: 'загрязнять, заражать', example: 'Industrial waste can contaminate groundwater supplies.', topic: 'Environment' },
  { id: 'e8', word: 'habitat', type: 'noun', definition: 'среда обитания', example: 'Urban expansion destroys the natural habitat of many species.', topic: 'Environment' },
  { id: 'e9', word: 'ecosystem', type: 'noun', definition: 'экосистема', example: 'Coral reefs are among the most complex ecosystems on Earth.', topic: 'Environment' },
  { id: 'e10', word: 'carbon footprint', type: 'phrase', definition: 'углеродный след — количество CO₂, выделяемое человеком', example: 'Reducing your carbon footprint can be achieved through small lifestyle changes.', topic: 'Environment' },

  // Technology
  { id: 't1', word: 'automation', type: 'noun', definition: 'автоматизация — замена ручного труда машинами', example: 'Automation in manufacturing has significantly increased production efficiency.', topic: 'Technology' },
  { id: 't2', word: 'innovation', type: 'noun', definition: 'инновация, нововведение', example: 'Technological innovation has transformed the way we communicate.', topic: 'Technology' },
  { id: 't3', word: 'algorithm', type: 'noun', definition: 'алгоритм — набор правил для решения задачи', example: 'Search engines use complex algorithms to rank web pages.', topic: 'Technology' },
  { id: 't4', word: 'artificial intelligence', type: 'phrase', definition: 'искусственный интеллект', example: 'Artificial intelligence is increasingly being used in medical diagnosis.', topic: 'Technology' },
  { id: 't5', word: 'surveillance', type: 'noun', definition: 'наблюдение, слежка', example: 'Critics argue that widespread surveillance threatens individual privacy.', topic: 'Technology' },
  { id: 't6', word: 'obsolete', type: 'adj', definition: 'устаревший, вышедший из употребления', example: 'Many traditional skills have become obsolete due to technological advances.', topic: 'Technology' },
  { id: 't7', word: 'digital divide', type: 'phrase', definition: 'цифровое неравенство — разрыв в доступе к технологиям', example: 'The digital divide between urban and rural areas remains a significant challenge.', topic: 'Technology' },
  { id: 't8', word: 'cybersecurity', type: 'noun', definition: 'кибербезопасность', example: 'Companies are investing heavily in cybersecurity to protect user data.', topic: 'Technology' },
  { id: 't9', word: 'infrastructure', type: 'noun', definition: 'инфраструктура — базовые системы (дороги, связь и т.д.)', example: 'A reliable digital infrastructure is essential for economic growth.', topic: 'Technology' },
  { id: 't10', word: 'disruptive', type: 'adj', definition: 'разрушительный (о технологии) — меняющий устоявшийся порядок', example: 'Ride-sharing apps have had a disruptive effect on the taxi industry.', topic: 'Technology' },

  // Society
  { id: 's1', word: 'inequality', type: 'noun', definition: 'неравенство — несправедливое распределение ресурсов', example: 'Income inequality has widened in many developed countries over the past decade.', topic: 'Society' },
  { id: 's2', word: 'urbanisation', type: 'noun', definition: 'урбанизация — рост городского населения', example: 'Rapid urbanisation has put pressure on housing and public services.', topic: 'Society' },
  { id: 's3', word: 'globalisation', type: 'noun', definition: 'глобализация — интеграция мировой экономики и культуры', example: 'Globalisation has made it easier for businesses to operate across borders.', topic: 'Society' },
  { id: 's4', word: 'discrimination', type: 'noun', definition: 'дискриминация — несправедливое отношение к группе людей', example: 'Legislation has been introduced to combat workplace discrimination.', topic: 'Society' },
  { id: 's5', word: 'migration', type: 'noun', definition: 'миграция — переселение людей', example: 'Economic migration has contributed to labour shortages in rural areas.', topic: 'Society' },
  { id: 's6', word: 'elderly', type: 'adj', definition: 'пожилые люди', example: 'An ageing population places greater demands on elderly care services.', topic: 'Society' },
  { id: 's7', word: 'cohesion', type: 'noun', definition: 'сплочённость, единство (общества)', example: 'Social cohesion is essential for maintaining a stable and peaceful community.', topic: 'Society' },
  { id: 's8', word: 'stereotype', type: 'noun', definition: 'стереотип — упрощённое представление о группе людей', example: 'Media representations often reinforce harmful stereotypes about certain groups.', topic: 'Society' },
  { id: 's9', word: 'peer pressure', type: 'phrase', definition: 'давление сверстников', example: 'Young people may engage in risky behaviour due to peer pressure.', topic: 'Society' },
  { id: 's10', word: 'welfare', type: 'noun', definition: 'благосостояние; система социальной помощи', example: 'Government welfare programmes aim to support those in financial difficulty.', topic: 'Society' },

  // Education
  { id: 'ed1', word: 'curriculum', type: 'noun', definition: 'учебная программа', example: 'The curriculum should be updated to include digital literacy skills.', topic: 'Education' },
  { id: 'ed2', word: 'vocational', type: 'adj', definition: 'профессиональный, прикладной (об образовании)', example: 'Vocational training provides practical skills for specific careers.', topic: 'Education' },
  { id: 'ed3', word: 'scholarship', type: 'noun', definition: 'стипендия; учёность', example: 'She was awarded a scholarship to study at a prestigious university abroad.', topic: 'Education' },
  { id: 'ed4', word: 'literacy', type: 'noun', definition: 'грамотность — умение читать и писать', example: 'Improving adult literacy rates is a key development goal in many countries.', topic: 'Education' },
  { id: 'ed5', word: 'compulsory', type: 'adj', definition: 'обязательный (по закону)', example: 'Education is compulsory for children between the ages of 6 and 16.', topic: 'Education' },
  { id: 'ed6', word: 'tuition', type: 'noun', definition: 'плата за обучение; преподавание', example: 'Rising university tuition fees are discouraging students from lower-income families.', topic: 'Education' },
  { id: 'ed7', word: 'extracurricular', type: 'adj', definition: 'внеучебный, внеклассный', example: 'Extracurricular activities help students develop social and leadership skills.', topic: 'Education' },
  { id: 'ed8', word: 'academic', type: 'adj', definition: 'академический, учебный; теоретический', example: 'Strong academic performance does not always guarantee career success.', topic: 'Education' },
  { id: 'ed9', word: 'critical thinking', type: 'phrase', definition: 'критическое мышление', example: 'Universities aim to develop critical thinking skills alongside subject knowledge.', topic: 'Education' },
  { id: 'ed10', word: 'graduate', type: 'noun', definition: 'выпускник; человек с высшим образованием', example: 'Many graduates struggle to find employment in their chosen field.', topic: 'Education' },

  // Economy
  { id: 'ec1', word: 'inflation', type: 'noun', definition: 'инфляция — рост цен', example: 'High inflation reduces the purchasing power of ordinary consumers.', topic: 'Economy' },
  { id: 'ec2', word: 'recession', type: 'noun', definition: 'рецессия — спад экономики', example: 'The global recession led to widespread unemployment in many sectors.', topic: 'Economy' },
  { id: 'ec3', word: 'investment', type: 'noun', definition: 'инвестиция — вложение капитала', example: 'Foreign investment has played a crucial role in the country\'s development.', topic: 'Economy' },
  { id: 'ec4', word: 'subsidise', type: 'verb', definition: 'субсидировать — финансово поддерживать', example: 'The government subsidises public transport to keep fares affordable.', topic: 'Economy' },
  { id: 'ec5', word: 'entrepreneur', type: 'noun', definition: 'предприниматель', example: 'Young entrepreneurs are driving innovation in the technology sector.', topic: 'Economy' },
  { id: 'ec6', word: 'revenue', type: 'noun', definition: 'доход, выручка (государства или компании)', example: 'Tax revenue is used to fund public services such as healthcare and education.', topic: 'Economy' },
  { id: 'ec7', word: 'expenditure', type: 'noun', definition: 'расходы, затраты', example: 'Government expenditure on defence has increased significantly.', topic: 'Economy' },
  { id: 'ec8', word: 'deficit', type: 'noun', definition: 'дефицит — превышение расходов над доходами', example: 'A large budget deficit forces governments to borrow money.', topic: 'Economy' },
  { id: 'ec9', word: 'commodity', type: 'noun', definition: 'товар, сырьё (нефть, газ, металлы)', example: 'Oil remains one of the world\'s most valuable commodities.', topic: 'Economy' },
  { id: 'ec10', word: 'gross domestic product', type: 'phrase', definition: 'ВВП — валовой внутренний продукт', example: 'The country\'s gross domestic product grew by 4% last year.', topic: 'Economy' },

  // Health
  { id: 'h1', word: 'epidemic', type: 'noun', definition: 'эпидемия — массовое распространение болезни', example: 'The obesity epidemic is linked to poor diet and lack of exercise.', topic: 'Health' },
  { id: 'h2', word: 'vaccination', type: 'noun', definition: 'вакцинация, прививка', example: 'Childhood vaccination programmes have eradicated many deadly diseases.', topic: 'Health' },
  { id: 'h3', word: 'chronic', type: 'adj', definition: 'хронический — длительный, постоянный', example: 'Chronic stress can have serious long-term effects on physical health.', topic: 'Health' },
  { id: 'h4', word: 'mortality', type: 'noun', definition: 'смертность', example: 'Infant mortality rates have fallen dramatically in developing nations.', topic: 'Health' },
  { id: 'h5', word: 'sedentary', type: 'adj', definition: 'малоподвижный, сидячий', example: 'A sedentary lifestyle is a major risk factor for cardiovascular disease.', topic: 'Health' },
  { id: 'h6', word: 'obesity', type: 'noun', definition: 'ожирение', example: 'Obesity rates among children have tripled in the past thirty years.', topic: 'Health' },
  { id: 'h7', word: 'nutrition', type: 'noun', definition: 'питание, нутриция', example: 'Proper nutrition during childhood is essential for healthy development.', topic: 'Health' },
  { id: 'h8', word: 'mental health', type: 'phrase', definition: 'психическое здоровье', example: 'Governments must invest more in mental health services.', topic: 'Health' },
  { id: 'h9', word: 'preventable', type: 'adj', definition: 'предотвратимый', example: 'Many deaths from lifestyle diseases are entirely preventable.', topic: 'Health' },
  { id: 'h10', word: 'well-being', type: 'noun', definition: 'благополучие — физическое и психологическое состояние', example: 'Employee well-being should be a priority for all organisations.', topic: 'Health' },

  // General Academic
  { id: 'a1', word: 'significant', type: 'adj', definition: 'значительный, существенный', example: 'There has been a significant increase in the number of online learners.', topic: 'Academic' },
  { id: 'a2', word: 'consequently', type: 'adv', definition: 'следовательно, в результате', example: 'Resources are limited; consequently, difficult choices must be made.', topic: 'Academic' },
  { id: 'a3', word: 'nevertheless', type: 'adv', definition: 'тем не менее, несмотря на это', example: 'The task was challenging; nevertheless, the team completed it on time.', topic: 'Academic' },
  { id: 'a4', word: 'whereas', type: 'conj', definition: 'тогда как, в то время как (для противопоставления)', example: 'Urban areas have excellent transport links, whereas rural regions often do not.', topic: 'Academic' },
  { id: 'a5', word: 'advocate', type: 'verb', definition: 'выступать за, поддерживать', example: 'Many experts advocate a shift towards plant-based diets.', topic: 'Academic' },
  { id: 'a6', word: 'controversy', type: 'noun', definition: 'споры, разногласие', example: 'The proposal has attracted considerable controversy among local residents.', topic: 'Academic' },
  { id: 'a7', word: 'prevalent', type: 'adj', definition: 'широко распространённый', example: 'Smartphone addiction is increasingly prevalent among teenagers.', topic: 'Academic' },
  { id: 'a8', word: 'mitigate', type: 'verb', definition: 'смягчать, уменьшать (негативный эффект)', example: 'Planting trees can help mitigate the effects of air pollution.', topic: 'Academic' },
  { id: 'a9', word: 'detrimental', type: 'adj', definition: 'вредный, пагубный', example: 'Excessive screen time can be detrimental to children\'s development.', topic: 'Academic' },
  { id: 'a10', word: 'exacerbate', type: 'verb', definition: 'усугублять, обострять', example: 'Poor housing conditions can exacerbate respiratory illnesses.', topic: 'Academic' },
  { id: 'a11', word: 'acknowledge', type: 'verb', definition: 'признавать, отмечать', example: 'The report acknowledges that progress has been slower than expected.', topic: 'Academic' },
  { id: 'a12', word: 'compelling', type: 'adj', definition: 'убедительный; захватывающий', example: 'There is compelling evidence that diet affects mental health.', topic: 'Academic' },
  { id: 'a13', word: 'alleviate', type: 'verb', definition: 'облегчать, смягчать (боль, проблему)', example: 'Aid organisations work to alleviate poverty in conflict zones.', topic: 'Academic' },
  { id: 'a14', word: 'implement', type: 'verb', definition: 'реализовывать, внедрять', example: 'The government plans to implement new environmental regulations next year.', topic: 'Academic' },
  { id: 'a15', word: 'undermine', type: 'verb', definition: 'подрывать, ослаблять', example: 'Corruption undermines public trust in government institutions.', topic: 'Academic' },
  { id: 'a16', word: 'demonstrate', type: 'verb', definition: 'демонстрировать, показывать', example: 'Research demonstrates a clear link between exercise and improved mood.', topic: 'Academic' },
  { id: 'a17', word: 'perspective', type: 'noun', definition: 'точка зрения, перспектива', example: 'It is important to consider the issue from multiple perspectives.', topic: 'Academic' },
  { id: 'a18', word: 'predominantly', type: 'adv', definition: 'преимущественно, главным образом', example: 'The workforce is predominantly made up of young people under 30.', topic: 'Academic' },
  { id: 'a19', word: 'substantially', type: 'adv', definition: 'существенно, значительно', example: 'Living standards have improved substantially over the past two decades.', topic: 'Academic' },
  { id: 'a20', word: 'controversial', type: 'adj', definition: 'спорный, вызывающий разногласия', example: 'The policy remains controversial despite widespread public debate.', topic: 'Academic' },
];

// localStorage helpers
const LEARNED_KEY = 'mentora_vocab_learned';

export function getLearnedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LEARNED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function markLearned(id: string): void {
  const learned = getLearnedIds();
  learned.add(id);
  localStorage.setItem(LEARNED_KEY, JSON.stringify([...learned]));
}

export function resetVocab(): void {
  localStorage.removeItem(LEARNED_KEY);
}

// Build a session: up to 12 unlearned + 3 review words
export function buildSession(): VocabWord[] {
  const learned = getLearnedIds();
  const unlearned = VOCAB_WORDS.filter(w => !learned.has(w.id));
  const learnedWords = VOCAB_WORDS.filter(w => learned.has(w.id));

  const shuffled = (arr: VocabWord[]) => [...arr].sort(() => Math.random() - 0.5);

  const newWords = shuffled(unlearned).slice(0, 12);
  const reviewWords = shuffled(learnedWords).slice(0, 3);

  return shuffled([...newWords, ...reviewWords]);
}

export const TOPICS = ['Все', 'Environment', 'Technology', 'Society', 'Education', 'Economy', 'Health', 'Academic'];
