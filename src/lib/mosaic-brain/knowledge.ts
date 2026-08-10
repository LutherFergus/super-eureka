/**
 * Mosaic Blanket Knowledge Base
 *
 * Domain rules for designs that must later translate into yarn/mosaic blankets
 * (graphghan / tapestry / C2C / mosaic crochet charts). Every stitch or block
 * is one solid color — fine detail is lost. Simple is usually better.
 */

export const MOSAIC_BLANKET_FACTS = {
  medium:
    "Mosaic blankets and graphghans are built from a grid where each stitch/block is one solid yarn color. Curves become stairsteps; tiny marks vanish.",
  techniques: [
    "Graphghan / tapestry / intarsia: colored squares on a chart; more colors mean more yarn changes.",
    "C2C (corner-to-corner): each tile is a block — needs thicker lines and less detail than single-crochet graphs.",
    "Overlay/inset mosaic crochet: usually two high-contrast colors; bold geometric graphics excel; painterly detail fails.",
  ],
  hardLimits: [
    "No gradients, shading, antialiasing, textures, or photorealism — yarn cannot render them.",
    "No thin linework, eyelashes, tiny text, dense icon borders, or hairline ornament.",
    "No pixel-art / bead / Lego look in the *source image*; we output crisp vector art that will be charted later.",
    "Every shape must stay large enough to survive reduction to roughly 80–150 blocks across a throw.",
  ],
  softPreferences: [
    "Fewer colors are easier and usually clearer — 2 colors is the sweet spot for classic mosaic contrast.",
    "One dominant silhouette beats a crowded scene.",
    "Generous negative space helps charts stay readable.",
    "Closed chunky shapes beat open thin outlines.",
    "Borders and backgrounds should use a handful of oversized motifs, never dozens of mini repeats.",
  ],
} as const;

/** Patterns we always forbid in generated artwork. */
export const FORBIDDEN_VISUALS = [
  "photorealism",
  "gradients",
  "soft shadows",
  "glow effects",
  "film grain / texture fills",
  "watercolor washes",
  "tiny repeating border icons",
  "dense filigree",
  "small facial features (pupils, nostrils, teeth grids)",
  "readable small text or logos",
  "busy photographic backgrounds",
  "pixel mosaic / 8-bit / bead grid appearance",
  "abstract background filler (random circles, arcs, disks, blobs, or geometric blocks unrelated to the subject)",
] as const;

/** Patterns that translate well into stitch charts. */
export const POSSIBLE_VISUALS = [
  "bold silhouettes",
  "large geometric blocks",
  "chunky botanical shapes",
  "simple animal profiles",
  "thick frames and oversized corner motifs",
  "1–3 large concrete thematic props behind the subject",
  "high-contrast flat color fields",
  "clear negative space",
] as const;

export type ThemeFamily =
  | "animal"
  | "nature"
  | "ocean"
  | "sky"
  | "space"
  | "home"
  | "holiday"
  | "vehicle"
  | "people"
  | "abstract";

type ThemeRule = {
  family: ThemeFamily;
  keywords: string[];
  /** Large stitch-safe background props tied to the subject world. */
  backgroundMotifs: string[];
};

/** Concrete props for specific subjects — preferred over family defaults. */
const SUBJECT_BACKGROUND_HINTS: { match: RegExp; motifs: string[] }[] = [
  {
    match: /\b(cows?|cattle|bulls?|calves|calf)\b/i,
    motifs: [
      "a barn or lean-to silhouette",
      "one large hay bale",
      "a tractor",
      "a short stretch of barbed-wire or post fence",
    ],
  },
  {
    match: /\b(horses?|ponies|pony|foals?|mustangs?)\b/i,
    motifs: [
      "a barn or stable silhouette",
      "a fence rail or paddock post line",
      "a large hay bale",
      "a water trough",
    ],
  },
  {
    match: /\b(pigs?|hogs?|piglets?)\b/i,
    motifs: [
      "a lean-to or sty silhouette",
      "a feed trough",
      "a fence panel",
      "a large hay or straw pile",
    ],
  },
  {
    match: /\b(sheep|lambs?|goats?|kids?)\b/i,
    motifs: [
      "a barn or lean-to",
      "a stone wall or fence",
      "a large hay bale",
      "a simple rolling pasture hill",
    ],
  },
  {
    match: /\b(chickens?|roosters?|hens?|chicks?|ducks?|geese|goose|turkeys?)\b/i,
    motifs: [
      "a coop or barn silhouette",
      "a nest box or crate",
      "a fence post line",
      "a feed bucket",
    ],
  },
  {
    match: /\b(dogs?|puppies|puppy)\b/i,
    motifs: [
      "a doghouse",
      "a large bone",
      "a fence or gate",
      "a food bowl",
    ],
  },
  {
    match: /\b(cats?|kittens?|kitty)\b/i,
    motifs: [
      "a windowsill or window frame",
      "a yarn ball or cushion",
      "a simple house plant",
      "a door or stoop silhouette",
    ],
  },
  {
    match: /\b(foxes?|fox)\b/i,
    motifs: [
      "a den or hollow-log silhouette",
      "a few large pine trees",
      "a simple woodland hill",
      "oversized mushrooms (1–2 only)",
    ],
  },
  {
    match: /\b(bears?|cubs?)\b/i,
    motifs: [
      "a mountain or forest silhouette",
      "a large pine or fir tree",
      "a cave mouth",
      "a simple river band",
    ],
  },
  {
    match: /\b(owls?|birds?|eagles?|hawks?|robins?|cardinals?)\b/i,
    motifs: [
      "a large tree branch or nest",
      "a few oversized leaves",
      "a simple moon",
      "a barn or silo silhouette (if farm bird)",
    ],
  },
  {
    match: /\b(fish|whales?|sharks?|dolphins?|octopuses?|octopus)\b/i,
    motifs: [
      "large seaweed or kelp fronds",
      "a few oversized bubbles",
      "a coral mound or rock",
      "a simple wave band",
    ],
  },
  {
    match: /\b(dinosaurs?|t-rex|triceratops|stegosaurus)\b/i,
    motifs: [
      "a volcano silhouette",
      "large fern or prehistoric plant shapes",
      "a rocky cliff band",
      "a simple sun disk",
    ],
  },
  {
    match: /\b(tractors?|farms?|barns?|farmers?)\b/i,
    motifs: [
      "a barn silhouette",
      "hay bales",
      "a fence line",
      "a silo",
    ],
  },
  {
    match: /\b(trucks?|cars?|vehicles?)\b/i,
    motifs: [
      "a simple road band",
      "a garage or shed silhouette",
      "a few large roadside trees",
      "a stop sign or mailbox (oversized, single)",
    ],
  },
  {
    match: /\b(trains?|locomotives?)\b/i,
    motifs: [
      "rail tracks as a simple band",
      "a station or water tower silhouette",
      "a few large hills",
      "a signal post",
    ],
  },
  {
    match: /\b(boats?|ships?|sailboats?|lighthouses?)\b/i,
    motifs: [
      "a lighthouse",
      "large wave bands",
      "a dock or pier silhouette",
      "a simple shoreline",
    ],
  },
  {
    match: /\b(flowers?|gardens?|roses?|sunflowers?)\b/i,
    motifs: [
      "a garden fence or gate",
      "a watering can",
      "a flower pot or planter",
      "a simple shed or trellis",
    ],
  },
  {
    match: /\b(christmas|santa|snowmen|snowman|reindeer)\b/i,
    motifs: [
      "a gift box",
      "a large Christmas tree",
      "a chimney or cottage silhouette",
      "a simple snowbank",
    ],
  },
  {
    match: /\b(halloween|pumpkins?|ghosts?|witches?)\b/i,
    motifs: [
      "a jack-o'-lantern",
      "a fence or gate",
      "a haunted house silhouette",
      "a large crescent moon",
    ],
  },
];

export const THEME_RULES: ThemeRule[] = [
  {
    family: "animal",
    keywords: [
      "fox",
      "horse",
      "dog",
      "cat",
      "bird",
      "owl",
      "bear",
      "deer",
      "wolf",
      "bunny",
      "rabbit",
      "lion",
      "tiger",
      "elephant",
      "whale",
      "fish",
      "dragon",
      "unicorn",
      "pet",
      "animal",
      "cow",
      "cattle",
      "bull",
      "calf",
      "pig",
      "sheep",
      "lamb",
      "goat",
      "chicken",
      "rooster",
      "hen",
      "duck",
      "turkey",
      "pony",
      "dinosaur",
    ],
    backgroundMotifs: [
      "one concrete habitat prop tied to the animal (barn, den, nest, coop, or similar)",
      "one oversized related object from that animal’s world (hay bale, trough, branch, rock)",
      "a short fence, tree, or shelter silhouette — never random circles or arcs",
    ],
  },
  {
    family: "ocean",
    keywords: [
      "ocean",
      "sea",
      "wave",
      "beach",
      "shark",
      "dolphin",
      "mermaid",
      "boat",
      "sail",
      "lighthouse",
      "anchor",
    ],
    backgroundMotifs: [
      "a lighthouse, dock, or boat silhouette",
      "large seaweed or coral shapes",
      "a simple shoreline or wave band",
    ],
  },
  {
    family: "sky",
    keywords: ["cloud", "sky", "rainbow", "storm", "kite", "balloon"],
    backgroundMotifs: [
      "2–3 oversized cloud silhouettes",
      "a kite string post, balloon basket, or similar sky prop",
      "a simple ground strip with a tree or hill",
    ],
  },
  {
    family: "space",
    keywords: [
      "space",
      "planet",
      "rocket",
      "astronaut",
      "galaxy",
      "star",
      "alien",
      "moon",
    ],
    backgroundMotifs: [
      "one large planet",
      "a rocket, satellite, or crater prop",
      "3–5 oversized stars only (never a dense starfield)",
    ],
  },
  {
    family: "nature",
    keywords: [
      "tree",
      "flower",
      "forest",
      "mountain",
      "garden",
      "leaf",
      "cactus",
      "farm",
      "barn",
    ],
    backgroundMotifs: [
      "a barn, shed, fence, or garden gate",
      "a watering can, planter, or hay bale when farm/garden-like",
      "large mountain, tree, or bloom shapes that belong to the scene",
    ],
  },
  {
    family: "home",
    keywords: [
      "house",
      "home",
      "cabin",
      "coffee",
      "mug",
      "book",
      "hearth",
      "kitchen",
    ],
    backgroundMotifs: [
      "a window, doorway, or mantel",
      "one oversized plant, mug, or book stack",
      "a simple shelf or table edge — real home objects, not abstract shapes",
    ],
  },
  {
    family: "holiday",
    keywords: [
      "christmas",
      "halloween",
      "easter",
      "valentine",
      "heart",
      "snowman",
      "pumpkin",
      "santa",
      "tree ornament",
    ],
    backgroundMotifs: [
      "2–3 oversized holiday props (gift, pumpkin, stocking, egg)",
      "a cottage, tree, or fence that fits the holiday",
      "a simple ground or snowbank band",
    ],
  },
  {
    family: "vehicle",
    keywords: [
      "truck",
      "car",
      "train",
      "plane",
      "bike",
      "tractor",
      "firetruck",
      "bus",
    ],
    backgroundMotifs: [
      "a road, track, or runway band",
      "a garage, barn, station, or hangar silhouette",
      "one related roadside/trackside prop (sign, silo, water tower)",
    ],
  },
  {
    family: "people",
    keywords: [
      "person",
      "girl",
      "boy",
      "baby",
      "family",
      "portrait",
      "face",
      "couple",
    ],
    backgroundMotifs: [
      "one prop from their setting (swing, desk, garden gate, window)",
      "a simple plant or doorway",
      "avoid crowded scenery behind faces",
    ],
  },
  {
    family: "abstract",
    keywords: [],
    backgroundMotifs: [
      "1–3 concrete props invented from the subject’s real-world setting",
      "habitat objects, tools, shelters, or scenery items that belong with the subject",
      "never abstract circles, arcs, disks, blobs, or unrelated geometric blocks",
    ],
  },
];

export function detectThemeFamily(subject: string): ThemeFamily {
  const text = subject.toLowerCase();
  for (const rule of THEME_RULES) {
    if (rule.family === "abstract") continue;
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.family;
    }
  }
  return "abstract";
}

/**
 * Background props for themed mode: prefer subject-specific concrete objects
 * (cow → barn / tractor / hay), then theme-family defaults. Never abstract filler.
 */
export function backgroundMotifsForSubject(subject: string): string[] {
  for (const hint of SUBJECT_BACKGROUND_HINTS) {
    if (hint.match.test(subject)) {
      return [...hint.motifs];
    }
  }

  const family = detectThemeFamily(subject);
  const rule =
    THEME_RULES.find((item) => item.family === family) ??
    THEME_RULES[THEME_RULES.length - 1];

  if (family === "abstract") {
    const trimmed = subject.trim() || "the subject";
    return [
      `Invent 1–3 large concrete props that naturally belong with "${trimmed}" (shelter, tools, habitat objects, or related scenery)`,
      "Props must be recognizable real-world things from that subject’s world",
      "Forbidden behind the subject: abstract circles, arcs, disks, blobs, random geometric blocks, or decorative filler with no thematic link",
    ];
  }

  return [...rule.backgroundMotifs];
}
