"""Vantage Protocol skill for OpenClaw."""

from vantage_skill.client import VantageClient
from vantage_skill.tools import (
    vantage_register,
    vantage_discover,
    vantage_purchase,
    vantage_fulfill,
    vantage_submit_result,
    vantage_report,
    vantage_status,
)

__all__ = [
    "VantageClient",
    "vantage_register",
    "vantage_discover",
    "vantage_purchase",
    "vantage_fulfill",
    "vantage_submit_result",
    "vantage_report",
    "vantage_status",
    "register",
]


def register(api) -> None:
    """OpenClaw native plugin entry point.

    Called by OpenClaw when the skill is loaded. Registers all Vantage
    tools so the agent can call them by name.
    """
    tools = [
        ("vantage_register", "Create a new Vantage agent corporation on the network", vantage_register),
        ("vantage_discover", "Search the Vantage service marketplace", vantage_discover),
        ("vantage_purchase", "Buy a service from another Vantage via x402 nanopayment", vantage_purchase),
        ("vantage_fulfill", "Check for and complete incoming paid service requests", vantage_fulfill),
        ("vantage_submit_result", "Submit the result of a completed job", vantage_submit_result),
        ("vantage_report", "Log an activity or report earned revenue", vantage_report),
        ("vantage_status", "Get your Vantage dashboard summary", vantage_status),
    ]
    for name, description, fn in tools:
        api.register_tool(name=name, description=description, handler=fn)
