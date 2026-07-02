import type { FormSection, SectionReviewStatus } from "./mockData";

/**
 * Tiny localStorage-backed store for the reviewer's per-section edits + approvals.
 * Mock-data-first stand-in for the backend: it lets the review screen's edits and
 * approvals flow into the official report page (and survive navigation/refresh).
 */
const KEY = "acespect_report_reviews";

export interface SectionReview {
  reportText: string;
  reviewStatus: SectionReviewStatus;
}
type Store = Record<string, Record<string, SectionReview>>;

function read(): Store {
  if (typeof localStorage === "undefined") return {};
  try {
    return (JSON.parse(localStorage.getItem(KEY) || "{}") as Store) ?? {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/** Reviewer overrides for one inspection, keyed by section id. */
export function getInspectionReview(inspectionId: string): Record<string, SectionReview> {
  return read()[inspectionId] ?? {};
}

/** Persist the current report text + review status for every section. */
export function saveInspectionReview(inspectionId: string, sections: FormSection[]) {
  const store = read();
  store[inspectionId] = Object.fromEntries(
    sections.map((s) => [s.id, { reportText: s.reportText, reviewStatus: s.reviewStatus }]),
  );
  write(store);
}
