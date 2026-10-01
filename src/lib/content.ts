import { normalizeOrigin } from './site';

export const SITE = {
  name: 'FORGE30',
  org: 'SHARIF TECHNOLOGIES',
  full: 'FORGE30 — SHARIF TECHNOLOGIES Developer Forge',
  tagline: '30 DAYS • 60 HOURS • BUILD FOR REAL',
  slogan: 'Knowledge Is Power',
  description:
    'FORGE30 is an intensive, live 30-day developer program by SHARIF TECHNOLOGIES: 60 hours of practical software-development training for committed beginners, ending in a real project you present on Day 30.',
  url: normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? 'https://forge30.example.com',
};

export const STAGES = [
  { id: 'foundations', name: 'Foundations', blurb: 'Getting comfortable with the computer, files, the internet and the way developers work.', items: ['Using a computer confidently for development work', 'How the internet and software actually work', 'Setting up your tools and workspace', 'Thinking in steps: how to break a problem down'] },
  { id: 'web', name: 'Web', blurb: 'The building blocks of every website: structure, style and behaviour.', items: ['Structuring pages with HTML', 'Styling and layout with CSS', 'Making pages work on phones and computers', 'Reading and fixing your own mistakes'] },
  { id: 'programming', name: 'Programming', blurb: 'The core ideas of programming, practised until they feel natural.', items: ['Variables, decisions and loops', 'Functions and organising code', 'Working with data', 'Solving small problems on your own'] },
  { id: 'applications', name: 'Applications', blurb: 'Turning separate skills into interactive applications people can use.', items: ['Responding to user actions', 'Forms, validation and feedback', 'Structuring a real application', 'Testing what you build'] },
  { id: 'backend', name: 'Backend', blurb: 'What happens behind the screen: servers, logic and keeping information.', items: ['How servers and requests work', 'Building simple back-end logic', 'Connecting the front and back ends', 'Keeping software secure at a basic level'] },
  { id: 'data', name: 'Data', blurb: 'How applications store, find and protect information.', items: ['Why and how data is stored', 'Basic database concepts', 'Saving and retrieving records', 'Designing data for your own project'] },
  { id: 'version-control', name: 'Version control', blurb: 'Working the way professional developers do: tracking and sharing changes.', items: ['Saving the history of your work', 'Working safely with changes', 'Sharing code online', 'Recovering from mistakes'] },
  { id: 'deployment', name: 'Deployment', blurb: 'Putting your work on the internet so real people can use it.', items: ['What “going live” means', 'Publishing an application', 'Domains and hosting basics', 'Checking it works for real users'] },
  { id: 'project', name: 'Project', blurb: 'Building your own idea, with guidance, feedback and daily practice.', items: ['Turning your idea into a plan', 'Building it step by step', 'Testing and improving', 'Getting it ready to present'] },
  { id: 'presentation', name: 'Presentation', blurb: 'Day 30: submitting your project package and presenting what you built.', items: ['Explaining the problem and the users', 'Showing how your solution works', 'Reflecting on what you learned', 'Describing how it could grow'] },
];

export const DEVICES = {
  Android: { kind: 'Phone', text: 'An Android phone is useful for following along and testing your work, but real development happens on a computer. Tell us honestly whether you have access to one.' },
  iOS: { kind: 'Phone', text: 'An iPhone is useful for testing how your work looks on a phone. You will still need a computer for the main development work.' },
  Windows: { kind: 'Computer', text: 'Windows laptops and desktops are fully suitable for FORGE30. We will guide everyone through setting up their tools.' },
  macOS: { kind: 'Computer', text: 'Mac laptops are fully suitable for FORGE30. We will guide everyone through setting up their tools.' },
  Linux: { kind: 'Computer', text: 'Linux laptops and desktops are fully suitable. You are likely already comfortable with a terminal, which helps.' },
  'No computer': { kind: 'Computer', text: 'You can still apply. Tell us whether you can regularly use a shared computer (for example at home, work or a café). Regular access is important because the program is practical. How this is handled is decided by SHARIF TECHNOLOGIES.' },
};

export const FAQ = [
  ['Is FORGE30 free?', 'FORGE30 is not advertised as a free course and there is no fixed course fee published at this time. Two things are separate from any course fee: an in-person arrangement may involve additional logistical costs, and you should be prepared to arrange approximately GH₵500 for your own project-development needs. Anything further is determined by SHARIF TECHNOLOGIES and will be communicated clearly.'],
  ['Do I need any experience?', 'No. A committed beginner can start from zero programming knowledge. What you need is the ability to show up, practise and keep going.'],
  ['Can I watch recordings and catch up later?', 'No. FORGE30 is live and instructor-led. Recorded lessons are not provided as a substitute for attendance, and there is no self-paced version. Unnecessary absence may result in dismissal.'],
  ['Can I choose my class time or format?', 'No. You may tell us your general availability and preferred format in the application, but they are not reservations. Your class time and the delivery arrangement are assigned by SHARIF TECHNOLOGIES after applications close.'],
  ['When do applications close?', 'There is no fixed deadline. Applications close when SHARIF TECHNOLOGIES is satisfied that enough applications have been received. The application page always shows whether applications are currently open.'],
  ['Am I enrolled when I submit?', 'No. Submitting is an application. Applications are reviewed, and submission does not guarantee selection. Confirmed participants get a student dashboard and a downloadable student card.'],
  ['Will I get a certificate?', 'Certificates are associated with successful completion of the program requirements. They are not issued automatically because someone applied or registered. FORGE30 makes no claim of accreditation, government or university recognition, or employment.'],
];
