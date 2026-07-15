import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Save, Send } from "lucide-react";
import { PageShell, StatusBadge } from "../../components/WebLayout";
import { TEMPLATE_STATUS_CONFIG, type Template, type TemplateField, type TemplateFieldType } from "../../mockData";
import { api } from "../../api";

const FIELD_TYPES: { value: TemplateFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "date", label: "Date" },
  { value: "select-tiles", label: "Select (tiles)" },
  { value: "yesno", label: "Yes / No" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px", borderRadius: "7px",
  border: "1.5px solid #e5e7eb", background: "white",
  fontSize: "13px", color: "#1a2a4a", fontFamily: "Inter, -apple-system, sans-serif",
  outline: "none", boxSizing: "border-box",
};

function emptyField(order: number): TemplateField {
  return { key: "", label: "", type: "text", order, required: false };
}

export function AdminTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getTemplate(id).then((t) => {
      setTemplate(t);
      setName(t.name);
      setFields([...t.fields].sort((a, b) => a.order - b.order));
    });
  }, [id]);

  if (!template) {
    return (
      <PageShell title="Template">
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>Loading…</p>
      </PageShell>
    );
  }

  const isDraft = template.status === "draft";
  const sc = TEMPLATE_STATUS_CONFIG[template.status];

  function updateField(idx: number, patch: Partial<TemplateField>) {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function move(idx: number, dir: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((f, i) => ({ ...f, order: i }));
    });
  }

  function addField() {
    setFields((prev) => [...prev, emptyField(prev.length)]);
  }

  function removeField(idx: number) {
    setFields((prev) => prev.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i })));
  }

  function addOption(idx: number) {
    updateField(idx, { options: [...(fields[idx].options ?? []), { value: "", label: "" }] });
  }

  function updateOption(idx: number, optIdx: number, patch: Partial<{ value: string; label: string; icon: string }>) {
    const options = (fields[idx].options ?? []).map((o, i) => (i === optIdx ? { ...o, ...patch } : o));
    updateField(idx, { options });
  }

  function removeOption(idx: number, optIdx: number) {
    updateField(idx, { options: (fields[idx].options ?? []).filter((_, i) => i !== optIdx) });
  }

  async function saveDraft() {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await api.updateTemplate(id, { name, fields });
      setTemplate(updated);
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!id || !template) return;
    if (!confirm(`Publish v${template.version}? This becomes the active template new inspections use.`)) return;
    setPublishing(true);
    try {
      await saveDraft();
      await api.publishTemplate(id);
      navigate("/admin/templates");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <PageShell
      title={name || "Template"}
      subtitle={template.sectionKey}
      actions={
        <>
          <StatusBadge label={`v${template.version} · ${sc.label}`} color={sc.color} bg={sc.bg} />
          <button
            onClick={() => navigate("/admin/templates")}
            style={{
              height: "32px", padding: "0 12px", borderRadius: "8px", background: "white",
              border: "1px solid #e5e7eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
              color: "#374151", fontSize: "12px", fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </>
      }
    >
      {!isDraft && (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "12px", color: "#92400e" }}>
          This version is {template.status} and read-only. Go back and click "Continue Draft" / "Edit" to make changes.
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
          Template Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isDraft}
          style={{ ...inputStyle, maxWidth: "360px" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        {fields.map((field, idx) => (
          <div key={idx} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "3px" }}>Key</label>
                <input value={field.key} disabled={!isDraft} onChange={(e) => updateField(idx, { key: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "3px" }}>Label</label>
                <input value={field.label} disabled={!isDraft} onChange={(e) => updateField(idx, { label: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: "0 1 150px" }}>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "3px" }}>Type</label>
                <select
                  value={field.type}
                  disabled={!isDraft}
                  onChange={(e) => updateField(idx, { type: e.target.value as TemplateFieldType })}
                  style={inputStyle}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#374151", paddingBottom: "8px" }}>
                <input type="checkbox" checked={!!field.required} disabled={!isDraft} onChange={(e) => updateField(idx, { required: e.target.checked })} />
                Required
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#374151", paddingBottom: "8px" }}>
                <input type="checkbox" checked={!!field.readOnly} disabled={!isDraft} onChange={(e) => updateField(idx, { readOnly: e.target.checked })} />
                Read-only
              </label>
              {isDraft && (
                <div style={{ display: "flex", gap: "4px", paddingBottom: "4px" }}>
                  <IconBtn onClick={() => move(idx, -1)} disabled={idx === 0}><ArrowUp size={13} /></IconBtn>
                  <IconBtn onClick={() => move(idx, 1)} disabled={idx === fields.length - 1}><ArrowDown size={13} /></IconBtn>
                  <IconBtn onClick={() => removeField(idx)} danger><Trash2 size={13} /></IconBtn>
                </div>
              )}
            </div>

            {(field.type === "select-tiles" || field.type === "yesno") && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Options</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(field.options ?? []).map((opt, optIdx) => (
                    <div key={optIdx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input placeholder="value" value={opt.value} disabled={!isDraft} onChange={(e) => updateOption(idx, optIdx, { value: e.target.value })} style={{ ...inputStyle, flex: "0 1 120px" }} />
                      <input placeholder="label" value={opt.label} disabled={!isDraft} onChange={(e) => updateOption(idx, optIdx, { label: e.target.value })} style={{ ...inputStyle, flex: "1 1 160px" }} />
                      {field.type === "select-tiles" && (
                        <input placeholder="icon (optional)" value={opt.icon ?? ""} disabled={!isDraft} onChange={(e) => updateOption(idx, optIdx, { icon: e.target.value })} style={{ ...inputStyle, flex: "1 1 140px" }} />
                      )}
                      {isDraft && (
                        <IconBtn onClick={() => removeOption(idx, optIdx)} danger><Trash2 size={12} /></IconBtn>
                      )}
                    </div>
                  ))}
                  {isDraft && (
                    <button onClick={() => addOption(idx)} style={{ alignSelf: "flex-start", fontSize: "11px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontWeight: 600 }}>
                      + Add option
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isDraft && (
        <button
          onClick={addField}
          style={{
            padding: "9px 16px", borderRadius: "8px", background: "white",
            border: "1.5px dashed #cbd5e1", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            color: "#64748b", fontSize: "12px", fontWeight: 600, marginBottom: "24px",
          }}
        >
          <Plus size={14} /> Add Field
        </button>
      )}

      {isDraft && (
        <div style={{ display: "flex", gap: "10px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
          <button
            onClick={saveDraft}
            disabled={saving || publishing}
            style={{
              padding: "10px 18px", borderRadius: "8px", background: "white", border: "1px solid #e5e7eb",
              color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "7px",
            }}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={publish}
            disabled={saving || publishing}
            style={{
              padding: "10px 18px", borderRadius: "8px", background: "#1a2a4a", border: "none",
              color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "7px",
            }}
          >
            <Send size={14} /> {publishing ? "Publishing…" : `Publish v${template.version}`}
          </button>
        </div>
      )}
    </PageShell>
  );
}

function IconBtn({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "26px", height: "26px", borderRadius: "6px",
        background: danger ? "#fef2f2" : "#f8fafc",
        border: `1px solid ${danger ? "#fecaca" : "#e5e7eb"}`,
        color: disabled ? "#cbd5e1" : danger ? "#dc2626" : "#64748b",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}
