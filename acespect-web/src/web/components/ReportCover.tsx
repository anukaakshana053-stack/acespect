import type { ReportHeader } from "../report";

/** A label : value row, mimicking the Word document layout. */
function Row({
  label,
  labelWidth,
  children,
}: {
  label: string;
  labelWidth: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td style={{ verticalAlign: "top", padding: "6px 0", width: `${labelWidth}px` }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
      </td>
      <td style={{ verticalAlign: "top", padding: "6px 6px", width: "10px", fontWeight: 700 }}>:</td>
      <td style={{ verticalAlign: "top", padding: "6px 0" }}>{children}</td>
    </tr>
  );
}

/**
 * The Dilapidation Report front matter (cover), generated from Job Information.
 * `compact` shrinks it for the reviewer's narrow Report Text panel; the default
 * full size is used on the official report page.
 */
export function ReportCover({ header: r, compact = false }: { header: ReportHeader; compact?: boolean }) {
  const labelW = compact ? 92 : 175;
  const fontSize = compact ? 12.5 : 15;
  const titleSize = compact ? 18 : 30;

  return (
    <div
      style={{
        fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
        color: "#111",
        fontSize: `${fontSize}px`,
        lineHeight: 1.5,
      }}
    >
      {/* Client + references */}
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          <Row label="Client" labelWidth={labelW}>
            <div>{r.clientName}</div>
            {r.clientAttn && <div style={{ fontStyle: "italic" }}>Attn: {r.clientAttn}</div>}
            {r.clientEmail && <div style={{ fontStyle: "italic" }}>Via email: {r.clientEmail}</div>}
          </Row>
          <Row label="Your Reference" labelWidth={labelW}>{r.yourReference}</Row>
          <Row label="Our Reference" labelWidth={labelW}>{r.ourReference}</Row>
        </tbody>
      </table>

      {/* Title box */}
      <div
        style={{
          border: "1.5px solid #111",
          textAlign: "center",
          padding: compact ? "9px 0" : "16px 0",
          margin: compact ? "16px 0 18px" : "30px 0 34px",
        }}
      >
        <span
          style={{
            fontSize: `${titleSize}px`,
            fontWeight: 700,
            fontFamily: "'Times New Roman', Georgia, serif",
          }}
        >
          {r.reportTitle}
        </span>
      </div>

      {/* Property details */}
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          <Row label="Property" labelWidth={labelW}>{r.property}</Row>
          <Row label="Property Owner" labelWidth={labelW}>
            <div>{r.propertyOwner ?? "—"}</div>
            {r.propertyOwnerEmail && (
              <div style={{ fontStyle: "italic" }}>Via email: {r.propertyOwnerEmail}</div>
            )}
          </Row>
          <Row label="Inspection Date" labelWidth={labelW}>{r.inspectionDate}</Row>
          <Row label="Weather Conditions" labelWidth={labelW}>{r.weather}</Row>
          <Row label="Inspector" labelWidth={labelW}>
            {r.inspector}
            {r.inspectorRegistration ? ` (Builder Registration No ${r.inspectorRegistration})` : ""}
          </Row>
        </tbody>
      </table>

      {/* Purpose */}
      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: compact ? "14px" : "22px" }}>
        <tbody>
          <Row label="Purpose" labelWidth={labelW}>
            <p style={{ margin: 0, textAlign: "justify", lineHeight: 1.6 }}>{r.purpose}</p>
          </Row>
        </tbody>
      </table>
    </div>
  );
}
