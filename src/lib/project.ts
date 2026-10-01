// The student's project workspace: a proposal built section by section until Day 30.
export type ProjectSection = { text: string; ready: boolean; updatedAt: string };
export type Project = {
  title?: string;
  sections?: Record<string, ProjectSection>;
  log?: { id: string; at: string; text: string }[];
  feedback?: { id: string; at: string; text: string }[];
};

export const STAGES = [
  { id: 1, name: 'Understand the problem', pace: 'Start here', blurb: 'Every good project starts with a real problem and real people.' },
  { id: 2, name: 'Shape the idea', pace: 'Early in the program', blurb: 'Turn the problem into a software idea you can explain simply.' },
  { id: 3, name: 'Plan the build', pace: 'Through the middle', blurb: 'Decide what the first version does, how it could grow, and what it needs.' },
  { id: 4, name: 'Prepare to present', pace: 'Before Day 30', blurb: 'Get your story ready for Day 30.' },
] as const;

export const SECTIONS = [
  { key: 'problem', stage: 1, title: 'The problem', min: 40, prompt: 'What real problem do you want to solve? Who experiences it, how often, and what does it cost them (time, money, stress)?', example: 'Small shop owners in my town write debts in a notebook. They forget who owes what and lose money every month.' },
  { key: 'users', stage: 1, title: 'The users', min: 30, prompt: 'Who exactly will use your software? Describe one or two typical people. Where are they and what devices do they have?', example: 'Shop owners aged 25 to 55 who use an Android phone and WhatsApp every day but rarely use laptops.' },
  { key: 'idea', stage: 2, title: 'The idea', min: 40, prompt: 'In plain words, what will you build? Explain it so a friend would understand it in one minute.', example: 'A simple phone-friendly app where a shop owner records a customer and what they owe, and sees a list of balances.' },
  { key: 'benefit', stage: 2, title: 'The benefit', min: 30, prompt: 'What changes for your users after they use it? What do they gain or stop losing?', example: 'They stop losing money to forgotten debts and can remind customers politely in seconds.' },
  { key: 'solution', stage: 2, title: 'The solution: how it will work', min: 60, prompt: 'Walk through how someone uses it, from opening it to finishing their task. What do they see and do, step by step?', example: '1. Owner signs in. 2. Taps “Add customer”. 3. Records a debt. 4. Sees balances. 5. Taps to send a reminder.' },
  { key: 'features', stage: 3, title: 'Core features: the first version', min: 40, prompt: 'List the smallest set of features that makes your project useful. What will you leave for later?', example: 'First version: add customers, record debts and payments, list balances. Later: reminders, reports.' },
  { key: 'growth', stage: 3, title: 'The future: how it could grow', min: 30, prompt: 'If it works, how could it grow? More users, more places, more features?', example: 'Start with shops in my town, then markets in the region, then add mobile money payments.' },
  { key: 'sustain', stage: 3, title: 'Sustainability: how you could benefit', min: 30, prompt: 'How could this support you or your team over time? Who would pay, and for what?', example: 'A small monthly subscription from shop owners, or a free version with paid reports.' },
  { key: 'budget', stage: 3, title: 'Budget plan (about GH₵500)', min: 30, prompt: 'What will you need to spend money on for this project? Be realistic. Not every project fits in GH₵500, so note what you would prioritise.', example: 'Domain name, hosting for the first months, internet data for testing, printing a few flyers.' },
  { key: 'present', stage: 4, title: 'Day 30 presentation outline', min: 60, prompt: 'Outline what you will say on Day 30: the problem, the users, what you built, how it works, what you learned, what remains, how it could scale and how you could benefit.', example: 'Intro (1 min) · Problem · Demo · What I learned · What is next · Questions.' },
] as const;

export type SectionKey = (typeof SECTIONS)[number]['key'];
export const SECTION_KEYS = SECTIONS.map((s) => s.key) as string[];

export function summarize(p: Project | null | undefined) {
  const secs = p?.sections ?? {};
  const ready = SECTIONS.filter((s) => secs[s.key]?.ready).length;
  const started = SECTIONS.filter((s) => (secs[s.key]?.text ?? '').trim().length > 0).length;
  const next = SECTIONS.find((s) => !secs[s.key]?.ready);
  return { ready, started, total: SECTIONS.length, nextTitle: next?.title ?? null, title: p?.title ?? '' };
}
