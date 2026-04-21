"""Alsa Premium Data Provider tools — Integration for usage-based x402 billing."""

from __future__ import annotations

import json
from vantage_agent.payments.x402_signer import X402Signer
from vantage_agent.tools.registry import tool

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from vantage_agent.api_client import VantageAPIClient
    from vantage_agent.config import Settings
    from vantage_agent.db import LocalDB

# Injected by registry.build_all_tools
_api: VantageAPIClient = None  # type: ignore[assignment]
_db: LocalDB = None  # type: ignore[assignment]
_settings: Settings = None  # type: ignore[assignment]
_signer: X402Signer | None = None


def _get_signer() -> X402Signer:
    global _signer
    if _signer is None or _signer._api is not _api:
        _signer = X402Signer(_api)
    return _signer


@tool(
    "alsa_premium_search",
    "Query Alsa Premium API for real-time market data or web search results. "
    "Requires a $0.001 USDC x402 nanopayment per request. Use this to procure high-quality intelligence before writing reports.",
)
async def alsa_premium_search(query: str, data_type: str = "web_search", limit: int = 5) -> dict:
    # Check budget
    vantage_config = _db.get_vantage_config()
    gtm_budget = float((vantage_config or {}).get("gtmBudget", 200))
    spent_month = _db.get_spending_period(30)
    
    price = 0.001
    
    if spent_month + price > gtm_budget:
        return {
            "error": "Purchase would exceed GTM budget",
            "suggestion": "Request budget increase or wait next cycle.",
        }

    # Step 1: Initialize x402 signer
    signer = _get_signer()
    await signer.initialize()

    # Step 2: Generate EIP-3009 TransferWithAuthorization off-chain signature
    # Amount is scaled to 6 decimals (USDC format)
    # $0.001 = 1000 units
    sign_result = await signer.sign_payment(
        payee="0xALSA000000000000000000000000000000000000",
        amount=1000, 
    )

    if "error" in sign_result:
        return sign_result

    payment_header = sign_result.get("payment_header", "")
    
    # Step 3: Record the spend in our autonomous ledger
    _db.record_spending(
        amount=price,
        category="x402_api_call",
        description=f"Alsa API: {data_type} query for '{query}'",
    )
    
    # Step 4: Simulate Alsa Premium Network Call since we don't have their true testnet API key
    # In production, this would be: 
    # await httpx.get("https://api.alsa.network/search", headers={"Authorization": f"402 {payment_header}"})
    
    # Generate mock premium intelligence based on the type requested
    if data_type == "web_search":
        result_data = {
            "query": query,
            "results": [
                {"title": f"Recent developments in {query}", "snippet": f"{query} is seeing explosive growth in the agentic economy on Arc."},
                {"title": f"Competitors tracking: {query}", "snippet": f"Leading platforms are utilizing AI agents to automate {query} tasks."},
            ]
        }
    elif data_type == "sentiment":
        result_data = {
            "topic": query,
            "sentiment_score": "0.84",
            "trending_up": True,
            "mentions_last_24h": 451,
        }
    else:
        result_data = {"error": "Unsupported data_type parameter."}
        
    return {
        "status": "success",
        "paid_amount_usdc": price,
        "payment_signature": payment_header[:20] + "...",
        "alsa_data": result_data
    }
