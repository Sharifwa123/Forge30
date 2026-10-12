/** Computer-skills levels, shared by the landing explorer, the application and placement. Pure data: safe for client code. */
export const LEVELS = [
  { v: 'none', name: 'Beginner', hint: 'I have never used a computer, or I am just starting' },
  { v: 'basic', name: 'Basic', hint: 'I can type, message and browse' },
  { v: 'some', name: 'Intermediate', hint: 'I use computers regularly, or have tried coding' },
  { v: 'prior', name: 'Advanced', hint: 'I am very comfortable with computers' },
] as const;
export const GROUP_NAME: Record<string, string> = { LCS: 'Low Computer Skills', ICS: 'Intermediate Computer Skills', ACS: 'Advanced Computer Skills' };

/** Never used / low skills -> LCS, regular use or some coding -> ICS, advanced -> ACS. */
export function groupFor(experience: string | undefined): string {
  if (experience === 'prior') return 'ACS';
  if (experience === 'some') return 'ICS';
  return 'LCS';
}
