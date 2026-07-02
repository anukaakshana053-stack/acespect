import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InspectionDraftSelection } from '../types/inspection';
import { JobSetupData } from '../types/jobSetup';

/** Screens available before authentication. */
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  // ForgotPassword lands here next.
};

/** Screens available once authenticated. */
export type AppStackParamList = {
  SelectInspectionType: undefined;
  // Inspection Setup · Step 1 of 2 — receives the wizard's selection.
  JobInformation: { selection: InspectionDraftSelection };
  // Inspection Setup · Step 2 of 2 — receives the completed job setup.
  InspectionSetupStep2: { data: JobSetupData };
  // Inspection Sections hub — landing screen after setup. `completedId` is set
  // when a finished section navigates back to update progress.
  InspectionSections: { data: JobSetupData; completedId?: string };
  // Individual section screens.
  DrivewaySection: undefined;
  PavingPaths: undefined;
  Fences: undefined;
  RetainingWalls: undefined;
  GarageCarport: undefined;
  Elevations: undefined;
  RoofChimneys: undefined;
  PoolSpa: undefined;
  InternalAreas: undefined;
  NotesPostProject: undefined;
  // Final overview — receives the live completion map + job setup data.
  ReportSummary: { completed: Record<string, boolean>; data: JobSetupData };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;
