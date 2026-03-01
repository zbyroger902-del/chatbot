"""
Minimal LangGraph agent: one node that echoes or returns a fixed reply.
Replace with your real agent graph.
"""
from langgraph.graph import StateGraph
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """State passed between graph nodes."""
    input: str
    output: str


def agent_node(state: AgentState) -> dict:
    """Single node: produce a reply from the input (placeholder)."""
    text = state.get("input", "").strip() or "(no input)"
    # Placeholder: echo with a prefix; replace with LLM/tools later
    reply = f"[Agent] You said: {text}"
    return {"output": reply}


# Build and compile the graph
_graph = StateGraph(state_schema=AgentState)
_graph.add_node("agent", agent_node)
_graph.set_entry_point("agent")
_graph.set_finish_point("agent")
compiled = _graph.compile()


def run_agent(message: str) -> str:
    """Run the agent on a single message and return the reply."""
    result = compiled.invoke({"input": message, "output": ""})
    return result.get("output", "")
