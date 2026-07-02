"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "./api";
import type { JobStatus, SummaryStatus } from "./types";

export function TopBar() {
  const router = useRouter();
  return (
    <div className="topbar">
      <div className="brand">
        ACE <span>SPECT</span> · Reviewer
      </div>
      <button
        onClick={() => {
          clearToken();
          router.push("/login");
        }}
      >
        Sign out
      </button>
    </div>
  );
}

export function JobBadge({ status }: { status: JobStatus | null }) {
  if (!status) return <span className="badge slate">no job</span>;
  const cls =
    status === "DONE" ? "green" : status === "FAILED" ? "red" : "amber";
  return <span className={`badge ${cls}`}>{status.toLowerCase()}</span>;
}

export function SummaryBadge({ status }: { status: SummaryStatus | null | undefined }) {
  if (!status) return <span className="badge slate">—</span>;
  const cls =
    status === "APPROVED"
      ? "green"
      : status === "REJECTED"
        ? "red"
        : status === "EDITED"
          ? "brand"
          : "amber";
  return <span className={`badge ${cls}`}>{status.toLowerCase()}</span>;
}

/** Risk score colour: low < 34 (green), 34–66 (amber), > 66 (red). */
export function RiskBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="muted">—</span>;
  const cls = score > 66 ? "red" : score >= 34 ? "amber" : "green";
  return <span className={`badge ${cls}`}>{score}</span>;
}
