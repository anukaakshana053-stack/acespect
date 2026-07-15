/**
 * The 12 real data-entry section keys that get templates. These are the
 * actual `Section.key` values written by `draft.setSection({ key, ... })`
 * on mobile (and read back by `buildReportHeader`/`ReviewerFormView` on
 * web) -- NOT the `id` values in acespect-mobile's
 * `constants/inspectionSections.ts` hub registry, which differ for three
 * of them (job_information -> job-info, description_overview ->
 * description, notes_defects -> notes). Report Summary & Sign-Off is
 * deliberately excluded: it's a declaration + signature screen that never
 * calls setSection, not a data section.
 */
export const TEMPLATABLE_SECTIONS: { key: string; name: string }[] = [
  { key: 'job-info', name: 'Job Information' },
  { key: 'description', name: 'Description & Overview' },
  { key: 'driveway', name: 'Driveway' },
  { key: 'paving_paths', name: 'Paving & Paths' },
  { key: 'fences', name: 'Fences' },
  { key: 'retaining_walls', name: 'Retaining Walls' },
  { key: 'garage_carport_sheds', name: 'Garage / Carport / Sheds' },
  { key: 'pool_spa', name: 'Pool / Spa' },
  { key: 'elevations', name: 'Elevations' },
  { key: 'roof_chimneys', name: 'Roof Covering & Chimneys' },
  { key: 'internal_areas', name: 'Internal Areas' },
  { key: 'notes', name: 'Notes / Post Project / Defects' },
];

export const TEMPLATABLE_SECTION_KEYS: string[] = TEMPLATABLE_SECTIONS.map((s) => s.key);
