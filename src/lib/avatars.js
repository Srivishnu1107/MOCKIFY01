// 20 professional AI interviewer personas rendered with DiceBear's "avataaars"
// style, constrained to an HR/business dress code:
//   • Clothing limited to blazers + collared shirts + formal sweaters
//   • Palette limited to muted corporate colours (charcoal, navy, slate, wine)
//   • Eyes forward (looking straight at the candidate)
//   • No accessories, wild hair, or silly mouths
//
// Each persona exposes two expressions (listening / engaged) which the
// Interview stage cross-fades during speech to simulate real facial movement.

const BASE = "https://api.dicebear.com/7.x/avataaars/svg";

// Professional HR / tech-interviewer dress-code constants (DiceBear v7 valid names).
const BIZ_CLOTHING = "blazerAndShirt,blazerAndSweater,collarAndSweater";
const BIZ_CLOTH_COLORS = "262e33,3c4f5c,25557c,545454,929598,5199e4";
const HAIR_NATURAL = "2c1b18,4a312c,724133,a55728,b58143";
// v7 `top` values
const HAIR_MALE =
  "shortFlat,theCaesar,sides,shortCurly,shortRound,shortWaved,dreads01,dreads02";
const HAIR_FEMALE =
  "bob,bun,longButNotTooLong,miaWallace,straight01,straight02,straightAndStrand";

function buildAvatar({ seed, gender, expression = "listening" }) {
  const engaged = expression === "engaged";
  const q = new URLSearchParams({
    seed,
    // Dress code — blazers / collared shirts only
    clothing: BIZ_CLOTHING,
    clothesColor: BIZ_CLOTH_COLORS,
    // Hair
    top: gender === "female" ? HAIR_FEMALE : HAIR_MALE,
    hairColor: HAIR_NATURAL,
    // Eyes forward (looking straight at the candidate)
    eyes: "default",
    // Facial hair rare on men, none on women
    facialHair: gender === "male" ? "beardLight,beardMedium" : "",
    facialHairProbability: gender === "male" ? "25" : "0",
    facialHairColor: HAIR_NATURAL,
    // No accessories — kept corporate
    accessoriesProbability: "0",
    // Expression: listening (neutral/serious) vs engaged (smile + brows up)
    eyebrows: engaged
      ? "raisedExcitedNatural"
      : "defaultNatural",
    mouth: engaged ? "smile" : "serious",
    // Background transparent so stage backdrop shows through
    backgroundColor: "transparent",
  });
  return `${BASE}?${q.toString()}`;
}

// Public helper — returns the rendered URL for a given expression.
export function avatarImage(avatar, expression = "listening") {
  return buildAvatar({
    seed: avatar.seed,
    gender: avatar.voice.gender,
    expression,
  });
}

const make = (base) => ({
  ...base,
  // Pre-computed default image (listening) for places that want a single URL.
  image: buildAvatar({
    seed: base.seed,
    gender: base.voice.gender,
    expression: "listening",
  }),
});

export const AVATARS = [
  // ===== Male-voiced (10) =====
  make({
    id: "atlas",
    seed: "Atlas-Male-Staff-Engineer-Cloud-v3",
    name: "Atlas",
    title: "Staff Engineer · Cloud Infra",
    tagline: "Deep systems rigor. Expects precision on every answer.",
    specialty: ["technical", "system_design"],
    accent: "#1e3a5f",
    bg: "e6eef7,d4e0ed",
    voice: { gender: "male", lang: "en-US", rate: 0.95, pitch: 0.88 },
  }),
  make({
    id: "orion",
    seed: "Orion-Male-Principal-Architect-v3",
    name: "Orion",
    title: "Principal Architect",
    tagline: "Distributed systems specialist. Trade-off obsessed.",
    specialty: ["system_design"],
    accent: "#1f4438",
    bg: "e5eee9,d2e0d7",
    voice: { gender: "male", lang: "en-GB", rate: 0.95, pitch: 0.9 },
  }),
  make({
    id: "cipher",
    seed: "Cipher-Male-Security-Principal-v3",
    name: "Cipher",
    title: "Security Principal",
    tagline: "Pushes hard on edge cases & failure modes.",
    specialty: ["technical", "system_design"],
    accent: "#5a2a1f",
    bg: "f0e5df,e2d1c6",
    voice: { gender: "male", lang: "en-US", rate: 0.92, pitch: 0.82 },
  }),
  make({
    id: "vector",
    seed: "Vector-Male-TechLead-Payments-v3",
    name: "Vector",
    title: "Tech Lead · Payments",
    tagline: "Pragmatic. Scrutinises your trade-offs.",
    specialty: ["technical", "behavioral"],
    accent: "#4a2d6b",
    bg: "ece5f5,ddd0ec",
    voice: { gender: "male", lang: "en-IN", rate: 1.0, pitch: 0.95 },
  }),
  make({
    id: "onyx",
    seed: "Onyx-Male-Distinguished-Engineer-v3",
    name: "Onyx",
    title: "Distinguished Engineer",
    tagline: "Low-level obsessed. Concurrency & performance drills.",
    specialty: ["technical", "system_design"],
    accent: "#252a33",
    bg: "e8eaed,d7dce1",
    voice: { gender: "male", lang: "en-US", rate: 0.9, pitch: 0.8 },
  }),
  make({
    id: "halcyon",
    seed: "Halcyon-Male-VP-Engineering-v3",
    name: "Halcyon",
    title: "VP Engineering",
    tagline: "Executive presence. Probes leadership & ownership.",
    specialty: ["behavioral", "product_management"],
    accent: "#1f4a47",
    bg: "e3efee,cee2e0",
    voice: { gender: "male", lang: "en-US", rate: 0.92, pitch: 0.88 },
  }),
  make({
    id: "draco",
    seed: "Draco-Male-Principal-Gaming-v3",
    name: "Draco",
    title: "Principal Engineer · Gaming",
    tagline: "Systems + graphics thinker. Loves mathy questions.",
    specialty: ["technical", "system_design"],
    accent: "#5e1f2f",
    bg: "efe2e6,e1c9d0",
    voice: { gender: "male", lang: "en-US", rate: 0.98, pitch: 0.92 },
  }),
  make({
    id: "nexus",
    seed: "Nexus-Male-Principal-PM-v3",
    name: "Nexus",
    title: "Principal PM",
    tagline: "Metrics-driven. Estimation & prioritisation puzzles.",
    specialty: ["product_management"],
    accent: "#1e3363",
    bg: "e5ebf3,ccd7e7",
    voice: { gender: "male", lang: "en-IN", rate: 1.0, pitch: 1.0 },
  }),
  make({
    id: "titan",
    seed: "Titan-Male-CTO-SeriesC-v3",
    name: "Titan",
    title: "CTO · Series C",
    tagline: "Strategic thinker. Blends business with tech depth.",
    specialty: ["system_design", "behavioral"],
    accent: "#5a4117",
    bg: "f0ebde,e2d8c1",
    voice: { gender: "male", lang: "en-GB", rate: 0.95, pitch: 0.93 },
  }),
  make({
    id: "zenith",
    seed: "Zenith-Male-EM-STAR-v3",
    name: "Zenith",
    title: "Engineering Manager",
    tagline: "People-first leader. STAR-method deep dives.",
    specialty: ["behavioral"],
    accent: "#3a3f6b",
    bg: "e8eaf2,d1d6e8",
    voice: { gender: "male", lang: "en-US", rate: 0.96, pitch: 0.9 },
  }),

  // ===== Female-voiced (10) =====
  make({
    id: "nova",
    seed: "Nova-Female-Senior-Product-v3",
    name: "Nova",
    title: "Senior Product Lead",
    tagline: "Warm, curious. Case-study & customer-focused.",
    specialty: ["product_management", "behavioral"],
    accent: "#7a2553",
    bg: "f5e4ed,eccbdc",
    voice: { gender: "female", lang: "en-US", rate: 1.0, pitch: 1.12 },
  }),
  make({
    id: "iris",
    seed: "Iris-Female-HR-Director-v3",
    name: "Iris",
    title: "HR Director · FAANG",
    tagline: "Digs into motivation, conflict & culture fit.",
    specialty: ["behavioral"],
    accent: "#5e2a75",
    bg: "efe3f3,dec8e6",
    voice: { gender: "female", lang: "en-GB", rate: 1.0, pitch: 1.15 },
  }),
  make({
    id: "lyra",
    seed: "Lyra-Female-System-Architect-v3",
    name: "Lyra",
    title: "System Architect · Edge",
    tagline: "Challenges you on consistency models & capacity.",
    specialty: ["system_design", "technical"],
    accent: "#6e2540",
    bg: "f2e2e7,e5c7d1",
    voice: { gender: "female", lang: "en-IN", rate: 1.0, pitch: 1.1 },
  }),
  make({
    id: "aria",
    seed: "Aria-Female-Staff-MLInfra-v3",
    name: "Aria",
    title: "Staff Engineer · ML Infra",
    tagline: "Deep technical. Dives into data pipelines & GPUs.",
    specialty: ["technical", "system_design"],
    accent: "#4d2a72",
    bg: "ece5f5,d8c9e9",
    voice: { gender: "female", lang: "en-US", rate: 0.98, pitch: 1.05 },
  }),
  make({
    id: "juno",
    seed: "Juno-Female-VP-Product-Fintech-v3",
    name: "Juno",
    title: "VP Product · Fintech",
    tagline: "Product sense drills. Roadmap trade-offs.",
    specialty: ["product_management"],
    accent: "#1d4c5a",
    bg: "e4eef1,c8dae0",
    voice: { gender: "female", lang: "en-US", rate: 1.0, pitch: 1.1 },
  }),
  make({
    id: "vega",
    seed: "Vega-Female-Principal-Robotics-v3",
    name: "Vega",
    title: "Principal Engineer · Robotics",
    tagline: "Control systems & safety-critical mindset.",
    specialty: ["technical"],
    accent: "#6b3a16",
    bg: "f2e8df,e3d0bf",
    voice: { gender: "female", lang: "en-US", rate: 0.96, pitch: 1.0 },
  }),
  make({
    id: "saga",
    seed: "Saga-Female-Engineering-Director-v3",
    name: "Saga",
    title: "Engineering Director",
    tagline: "Calm, methodical. Asks about decision frameworks.",
    specialty: ["behavioral", "system_design"],
    accent: "#214d2a",
    bg: "e3ede6,c8dccd",
    voice: { gender: "female", lang: "en-GB", rate: 0.96, pitch: 1.08 },
  }),
  make({
    id: "echo",
    seed: "Echo-Female-Senior-DevTools-v3",
    name: "Echo",
    title: "Senior Staff · Developer Tools",
    tagline: "Developer-experience advocate. Practical & sharp.",
    specialty: ["technical", "product_management"],
    accent: "#1c3a5a",
    bg: "e4ecf2,c9d8e4",
    voice: { gender: "female", lang: "en-US", rate: 1.02, pitch: 1.12 },
  }),
  make({
    id: "zara",
    seed: "Zara-Female-Principal-PM-Marketplace-v3",
    name: "Zara",
    title: "Principal PM · Marketplace",
    tagline: "Two-sided market dynamics & growth loops.",
    specialty: ["product_management", "behavioral"],
    accent: "#6e3d0e",
    bg: "f2eadd,e3d4b9",
    voice: { gender: "female", lang: "en-IN", rate: 1.0, pitch: 1.05 },
  }),
  make({
    id: "muse",
    seed: "Muse-Female-Head-Research-v3",
    name: "Muse",
    title: "Head of Research",
    tagline: "Pushes deep on fundamentals & first principles.",
    specialty: ["technical", "system_design"],
    accent: "#512a7a",
    bg: "ece5f5,d7c7e8",
    voice: { gender: "female", lang: "en-GB", rate: 0.98, pitch: 1.12 },
  }),
];

export const getAvatar = (id) =>
  AVATARS.find((a) => a.id === id) || AVATARS[0];

/**
 * Pick a SpeechSynthesis voice matched to the avatar's gender.
 */
export function pickVoice(profile) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  const lang = profile?.lang || "en-US";
  const wantsFemale = profile?.gender === "female";

  const femaleHints =
    /(female|woman|zira|samantha|victoria|karen|tessa|serena|kate|moira|fiona|susan|allison|lisa|aria|ava|eva|sara|mia|amy|emma|layla|google.*female|microsoft.*(zira|eva|aria|jessa|clara|sonia|catherine|hazel|hanna|heera))/i;
  const maleHints =
    /(male|man|daniel|david|alex|fred|bruce|arthur|oliver|rishi|aaron|nathan|guy|mark|ryan|kevin|matthew|eric|luke|james|thomas|tom|google.*male|microsoft.*(mark|david|guy|ryan|george|james|ravi))/i;

  const base = lang.split("-")[0];
  const langPool = voices.filter((v) => v.lang && v.lang.startsWith(base));
  const pool = langPool.length ? langPool : voices;

  const targeted = pool.filter((v) =>
    wantsFemale
      ? femaleHints.test(v.name) && !maleHints.test(v.name)
      : maleHints.test(v.name) && !femaleHints.test(v.name)
  );
  if (targeted.length) {
    const exact = targeted.find((v) => v.lang === lang);
    return exact || targeted[0];
  }

  const notOpposite = pool.filter((v) =>
    wantsFemale ? !maleHints.test(v.name) : !femaleHints.test(v.name)
  );
  if (notOpposite.length) return notOpposite[0];

  return pool[0] || voices[0];
}

export function speak(text, profile, handlers = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(profile);
  if (v) u.voice = v;
  u.lang = profile?.lang || "en-US";
  u.rate = profile?.rate ?? 1;
  u.pitch = profile?.pitch ?? (profile?.gender === "female" ? 1.15 : 0.9);
  if (handlers.onstart) u.onstart = handlers.onstart;
  if (handlers.onend) u.onend = handlers.onend;
  if (handlers.onerror) u.onerror = handlers.onerror;
  synth.speak(u);
  return u;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
