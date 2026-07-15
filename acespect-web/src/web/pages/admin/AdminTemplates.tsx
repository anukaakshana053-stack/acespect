import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Pencil, Eye, FileText, Clock, Plus } from "lucide-react";
import { PageShell, TableCard, StatusBadge } from "../../components/WebLayout";
import { TEMPLATE_STATUS_CONFIG, type Template } from "../../mockData";
import { api } from "../../api";

// Pilot scope: only the "job-info" section has a template today. Future
// sections would list here too once phase 2 extends the template system.
const SECTION_KEY = "job-info";
const SECTION_NAME = "Job Information";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getTemplates(SECTION_KEY).then(setTemplates).finally(() => setLoading(false));
  }, []);

  const published = templates.find((t) => t.status === "published");
  const draft = templates.find((t) => t.status === "draft");

  async function editPublished() {
    if (!published) return;
    // Editing a published template means starting a new draft version cloned
    // from it -- publishing never mutates the live version in place.
    if (draft) {
      navigate(`/admin/templates/${draft.id}`);
      return;
    }
    setBusy(true);
    try {
      const created = await api.createTemplate({
        sectionKey: published.sectionKey,
        name: published.name,
        fields: published.fields,
      });
      navigate(`/admin/templates/${created.id}`);
    } finally {
      setBusy(false);
    }
  }

  /** No template exists yet for this section at all -- start a blank draft. */
  async function createFromScratch() {
    setBusy(true);
    try {
      const created = await api.createTemplate({ sectionKey: SECTION_KEY, name: SECTION_NAME, fields: [] });
      navigate(`/admin/templates/${created.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell title="Templates" subtitle="Define the fields inspectors fill in on mobile">
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "18px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FileText size={18} color="#2563eb" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a4a", margin: 0 }}>{SECTION_NAME}</p>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0" }}>
            {published ? `Live: v${published.version}, published ${formatDate(published.publishedAt)}` : "No published version yet"}
          </p>
        </div>
        {published ? (
          <button
            onClick={editPublished}
            disabled={busy}
            style={{
              padding: "8px 16px", borderRadius: "8px", background: "#1a2a4a", color: "white",
              fontSize: "12px", fontWeight: 700, border: "none", cursor: busy ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px", opacity: busy ? 0.6 : 1,
            }}
          >
            <Pencil size={13} />
            {draft ? "Continue Draft" : "Edit"}
          </button>
        ) : draft ? (
          <button
            onClick={() => navigate(`/admin/templates/${draft.id}`)}
            style={{
              padding: "8px 16px", borderRadius: "8px", background: "#1a2a4a", color: "white",
              fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            <Pencil size={13} />
            Continue Draft
          </button>
        ) : (
          <button
            onClick={createFromScratch}
            disabled={busy}
            style={{
              padding: "8px 16px", borderRadius: "8px", background: "#1a2a4a", color: "white",
              fontSize: "12px", fontWeight: 700, border: "none", cursor: busy ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px", opacity: busy ? 0.6 : 1,
            }}
          >
            <Plus size={13} />
            Create Template
          </button>
        )}
      </div>

      <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a4a", margin: "0 0 10px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Clock size={13} color="#94a3b8" /> Version History
      </h2>

      <TableCard headers={["Version", "Status", "Fields", "Published", "Actions"]}>
        {loading ? (
          <tr>
            <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
              Loading…
            </td>
          </tr>
        ) : templates.length === 0 ? (
          <tr>
            <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
              No templates yet for {SECTION_NAME}.
            </td>
          </tr>
        ) : (
          templates.map((t, idx) => {
            const sc = TEMPLATE_STATUS_CONFIG[t.status];
            return (
              <tr key={t.id} style={{ borderBottom: idx < templates.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: 700, color: "#1a2a4a" }}>v{t.version}</td>
                <td style={{ padding: "13px 16px" }}>
                  <StatusBadge label={sc.label} color={sc.color} bg={sc.bg} />
                </td>
                <td style={{ padding: "13px 16px", fontSize: "13px", color: "#374151" }}>{t.fields.length}</td>
                <td style={{ padding: "13px 16px", fontSize: "13px", color: "#374151" }}>{formatDate(t.publishedAt)}</td>
                <td style={{ padding: "13px 16px" }}>
                  <button
                    onClick={() => navigate(`/admin/templates/${t.id}`)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "5px 11px", borderRadius: "7px",
                      background: t.status === "draft" ? "#1a2a4a" : "white",
                      color: t.status === "draft" ? "white" : "#64748b",
                      border: t.status === "draft" ? "none" : "1px solid #e5e7eb",
                      fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {t.status === "draft" ? <Pencil size={12} /> : <Eye size={12} />}
                    {t.status === "draft" ? "Edit" : "View"}
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </TableCard>
    </PageShell>
  );
}
