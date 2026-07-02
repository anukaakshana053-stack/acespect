"""FastAPI service the Node worker calls. POST /review runs the agent graph and
returns structured per-agent results + the reviewer summary."""
from __future__ import annotations

from fastapi import FastAPI

from .config import settings
from .graph import build_graph
from .schemas import (
    AgentResultOut,
    ReviewRequest,
    ReviewResponse,
    SummaryOut,
)

app = FastAPI(title="acespect-ai", version="0.1.0")
_graph = build_graph()

_AGENT_KEYS = [("form", "FORM"), ("photo", "PHOTO"), ("risk", "RISK"), ("summary", "SUMMARY")]


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "acespect-ai",
        "stub": settings.stub_mode,
        "models": {
            "form": settings.model_form,
            "photo": settings.model_photo,
            "risk": settings.model_risk,
            "summary": settings.model_summary,
        },
    }


@app.post("/review", response_model=ReviewResponse)
def review(req: ReviewRequest) -> ReviewResponse:
    final = _graph.invoke({"request": req})

    metas = {m["agent"]: m for m in final.get("metas", [])}
    agents: list[AgentResultOut] = []
    for key, name in _AGENT_KEYS:
        out = final.get(key, {}) or {}
        m = metas.get(name, {})
        agents.append(
            AgentResultOut(
                agent=name,
                output=out,
                model=m.get("model"),
                tokensUsed=m.get("tokensUsed"),
                latencyMs=m.get("latencyMs"),
            )
        )

    risk = final.get("risk", {}) or {}
    summ = final.get("summary", {}) or {}
    summary = SummaryOut(
        riskScore=summ.get("risk_score", risk.get("score")),
        flags=risk.get("flags", []),
        summaryText=summ.get("summary"),
    )
    return ReviewResponse(agents=agents, summary=summary)
