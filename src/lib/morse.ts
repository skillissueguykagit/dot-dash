// Core Morse engine — data tables + content generators.
// Ported directly from the original single-file prototype (see HANDOFF.md).
// Pure logic, no DOM/React dependencies, so it's trivially testable.

export const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-",
  '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};

export const LETTER_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const NUM_POOL_SINGLE = "0123456789".split("");
export const PUNCT_POOL = ".,?!/:;=+-".split("");

export const WORDS = [
  "the","quick","brown","fox","jumps","over","lazy","dog","radio","signal","morse","code",
  "speed","learn","practice","dash","dot","key","tone","wave","light","night","storm","ocean",
  "forest","cloud","spark","pulse","echo","drift","frame","logic","panel","cable","voice","alert",
  "field","route","track","north","south","east","west","level","angle","depth","charge","photon",
  "vector","matrix","engine","system","module","beacon","relay","circuit","filter","output","input",
  "buffer","packet","stream","kernel","thread","socket","server","client","router","switch","bridge",
  "anchor","harbor","compass","rescue","convoy","patrol","sentry","outpost","bunker","tunnel","cipher",
  "decode","encode","antenna","receiver","carrier","channel","spectrum","amplify","resonate","frequency",
  "static","noise","clarity","precision","rhythm","cadence","tempo","interval","duration","pattern",
  "sequence","texture","surface","horizon","summit","valley","canyon","glacier","tundra","desert",
  "prairie","meadow","thicket","marsh","delta","estuary","current","tide","surf","breeze","gale",
  "frost","ember","flare","glow","shadow","dusk","dawn","zenith","orbit","comet","meteor","asteroid",
  "nebula","galaxy","quasar","pulsar","gravity","velocity","momentum","inertia","friction","tension",
  "torque","voltage","diode","resistor","capacitor","magnet","turbine","reactor","piston","gauge",
  "dial","lever","pulley","gear","axle","chassis","hull","keel","rudder","mast","sail","cargo",
  "freight","depot","ledger","archive","register","dossier","protocol","mandate","charter","treaty",
  "accord","envoy","liaison","courier","dispatch","bulletin","briefing","report","memo",
];

export const SENT_SUBJECTS = ["THE PILOT","THE CAPTAIN","THE OPERATOR","OUR TEAM","THE ENGINEER","THE SAILOR","THE GUARD","THE DRIVER","THE MEDIC","THE SCOUT","THE FARMER","THE TEACHER","MY FRIEND","THE NEIGHBOR","THE STRANGER"];
export const SENT_VERBS = ["SENT","RECEIVED","FOUND","CHECKED","REPAIRED","REPORTED","REQUESTED","CONFIRMED","TRACKED","OPENED","CLOSED","STARTED","FINISHED","CARRIED","DELIVERED","PROTECTED","OBSERVED","RECORDED","ANNOUNCED","SECURED","FOLLOWED","REMEMBERED","FORGOT","BUILT"];
export const SENT_OBJECTS = ["THE MESSAGE","THE SIGNAL","THE SUPPLIES","THE COORDINATES","THE ENGINE","THE RADIO","THE MAP","THE CODE","THE SHIP","THE CONVOY","A WARNING","THE RESCUE TEAM","THE BORDER","THE FREQUENCY","THE ANTENNA","THE REPORT","THE MISSION","THE SCHEDULE","THE CARGO","A NEW ROUTE","AN OLD LETTER","THE ANSWER"];
export const SENT_PHRASES = ["AT DAWN","BEFORE NOON","NEAR THE COAST","UNDER HEAVY RAIN","WITHOUT DELAY","DURING THE STORM","ACROSS THE VALLEY","ALONG THE COAST","AFTER THE ALERT","BEFORE SUNRISE","ONCE AGAIN","RIGHT ON TIME","WITH GREAT CARE","IN THE DISTANCE","THROUGH THE STATIC","FOR THE FIRST TIME"];

export function buildNumWords(): string[] {
  const arr: string[] = [];
  for (let i = 0; i < 10; i++) arr.push(String(i));
  for (let i = 0; i < 40; i++) arr.push(String(Math.floor(Math.random() * 900) + 10));
  return arr;
}

// ---------- Shuffle-bag: draws every item before any repeats ----------
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeBag<T>(pool: T[]): () => T {
  let bag: T[] = [];
  let last: T | null = null;
  return function next(): T {
    if (bag.length === 0) {
      bag = shuffle(pool);
      if (bag.length > 1 && bag[bag.length - 1] === last) {
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
    }
    const val = bag.pop() as T;
    last = val;
    return val;
  };
}

// ---------- Deterministic (seeded) RNG for the Daily Challenge ----------
// NOTE: in this backend-backed version, prefer generating the day's word list
// **server-side** (e.g. in the /api/daily route) and serving it to clients,
// rather than trusting every client to compute the same thing. This module
// still exports the seeded generator so that route can use it.
export function hashStringToSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeSeededBag<T>(pool: T[], rng: () => number): () => T {
  let bag: T[] = [];
  return function next(): T {
    if (bag.length === 0) bag = seededShuffle(pool, rng);
    return bag.pop() as T;
  };
}

export function getDailySeedString(): string {
  return new Date().toISOString().slice(0, 10); // UTC date — same for everyone
}

export function buildDailyWords(): string[] {
  const rng = mulberry32(hashStringToSeed("dotanddash-daily-" + getDailySeedString()));
  const bag = makeSeededBag(WORDS.map((w) => w.toUpperCase()), rng);
  return Array.from({ length: 10 }, () => bag());
}

// ---------- Practice content generation ----------
export type PracticeMode =
  | "letters" | "words" | "sentences" | "numbers" | "mixed" | "custom" | "weak";

export const CHAR_MODES: PracticeMode[] = ["letters", "custom", "weak"];
export function amountKind(mode: PracticeMode): "char" | "word" {
  return CHAR_MODES.includes(mode) ? "char" : "word";
}
export function amountUnit(mode: PracticeMode): "characters" | "words" {
  return CHAR_MODES.includes(mode) ? "characters" : "words";
}
export const AMOUNT_OPTIONS = { char: [25, 50, 100], word: [10, 25, 50] } as const;
export const AMOUNT_DEFAULT = { char: 50, word: 10 } as const;

interface GeneratorOptions {
  customChars?: string[];
  weakSymbols?: { symbol: string; count: number }[]; // from symbol_mistakes table, sorted desc
}

export function makeModeGenerator(mode: PracticeMode, opts: GeneratorOptions = {}): () => string {
  if (mode === "sentences") {
    const subjBag = makeBag(SENT_SUBJECTS);
    const verbBag = makeBag(SENT_VERBS);
    const objBag = makeBag(SENT_OBJECTS);
    const phraseBag = makeBag(SENT_PHRASES);
    let queue: string[] = [];
    return function () {
      if (queue.length === 0) {
        const tokens = [...subjBag().split(" "), verbBag(), ...objBag().split(" ")];
        if (Math.random() < 0.6) tokens.push(...phraseBag().split(" "));
        queue = tokens;
      }
      return queue.shift() as string;
    };
  }
  if (mode === "letters") return makeBag(LETTER_POOL);
  if (mode === "numbers") return makeBag(buildNumWords());
  if (mode === "custom") {
    const pool = opts.customChars && opts.customChars.length ? opts.customChars : LETTER_POOL;
    return makeBag(pool);
  }
  if (mode === "weak") {
    const weak = (opts.weakSymbols || []).slice(0, 10);
    if (!weak.length) return makeBag(LETTER_POOL);
    const maxCount = weak[0].count;
    const pool: string[] = [];
    weak.forEach(({ symbol, count }) => {
      const weight = Math.max(1, Math.min(5, Math.round((count / maxCount) * 5)));
      for (let i = 0; i < weight; i++) pool.push(symbol);
    });
    return makeBag(pool);
  }
  if (mode === "mixed") {
    const wordBag = makeBag(WORDS.map((w) => w.toUpperCase()));
    const numBag = makeBag(buildNumWords());
    const punctBag = makeBag(PUNCT_POOL);
    return function () {
      const r = Math.random();
      return r < 0.5 ? wordBag() : r < 0.8 ? numBag() : punctBag();
    };
  }
  return makeBag(WORDS.map((w) => w.toUpperCase())); // words
}
