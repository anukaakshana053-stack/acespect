import { useNavigate } from "react-router";
import { PageShell } from "../../components/WebLayout";
import { INSPECTION_TYPES, PROPERTY_TYPES, isValidCombo } from "../../constants/inspectionData";

/**
 * Step 1 of the admin template flow: pick which profile (inspection type +
 * property type combo) is being modified. Each combo's 12 sections are
 * fully independent template lineages -- Dilapidation+Residential and
 * Dilapidation+Apartment never share content.
 */
export function AdminTemplateProfiles() {
  const navigate = useNavigate();

  return (
    <PageShell title="Templates" subtitle="Select which inspection profile's templates you want to modify">
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e5e7eb" }}>
                Inspection Type
              </th>
              {PROPERTY_TYPES.map((p) => (
                <th key={p.id} style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e5e7eb" }}>
                  {p.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INSPECTION_TYPES.map((t, idx) => (
              <tr key={t.id} style={{ borderBottom: idx < INSPECTION_TYPES.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "#1a2a4a" }}>{t.title}</td>
                {PROPERTY_TYPES.map((p) => {
                  const valid = isValidCombo(t.id, p.id);
                  return (
                    <td key={p.id} style={{ padding: "10px 16px", textAlign: "center" }}>
                      {valid ? (
                        <button
                          onClick={() => navigate(`/admin/templates/${t.id}/${p.id}`)}
                          style={{
                            padding: "8px 14px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb",
                            border: "1px solid #bfdbfe", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                        >
                          Manage
                        </button>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 600 }}>N/A</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
