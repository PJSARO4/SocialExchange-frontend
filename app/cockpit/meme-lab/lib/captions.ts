/**
 * Caption engine — ported from the MEMEMaker desktop app.
 *
 * No language model. Captions come from mode-specific pattern banks with the
 * subject substituted in: instant, offline, free, and deterministic enough to
 * debug. Swap this module for an LLM call behind the same generate() signature
 * when you want to.
 *
 * Each mode encodes one of the comedic structures from the research:
 *   macro      classic setup / punchline
 *   deadpan    anticlimax — setup implies drama, delivery is flat
 *   absurd     committed absurdism — impossible premise, played straight
 *   corporate  motivational-poster grammar, undercut by the words
 *   mismatch   unearned gravitas applied to something trivial
 *   escalate   stakes rise, then refuse to resolve
 *   cursed     minimal or no caption; the image does the work
 */

export type ModeKey =
  | 'macro' | 'deadpan' | 'absurd' | 'corporate'
  | 'mismatch' | 'escalate' | 'cursed';

export interface Caption {
  mode: ModeKey;
  modeLabel: string;
  top: string;
  bottom: string;
}

interface ModeDef {
  label: string;
  blurb: string;
  patterns: Array<[string, string]>;
}

export const MODES: Record<ModeKey, ModeDef> = {
  macro: {
    label: 'Impact Macro',
    blurb: 'Classic setup and punchline. The control group.',
    patterns: [
      ['nobody:', 'absolutely nobody: me at 3am thinking about {kw}'],
      ['me: i should sleep', 'my brain: but what about {kw}'],
      ['when someone mentions {kw}', 'and you have opinions'],
      ["i don't always think about {kw}", "but when i do it's during a meeting"],
      ['{kw}?', 'in this economy?'],
      ['everyone: stop talking about {kw}', 'me: no'],
      ['my therapist: {kw} is not real', '{kw}:'],
      ['what if {kw}', 'but too much'],
      ['society if {kw} was handled correctly', ''],
      ['me explaining {kw} to someone who did not ask', ''],
      ['nobody asked about {kw}', 'and yet'],
      ["them: it's just {kw}", 'me, who has read three articles:'],
      ['looking up {kw} at 2am', 'for no reason'],
      ['first day of {kw}', 'vs the fourth hour of {kw}'],
    ],
  },
  deadpan: {
    label: 'Deadpan Anticlimax',
    blurb: 'Sets up a punchline, then declines to deliver one.',
    patterns: [
      ['{kw} is happening', 'anyway'],
      ['breaking: {kw}', "that's the whole post"],
      ['i have thought a lot about {kw}', 'i have no conclusions'],
      ['everyone is talking about {kw}', 'it is fine'],
      ['{kw}', 'yes'],
      ['the truth about {kw}', 'it exists'],
      ['i was asked to comment on {kw}', 'no comment'],
      ['what {kw} means for you', 'nothing'],
      ['{kw} update', 'no update'],
      ['here is my hot take on {kw}', "it's room temperature"],
      ['day 400 of {kw}', 'still going i guess'],
      ['some say {kw}', 'others do not'],
      ['i looked into {kw}', 'and then i stopped looking into {kw}'],
      ['{kw} explained', "it wasn't"],
    ],
  },
  absurd: {
    label: 'Committed Absurdism',
    blurb: 'An impossible premise, delivered completely straight.',
    patterns: [
      ['scientists confirm {kw} has a {noun}', 'study ongoing'],
      ['the {kw} was found in the {place}', 'it had been there the whole time'],
      ['local {kw} declared {adj} by council', ''],
      ['{kw} but it is {number} feet tall', 'and it knows'],
      ['they put {kw} in the {place}', 'nobody has said anything'],
      ['i have been appointed regional manager of {kw}', ''],
      ['{kw} is legally a {noun} in {number} states', ''],
      ['the {adj} {kw} approaches', 'do not make eye contact'],
      ['official {kw} of the {place}', 'est. {number}'],
      ['{kw} has been {adj} since {number}', 'this is normal'],
      ['do not feed the {kw}', 'it has already eaten'],
      ['the {kw} committee has reached a decision', 'the decision is {noun}'],
      ['{kw} was never supposed to be {adj}', 'and yet here we are'],
    ],
  },
  corporate: {
    label: 'Motivational Inversion',
    blurb: 'Poster grammar, completely undercut by the caption.',
    patterns: [
      ['{kwUpper}', 'because someone had to'],
      ['{kwUpper}', 'results may vary. results have varied.'],
      ['SYNERGY', "we still don't understand {kw}"],
      ['{kwUpper}', 'aligning stakeholders since never'],
      ['EXCELLENCE', 'is not what happened with {kw}'],
      ['{kwUpper}', 'a journey nobody asked to take'],
      ['TEAMWORK', 'someone will handle {kw}. not us.'],
      ['{kwUpper}', 'circle back on this'],
      ['INNOVATION', '{kw}, but worse and more expensive'],
      ['{kwUpper}', 'per my last email'],
      ['VISION', 'we have a slide about {kw}'],
      ['{kwUpper}', 'quarterly. relentlessly. pointlessly.'],
    ],
  },
  mismatch: {
    label: 'Value Mismatch',
    blurb: 'Enormous reverence applied to something trivial.',
    patterns: [
      ['behold', '{kw}'],
      ['they said it could not be done', '{kw}'],
      ['after {number} years of research', '{kw}'],
      ['the final form of {kw}', ''],
      ["civilization's greatest achievement", '{kw}'],
      ['what the ancients died for', '{kw}'],
      ['{number} million years of evolution', 'for {kw}'],
      ['this is what peak {kw} looks like', 'you may not like it'],
      ['i have seen {kw}', 'i can never go back'],
      ['the {kw} of our generation', ''],
      ['witness', '{kw}, unbothered, thriving'],
      ['all of human progress', 'culminating in {kw}'],
    ],
  },
  escalate: {
    label: 'Escalation',
    blurb: 'Stakes climb, then the ending refuses to resolve.',
    patterns: [
      ['small {kw}', 'medium {kw}. large {kw}. unspeakable {kw}.'],
      ['first they came for {kw}', 'and i said sure ok'],
      ['{kw}. then more {kw}.', 'then it got out of hand'],
      ['it started with one {kw}', 'there are now {number}'],
      ['{kw} on monday', 'by friday: {adj}, {adj}, and load-bearing'],
      ['we can stop at any time', '{number} {kw} later'],
      ['just a little {kw}', 'as a treat. and then more. and then.'],
      ['i can handle {kw}', 'narrator: he could not handle {kw}'],
      ['phase one: {kw}', 'phase two: unclear. phase three: {kw} again.'],
    ],
  },
  cursed: {
    label: 'Cursed / No Caption',
    blurb: 'Minimal text. The image is the entire joke.',
    patterns: [
      ['', '{kw}'],
      ['{kw}', ''],
      ['', ''],
      ['', "it's {kw}"],
      ['no thoughts', '{kw}'],
      ['', '{kw}. do not ask.'],
      ['hey', '{kw}'],
    ],
  },
};

export const MODE_ORDER: ModeKey[] = [
  'macro', 'deadpan', 'absurd', 'corporate', 'mismatch', 'escalate', 'cursed',
];

const NOUNS = [
  'spine', 'opinion', 'second job', 'restraining order', 'loyalty program',
  'mild fever', 'union rep', 'birth certificate', 'sponsor', 'dental plan',
  'small business', 'cousin', 'parking pass', 'warranty', 'legal team',
  'newsletter', 'grudge', 'podcast', 'hostage situation', 'gift shop',
];
const ADJECTIVES = [
  'load-bearing', 'unlicensed', 'seasonal', 'non-refundable', 'haunted',
  'recently promoted', 'structurally unsound', 'tax-exempt', 'damp',
  'federally recognized', 'off-brand', 'emotionally unavailable', 'gluten-free',
  'asbestos-adjacent', 'mildly radioactive', 'extremely normal', 'fully insured',
];
const PLACES = [
  'break room', 'parking garage', 'county fair', 'DMV', 'airport Wendys',
  'hotel conference room', 'basement', 'group chat', 'produce aisle',
  'abandoned Sears', 'middle school gym', 'Ohio', 'back of the van',
];
const NUMBERS = ['3', '7', '12', '40', '76', '200', '1908', '1997', '10,000', 'billion'];

export const RANDOM_SUBJECTS = [
  'mondays', 'the group chat', 'my back', 'email', 'gas prices', 'the algorithm',
  'airport food', 'my sleep schedule', 'printers', 'small talk', 'wifi',
  'the DMV', 'meal prep', 'self checkout', 'leftovers', 'parallel parking',
  'the gym', 'taxes', 'group projects', 'unread notifications', 'microwaves',
  'hold music', 'traffic', 'my houseplants', 'laundry day', 'hotel breakfast',
  'customer service', 'daylight savings', 'the fridge light', 'my posture',
  'expired coupons', 'software updates', 'shopping carts', 'the aux cord',
  'cold pizza', 'weather apps', 'loading screens', 'socks', 'escalators',
  'gift cards', 'the last slice', 'haircuts', 'assembly instructions',
];

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

/** Substitute {kw} and the absurdist filler tokens. */
function fill(pattern: string, kw: string): string {
  let out = pattern
    .replace(/\{kwUpper\}/g, kw.toUpperCase())
    .replace(/\{kw\}/g, kw);

  const banks: Array<[string, string[]]> = [
    ['{noun}', NOUNS],
    ['{adj}', ADJECTIVES],
    ['{place}', PLACES],
    ['{number}', NUMBERS],
  ];

  for (const [token, bank] of banks) {
    // A token can appear twice in one pattern and must differ each time —
    // "extremely normal, extremely normal" is a bug, not a bit.
    const used = new Set<string>();
    while (out.includes(token)) {
      const choices = bank.filter(c => !used.has(c));
      const choice = pickFrom(choices.length ? choices : bank);
      used.add(choice);
      out = out.replace(token, choice);
    }
  }
  return out.trim();
}

export function randomSubject(): string {
  return pickFrom(RANDOM_SUBJECTS);
}

export function cleanKeyword(kw: string): string {
  return (kw || '').trim().replace(/\s+/g, ' ').slice(0, 60);
}

/**
 * Return `count` caption candidates for `keyword`, spread evenly across modes
 * so no single register dominates the grid.
 */
export function generate(keyword: string, count = 12, modes?: ModeKey[]): Caption[] {
  const kw = cleanKeyword(keyword) || randomSubject();
  const useModes = (modes && modes.length ? modes : MODE_ORDER).filter(m => m in MODES);

  const byMode = new Map<ModeKey, Array<[string, string]>>();
  for (const m of useModes) {
    const pats = [...MODES[m].patterns];
    for (let i = pats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pats[i], pats[j]] = [pats[j] as [string, string], pats[i] as [string, string]];
    }
    byMode.set(m, pats);
  }

  const results: Caption[] = [];
  let idx = 0;
  let guard = 0;
  while (results.length < count && guard < count * 40) {
    guard++;
    const mode = useModes[idx % useModes.length] as ModeKey;
    idx++;
    const bank = byMode.get(mode);
    if (!bank || bank.length === 0) {
      if ([...byMode.values()].every(v => v.length === 0)) break;
      continue;
    }
    const pat = bank.pop() as [string, string];
    results.push({
      mode,
      modeLabel: MODES[mode].label,
      top: fill(pat[0], kw),
      bottom: fill(pat[1], kw),
    });
  }
  return results;
}
