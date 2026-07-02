import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/**
 * In-memory draft of the inspection being filled. Each section screen writes its
 * data via `setSection`; the shared photo-capture hook feeds `addPhoto` (keyed
 * by sectionKey). `ReportSummaryScreen` reads it all at submit time and POSTs the
 * structured inspection. (Online submit — not offline-first yet.)
 */
export interface DraftDamage {
  type: string;
  location?: string;
  direction?: string;
  widthMm?: number;
  lengthMm?: number;
  notes?: string;
  photos?: string[]; // local file:// URIs until uploaded
}

export interface DraftSection {
  key: string;
  name: string;
  icon?: string;
  order: number;
  status?: 'complete' | 'partial' | 'pending';
  reportText?: string;
  fields?: Record<string, unknown>;
  photos?: string[]; // local file:// URIs until uploaded
  damages?: DraftDamage[];
}

export interface DraftTop {
  inspectionType: string;
  propertyType: string;
  jobNo?: string;
  address?: string;
  suburb?: string;
  client?: string;
  date?: string;
  notes?: string;
  overallProgress?: number;
}

export interface SubmitPayload extends DraftTop {
  sections: DraftSection[];
}

interface DraftValue {
  setTop: (patch: Partial<DraftTop>) => void;
  setSection: (section: DraftSection) => void;
  /** Register a captured photo under its sectionKey (e.g. "driveway:1", "overview"). */
  addPhoto: (sectionKey: string, uri: string) => void;
  reset: () => void;
  /** All local photo URIs across sections + damages + the registry (to upload). */
  collectPhotoUris: () => string[];
  /** Build the submit payload, mapping each local photo URI via `resolve`. */
  buildPayload: (resolve: (uri: string) => string) => SubmitPayload;
}

const Ctx = createContext<DraftValue | null>(null);

export function useInspectionDraft(): DraftValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useInspectionDraft must be used within InspectionDraftProvider');
  return ctx;
}

export function InspectionDraftProvider({ children }: { children: React.ReactNode }) {
  const topRef = useRef<DraftTop>({ inspectionType: 'Dilapidation', propertyType: 'Residential House' });
  const sectionsRef = useRef<Record<string, DraftSection>>({});
  const photosRef = useRef<Record<string, string[]>>({});

  const setTop = useCallback((patch: Partial<DraftTop>) => {
    topRef.current = { ...topRef.current, ...patch };
  }, []);

  const setSection = useCallback((section: DraftSection) => {
    sectionsRef.current = { ...sectionsRef.current, [section.key]: section };
  }, []);

  const addPhoto = useCallback((sectionKey: string, uri: string) => {
    const cur = photosRef.current[sectionKey] ?? [];
    photosRef.current = { ...photosRef.current, [sectionKey]: [...cur, uri] };
  }, []);

  const reset = useCallback(() => {
    topRef.current = { inspectionType: 'Dilapidation', propertyType: 'Residential House' };
    sectionsRef.current = {};
    photosRef.current = {};
  }, []);

  // Photos registered under a section key or any "key:n" sub-key.
  const photosForSection = useCallback((key: string): string[] => {
    return Object.entries(photosRef.current)
      .filter(([k]) => k === key || k.startsWith(`${key}:`))
      .flatMap(([, uris]) => uris);
  }, []);

  const collectPhotoUris = useCallback((): string[] => {
    const uris = new Set<string>();
    Object.values(photosRef.current).forEach((arr) => arr.forEach((u) => uris.add(u)));
    Object.values(sectionsRef.current).forEach((s) => {
      (s.photos ?? []).forEach((u) => uris.add(u));
      (s.damages ?? []).forEach((d) => (d.photos ?? []).forEach((u) => uris.add(u)));
    });
    return [...uris].filter((u) => u.startsWith('file:'));
  }, []);

  const buildPayload = useCallback(
    (resolve: (uri: string) => string): SubmitPayload => ({
      ...topRef.current,
      sections: Object.values(sectionsRef.current)
        .sort((a, b) => a.order - b.order)
        .map((s) => {
          const photos = [...new Set([...(s.photos ?? []), ...photosForSection(s.key)])].map(resolve);
          return {
            ...s,
            photos,
            damages: (s.damages ?? []).map((d) => ({ ...d, photos: (d.photos ?? []).map(resolve) })),
          };
        }),
    }),
    [photosForSection],
  );

  // Force re-render is unnecessary — writers use refs, the reader (submit) pulls
  // current values on demand. Keep a stable value object.
  const value = useMemo<DraftValue>(
    () => ({ setTop, setSection, addPhoto, reset, collectPhotoUris, buildPayload }),
    [setTop, setSection, addPhoto, reset, collectPhotoUris, buildPayload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
