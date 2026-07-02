"""Pydantic models: the request/response contract with the Node worker, plus
the structured output schema for each agent."""
from __future__ import annotations
from pydantic import BaseModel, Field


# ---- Request from the Node worker ----------------------------------------
class PhotoRef(BaseModel):
    id: str
    url: str | None = None  # signed/public Supabase Storage URL; None = no image
    caption: str | None = None
    section: str | None = None


class ReviewRequest(BaseModel):
    inspectionId: str
    version: int = 1
    inspectionType: str
    propertyType: str
    payload: dict = Field(default_factory=dict)
    photos: list[PhotoRef] = Field(default_factory=list)


# ---- Per-agent structured outputs (also used as Claude tool schemas) ------
class FormFinding(BaseModel):
    field: str
    issue: str
    severity: str = Field(description="low | medium | high")


class FormOutput(BaseModel):
    valid: bool
    missing_fields: list[str] = Field(default_factory=list)
    findings: list[FormFinding] = Field(default_factory=list)
    notes: str = ""


class PhotoDefect(BaseModel):
    photo_id: str
    label: str
    severity: str = Field(description="low | medium | high")
    confidence: float = Field(description="0.0 - 1.0")


class PhotoOutput(BaseModel):
    analyzed: int = 0
    defects: list[PhotoDefect] = Field(default_factory=list)
    notes: str = ""


class RiskFlag(BaseModel):
    code: str
    description: str
    severity: str = Field(description="low | medium | high")


class RiskOutput(BaseModel):
    score: int = Field(description="overall risk 0-100")
    flags: list[RiskFlag] = Field(default_factory=list)
    rationale: str = ""


class SummaryOutput(BaseModel):
    summary: str
    risk_score: int = Field(description="0-100, echo the risk agent's score")
    recommendation: str = Field(description="approve | review | reject (advisory)")


# ---- Response back to the Node worker -------------------------------------
class AgentResultOut(BaseModel):
    agent: str  # PHOTO | FORM | RISK | SUMMARY
    output: dict
    model: str | None = None
    tokensUsed: int | None = None
    latencyMs: int | None = None


class SummaryOut(BaseModel):
    riskScore: int | None = None
    flags: list = Field(default_factory=list)
    summaryText: str | None = None


class ReviewResponse(BaseModel):
    agents: list[AgentResultOut]
    summary: SummaryOut
