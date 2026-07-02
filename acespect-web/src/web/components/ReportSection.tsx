import type { DamageRecord, FormSection } from "../mockData";

/** Turn a damage record into a report sentence. */
function describeDamage(d: DamageRecord): string {
  const descriptor = `${d.direction ? d.direction.toLowerCase() + " " : ""}${d.type.toLowerCase()}`;
  const dims: string[] = [];
  if (d.widthMm > 0) dims.push(`approximately ${d.widthMm}mm wide`);
  if (d.lengthMm > 0) dims.push(`approximately ${d.lengthMm}mm long`);
  let s = `At ${d.location}, there is a ${descriptor}`;
  if (dims.length) s += `, ${dims.join(" and ")}`;
  s += ".";
  if (d.notes) s += ` ${d.notes}`;
  return s;
}

function PhotoGrid({ photos, compact }: { photos: string[]; compact: boolean }) {
  if (photos.length === 0) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 88 : 150}px, 1fr))`,
        gap: "8px",
        margin: "8px 0 12px",
      }}
    >
      {photos.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            objectFit: "cover",
            borderRadius: "6px",
            border: "1px solid #d7dbe2",
          }}
        />
      ))}
    </div>
  );
}

/**
 * A single inspection category rendered as report content: the description, then
 * its photographs, then each crack/damage described with its image. Used in both
 * the official report and the reviewer's Report Content column so they match.
 */
export function ReportSection({
  section,
  showHeading = true,
  compact = false,
}: {
  section: FormSection;
  showHeading?: boolean;
  compact?: boolean;
}) {
  const paras = section.reportText
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
        color: "#111",
        fontSize: compact ? "12.5px" : "15px",
        lineHeight: 1.5,
      }}
    >
      {showHeading && (
        <p style={{ fontWeight: 700, margin: "0 0 8px", textDecoration: "underline" }}>{section.name}</p>
      )}

      {/* Description */}
      {paras.map((p, i) => (
        <p key={i} style={{ margin: "0 0 10px", textAlign: "justify", lineHeight: 1.6 }}>
          {p}
        </p>
      ))}

      {/* Photographs for the category */}
      {section.photos.length > 0 && (
        <>
          <p style={{ fontWeight: 600, color: "#374151", margin: "4px 0 2px" }}>Please refer to Photographs:</p>
          <PhotoGrid photos={section.photos} compact={compact} />
        </>
      )}

      {/* Cracks / damages — described and imaged */}
      {section.damages.map((d) => (
        <div key={d.id} style={{ margin: "10px 0 0" }}>
          <p style={{ margin: "0 0 6px", textAlign: "justify", lineHeight: 1.6 }}>{describeDamage(d)}</p>
          <PhotoGrid photos={d.photos} compact={compact} />
        </div>
      ))}

      {section.photos.length === 0 && section.damages.length === 0 && paras.length === 0 && (
        <p style={{ color: "#94a3b8", fontStyle: "italic" }}>No content recorded for this category.</p>
      )}
    </div>
  );
}
