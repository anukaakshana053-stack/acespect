"""LangGraph wiring: form ∥ photo (parallel) → risk → summary.

form and photo are independent and run in the same super-step. risk has both as
predecessors, so LangGraph runs it only once both finish (fan-in). summary runs
last on the full state."""
from __future__ import annotations
from langgraph.graph import StateGraph, START, END

from .agents import GraphState, form_agent, photo_agent, risk_agent, summary_agent


def build_graph():
    g = StateGraph(GraphState)
    g.add_node("form", form_agent)
    g.add_node("photo", photo_agent)
    g.add_node("risk", risk_agent)
    g.add_node("summary", summary_agent)

    g.add_edge(START, "form")
    g.add_edge(START, "photo")
    g.add_edge("form", "risk")
    g.add_edge("photo", "risk")
    g.add_edge("risk", "summary")
    g.add_edge("summary", END)

    return g.compile()
