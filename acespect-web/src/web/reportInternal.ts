import type { ExtBlock } from "./reportExternal";

/**
 * INTERNAL report body template — floor banners (Ground Floor / First Floor)
 * and per-room blocks. "{}" marks a fill-in field.
 */
const PHOTOS = "Please refer to Photographs {}.";
const CRACK =
  "At the {}, there is a crack starting at and running to the {}. The crack is approximately {} " +
  "millimetres wide and approximately {} millimetres long. " + PHOTOS;

/** One room: heading, photos line, condition (+ optional "obscured by"), crack line. */
function room(title: string, opts: { admin?: string; obscured?: string | null } = {}): ExtBlock[] {
  let condition = "Satisfactory and in typical condition.";
  if (opts.obscured !== null && opts.obscured !== undefined) {
    condition += ` Sections were obscured by ${opts.obscured}.`;
  }
  return [
    { kind: "heading", title, admin: opts.admin },
    { kind: "para", text: PHOTOS },
    { kind: "para", text: condition },
    { kind: "para", text: CRACK },
  ];
}

export const INTERNAL_BLOCKS: ExtBlock[] = [
  { kind: "banner", title: "INTERNAL" },

  { kind: "floor", title: "Ground Floor" },
  ...room("Entry and Hallway", { obscured: "furniture and stored goods" }),
  ...room("Kitchen, Living and Dining", {
    admin: "Admin to adjust heading to suit the property",
    obscured: "furniture, appliances and stored goods",
  }),
  ...room("Bedroom 1 and ensuite", { obscured: "furniture and stored goods" }),
  ...room("Bedroom 2", { obscured: "furniture and stored goods" }),
  ...room("Bedroom 3", { obscured: "furniture and stored goods" }),
  ...room("Bedroom 4", { obscured: "furniture and stored goods" }),
  ...room("Study", { obscured: "furniture and stored goods" }),
  ...room("Bathroom", { obscured: "stored goods" }),
  ...room("Toilet", { obscured: null }),
  ...room("Laundry", { obscured: "appliances and stored goods" }),
  ...room("Other room", { obscured: "furniture and stored goods" }),

  { kind: "floor", title: "First Floor" },
  ...room("Stairwell", { obscured: null }),
  ...room("Bathroom", { obscured: "stored goods" }),
  ...room("Balcony", { obscured: "{}" }),
  ...room("Other room", { obscured: "furniture and stored goods" }),
];
