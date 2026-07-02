"""The four review agents. Each is a LangGraph node: it reads shared state and
returns a partial-state update. In stub mode they return deterministic output so
the graph + contract can be exercised without API calls."""
from __future__ import annotations
import json
import operator
from typing import Annotated, Any, TypedDict

from .config import settings
from .llm import structured_call
from .schemas import (
    FormOutput,
    PhotoOutput,
    RiskOutput,
    ReviewRequest,
    SummaryOutput,
)


class GraphState(TypedDict, total=False):
    request: ReviewRequest
    form: dict
    photo: dict
    risk: dict
    summary: dict
    # Parallel nodes (form, photo) both append — needs a merge reducer.
    metas: Annotated[list[dict[str, Any]], operator.add]


def _meta(agent: str, m: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"agent": agent, **(m or {"model": "stub"})}


# ---- FORM -----------------------------------------------------------------
def form_agent(state: GraphState) -> GraphState:
    req = state["request"]
    if settings.stub_mode:
        out = FormOutput(valid=True, notes="stub: form not validated").model_dump()
        return {"form": out, "metas": [_meta("FORM")]}

    system = (
        "You are a building-inspection form validator. Inspect the submitted "
        "form for missing required fields, internal inconsistencies, and "
        "data-quality issues. Only report real problems; do not invent issues."
    )
    content = [
        {
            "type": "text",
            "text": (
                f"Inspection type: {req.inspectionType}\n"
                f"Property type: {req.propertyType}\n"
                f"Form payload (JSON):\n{json.dumps(req.payload, indent=2)}"
            ),
        }
    ]
    data, meta = structured_call(
        model=settings.model_form,
        system=system,
        content=content,
        tool_name="form_review",
        schema=FormOutput.model_json_schema(),
    )
    return {"form": data, "metas": [_meta("FORM", meta)]}


# ---- PHOTO (vision) -------------------------------------------------------
def photo_agent(state: GraphState) -> GraphState:
    req = state["request"]
    with_urls = [p for p in req.photos if p.url]

    if settings.stub_mode or not with_urls:
        note = "stub: photos not analysed" if settings.stub_mode else "no image URLs provided"
        out = PhotoOutput(analyzed=0, notes=note).model_dump()
        model = "stub" if settings.stub_mode else "skipped"
        return {"photo": out, "metas": [_meta("PHOTO", {"model": model})]}

    system = (
        "You are a building-inspection photo analyst. Identify visible defects "
        "(cracks, water damage, corrosion, wear, safety hazards) in the photos. "
        "Report each defect with the photo id, a short label, a severity, and "
        "your confidence. Do not report defects you cannot actually see."
    )
    content: list[dict[str, Any]] = []
    for p in with_urls[:20]:
        content.append(
            {
                "type": "text",
                "text": f"Photo id={p.id} section={p.section or 'n/a'} caption={p.caption or 'n/a'}",
            }
        )
        content.append({"type": "image", "source": {"type": "url", "url": p.url}})
    content.append({"type": "text", "text": "Analyse every photo above and record the defects."})

    data, meta = structured_call(
        model=settings.model_photo,
        system=system,
        content=content,
        tool_name="photo_review",
        schema=PhotoOutput.model_json_schema(),
    )
    return {"photo": data, "metas": [_meta("PHOTO", meta)]}


# ---- RISK (depends on form + photo) --------------------------------------
def risk_agent(state: GraphState) -> GraphState:
    req = state["request"]
    form = state.get("form", {})
    photo = state.get("photo", {})

    if settings.stub_mode:
        out = RiskOutput(score=0, rationale="stub: risk not assessed").model_dump()
        return {"risk": out, "metas": [_meta("RISK")]}

    system = (
        "You are a building-inspection risk assessor. Given the validated form "
        "findings and the detected photo defects, assess overall risk for this "
        "property. Produce a 0-100 risk score and concrete compliance/safety "
        "flags. Weight safety hazards and structural defects most heavily."
    )
    content = [
        {
            "type": "text",
            "text": (
                f"Inspection type: {req.inspectionType}; property: {req.propertyType}\n\n"
                f"Form review:\n{json.dumps(form, indent=2)}\n\n"
                f"Photo review:\n{json.dumps(photo, indent=2)}"
            ),
        }
    ]
    data, meta = structured_call(
        model=settings.model_risk,
        system=system,
        content=content,
        tool_name="risk_review",
        schema=RiskOutput.model_json_schema(),
    )
    return {"risk": data, "metas": [_meta("RISK", meta)]}


# ---- SUMMARY (depends on all) --------------------------------------------
def summary_agent(state: GraphState) -> GraphState:
    form = state.get("form", {})
    photo = state.get("photo", {})
    risk = state.get("risk", {})

    if settings.stub_mode:
        out = SummaryOutput(
            summary="Simulated review (stub mode — no AI service key configured).",
            risk_score=0,
            recommendation="review",
        ).model_dump()
        return {"summary": out, "metas": [_meta("SUMMARY")]}

    system = (
        "You are writing the reviewer-facing summary for a building inspection. "
        "Synthesise the form, photo, and risk findings into a concise summary a "
        "human reviewer can act on. Echo the risk score and give an advisory "
        "recommendation (approve | review | reject). The human reviewer decides."
    )
    content = [
        {
            "type": "text",
            "text": (
                f"Form review:\n{json.dumps(form, indent=2)}\n\n"
                f"Photo review:\n{json.dumps(photo, indent=2)}\n\n"
                f"Risk review:\n{json.dumps(risk, indent=2)}"
            ),
        }
    ]
    data, meta = structured_call(
        model=settings.model_summary,
        system=system,
        content=content,
        tool_name="summary_review",
        schema=SummaryOutput.model_json_schema(),
    )
    return {"summary": data, "metas": [_meta("SUMMARY", meta)]}
