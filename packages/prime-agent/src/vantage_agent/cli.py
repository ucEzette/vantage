"""CLI entry point — vantage-agent start|config|status."""

from __future__ import annotations

import asyncio
import json
import sys

import click
from rich.console import Console

from vantage_agent import __version__
from vantage_agent.config import APP_DIR, Settings, ensure_app_dir

console = Console()


@click.group()
@click.version_option(__version__, prog_name="vantage-agent")
def main():
    """Vantage Protocol Prime Agent — autonomous GTM agent."""


@main.command()
@click.option("--vantage-id", default=None, help="Vantage ID (overrides VANTAGE_ID in .env)")
@click.option("--env-file", default=".env", help="Path to .env file")
def start(vantage_id: str | None, env_file: str):
    """Start the Prime Agent for a Vantage."""
    from pathlib import Path

    ensure_app_dir()

    # Load .env into os.environ so child processes (Stagehand SEA) inherit them
    env_path = Path(env_file)
    if env_path.exists():
        import os
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

    kwargs: dict = {"_env_file": env_file}
    if vantage_id:
        kwargs["vantage_id"] = vantage_id
    settings = Settings(**kwargs)

    if not settings.vantage_api_key:
        console.print("[red]Error:[/red] VANTAGE_API_KEY is required. Set it in .env or run `vantage-agent config`.")
        sys.exit(1)
    if not settings.openai_api_key:
        console.print("[red]Error:[/red] OPENAI_API_KEY is required. Set it in .env.")
        sys.exit(1)

    console.print(f"[bold green]Vantage Agent v{__version__}[/bold green]")
    if settings.vantage_id:
        console.print(f"  Vantage ID:  {settings.vantage_id}")
    else:
        console.print("  Vantage ID:  (auto-resolve from API key)")
    console.print(f"  API URL:    {settings.vantage_api_url}")
    console.print()

    from vantage_agent.scheduler import run

    asyncio.run(run(settings))


@main.command()
@click.option("--api-key", prompt="Vantage API Key", help="API key issued at Vantage creation")
@click.option("--openai-key", prompt="OpenAI API Key", help="OpenAI API key")
def config(api_key: str, openai_key: str):
    """Configure agent credentials (saved to ~/.vantage-agent/config.json)."""
    ensure_app_dir()
    cfg_path = APP_DIR / "config.json"

    existing = {}
    if cfg_path.exists():
        existing = json.loads(cfg_path.read_text())

    existing.update({
        k: v for k, v in {
            "vantage_api_key": api_key,
            "openai_api_key": openai_key,
        }.items() if v
    })

    cfg_path.write_text(json.dumps(existing, indent=2))
    console.print(f"[green]Config saved to {cfg_path}[/green]")


@main.command()
def status():
    """Show agent status."""
    from vantage_agent.db import LocalDB

    ensure_app_dir()
    db = LocalDB()

    vantage_cfg = db.get_vantage_config()
    if vantage_cfg:
        console.print(f"[bold]Vantage:[/bold] {vantage_cfg.get('name', 'Unknown')}")
    else:
        console.print("[yellow]No vantage config cached. Run `vantage-agent start` first.[/yellow]")

    last_cycle = db.get_last_run("agent_cycle")
    if last_cycle:
        console.print(f"[bold]Last agent cycle:[/bold] {last_cycle.isoformat()}")

    posts_today = db.count_today("post")
    console.print(f"[bold]Posts today:[/bold] {posts_today}")

    playbook = db.get_active_playbook()
    if playbook:
        console.print(f"[bold]Active playbook:[/bold] {playbook['name']}")

    pending = db.get_pending_approvals()
    console.print(f"[bold]Pending approvals:[/bold] {len(pending)}")

    db.close()
