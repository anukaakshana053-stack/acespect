import { api } from './apiClient';
import type { SubmitPayload } from '../context/InspectionDraftContext';

/** Upload one local photo (file:// URI) to the backend → returns its public URL. */
export async function uploadPhoto(uri: string): Promise<string> {
  const name = uri.split('/').pop() || 'photo.jpg';
  const rawExt = (name.split('.').pop() || 'jpg').toLowerCase();
  const mime = rawExt === 'jpg' ? 'image/jpeg' : `image/${rawExt}`;

  const form = new FormData();
  // React Native's FormData accepts { uri, name, type } for file parts.
  form.append('photo', { uri, name, type: mime } as unknown as Blob);

  const { data } = await api.post<{ url: string }>('/inspections/photos', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

/** Submit the structured inspection. Returns the created inspection id. */
export async function submitInspection(
  payload: SubmitPayload,
): Promise<{ inspectionId: string; reviewJobId: string; status: string }> {
  const { data } = await api.post('/inspections/submit', payload);
  return data;
}
