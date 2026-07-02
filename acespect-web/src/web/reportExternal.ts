/**
 * EXTERNAL report body template (Driveway & Paving, Fences, yard structures,
 * Pool/Spa, Elevations, Roof). Heavily templated: "{}" marks a fill-in field
 * (rendered as an inline blank), `fill` = yellow admin instruction/boilerplate,
 * `italic` = disclaimer text.
 */
export type ExtBlock =
  | { kind: "banner"; title: string }
  | { kind: "floor"; title: string }
  | { kind: "heading"; title: string; admin?: string }
  | { kind: "subheading"; title: string }
  | { kind: "para"; text: string }
  | { kind: "fill"; text: string }
  | { kind: "italic"; text: string };

const PHOTOS = "Please refer to Photographs {}.";
const CRACK =
  "At the {}, there is a crack starting at and running to the {}. The crack is {} millimetres wide and " +
  "{} millimetres long. " + PHOTOS;
const PAVING = (side: string) =>
  `There is paving to the ${side} of the block, constructed of {}. It is in satisfactory condition with ` +
  `typical wear and tear. Sections of the paving were obscured by {}. ${PHOTOS}`;
const FENCE = (side: string) =>
  `The ${side} fence is constructed of {} and is in satisfactory condition with typical weathering. ` +
  `Sections of the fence were obscured by {}. ${PHOTOS}`;
const FENCE_GATE = "A {} at {}. " + PHOTOS;
const ELEVATION_BASE = "Satisfactory and in typical condition. Sections were obscured by {}.";
const PARTY_WALL = (side: string) =>
  `The ${side} elevation is a party wall abutting the next property at No. {} and to the {}. To the ` +
  `sections observed, it appears to be in satisfactory and typical condition.`;
const ROOF_OBS =
  "Comments are based on limited observations from the ground only and using a camera zoom, or from " +
  "limited observations standing on a ladder to the lower roof and from the ground using a camera zoom, " +
  "or from balcony over sections of roofing, or from the upper balcony.";

export const EXTERNAL_BLOCKS: ExtBlock[] = [
  { kind: "banner", title: "EXTERNAL" },

  { kind: "heading", title: "Driveway and Paving" },
  { kind: "para", text: PHOTOS },
  { kind: "para", text: "There is no driveway." },
  {
    kind: "para",
    text:
      "The driveway is to the {} of the block and is constructed of {}. It is in satisfactory condition with " +
      "typical wear and tear. Sections of the driveway were obscured by {}. " + PHOTOS,
  },
  { kind: "para", text: CRACK },
  { kind: "para", text: PAVING("front") },
  { kind: "para", text: CRACK },
  { kind: "para", text: PAVING("left-hand side") },
  { kind: "para", text: CRACK },
  { kind: "para", text: PAVING("rear") },
  { kind: "para", text: CRACK },
  { kind: "para", text: PAVING("right-hand side") },
  { kind: "para", text: CRACK },

  { kind: "heading", title: "Fences" },
  { kind: "para", text: PHOTOS },
  { kind: "para", text: "There are no fences surrounding this property." },
  { kind: "para", text: "There is no front fence." },
  { kind: "para", text: FENCE("front") },
  { kind: "para", text: FENCE_GATE },
  { kind: "para", text: FENCE("left-hand") },
  { kind: "para", text: FENCE_GATE },
  { kind: "para", text: FENCE("rear") },
  { kind: "para", text: FENCE_GATE },
  { kind: "para", text: FENCE("right-hand") },
  { kind: "para", text: FENCE_GATE },
  {
    kind: "para",
    text:
      "There is a partition {} at the {} side of the house, running from the {} to the {}. The partition {} " +
      "is constructed of {} and is in satisfactory condition with typical weathering. " + PHOTOS,
  },

  { kind: "heading", title: "Retaining Walls" },
  { kind: "para", text: PHOTOS },
  {
    kind: "para",
    text:
      "There {} retaining wall/s to the front/left/rear/right {} constructed of {}. They are in satisfactory " +
      "condition with typical weathering. There is some decay. The walls are bowed/leaning {}. Sections were " +
      "obscured by vegetation/stored goods.",
  },

  { kind: "heading", title: "Garage" },
  { kind: "para", text: PHOTOS },
  {
    kind: "para",
    text:
      "There is a garage to the house at the {} constructed of {} with a {} and is generally in {} state of " +
      "repair. Sections of the walls and hardstand were obscured by {}.",
  },

  { kind: "heading", title: "Carport" },
  { kind: "para", text: PHOTOS },
  {
    kind: "para",
    text:
      "There is a carport to the house at the {} constructed of {} with a {} and is generally in {} state of " +
      "repair. A parked car/vehicle obscured part of the hardstand.",
  },

  { kind: "heading", title: "Other structures – Shed / Greenhouse / BBQ area", admin: "Admin to adjust heading" },
  { kind: "para", text: PHOTOS },
  {
    kind: "para",
    text:
      "There is a shed located at {}, constructed of {} with a {} and is generally in {} state of repair. " +
      "Sections of the walls and hardstand were obscured by {}.",
  },

  { kind: "heading", title: "Pergola / Verandah / Other", admin: "Admin to adjust heading" },
  { kind: "para", text: PHOTOS },
  {
    kind: "para",
    text:
      "There is a {} located at {}, constructed of {} which is generally in {} state of repair.",
  },

  { kind: "heading", title: "Decking" },
  { kind: "para", text: PHOTOS },
  {
    kind: "para",
    text:
      "There is a {} located at {}, constructed of {}, which is generally in {} state of repair. Sections " +
      "were obscured by plant pots / outdoor furniture / stored goods.",
  },

  { kind: "heading", title: "Pool / Spa" },
  { kind: "para", text: PHOTOS },
  {
    kind: "para",
    text:
      "There is a {} located at {}, constructed of {}, which is generally in {} state of repair. Observations " +
      "of the structure were obscured or limited by water in the {}.",
  },
  {
    kind: "para",
    text:
      "The {} fence is constructed of {} and {} condition with typical weathering. The {} surrounds are " +
      "paved with {}.",
  },
  {
    kind: "fill",
    text:
      "Example: The pool is not operational at the time of inspection, however the east gate of the pool " +
      "barrier has been removed which does not appear to comply with current safety regulations which is a " +
      "safety concern. Please refer to Photograph 1044 & Pool and Spa Safety Disclaimer.",
  },
  { kind: "fill", text: "Use the disclaimer below for pools / spas." },
  { kind: "subheading", title: "Pool and Spa Safety Disclaimer" },
  {
    kind: "italic",
    text:
      "The Houspect building inspector's comments are observations only, and any comments offered about the " +
      "pool area are of a general nature and should not be relied upon. All pools and spas in Victoria must be " +
      "registered with local council and certified for a pool safety barrier by a building surveyor or " +
      "registered pool inspector (licensed by the VBA). Pool safety is important and requirements vary. Please " +
      "seek advice from your local council. Houspect does not inspect pool pumps, filters, solar panels, pool " +
      "cleaning equipment, play equipment, etc. It is recommended that all electrical circuits and equipment " +
      "to the pool area be checked by a licensed electrician or pool specialist for function and performance.",
  },

  {
    kind: "heading",
    title: "House / Main Structure",
    admin: "Admin to adjust heading to suit the property description",
  },
  { kind: "subheading", title: "Front Elevation ( )" },
  { kind: "para", text: PHOTOS },
  { kind: "para", text: ELEVATION_BASE },
  { kind: "subheading", title: "Left Elevation ( )" },
  { kind: "para", text: PHOTOS },
  { kind: "para", text: ELEVATION_BASE },
  { kind: "para", text: PARTY_WALL("left") },
  { kind: "subheading", title: "Rear Elevation ( )" },
  { kind: "para", text: PHOTOS },
  { kind: "para", text: ELEVATION_BASE },
  { kind: "para", text: PARTY_WALL("rear") },
  { kind: "subheading", title: "Right Elevation ( )" },
  { kind: "para", text: PHOTOS },
  { kind: "para", text: ELEVATION_BASE },
  { kind: "para", text: PARTY_WALL("right") },

  { kind: "heading", title: "Roof Covering and Chimney", admin: "If no chimney, delete from sub-heading" },
  { kind: "para", text: PHOTOS },
  { kind: "para", text: "The roof covering appears to be in {} condition with {}." },
  { kind: "fill", text: ROOF_OBS },
  { kind: "fill", text: "There are no chimneys visible." },
  { kind: "para", text: "The lower level roofing generally appears to be in {} condition." },
  { kind: "fill", text: ROOF_OBS },
  {
    kind: "para",
    text:
      "The roof could not be inspected as the building is a multi-level building complex. Roof coverings in a " +
      "unit complex are common property and need to be maintained through the Owners Corporation.",
  },
  {
    kind: "para",
    text: "The chimney is constructed of {} and appears to be in {} condition with {}.",
  },
  { kind: "fill", text: ROOF_OBS },
];
