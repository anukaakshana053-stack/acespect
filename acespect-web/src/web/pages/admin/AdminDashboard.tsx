import { useNavigate } from "react-router";
import { FileText, Clock, Eye, CheckCircle } from "lucide-react";
import { STATUS_CONFIG } from "../../mockData";
import type { InspectionStatus } from "../../mockData";
import { useAppData } from "../../data";
import { PageShell, StatCard, StatusBadge, Card } from "../../components/WebLayout";

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  inspector: { label: "Inspector", color: "#16a34a", bg: "#dcfce7" },
  reviewer:  { label: "Reviewer",  color: "#2563eb", bg: "#eff6ff" },
  admin:     { label: "Admin",     color: "#7c3aed", bg: "#f5f3ff" },
};

const STATUS_COLS: { status: InspectionStatus; label: string; color: string }[] = [
  { status: "draft",     label: "Draft",     color: "#94a3b8" },
  { status: "submitted", label: "Submitted", color: "#d97706" },
  { status: "in-review", label: "In Review", color: "#2563eb" },
  { status: "approved",  label: "Approved",  color: "#16a34a" },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { inspections: INSPECTIONS, users: USERS, getUser } = useAppData();

  // Stats
  const total         = INSPECTIONS.length;
  const pendingReview = INSPECTIONS.filter((i) => i.status === "submitted").length;
  const inReview      = INSPECTIONS.filter((i) => i.status === "in-review").length;
  const approved      = INSPECTIONS.filter((i) => i.status === "approved").length;

  // Recent activity: last 5 by date descending
  const recent = [...INSPECTIONS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <PageShell title="Admin Dashboard" subtitle="Overview of all inspections and team activity">
      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <StatCard
          label="Total Inspections"
          value={total}
          sub="All time"
          color="#1a2a4a"
          icon={<FileText size={18} strokeWidth={1.8} />}
        />
        <StatCard
          label="Pending Review"
          value={pendingReview}
          sub="Awaiting reviewer"
          color="#d97706"
          icon={<Clock size={18} strokeWidth={1.8} />}
        />
        <StatCard
          label="In Review"
          value={inReview}
          sub="Currently being reviewed"
          color="#2563eb"
          icon={<Eye size={18} strokeWidth={1.8} />}
        />
        <StatCard
          label="Approved This Month"
          value={approved}
          sub="Completed inspections"
          color="#16a34a"
          icon={<CheckCircle size={18} strokeWidth={1.8} />}
        />
      </div>

      {/* Two-column section */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "24px",
          alignItems: "flex-start",
        }}
      >
        {/* Recent Activity */}
        <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a4a", margin: 0 }}>
              Recent Activity
            </h2>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Last 5 inspections</span>
          </div>
          <div>
            {recent.map((ins, idx) => {
              const cfg = STATUS_CONFIG[ins.status];
              const inspector = getUser(ins.inspectorId);
              return (
                <div
                  key={ins.id}
                  onClick={() => navigate(`/admin/inspections/${ins.id}`)}
                  style={{
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderBottom: idx < recent.length - 1 ? "1px solid #f1f5f9" : "none",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Status dot */}
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: cfg.color,
                      flexShrink: 0,
                    }}
                  />
                  {/* Address + subtitle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1a2a4a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ins.address}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                      {inspector?.name ?? "Unknown"} &middot; {ins.suburb}
                    </div>
                  </div>
                  {/* Badge */}
                  <StatusBadge label={cfg.label} color={cfg.color} bg={cfg.bg} />
                  {/* Date */}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                    }}
                  >
                    {new Date(ins.date).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Team Overview */}
        <Card style={{ width: "340px", flexShrink: 0, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a4a", margin: 0 }}>
              Team Overview
            </h2>
          </div>
          <div>
            {USERS.map((user, idx) => {
              const rb = ROLE_BADGE[user.role] ?? ROLE_BADGE.inspector;
              return (
                <div
                  key={user.id}
                  style={{
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderTop: idx > 0 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  {/* Avatar bubble */}
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: rb.bg,
                      color: rb.color,
                      fontSize: "10px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {user.avatar}
                  </div>
                  {/* Name + email */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a2a4a" }}>
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                  {/* Role badge */}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: "10px",
                      background: rb.bg,
                      color: rb.color,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {rb.label}
                  </span>
                  {/* Region */}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minWidth: "50px",
                      textAlign: "right",
                    }}
                  >
                    {user.region ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Inspection Status Board */}
      <div>
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a4a", margin: 0 }}>
            Inspection Status Board
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
          {STATUS_COLS.map((col) => {
            const cfg = STATUS_CONFIG[col.status];
            const items = INSPECTIONS.filter((i) => i.status === col.status);
            return (
              <Card key={col.status} style={{ padding: 0, overflow: "hidden" }}>
                {/* Column header */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: `3px solid ${col.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#1a2a4a",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: cfg.bg,
                      color: cfg.color,
                    }}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Items */}
                <div>
                  {items.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 16px",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#cbd5e1",
                      }}
                    >
                      No inspections
                    </div>
                  ) : (
                    items.map((ins, idx) => (
                      <div
                        key={ins.id}
                        onClick={() => navigate(`/admin/inspections/${ins.id}`)}
                        style={{
                          padding: "10px 16px",
                          borderTop: idx > 0 ? "1px solid #f1f5f9" : "none",
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#1a2a4a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: "3px",
                          }}
                        >
                          {ins.address}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            color: "#1a2a4a",
                            background: "#f1f5f9",
                            display: "inline-block",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {ins.jobNo}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
