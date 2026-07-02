import { CONDITIONS, CONDITIONS_TITLE, type ConditionClause } from "../reportConditions";

function Clause({ c }: { c: ConditionClause }) {
  return (
    <div style={{ display: "flex", gap: "10px", margin: "0 0 11px" }}>
      <span style={{ width: "30px", flexShrink: 0 }}>{c.n}.</span>
      <div style={{ flex: 1 }}>
        {c.text && <p style={{ margin: 0, textAlign: "justify", lineHeight: 1.6 }}>{c.text}</p>}
        {c.items?.map((it) => (
          <div key={it.label} style={{ display: "flex", gap: "8px", margin: "6px 0 0", paddingLeft: "18px" }}>
            <span style={{ width: "26px", flexShrink: 0 }}>{it.label}</span>
            <p style={{ margin: 0, flex: 1, textAlign: "justify", lineHeight: 1.6 }}>{it.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Standard "Conditions for the Provision of the Report" appendix. */
export function ReportConditions({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
        color: "#111",
        fontSize: compact ? "11.5px" : "14px",
        lineHeight: 1.5,
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 700,
          textDecoration: "underline",
          fontSize: compact ? "14px" : "18px",
          margin: "8px 0 18px",
          fontFamily: "'Times New Roman', Georgia, serif",
        }}
      >
        {CONDITIONS_TITLE}
      </h2>
      {CONDITIONS.map((c) => (
        <Clause key={c.n} c={c} />
      ))}
    </div>
  );
}
