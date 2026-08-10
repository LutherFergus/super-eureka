/** Common yarn / craft colors with display names for palette picks. */
export type YarnColor = {
  id: string;
  name: string;
  hex: string;
};

export const YARN_COLORS: YarnColor[] = [
  { id: "white", name: "White", hex: "#FFFFFF" },
  { id: "ivory", name: "Ivory", hex: "#FFFFF0" },
  { id: "cream", name: "Cream", hex: "#F5F0E1" },
  { id: "beige", name: "Beige", hex: "#E8D9C0" },
  { id: "tan", name: "Tan", hex: "#D2B48C" },
  { id: "brown", name: "Brown", hex: "#8B5E3C" },
  { id: "chocolate", name: "Chocolate", hex: "#5C3317" },
  { id: "black", name: "Black", hex: "#1A1A1A" },
  { id: "charcoal", name: "Charcoal", hex: "#36454F" },
  { id: "gray", name: "Gray", hex: "#808080" },
  { id: "light-gray", name: "Light Gray", hex: "#C0C0C0" },
  { id: "silver", name: "Silver", hex: "#A8A9AD" },
  { id: "navy", name: "Navy", hex: "#001F3F" },
  { id: "royal-blue", name: "Royal Blue", hex: "#2B4C8C" },
  { id: "blue", name: "Blue", hex: "#3A6EA5" },
  { id: "sky-blue", name: "Sky Blue", hex: "#87CEEB" },
  { id: "baby-blue", name: "Baby Blue", hex: "#A8D4F0" },
  { id: "teal", name: "Teal", hex: "#1F7A66" },
  { id: "turquoise", name: "Turquoise", hex: "#40E0D0" },
  { id: "aqua", name: "Aqua", hex: "#7FDBFF" },
  { id: "forest-green", name: "Forest Green", hex: "#228B22" },
  { id: "green", name: "Green", hex: "#3D8B5A" },
  { id: "sage", name: "Sage", hex: "#9CAF88" },
  { id: "olive", name: "Olive", hex: "#6B8E23" },
  { id: "mint", name: "Mint", hex: "#98D7C2" },
  { id: "lime", name: "Lime", hex: "#B5E61D" },
  { id: "yellow", name: "Yellow", hex: "#F4D35E" },
  { id: "gold", name: "Gold", hex: "#D4A017" },
  { id: "mustard", name: "Mustard", hex: "#C4A35A" },
  { id: "orange", name: "Orange", hex: "#E07A3D" },
  { id: "peach", name: "Peach", hex: "#FFCBA4" },
  { id: "coral", name: "Coral", hex: "#FF7F50" },
  { id: "red", name: "Red", hex: "#C41E3A" },
  { id: "burgundy", name: "Burgundy", hex: "#800020" },
  { id: "maroon", name: "Maroon", hex: "#7A1F2B" },
  { id: "pink", name: "Pink", hex: "#F4A7B9" },
  { id: "hot-pink", name: "Hot Pink", hex: "#FF69B4" },
  { id: "rose", name: "Rose", hex: "#E8A0BF" },
  { id: "magenta", name: "Magenta", hex: "#C71585" },
  { id: "purple", name: "Purple", hex: "#6B3FA0" },
  { id: "lavender", name: "Lavender", hex: "#B57EDC" },
  { id: "lilac", name: "Lilac", hex: "#C8A2C8" },
  { id: "plum", name: "Plum", hex: "#8E4585" },
];

export const YARN_COLOR_BY_ID: Record<string, YarnColor> = Object.fromEntries(
  YARN_COLORS.map((color) => [color.id, color]),
);

/** Sensible starting picks per color-count. */
export const DEFAULT_COLOR_IDS: Record<2 | 3 | 4 | 5, string[]> = {
  2: ["navy", "cream"],
  3: ["navy", "cream", "coral"],
  4: ["navy", "cream", "coral", "sage"],
  5: ["navy", "cream", "coral", "sage", "gold"],
};

export function resolveYarnColor(id: string): YarnColor {
  return YARN_COLOR_BY_ID[id] ?? YARN_COLORS[0];
}

export function resizePaletteIds(
  current: string[],
  count: 2 | 3 | 4 | 5,
): string[] {
  const defaults = DEFAULT_COLOR_IDS[count];
  const next = current.slice(0, count);
  while (next.length < count) {
    const candidate =
      defaults[next.length] ??
      YARN_COLORS.find((color) => !next.includes(color.id))?.id ??
      YARN_COLORS[0].id;
    next.push(candidate);
  }
  return next;
}
