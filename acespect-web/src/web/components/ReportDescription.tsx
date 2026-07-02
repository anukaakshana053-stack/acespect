import type { Inspection } from "../mockData";
import {
  DESCRIPTION_PHOTO_PLACEHOLDER,
  PHOTOGRAPHS_NOTE,
  SCOPE_BOILERPLATE,
  SCOPE_PHOTOS_REF,
  SITE_IMAGE_NOTE,
} from "../report";

/** Blue full-width section heading (matches the Word blue-highlight headings). */
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#cfe2f3",
        color: "#0f1d35",
        fontWeight: 700,
        padding: "4px 8px",
        margin: "18px 0 10px",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </div>
  );
}

/** Yellow-highlighted template instruction / fill-in. */
function Fill({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ background: "#fff2a8", padding: "4px 6px", margin: "0 0 10px", lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function Para({ children, justify = true }: { children: React.ReactNode; justify?: boolean }) {
  return (
    <p style={{ margin: "0 0 10px", textAlign: justify ? "justify" : "left", lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontStyle: "italic", fontSize: "0.85em", color: "#555", margin: "0 0 10px", lineHeight: 1.5 }}>
      {children}
    </p>
  );
}

/**
 * The Description & Overview report section, in the standard Houspect layout:
 * description + photo placeholder, the Photographs notice, the Scope of
 * Inspection block, and the Site Image placeholder. The property description
 * paragraph comes from the section's (reviewer-editable) report text.
 */
export function ReportDescription({
  inspection,
  reportText,
  compact = false,
}: {
  inspection: Inspection;
  reportText: string;
  compact?: boolean;
}) {
  const paras = reportText
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const property = `${inspection.address}, ${inspection.suburb}`;

  return (
    <div
      style={{
        fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
        color: "#111",
        fontSize: compact ? "12.5px" : "15px",
        lineHeight: 1.5,
      }}
    >
      <Heading>DESCRIPTION AND OVERVIEW</Heading>
      {paras.length > 0 ? (
        paras.map((p, i) => <Para key={i}>{p}</Para>)
      ) : (
        <Fill>Insert property description (storeys, orientation, construction, roof, windows).</Fill>
      )}
      <Fill>{DESCRIPTION_PHOTO_PLACEHOLDER}</Fill>

      <Heading>PHOTOGRAPHS</Heading>
      <Para>
        Selected photographs are included in the body of this report. For a full download please{" "}
        <a style={{ color: "#2563eb", textDecoration: "underline" }} href="#photos" onClick={(e) => e.preventDefault()}>
          Click here
        </a>{" "}
        to access. We recommend that you download the digital photographs immediately and save in a secure
        folder on your device, as the link will remain active for only a few months from the date of this report.
      </Para>
      <Note>{PHOTOGRAPHS_NOTE}</Note>

      <Heading>SCOPE OF INSPECTION AND COMMENTS</Heading>
      <Fill>
        The project works are to the property at {property}, which is at the [direction] – approximately
        [compass point] – of the site of this inspection.
      </Fill>
      <Para>{SCOPE_BOILERPLATE}</Para>
      <Para>{SCOPE_PHOTOS_REF}</Para>

      <div
        style={{
          background: "#fff2a8",
          color: "#0f1d35",
          fontWeight: 700,
          padding: "4px 8px",
          margin: "18px 0 10px",
        }}
      >
        Site Image
      </div>
      <Fill>Mark-up by inspector indicating areas surveyed.</Fill>
      <Para justify={false}>North is approximately to the top of the image.</Para>
      <Note>{SITE_IMAGE_NOTE}</Note>
    </div>
  );
}
