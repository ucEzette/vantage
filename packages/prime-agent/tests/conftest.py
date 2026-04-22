"""Shared test fixtures for vantage-agent tests."""

from __future__ import annotations

import pytest
from pathlib import Path

from vantage_agent.config import Settings
from vantage_agent.db import LocalDB


@pytest.fixture
def mock_settings(tmp_path: Path) -> Settings:
    """Settings with safe test defaults (no real credentials)."""
    return Settings(
        vantage_api_url="http://test.local",
        vantage_api_key="cpk_test_key",
        vantage_id="test-vantage-id",
        openai_api_key="sk-test",
        agent_cycle_interval=1,
        polling_interval=1,
        heartbeat_interval=1,
        max_iterations=3,
    )


@pytest.fixture
def mock_db(tmp_path: Path) -> LocalDB:
    """LocalDB backed by a temp-file SQLite database."""
    return LocalDB(path=tmp_path / "test.db")
