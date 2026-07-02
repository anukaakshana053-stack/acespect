import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { CapturedPhoto } from '../types/photo';
import { database } from '../db';
import { persistPhoto } from '../db/photoRepo';
import { useInspectionDraft } from '../context/InspectionDraftContext';

/**
 * Camera + gallery capture via the OS pickers (works in Expo Go).
 *
 * Both entry points return a normalized {@link CapturedPhoto} or `null` when the
 * user cancels. On a hard permission denial we surface an Alert and return null.
 * Successful captures are copied into the app document directory so the URI is
 * stable (raw camera/cache URIs are transient) — that saved path is what
 * WatermelonDB will persist in Phase 2.
 */

const PHOTO_DIR = 'inspection-photos';

/** Copy a picked asset into document storage and return the stable file URI. */
function persistToDocuments(sourceUri: string, id: string): string {
  // The document-directory File API is native-only; on web (dev runs) the
  // picked blob URI is already usable, so pass it through untouched.
  if (Platform.OS === 'web') return sourceUri;

  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create({ intermediates: true });

  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = new File(dir, `${id}.${ext}`);
  new File(sourceUri).copy(dest);
  return dest.uri;
}

function toCapturedPhoto(
  asset: ImagePicker.ImagePickerAsset,
  opts?: { caption?: string; category?: string },
): CapturedPhoto {
  const id = Crypto.randomUUID();
  return {
    id,
    uri: persistToDocuments(asset.uri, id),
    caption: opts?.caption ?? '',
    capturedAt: new Date().toISOString(),
    category: opts?.category,
  };
}

export interface CaptureOptions {
  caption?: string;
  category?: string;
  /** When set, the photo is also persisted to WatermelonDB under this section. */
  sectionKey?: string;
  /** Position within the section (best-effort ordering for persistence). */
  sortOrder?: number;
}

/**
 * Best-effort persist to the local DB. No-ops in Expo Go (database === null)
 * and swallows errors so a DB hiccup never blocks the capture UX.
 */
async function maybePersist(photo: CapturedPhoto, opts?: CaptureOptions): Promise<void> {
  if (!opts?.sectionKey || !database) return;
  try {
    await persistPhoto(database, {
      sectionKey: opts.sectionKey,
      photo,
      sortOrder: opts.sortOrder ?? 0,
    });
  } catch (err) {
    console.warn('[usePhotoCapture] failed to persist photo', err);
  }
}

export function usePhotoCapture() {
  const { addPhoto } = useInspectionDraft();

  // Persist locally + register the photo in the inspection draft (by sectionKey)
  // so it's uploaded and attached to the right section at submit time.
  const register = useCallback(
    async (photo: CapturedPhoto, opts?: CaptureOptions) => {
      await maybePersist(photo, opts);
      if (opts?.sectionKey) addPhoto(opts.sectionKey, photo.uri);
    },
    [addPhoto],
  );

  const takePhoto = useCallback(
    async (opts?: CaptureOptions): Promise<CapturedPhoto | null> => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera access needed',
          'Enable camera access in Settings to capture inspection photos.',
        );
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: true,
      });
      if (result.canceled || !result.assets?.length) return null;
      const photo = toCapturedPhoto(result.assets[0], opts);
      await register(photo, opts);
      return photo;
    },
    [register],
  );

  const pickFromLibrary = useCallback(
    async (opts?: CaptureOptions): Promise<CapturedPhoto | null> => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photo access needed',
          'Enable photo-library access in Settings to attach existing photos.',
        );
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return null;
      const photo = toCapturedPhoto(result.assets[0], opts);
      await register(photo, opts);
      return photo;
    },
    [register],
  );

  return { takePhoto, pickFromLibrary };
}
