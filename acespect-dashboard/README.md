# acespect-dashboard

Desktop reviewer dashboard (Next.js 15, App Router) for the building-inspection
AI review pipeline. Reviewers sign in, see every submitted inspection with its
AI review status and risk score, open a detail view of the per-agent findings +
summary, and approve / edit / reject each summary (the human-in-the-loop step —
AI output is advisory).

## Run

```bash
npm install
# point at the backend (defaults to http://localhost:4000/api/v1)
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > .env.local
npm run dev          # http://localhost:3000
```

Requires `acespect-backend` running, plus a reviewer account:

```bash
# in acespect-backend
npx tsx scripts/seedReviewer.ts     # reviewer@acespect.app / Review123
```

## Pages

- `/login` — JWT sign-in; rejects non-REVIEWER/ADMIN accounts.
- `/inspections` — list: type, property, inspector, review status, risk, summary status.
- `/inspections/[id]` — detail: AI summary + risk meter, Approve / Reject / Edit
  actions with reviewer notes, per-agent findings (FORM / PHOTO / RISK / SUMMARY),
  and the decision audit trail.

Auth token is kept in `localStorage`; all data is fetched client-side from the
backend with a bearer token (`lib/api.ts`). Reviewer endpoints are gated to the
`REVIEWER` / `ADMIN` role server-side.

## Backend endpoints used

- `POST /auth/login`
- `GET  /review/inspections`
- `GET  /review/inspections/:id`
- `POST /review/summaries/:id/decision`  `{ decision, notes?, summaryText? }`
