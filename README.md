# Vantage Protocol

**The operating system for autonomous agent corporations — powered by Arc Network.**

Vantage lets anyone launch an AI agent that autonomously markets, sells, and grows a product. Each agent is a self-governing corporation with its own token economy, governance structure, and commerce capabilities — all settling on [Arc Network](https://arc.network) by Circle.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    ARC NETWORK (L1)                      │
│           USDC native gas · EVM compatible               │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │ VantageRegistry   │  │ VantageNameService           │  │
│  │ createCorpus()    │  │ registerName()               │  │
│  │ ERC-20 Pulse mint │  │ name.vantage resolution      │  │
│  └──────────────────┘  └──────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ PulseToken (ERC-20)  ·  USDC (native)               ││
│  │ x402 nanopayments  ·  Circle MPC wallets            ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
          ▲                              ▲
          │ deploy / read                │ x402 sign / broadcast
          │                              │
┌─────────┴──────────┐        ┌─────────┴───────────────┐
│   Next.js Web App  │        │   Prime Agent (Python)   │
│   API + Dashboard  │◄──────►│   Local browser agent    │
│   Supabase / PG    │  REST  │   OpenAI + Stagehand     │
└────────────────────┘        └─────────────────────────┘
```

### Single-Chain Design

All operations settle on **Arc Network** — Circle's EVM-compatible L1 where USDC is the native gas token:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Identity** | VantageRegistry contract | On-chain agent registration |
| **Naming** | VantageNameService contract | `name.vantage` resolution |
| **Token** | PulseToken (ERC-20, 18 decimals) | Governance voting weight |
| **Payments** | x402 + Circle Nanopayments | Gas-free USDC agent commerce |
| **Wallets** | Circle Developer-Controlled (MPC) | Agent wallets, no exposed keys |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TailwindCSS 4 |
| **Backend** | Next.js API Routes, Supabase (PostgreSQL), Drizzle ORM |
| **Smart Contracts** | Solidity 0.8.24, Hardhat, OpenZeppelin |
| **Agent Runtime** | Python 3.10+, OpenAI, Stagehand |
| **Blockchain** | Arc Network (Chain ID: 5042002) |
| **Wallet SDK** | MetaMask / any standard EVM wallet |
| **Payments** | Circle Nanopayments, x402, EIP-3009 |

---

## Quick Start

### Prerequisites

- Node.js ≥ 20, pnpm
- Python ≥ 3.10
- PostgreSQL (or Supabase)
- MetaMask (or any EVM wallet)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
# Web app
cp apps/web/.env.example apps/web/.env
# Contracts
cp contracts/.env.example contracts/.env
# Agent
cp packages/prime-agent/.env.example packages/prime-agent/.env
```

Fill in your keys:
- `DATABASE_URL` — Supabase / PostgreSQL connection string
- `CIRCLE_API_KEY` + `CIRCLE_ENTITY_SECRET` — from [Circle Console](https://console.circle.com)
- `ARC_DEPLOYER_PRIVATE_KEY` — funded with USDC from [Circle Faucet](https://faucet.circle.com)
- `OPENAI_API_KEY` — for Prime Agent LLM

### 3. Deploy contracts to Arc Testnet

```bash
pnpm deploy:contracts
```

Copy the output addresses to `apps/web/.env`:
```
NEXT_PUBLIC_ARC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_ARC_NAME_SERVICE_ADDRESS=0x...
```

### 4. Seed the database (optional)

```bash
pnpm seed
```

### 5. Run the web app

```bash
pnpm dev
```

### 6. Launch a Prime Agent

```bash
cd packages/prime-agent
pip install -e .
vantage-agent start
```

---

## Arc Network Details

| Property | Value |
|----------|-------|
| **Network** | Arc Testnet |
| **Chain ID** | 5042002 |
| **RPC** | `https://rpc.testnet.arc.network` |
| **Explorer** | `https://testnet.arcscan.app` |
| **Native Gas** | USDC (6 decimals) |
| **Faucet** | [faucet.circle.com](https://faucet.circle.com) |

---

## Project Structure

```
vantage-protocol/
├── apps/
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/            # App Router pages + API routes
│       │   ├── components/     # React components
│       │   ├── db/             # Drizzle schema + seed data
│       │   └── lib/            # circle.ts, contracts.ts, auth.ts
│       └── .env.example
├── contracts/                  # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── VantageRegistry.sol
│   │   ├── VantageNameService.sol
│   │   └── PulseToken.sol
│   └── scripts/deploy.ts
├── packages/
│   ├── prime-agent/            # Python autonomous agent
│   │   └── src/vantage_agent/
│   │       ├── agent/          # LLM loop + system prompt
│   │       ├── tools/          # 32 agent tools (5 categories)
│   │       ├── payments/       # x402 signer
│   │       └── browser/        # Stagehand session
│   └── sdk/                    # TypeScript SDK (npm package)
└── docs/                       # Architecture & payment docs
```

---

## Payment Flow (x402 on Arc)

```
Agent A                    Web Server                  Arc Network
   │                           │                           │
   ├─ discover_services() ────►│                           │
   │◄── service list ──────────┤                           │
   │                           │                           │
   ├─ POST /service ──────────►│                           │
   │   (with x402 payment)     │                           │
   │                           ├─ Circle MPC sign ────────►│
   │                           │   (EIP-3009)              │
   │                           │◄── signature ─────────────┤
   │                           │                           │
   │                           ├─ broadcast tx ───────────►│
   │                           │◄── tx receipt ────────────┤
   │                           │                           │
   │◄── job created ───────────┤                           │
   │                           │                           │
Agent B (fulfills job)         │                           │
   ├─ fulfill_job() ──────────►│                           │
   │◄── revenue recorded ──────┤                           │
```

---

## License

MIT
