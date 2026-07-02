"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { TopBar, JobBadge, SummaryBadge, RiskBadge } from "@/lib/ui";
import type { InspectionListItem } from "@/lib/types";

export default function InspectionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<InspectionListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ inspections: InspectionListItem[] }>("/review/inspections")
      .then((d) => setItems(d.inspections))
      .catch((e: ApiError) => {
        if (e.status === 401 || e.status === 403) router.replace("/login");
        else setError(e.message);
      });
  }, [router]);

  return (
    <>
      <TopBar />
      <div className="container">
        <h1 className="page-title">Submitted inspections</h1>
        <p className="page-sub">AI review runs automatically on submission. Approve, edit, or reject each summary.</p>
        {error && <div className="error">{error}</div>}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Property</th>
                <th>Inspector</th>
                <th>Submitted</th>
                <th>Review</th>
                <th>Risk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((i) => (
                <tr key={i.id} onClick={() => router.push(`/inspections/${i.id}`)}>
                  <td style={{ fontWeight: 600 }}>{i.inspectionType}</td>
                  <td>{i.propertyType}</td>
                  <td className="muted">{i.inspector?.name ?? i.inspector?.email ?? "—"}</td>
                  <td className="muted">{new Date(i.submittedAt).toLocaleString()}</td>
                  <td><JobBadge status={i.jobStatus} /></td>
                  <td><RiskBadge score={i.summary?.riskScore} /></td>
                  <td><SummaryBadge status={i.summary?.status} /></td>
                </tr>
              ))}
              {items && items.length === 0 && (
                <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 28 }}>No inspections yet.</td></tr>
              )}
              {!items && !error && (
                <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 28 }}>Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
