import type { Inspection } from "./mockData";
import { getUser } from "./mockData";

/** The front-matter of a Dilapidation Report, derived from Job Information. */
export interface ReportHeader {
  reportTitle: string;
  clientName: string;
  clientAttn?: string;
  clientEmail?: string;
  yourReference: string;
  ourReference: string;
  property: string;
  propertyOwner?: string;
  propertyOwnerEmail?: string;
  inspectionDate: string; // already formatted
  weather: string;
  inspector: string;
  inspectorRegistration?: string;
  purpose: string;
}

/** Standard boilerplate used when the Job Information section has no custom purpose. */
export const DEFAULT_PURPOSE =
  "The purpose of the inspection is to identify cracking, gaps and dilapidation in the main " +
  "structures on the property, so as to establish the current condition of the site in relation " +
  "to project works nearby, insofar as a licensed builder can reasonably identify the defects and " +
  "current state of the property. This report documents existing visible cracks and gaps to areas " +
  "in scope and may include internal walls, ceilings and floors, external walls, garage, driveway, " +
  "paths and fencing and is the result of a visual survey only.";

/* ── Description & Overview section boilerplate / template placeholders ── */

export const DESCRIPTION_PHOTO_PLACEHOLDER =
  "Insert photograph of front of property (from street view). Size 9.3cm";

export const PHOTOGRAPHS_NOTE =
  "You may view/save individual photographs by clicking on a file in the list. To save a copy of all " +
  "photographs, click the Download All button above the list of files and follow the prompts. The " +
  "security settings on your computer may display a bar at the top of the window, indicating that you " +
  "need to allow your browser to download from the site. If this message appears, please allow " +
  "downloads temporarily from this site. If a window does not then appear asking where you would like " +
  "the download saved, simply click on the Download All button again to commence the download.";

export const SCOPE_BOILERPLATE =
  "The scope for inspection is external and internal to all structures / external and internal to part " +
  "of the property at / internal only to all areas / external only to all areas. OR insert description of scope.";

export const SCOPE_PHOTOS_REF =
  "Selected photographs are displayed in this report. For a full download of photographs provided by " +
  "the Houspect survey please go to the link in the Photographs heading on page 2 of the report.";

export const SITE_IMAGE_NOTE =
  "Please do not anchor images. Just insert them the same way as a photograph so they can be easily " +
  "sized and moved. (Admin: adjust photo size to 5.9cm for landscape & 5.2cm for portrait.)";

/** "2024-06-15" → "Thursday, 18 June, 2026" (en-AU style with comma before year). */
export function formatLongDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday}, ${d.getDate()} ${month}, ${d.getFullYear()}`;
}

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

/**
 * Build the report front-matter from an inspection's Job Information section,
 * falling back to top-level inspection data when a field isn't recorded.
 */
export function buildReportHeader(inspection: Inspection): ReportHeader {
  const jobInfo = inspection.sections.find((s) => (s.key ?? s.id).startsWith("job-info"));
  const f = jobInfo?.fields ?? {};
  const inspector = getUser(inspection.inspectorId);

  return {
    reportTitle:
      inspection.type === "Dilapidation" ? "Dilapidation Report" : `${inspection.type} Report`,
    clientName: str(f.clientName, inspection.client),
    clientAttn: str(f.clientAttn) || undefined,
    clientEmail: str(f.clientEmail) || undefined,
    yourReference: str(f.yourReference, inspection.jobNo),
    ourReference: str(f.ourReference, inspection.jobNo),
    property: str(f.address, `${inspection.address}, ${inspection.suburb}`),
    propertyOwner: str(f.propertyOwner) || undefined,
    propertyOwnerEmail: str(f.propertyOwnerEmail) || undefined,
    inspectionDate: formatLongDate(str(f.date, inspection.date)),
    weather: str(f.weather, "—"),
    inspector: str(f.inspector, inspector?.name ?? "—"),
    inspectorRegistration: str(f.inspectorRegistration) || undefined,
    purpose: str(f.purpose) || DEFAULT_PURPOSE,
  };
}
