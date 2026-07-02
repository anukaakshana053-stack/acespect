/**
 * Static config + mock pre-loaded data for the Job Information screen.
 * The job details here stand in for an admin-platform fetch
 * (GET /jobs/:id) until the backend lands.
 */
import { TileOption } from '../components/inspection/ChoiceTile';
import { JobDetails } from '../types/jobSetup';

export const WEATHER_OPTIONS: TileOption[] = [
  { value: 'sunny', label: 'Sunny', icon: 'sunny-outline' },
  { value: 'overcast', label: 'Overcast', icon: 'cloud-outline' },
  { value: 'dry', label: 'Dry', icon: 'reorder-two-outline' },
  { value: 'intermittent_showers', label: 'Intermittent Showers', icon: 'rainy-outline' },
  { value: 'rain', label: 'Rain', icon: 'water-outline' },
  { value: 'other', label: 'Other', icon: 'help-circle-outline' },
];

/** Mock job pulled from the admin platform. Replace with a real fetch later. */
export const MOCK_JOB_DETAILS: JobDetails = {
  jobNumber: 'JOB-2026-0145',
  inspectionDate: '05/28/2026',
  clientName: 'Sarah & Mark Thompson',
  inspectionAddress: '47 Riverside Drive, Kew VIC 3101',
  assignedInspector: 'James Mitchell',
  gpsConfirmed: true,
};

// System status is no longer mocked — see src/hooks/useSystemStatus.ts for the
// live device clock / GPS / network / photo-count / offline-storage values.
