import { z } from 'zod';

export const OPTIONS = {
  ageBracket: [['under18', 'Under 18'], ['18-24', '18–24'], ['25-34', '25–34'], ['35-44', '35–44'], ['45+', '45 or older']],
  experience: [
    ['none', 'None — I have never programmed'],
    ['basic', 'Basic — I have used computers and the internet comfortably'],
    ['some', 'Some — I have tried coding tutorials or small exercises'],
    ['prior', 'Experienced — I have built things before'],
  ],
  seriousness: [
    ['all', 'I will attend every session unless something truly unavoidable happens'],
    ['most', 'I will do my best, but I may have to miss a few sessions'],
    ['unsure', 'I am not sure yet whether I can keep this up'],
  ],
  period: [['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening'], ['flexible', 'Flexible'], ['other', 'Other']],
  format: [['in_person', 'In person'], ['remote', 'Remote'], ['either', 'Either is acceptable']],
  contribPref: [
    ['prefer_not', 'I would prefer not to contribute.'],
    ['willing', 'I would be willing to contribute.'],
    ['comfortable', 'I would be comfortable contributing a reasonable amount.'],
    ['flexible', 'I am flexible.'],
    ['discuss', 'I would like to discuss it.'],
  ],
  contribRange: [
    ['0', 'GH₵0'], ['50-100', 'GH₵50–100'], ['101-200', 'GH₵101–200'], ['201-300', 'GH₵201–300'],
    ['301-500', 'GH₵301–500'], ['500+', 'Above GH₵500'], ['discuss', 'Prefer to discuss'],
  ],
  phone: [['android', 'Android'], ['ios', 'iPhone / iOS'], ['other', 'Other'], ['none', 'None']],
  computer: [
    ['win_laptop', 'Windows laptop'], ['mac_laptop', 'Mac laptop'], ['linux_laptop', 'Linux laptop'],
    ['win_desktop', 'Windows desktop'], ['linux_desktop', 'Linux desktop'], ['other', 'Other'],
    ['none', 'I do not currently have a computer'],
  ],
  sharedComputer: [['yes', 'Yes, I can regularly use one'], ['maybe', 'Possibly, I am not sure yet'], ['no', 'No']],
  internet: [
    ['reliable', 'Reliable (broadband / Wi-Fi / dependable data)'],
    ['mobile_data', 'Mobile data only'],
    ['unreliable', 'Unreliable or often interrupted'],
    ['none', 'No regular access'],
  ],
  electricity: [['reliable', 'Reliable'], ['intermittent', 'Intermittent outages'], ['unreliable', 'Frequently unavailable']],
  workspace: [['yes', 'Yes, a suitable quiet space'], ['sometimes', 'Sometimes'], ['no', 'No']],
  budget: [['yes', 'Yes, I am prepared to arrange this'], ['clarify', 'I need clarification'], ['no', 'No, not at this time']],
  certificate: [['yes', 'Yes'], ['no', 'No'], ['none', 'No preference']],
} as const;

export const STATUSES = ['submitted', 'under_review', 'selected', 'not_selected', 'confirmed', 'withdrawn'] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = {
  submitted: 'Submitted', under_review: 'Under review', selected: 'Selected',
  not_selected: 'Not selected', confirmed: 'Confirmed', withdrawn: 'Withdrawn',
};

const vals = <K extends keyof typeof OPTIONS>(k: K) => OPTIONS[k].map((o) => o[0]) as unknown as [string, ...string[]];
const en = <K extends keyof typeof OPTIONS>(k: K) => z.enum(vals(k), { message: 'Please choose an option' });

// strip control chars + angle brackets (output is also escaped by React; this is defence in depth)
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[<>]/g, '').trim();
const text = (min: number, max: number, label: string) =>
  z.string({ message: `${label} is required` }).transform(clean)
    .pipe(z.string().min(min, min <= 1 ? `${label} is required` : `${label}: please write at least ${min} characters`).max(max, `${label} is too long (max ${max})`));
const optText = (max: number) => z.string().optional().default('').transform(clean).pipe(z.string().max(max, `Too long (max ${max})`));

export const normalizePhone = (p: string) => p.replace(/[\s\-().]/g, '');
export const phoneOk = (p: string) => /^\+?\d{9,15}$/.test(normalizePhone(p));

export const aboutSchema = z.object({
  fullName: text(2, 100, 'Full name'),
  preferredName: optText(60),
  phone: z.string().transform((s) => s.trim()).pipe(z.string().refine(phoneOk, 'Enter a valid phone number, e.g. 0241234567 or +233241234567')),
  email: z.string().transform((s) => s.trim().toLowerCase()).pipe(z.string().email('Enter a valid email address').max(200)),
  location: text(2, 120, 'Town / city and region'),
  ageBracket: en('ageBracket'),
  experience: en('experience'),
});

export const commitmentSchema = z.object({
  why: text(30, 1500, 'This answer'),
  hopeToBuild: text(20, 1500, 'This answer'),
  canCommit: z.enum(['yes', 'no'], { message: 'Please answer this question' }).refine((v) => v === 'yes', 'FORGE30 requires a live 2-hour session every day for 30 consecutive days. If you cannot commit to that, this cohort is not the right fit.'),
  practise: z.enum(['yes', 'no'], { message: 'Please answer this question' }),
  seriousness: en('seriousness'),
  ackDiscipline: z.literal(true, { message: 'You must accept these conditions to apply' }),
});

// Conditional rules use `when` so they are evaluated even while other fields are invalid (all errors show at once).
const always = (p: { value: unknown }) => typeof p.value === 'object' && p.value !== null;
const rule = <T,>(test: (v: T) => boolean, path: string, message: string) => [test, { path: [path], message, when: always }] as [(v: T) => boolean, { path: string[]; message: string; when: typeof always }];

export const availabilitySchema = z.object({
  periods: z.array(z.enum(vals('period'))).min(1, 'Choose at least one period'),
  periodOther: optText(200),
  format: en('format'),
  contribPref: z.enum(vals('contribPref')).optional(),
  contribRange: z.enum(vals('contribRange')).optional(),
})
  .refine(...rule<any>((v) => !v.periods?.includes?.('other') || !!v.periodOther, 'periodOther', 'Tell us which other period'))
  .refine(...rule<any>((v) => !['in_person', 'either'].includes(v.format) || !!v.contribPref, 'contribPref', 'Please choose an option'))
  .refine(...rule<any>((v) => !['in_person', 'either'].includes(v.format) || !!v.contribRange, 'contribRange', 'Please choose an option'));

export const deviceSchema = z.object({
  phone: en('phone'),
  computer: en('computer'),
  sharedComputer: z.enum(vals('sharedComputer')).optional(),
  deviceNote: optText(300),
  internet: en('internet'),
  electricity: en('electricity'),
  workspace: en('workspace'),
}).refine(...rule<any>((v) => v.computer !== 'none' || !!v.sharedComputer, 'sharedComputer', 'Please choose an option'));

export const projectSchema = z.object({
  title: text(2, 120, 'Working name'),
  idea: text(30, 2000, 'This answer'),
  problem: text(20, 2000, 'This answer'),
  users: text(10, 1500, 'This answer'),
  benefits: text(10, 1500, 'This answer'),
  growth: text(10, 1500, 'This answer'),
  personalBenefit: text(10, 1500, 'This answer'),
  vision: text(10, 1500, 'This answer'),
  budget: en('budget'),
});

export const finishSchema = z.object({
  certificate: en('certificate'),
  privacy: z.literal(true, { message: 'You must agree to the privacy notice to apply' }),
});

export const applicationSchema = z.object({
  about: aboutSchema, commitment: commitmentSchema, availability: availabilitySchema,
  device: deviceSchema, project: projectSchema, finish: finishSchema,
});
export type ApplicationInput = z.input<typeof applicationSchema>;
export type Application = z.output<typeof applicationSchema>;

export const STEP_SCHEMAS = { about: aboutSchema, commitment: commitmentSchema, availability: availabilitySchema, device: deviceSchema, project: projectSchema, finish: finishSchema } as const;
export type StepKey = keyof typeof STEP_SCHEMAS;

export const label = (k: keyof typeof OPTIONS, v?: string) => OPTIONS[k].find((o) => o[0] === v)?.[1] ?? v ?? '';

export const contactSchema = z.object({
  whatsapp: optText(20).pipe(z.string().refine((v) => v === '' || phoneOk(v), 'Enter a valid WhatsApp number')),
  altPhone: optText(20).pipe(z.string().refine((v) => v === '' || phoneOk(v), 'Enter a valid phone number')),
  preferredMethod: z.enum(['whatsapp', 'call', 'sms', 'email'], { message: 'Please choose an option' }),
  bestTime: z.enum(['morning', 'afternoon', 'evening', 'anytime'], { message: 'Please choose an option' }),
  emergencyName: optText(100),
  emergencyPhone: optText(20).pipe(z.string().refine((v) => v === '' || phoneOk(v), 'Enter a valid phone number')),
}).refine((v) => !v.emergencyName === !v.emergencyPhone, { path: ['emergencyPhone'], message: 'Give both the emergency contact’s name and number, or leave both empty', when: (p) => typeof p.value === 'object' && p.value !== null });
export type Contact = z.output<typeof contactSchema>;
export const CONTACT_METHODS = [['whatsapp', 'WhatsApp message'], ['call', 'Phone call'], ['sms', 'SMS'], ['email', 'Email']] as const;
export const CONTACT_TIMES = [['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening'], ['anytime', 'Any time']] as const;
