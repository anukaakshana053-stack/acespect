/**
 * Types for the Job Information setup screen (Inspection Setup · Step 1 of 2).
 */
import { InspectionDraftSelection } from './inspection';

export type WeatherId =
  | 'sunny'
  | 'overcast'
  | 'dry'
  | 'intermittent_showers'
  | 'rain'
  | 'other';

export type PropertyUse = 'yes' | 'no';

/** Pre-loaded job details (from the admin platform). Editable on-site. */
export interface JobDetails {
  jobNumber: string;
  inspectionDate: string; // ISO-ish display string for now
  clientName: string;
  inspectionAddress: string;
  assignedInspector: string; // read-only (admin-assigned)
  gpsConfirmed: boolean;
}

/** Auto-initialized system status captured when the inspection begins. */
export interface SystemStatus {
  startedAt: string;
  gpsLocation: string;
  photoSequence: string;
  cloudSync: 'Connected' | 'Offline';
  offlineSave: 'Active' | 'Inactive';
}

/** Everything the Job Information step produces, handed to step 2. */
export interface JobSetupData {
  selection: InspectionDraftSelection;
  details: JobDetails;
  weather: WeatherId;
  usedAsBusiness: PropertyUse;
  systemStatus: SystemStatus;
}
