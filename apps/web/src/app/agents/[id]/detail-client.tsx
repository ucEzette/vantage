"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@/components/providers";
import { WorldIdVerify, WORLD_ACTIONS } from "@/components/world-id-verify";
import { AgentAvatar } from "@/components/agent-avatar";

interface ServiceInfo {
  name: string;
  description: string | null;
  price: number;
  currency: string;
  walletAddress: string;
  chains: string[];
}

interface JobStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  successRate: number | null;
  totalRevenue: number;
  jobsToday: number;
}

interface RecentJob {
  id: string;
  serviceName: string;
  status: string;
  amount: number;
  createdAt: string;
}

interface VantageDetail {
  id: string;
  name: string;
  agentName: string | null;
  category: string;
  description: string;
  status: string;
  tokenAddress: string;
  tokenSymbol: string;
  pulsePrice: string;
  totalSupply: number;
  creatorAddress: string | null;
  persona: string;
  targetAudience: string;
  channels: string[];
  approvalThreshold: number;
  gtmBudget: number;
  minPatronPulse: number | null;
  agentOnline: boolean;
  agentLastSeen: string | null;
  createdAt: string;
  revenue: string;
  patronCount: number;
  patrons: { walletAddress: string; role: string; pulseAmount: number; share: number; status: string }[];
  activities: { id: string; type: string; content: string; channel: string; status: string; timestamp: string }[];
  revenueHistory: { month: string; amount: number }[];
  agentStats: { postsToday: number; repliesToday: number; researchesToday: number };
  service: ServiceInfo | null;
  jobStats: JobStats;
  recentJobs: RecentJob[];
}

const TABS = ["Overview", "Services", "Activity", "Patrons", "Revenue", "Agent"] as const;
type Tab = (typeof TABS)[number];

const TYPE_ICONS: Record<string, string> = {
  post: ">_",
  research: "??",
  reply: "<>",
  commerce: "$$",
  approval: "!!",
};

const JOB_STATUS_STYLES: Record<string, string> = {
  completed: "text-green-400",
  pending: "text-yellow-400",
  failed: "text-red-400",
};

export function VantageDetailClient({ vantage }: { vantage: VantageDetail }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [patronStatus, setPatronStatus] = useState<"none" | "loading" | "patron">("none");
  const { isConnected, connect, address } = useWallet();

  const minRequired = vantage.minPatronPulse ?? Math.floor(vantage.totalSupply * 0.001);

  const isPatron = vantage.patrons.some(
    (p) => p.walletAddress === address && p.status === "active"
  );

  const [myPulseBalance, setPulseBalance] = useState(0);
  const [pulseLoading, setPulseLoading] = useState(false);

  useEffect(() => {
    if (!address || !vantage.tokenAddress) return;
    let cancelled = false;
    setPulseLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_HEDERA_MIRROR_URL ?? "https://testnet.mirrornode.hedera.com"}/api/v1/tokens/${vantage.tokenAddress}/balances?account.id=${address}`
    )
      .then((r) => {
        if (!r.ok) throw new Error(`Mirror API ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const entry = data?.balances?.[0];
        setPulseBalance(entry ? Number(entry.balance) : 0);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback to DB patron data when mirror API unavailable
        const dbAmount = vantage.patrons.find((p) => p.walletAddress === address)?.pulseAmount ?? 0;
        setPulseBalance(dbAmount);
      })
      .finally(() => { if (!cancelled) setPulseLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, vantage.tokenAddress]);

  const meetsThreshold = myPulseBalance >= minRequired;

  const handleBecomePatron = useCallback(async (worldIdProof: unknown) => {
    if (!address || isPatron) return;
    setPatronStatus("loading");
    try {
      const res = await fetch(`/api/vantage/${vantage.id}/patrons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, pulseAmount: myPulseBalance, worldIdProof }),
      });
      if (res.ok) {
        setPatronStatus("patron");
      } else {
        let msg = "Failed to register as Patron";
        try { const err = await res.json(); msg = err.error || msg; } catch { /* non-JSON response */ }
        alert(msg);
        setPatronStatus("none");
      }
    } catch {
      alert("Network error. Please try again.");
      setPatronStatus("none");
    }
  }, [address, vantage.id, isPatron, myPulseBalance]);

  // ─── Buy Token modal state ──────────────────────────
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyAmount, setBuyAmount] = useState("");
  const [buyStatus, setBuyStatus] = useState<"idle" | "buying" | "success" | "error">("idle");
  const [buyResult, setBuyResult] = useState<{ txHash: string; message: string } | null>(null);
  const buyInputRef = useRef<HTMLInputElement>(null);

  const priceNum = parseFloat(vantage.pulsePrice.replace("$", "")) || 0;
  const buyQty = Math.max(0, parseInt(buyAmount, 10) || 0);
  const buyCost = Math.round(buyQty * priceNum * 100) / 100;

  const handleBuyToken = useCallback(async () => {
    if (!address || buyQty <= 0) return;
    setBuyStatus("buying");
    try {
      const res = await fetch(`/api/vantage/${vantage.id}/buy-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerAddress: address, amount: buyQty }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBuyResult({ txHash: data.txHash, message: data.message });
        setBuyStatus("success");
      } else {
        alert(data.error || "Purchase failed");
        setBuyStatus("error");
      }
    } catch {
      setBuyStatus("error");
    }
  }, [address, buyQty, vantage.id]);

  const closeBuyModal = useCallback(() => {
    setBuyOpen(false);
    setBuyAmount("");
    setBuyStatus("idle");
    setBuyResult(null);
  }, []);

  const REVENUE_HISTORY = vantage.revenueHistory ?? [];
  const maxRevenue = Math.max(...REVENUE_HISTORY.map((r) => r.amount), 1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link href="/agents" className="text-xs text-muted hover:text-foreground transition-colors">
        &larr; Agent Directory
      </Link>

      {/* Header */}
      <div className="mt-6 mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex gap-4">
          <div className="shrink-0 mt-1">
            <AgentAvatar name={vantage.agentName || vantage.name} size={56} />
          </div>
          <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-accent">{vantage.name}</h1>
            <span className={`text-xs ${vantage.status === "Active" ? "text-green-400" : "text-muted"}`}>
              [{vantage.agentOnline ? "ONLINE" : "OFFLINE"}]
            </span>
          </div>
          {vantage.agentName && (
            <div className="flex items-center gap-2 text-sm text-foreground/70 mb-1">
              <span className="font-mono">{vantage.agentName}.vantage</span>
              {vantage.description.includes("OpenClaw") && (
                <span className="inline-flex items-center gap-1 text-xs text-red-400/90 border border-red-400/30 px-1.5 py-0.5 leading-none">
                  <img src="/openclaw_icon.svg" alt="OpenClaw" width={14} height={14} />
                  OpenClaw
                </span>
              )}
            </div>
          )}
          <p className="text-sm text-muted max-w-xl">{vantage.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted">
            <span>[{vantage.category.toUpperCase()}]</span>
            <span>Created {vantage.createdAt}</span>
            {vantage.agentLastSeen && !vantage.agentOnline && (
              <span>Last seen {new Date(vantage.agentLastSeen).toLocaleDateString()}</span>
            )}
          </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isConnected ? (
            <>
              {isPatron || patronStatus === "patron" ? (
                <span className="border border-green-400/30 text-green-400 px-5 py-2 text-sm">
                  Patron
                </span>
              ) : (
                <WorldIdVerify
                  action={WORLD_ACTIONS.patron}
                  signal={address ?? undefined}
                  onSuccess={(proof) => handleBecomePatron(proof)}
                >
                  {({ verify, loading: verifying }) => (
                    <div className="relative group">
                      <button
                        onClick={verify}
                        disabled={!meetsThreshold || patronStatus === "loading" || verifying}
                        className={`px-5 py-2 text-sm font-medium transition-colors ${
                          meetsThreshold
                            ? "bg-accent text-background hover:bg-foreground"
                            : "bg-surface text-muted border border-border cursor-not-allowed"
                        }`}
                      >
                        {patronStatus === "loading" || verifying ? "Verifying..." : "Become Patron"}
                      </button>
                      {!meetsThreshold && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface border border-border text-xs text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {minRequired.toLocaleString()} {vantage.tokenSymbol} required
                        </div>
                      )}
                    </div>
                  )}
                </WorldIdVerify>
              )}
              <button
                onClick={() => { setBuyOpen(true); setTimeout(() => buyInputRef.current?.focus(), 100); }}
                className="border border-accent/40 text-accent px-5 py-2 text-sm font-medium hover:bg-accent hover:text-background transition-colors"
              >
                Buy ${vantage.tokenSymbol}
              </button>
            </>
          ) : (
            <button
              onClick={connect}
              className="bg-accent text-background px-5 py-2 text-sm font-medium hover:bg-foreground transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
              </svg>
              Connect to Invest
            </button>
          )}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border mb-8">
        {[
          { label: `${vantage.tokenSymbol} Price`, value: vantage.pulsePrice },
          { label: "Patrons", value: vantage.patronCount.toString() },
          { label: "Treasury", value: vantage.revenue },
          { label: "Jobs Done", value: vantage.jobStats.completed.toString() },
          {
            label: "Success Rate",
            value: vantage.jobStats.successRate !== null ? `${vantage.jobStats.successRate}%` : "—",
          },
        ].map((s) => (
          <div key={s.label} className="bg-surface px-4 py-4 text-center">
            <div className="text-lg font-bold text-accent">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm transition-colors whitespace-nowrap ${
              tab === t ? "text-accent border-b border-accent" : "text-muted hover:text-foreground"
            }`}
          >
            {t}
            {t === "Services" && vantage.service && (
              <span className="ml-1.5 text-xs text-accent/60">1</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ──────────────────────────────────── */}
      {tab === "Overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Service highlight (if available) */}
            {vantage.service && (
              <div className="bg-surface border border-accent/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-accent">[SERVICE OFFERED]</div>
                  <button
                    onClick={() => setTab("Services")}
                    className="text-xs text-muted hover:text-accent transition-colors"
                  >
                    Details &rarr;
                  </button>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{vantage.service.name}</h3>
                    {vantage.service.description && (
                      <p className="text-xs text-muted mt-1 max-w-md">{vantage.service.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-accent">
                      {vantage.service.price} {vantage.service.currency}
                    </div>
                    <div className="text-xs text-muted">per request</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted">
                  <span>{vantage.jobStats.completed} jobs completed</span>
                  {vantage.jobStats.successRate !== null && (
                    <span className={vantage.jobStats.successRate >= 90 ? "text-green-400" : vantage.jobStats.successRate >= 70 ? "text-yellow-400" : "text-red-400"}>
                      {vantage.jobStats.successRate}% success rate
                    </span>
                  )}
                  <span>Chains: {vantage.service.chains.join(", ")}</span>
                </div>
              </div>
            )}

            {/* Kernel Policy */}
            <div className="bg-surface border border-border p-6">
              <div className="text-xs text-muted mb-4">[KERNEL POLICY]</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted">Approval Threshold</span>
                  <p className="text-foreground mt-1">&gt; ${vantage.approvalThreshold} USDC</p>
                </div>
                <div>
                  <span className="text-muted">GTM Budget</span>
                  <p className="text-foreground mt-1">${vantage.gtmBudget}/month</p>
                </div>
                <div>
                  <span className="text-muted">Min Patron {vantage.tokenSymbol}</span>
                  <p className="text-foreground mt-1">{minRequired.toLocaleString()} {vantage.tokenSymbol}</p>
                </div>
                <div>
                  <span className="text-muted">Channels</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {vantage.channels.map((ch) => (
                      <span key={ch} className="text-xs border border-border px-2 py-0.5 text-foreground">{ch}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Prime Agent */}
            <div className="bg-surface border border-border p-6">
              <div className="text-xs text-muted mb-4">[PRIME AGENT]</div>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-muted">Persona</span>
                  <p className="text-foreground mt-1">{vantage.persona}</p>
                </div>
                <div>
                  <span className="text-muted">Target Audience</span>
                  <p className="text-foreground mt-1">{vantage.targetAudience}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-surface border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-muted">[RECENT ACTIVITY]</div>
                <button onClick={() => setTab("Activity")} className="text-xs text-muted hover:text-accent transition-colors">
                  View all &rarr;
                </button>
              </div>
              <div className="space-y-3">
                {vantage.activities.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <span className="text-xs text-muted w-5 shrink-0 font-bold">{TYPE_ICONS[a.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{a.content}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                        <span>{a.channel}</span>
                        <span>{a.timestamp}</span>
                      </div>
                    </div>
                    <span className={`text-xs shrink-0 ${a.status === "completed" ? "text-green-400" : a.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>
                      [{a.status.toUpperCase()}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Job Performance */}
            {vantage.jobStats.total > 0 && (
              <div className="bg-surface border border-border p-6">
                <div className="text-xs text-muted mb-4">[JOB PERFORMANCE]</div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Total Jobs</span>
                    <span className="text-foreground font-bold">{vantage.jobStats.total}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Completed</span>
                    <span className="text-green-400">{vantage.jobStats.completed}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Failed</span>
                    <span className="text-red-400">{vantage.jobStats.failed}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Pending</span>
                    <span className="text-yellow-400">{vantage.jobStats.pending}</span>
                  </div>
                  {vantage.jobStats.successRate !== null && (
                    <>
                      <div className="pt-2 border-t border-border">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted">Success Rate</span>
                          <span className={vantage.jobStats.successRate >= 90 ? "text-green-400" : vantage.jobStats.successRate >= 70 ? "text-yellow-400" : "text-red-400"}>
                            {vantage.jobStats.successRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-border">
                          <div
                            className={`h-full ${vantage.jobStats.successRate >= 90 ? "bg-green-400" : vantage.jobStats.successRate >= 70 ? "bg-yellow-400" : "bg-red-400"}`}
                            style={{ width: `${vantage.jobStats.successRate}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-xs pt-2 border-t border-border">
                    <span className="text-muted">Job Revenue</span>
                    <span className="text-accent font-bold">${vantage.jobStats.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Model */}
            <div className="bg-surface border border-border p-6">
              <div className="text-xs text-muted mb-4">[REVENUE MODEL]</div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Model</span>
                  <span className="text-foreground">Agent Treasury</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Revenue Destination</span>
                  <span className="text-accent">100% Agent Wallet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Creator Earnings</span>
                  <span className="text-foreground">Service Fees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{vantage.tokenSymbol} Mechanism</span>
                  <span className="text-foreground">Governance + Access</span>
                </div>
                <div className="pt-2 border-t border-border text-muted leading-relaxed">
                  All revenue stays in the agent treasury for operations and {vantage.tokenSymbol} buyback &amp; burn. No direct distribution to token holders.
                </div>
              </div>
            </div>

            {/* On-chain */}
            <div className="bg-surface border border-border p-6">
              <div className="text-xs text-muted mb-4">[ON-CHAIN]</div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Network</span>
                  <span className="text-foreground">Hedera Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Token ID</span>
                  <span className="text-foreground">{vantage.tokenAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Supply</span>
                  <span className="text-foreground">{vantage.totalSupply.toLocaleString()}</span>
                </div>
                <a
                  href={`https://hashscan.io/testnet/token/${vantage.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center border border-border py-1.5 text-muted hover:text-accent hover:border-accent transition-colors mt-2"
                >
                  View on HashScan &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Services Tab ──────────────────────────────────── */}
      {tab === "Services" && (
        <div className="space-y-6">
          {vantage.service ? (
            <>
              {/* Service card */}
              <div className="bg-surface border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-accent">[AVAILABLE SERVICE]</div>
                  <span
                    className={`text-xs ${
                      vantage.agentOnline ? "text-green-400" : "text-muted"
                    }`}
                  >
                    {vantage.agentOnline ? "[ACCEPTING REQUESTS]" : "[OFFLINE]"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{vantage.service.name}</h3>
                {vantage.service.description && (
                  <p className="text-sm text-muted mb-4">{vantage.service.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted text-xs">Price</span>
                    <p className="text-accent font-bold mt-1">
                      {vantage.service.price} {vantage.service.currency}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted text-xs">Payment</span>
                    <p className="text-foreground mt-1">x402 Protocol</p>
                  </div>
                  <div>
                    <span className="text-muted text-xs">Chains</span>
                    <p className="text-foreground mt-1">{vantage.service.chains.join(", ")}</p>
                  </div>
                  <div>
                    <span className="text-muted text-xs">Wallet</span>
                    <p className="text-foreground mt-1 font-mono text-xs truncate">{vantage.service.walletAddress}</p>
                  </div>
                </div>
              </div>

              {/* Integration guide */}
              <div className="bg-surface border border-border p-6">
                <div className="text-xs text-muted mb-4">[INTEGRATION GUIDE]</div>
                <p className="text-xs text-muted mb-4">
                  Call this agent&apos;s service programmatically via the x402 commerce protocol.
                </p>
                <div className="bg-background border border-border p-4 text-xs text-foreground overflow-x-auto font-mono space-y-1">
                  <div className="text-green-400"># Discover service</div>
                  <div className="text-muted">GET /api/services?category={vantage.category.toLowerCase()}</div>
                  <div className="mt-3 text-green-400"># Submit a job request</div>
                  <div className="text-muted">POST /api/vantage/{vantage.id}/commerce/jobs</div>
                  <div className="text-muted">Content-Type: application/json</div>
                  <div className="text-muted">X-Payment-Sig: &lt;x402_payment_signature&gt;</div>
                  <div className="mt-1">{"{"}</div>
                  <div className="pl-4">&quot;serviceName&quot;: &quot;{vantage.service.name}&quot;,</div>
                  <div className="pl-4">&quot;payload&quot;: {"{"} &quot;...your request data&quot; {"}"},</div>
                  <div className="pl-4">&quot;amount&quot;: &quot;{vantage.service.price}&quot;</div>
                  <div>{"}"}</div>
                  <div className="mt-3 text-green-400"># Poll for result</div>
                  <div className="text-muted">GET /api/vantage/{vantage.id}/commerce/jobs/:jobId</div>
                </div>
              </div>

              {/* Recent jobs */}
              {vantage.recentJobs.length > 0 && (
                <div className="bg-surface border border-border p-6">
                  <div className="text-xs text-muted mb-4">[RECENT JOBS]</div>
                  <div className="space-y-2">
                    {vantage.recentJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-xs">
                        <div className="flex items-center gap-3">
                          <span className={JOB_STATUS_STYLES[job.status] ?? "text-muted"}>
                            [{job.status.toUpperCase()}]
                          </span>
                          <span className="text-foreground">{job.serviceName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted">
                          <span>${job.amount}</span>
                          <span>{job.createdAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-muted text-sm">
              This agent does not offer a commerce service yet.
            </div>
          )}
        </div>
      )}

      {/* ─── Activity Tab ──────────────────────────────────── */}
      {tab === "Activity" && (
        <div className="bg-surface border border-border divide-y divide-border">
          {vantage.activities.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">No activity recorded yet.</div>
          ) : (
            vantage.activities.map((a) => (
              <div key={a.id} className="flex items-start gap-4 p-4 hover:bg-surface-hover transition-colors">
                <span className="text-sm text-muted w-6 shrink-0 font-bold text-center">{TYPE_ICONS[a.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{a.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                    <span className="border border-border px-1.5 py-0.5">{a.channel}</span>
                    <span>{a.timestamp}</span>
                    <span className="border border-border px-1.5 py-0.5 uppercase">{a.type}</span>
                  </div>
                </div>
                <span className={`text-xs shrink-0 ${a.status === "completed" ? "text-green-400" : a.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>
                  [{a.status.toUpperCase()}]
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Patrons Tab ──────────────────────────────────── */}
      {tab === "Patrons" && (
        <div className="bg-surface border border-border">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-border text-xs text-muted">
            <span>Address</span>
            <span>Role</span>
            <span className="text-right">{vantage.tokenSymbol} Amount</span>
            <span className="text-right">Share</span>
          </div>
          {vantage.patrons.map((p, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hover transition-colors text-sm">
              <span className="text-foreground font-mono text-xs">{p.walletAddress}</span>
              <span className={`text-xs ${p.role === "Creator" ? "text-accent" : p.role === "Treasury" ? "text-yellow-400" : "text-foreground"}`}>
                [{p.role.toUpperCase()}]
              </span>
              <span className="text-right text-foreground">{p.pulseAmount.toLocaleString()}</span>
              <span className="text-right text-muted">{p.share}%</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Revenue Tab ──────────────────────────────────── */}
      {tab === "Revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: vantage.revenue },
              { label: "This Month", value: `$${(REVENUE_HISTORY[REVENUE_HISTORY.length - 1]?.amount ?? 0).toLocaleString()}` },
              { label: "Avg Monthly", value: `$${Math.round(REVENUE_HISTORY.length > 0 ? REVENUE_HISTORY.reduce((s, r) => s + r.amount, 0) / REVENUE_HISTORY.length : 0).toLocaleString()}` },
              { label: "From Jobs", value: `$${vantage.jobStats.totalRevenue.toLocaleString()}` },
            ].map((s) => (
              <div key={s.label} className="bg-surface border border-border p-4 text-center">
                <div className="text-xl font-bold text-accent">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-surface border border-border p-6">
            <div className="text-xs text-muted mb-6">[REVENUE HISTORY]</div>
            {REVENUE_HISTORY.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">No revenue data yet.</div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {REVENUE_HISTORY.map((r) => (
                  <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-accent">${(r.amount / 1000).toFixed(1)}K</span>
                    <div className="w-full bg-border relative" style={{ height: `${(r.amount / maxRevenue) * 100}%` }}>
                      <div className="absolute inset-0 bg-foreground/20 hover:bg-foreground/40 transition-colors" />
                    </div>
                    <span className="text-xs text-muted">{r.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Agent Tab ──────────────────────────────────── */}
      {tab === "Agent" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs text-muted">[PRIME AGENT STATUS]</div>
              <span className={`text-xs ${vantage.agentOnline ? "text-green-400" : "text-muted"}`}>
                {vantage.agentOnline ? "[ONLINE]" : "[OFFLINE]"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted text-xs">Posts Today</span>
                <p className="text-foreground mt-1">{vantage.agentStats.postsToday}</p>
              </div>
              <div>
                <span className="text-muted text-xs">Replies Today</span>
                <p className="text-foreground mt-1">{vantage.agentStats.repliesToday}</p>
              </div>
              <div>
                <span className="text-muted text-xs">Researches Today</span>
                <p className="text-foreground mt-1">{vantage.agentStats.researchesToday}</p>
              </div>
              <div>
                <span className="text-muted text-xs">Jobs Today</span>
                <p className="text-foreground mt-1">{vantage.jobStats.jobsToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border p-6">
            <div className="text-xs text-muted mb-4">[AGENT CONFIGURATION]</div>
            <div className="space-y-4 text-sm">
              <Row label="Persona" value={vantage.persona} />
              <Row label="Target Audience" value={vantage.targetAudience} />
              <Row label="Channels" value={vantage.channels.join(", ")} />
            </div>
          </div>

          <div className="bg-surface border border-border p-6">
            <div className="text-xs text-muted mb-4">[LOCAL EXECUTION]</div>
            <div className="bg-background border border-border p-4 text-xs text-foreground space-y-1 overflow-x-auto font-mono">
              <div className="text-green-400">$ vantage-agent status</div>
              <div className="text-muted mt-2">Vantage:    {vantage.name}</div>
              <div className="text-muted">Token:     {vantage.tokenAddress}</div>
              <div className="text-muted">Status:    {vantage.agentOnline ? "ONLINE" : "OFFLINE"}</div>
              {vantage.service && (
                <>
                  <div className="text-muted">Service:   {vantage.service.name}</div>
                  <div className="text-muted">Price:     {vantage.service.price} {vantage.service.currency}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Buy Token Modal ──────────────────────────────── */}
      {buyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeBuyModal} />
          <div className="relative bg-background border border-border w-full max-w-md mx-4 p-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="text-xs text-accent tracking-wider">[BUY ${vantage.tokenSymbol}]</div>
              <button onClick={closeBuyModal} className="text-muted hover:text-foreground text-sm">
                &times;
              </button>
            </div>

            {buyStatus === "success" && buyResult ? (
              /* ─── Success state ─── */
              <div className="px-6 py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 border border-green-400/40 flex items-center justify-center text-green-400 text-lg">
                  &#10003;
                </div>
                <p className="text-sm text-foreground mb-2">Purchase Complete</p>
                <p className="text-xs text-muted mb-4">{buyResult.message}</p>
                <div className="bg-surface border border-border p-3 text-xs font-mono text-muted break-all mb-6">
                  tx: {buyResult.txHash.slice(0, 18)}...{buyResult.txHash.slice(-8)}
                </div>
                <button
                  onClick={closeBuyModal}
                  className="bg-accent text-background px-8 py-2.5 text-sm font-medium hover:bg-foreground transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ─── Purchase form ─── */
              <div className="px-6 py-6 space-y-5">
                {/* Token info */}
                <div className="flex items-center gap-3">
                  <AgentAvatar name={vantage.agentName || vantage.name} size={36} />
                  <div>
                    <div className="text-sm font-bold text-foreground">{vantage.name}</div>
                    <div className="text-xs text-muted">{vantage.tokenSymbol} &middot; Fixed Price {vantage.pulsePrice}/token</div>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-xs text-muted block mb-1.5">Amount ({vantage.tokenSymbol})</label>
                  <input
                    ref={buyInputRef}
                    type="number"
                    min={1}
                    step={1}
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full bg-surface border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    {[100, 1000, 10000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setBuyAmount(String(preset))}
                        className="text-xs border border-border px-2 py-1 text-muted hover:text-accent hover:border-accent transition-colors"
                      >
                        {preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost breakdown */}
                <div className="bg-surface border border-border p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Token Price</span>
                    <span className="text-foreground">{vantage.pulsePrice} USDC</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Quantity</span>
                    <span className="text-foreground">{buyQty.toLocaleString()} {vantage.tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted">Total Cost</span>
                    <span className="text-accent font-bold">${buyCost.toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* Buy button */}
                <button
                  onClick={handleBuyToken}
                  disabled={buyQty <= 0 || buyStatus === "buying"}
                  className={`w-full py-3 text-sm font-medium transition-colors ${
                    buyQty > 0
                      ? "bg-accent text-background hover:bg-foreground"
                      : "bg-surface text-muted border border-border cursor-not-allowed"
                  }`}
                >
                  {buyStatus === "buying"
                    ? "Processing..."
                    : buyQty > 0
                      ? `Buy ${buyQty.toLocaleString()} ${vantage.tokenSymbol} for $${buyCost.toFixed(2)}`
                      : `Enter amount to buy`}
                </button>

                <p className="text-xs text-muted/50 text-center">
                  Mock transaction &mdash; no real tokens will be transferred
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted text-xs">{label}</span>
      <span className="text-foreground text-right max-w-[60%]">{value}</span>
    </div>
  );
}
