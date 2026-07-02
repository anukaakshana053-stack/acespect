/**
 * The 13 inspection sections, grouped, that drive the "Inspection Sections" hub
 * (reached after Setup Step 2). `route` is set only for sections that have a
 * real screen wired into the navigator today; the rest are placeholders until
 * their screens are built.
 */
import { AppStackParamList } from '../navigation/types';

export interface InspectionSectionItem {
  id: string;
  number: number;
  title: string;
  /** Navigable target when a screen exists; undefined = not built yet. */
  route?: keyof AppStackParamList;
}

export interface InspectionSectionGroup {
  title: string;
  sections: InspectionSectionItem[];
}

export const INSPECTION_SECTION_GROUPS: InspectionSectionGroup[] = [
  {
    title: 'Job Information',
    sections: [{ id: 'job_information', number: 1, title: 'Job Information' }],
  },
  {
    title: 'Description & Overview',
    sections: [{ id: 'description_overview', number: 2, title: 'Description & Overview' }],
  },
  {
    title: 'External Inspection',
    sections: [
      { id: 'driveway', number: 3, title: 'Driveway', route: 'DrivewaySection' },
      { id: 'paving_paths', number: 4, title: 'Paving & Paths', route: 'PavingPaths' },
      { id: 'fences', number: 5, title: 'Fences', route: 'Fences' },
      { id: 'retaining_walls', number: 6, title: 'Retaining Walls', route: 'RetainingWalls' },
      { id: 'garage_carport_sheds', number: 7, title: 'Garage / Carport / Sheds', route: 'GarageCarport' },
      { id: 'pool_spa', number: 8, title: 'Pool / Spa', route: 'PoolSpa' },
    ],
  },
  {
    title: 'Main Structure / Elevations',
    sections: [
      { id: 'elevations', number: 9, title: 'Elevations (Front/Left/Rear/Right)', route: 'Elevations' },
    ],
  },
  {
    title: 'Roof Covering & Chimneys',
    sections: [{ id: 'roof_chimneys', number: 10, title: 'Roof Covering & Chimneys', route: 'RoofChimneys' }],
  },
  {
    title: 'Internal Inspection',
    sections: [{ id: 'internal_areas', number: 11, title: 'Internal Areas', route: 'InternalAreas' }],
  },
  {
    title: 'Notes & Post Project',
    sections: [{ id: 'notes_defects', number: 12, title: 'Notes / Post Project / Defects', route: 'NotesPostProject' }],
  },
  {
    title: 'Review & Submit',
    sections: [{ id: 'report_signoff', number: 13, title: 'Report Summary & Sign-Off', route: 'ReportSummary' }],
  },
];

/** Flat list of every section, in order. */
export const INSPECTION_SECTIONS: InspectionSectionItem[] = INSPECTION_SECTION_GROUPS.flatMap(
  (g) => g.sections,
);

export const TOTAL_SECTIONS = INSPECTION_SECTIONS.length;
