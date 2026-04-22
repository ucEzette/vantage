"use client";

import { useState, useEffect, useCallback } from "react";
import { WalletGate } from "@/components/wallet-gate";
import { useWallet } from "@/components/providers";
import { WorldIdVerify, WORLD_ACTIONS } from "@/components/world-id-verify";
import { AgentAvatar } from "@/components/agent-avatar";
import { 
  TrendingUp, 
  Users, 
  Activity as ActivityIcon, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Shield,
  Layers,
  Cpu,
  BarChart3,
  ExternalLink,
  Copy,
  ChevronRight,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardData {
  stats: {
    totalValue: string;
    activeVantage: number;
    totalRevenue: string;
    pendingCount: number;
  };
  approvals: {
    id: string;
    vantageId: string;
    vantageName: string;
    type: string;
    title: string;
    description: string | null;
    amount: string | null;
    timestamp: string;
  }[];
  approvalHistory: {
    id: string;
    vantageId: string;
    vantageName: string;
    type: string;
    title: string;
    description: string | null;
    amount: string | null;
    status: "approved" | "rejected";
    decidedBy: string | null;
    decidedAt: string | null;
    txHash: string | null;
    timestamp: string;
  }[];
  activities: {
    id: string;
    vantageName: string;
    action: string;
    status: string;
    timestamp: string;
  }[];
  agents: {
    name: string;
    status: "online" | "offline";
    lastActive: string;
  }[];
  revenueStreams: {
    vantageId: string;
    vantageName: string;
    totalRevenue: number;
    bySource: Record<string, number>;
    recentTx: { amount: number; source: string; currency: string; date: string }[];
  }[];
  vantageManagement: {
    id: string;
    name: string;
    status: string;
    approvalThreshold: number;
    gtmBudget: number;
    channels: string[];
    tokenAddress: string;
    totalSupply: number;
    pulsePrice: number;
    apiKeyMasked: string | null;
    apiKeyRaw: string | null;
  }[];
}

function StatusBadge({ status }: { status: string }) {
  const isOnline = status === "completed" || status === "online";
  const isPending = status === "pending";
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border transition-colors ${
      isOnline 
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
        : isPending 
          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
          : "bg-white/5 text-muted border-white/5"
    }`}>
      {isOnline && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />}
      {status.toUpperCase()}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-[10px] font-bold text-muted border border-white/5 px-2 py-0.5 rounded bg-white/5 tracking-widest">
      {type.toUpperCase()}
    </span>
  );
}

export function DashboardClient() {
  return (
    <WalletGate
      title="Access Command Center"
      description="Connect your authorized wallet to manage your Vantage agents, approve transactions, and oversee on-chain governance."
    >
      <div className="pt-8">
        <DashboardLoader />
      </div>
    </WalletGate>
  );
}

function DashboardLoader() {
  const { address } = useWallet();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?wallet=${encodeURIComponent(address)}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 glass rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <DashboardContent {...data} onRefresh={fetchData} />;
}

function ApiKeyCell({ masked, raw }: { vantageId: string; masked: string | null; raw: string | null }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    if (raw) {
      navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  if (!masked) return <span className="text-muted italic opacity-50">NOT_PROVISIONED</span>;
  return (
    <div className="flex items-center gap-3">
      <code className="text-foreground text-[11px] font-mono bg-black/40 border border-white/5 px-2 py-1 rounded truncate max-w-[200px]">
        {masked}
      </code>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-[10px] font-bold text-muted hover:text-primary transition-colors"
      >
        <Copy className="w-3 h-3" />
        {copied ? "COPIED" : "COPY"}
      </button>
    </div>
  );
}

function DashboardContent({ stats, approvals: initialApprovals, approvalHistory: initialHistory, activities, agents, revenueStreams, vantageManagement, onRefresh }: DashboardData & { onRefresh: () => void }) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [approvalHistory, setApprovalHistory] = useState(initialHistory);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [error, setError] = useState<string | null>(null);
  const { address } = useWallet();

  async function handleDecision(id: string, vantageId: string, status: "approved" | "rejected", worldIdProof: unknown) {
    setError(null);
    const target = approvals.find((a) => a.id === id);
    try {
      const res = await fetch(`/api/vantage/${vantageId}/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, decidedBy: address, worldIdProof }),
      });
      if (res.ok) {
        const result = await res.json();
        setApprovals((prev) => prev.filter((a) => a.id !== id));
        if (target) {
          setApprovalHistory((prev) => [{
            ...target,
            status,
            decidedBy: address ?? null,
            decidedAt: new Date().toISOString(),
            txHash: result.txHash ?? null,
          } as any, ...prev]);
        }
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Decision failed");
      }
    } catch {
      setError("Connection error");
    }
  }

  const PORTFOLIO_STATS = [
    { label: "Portfolio Value", value: stats.totalValue, icon: TrendingUp },
    { label: "Active Vantage", value: stats.activeVantage.toString(), icon: Shield },
    { label: "Total Revenue", value: stats.totalRevenue, icon: BarChart3 },
    { label: "Pending Tasks", value: stats.pendingCount.toString(), icon: Clock },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Protocol Command</h1>
          <p className="text-muted text-sm flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live monitoring & governance for your agent corporations
          </p>
        </div>
        <button 
          onClick={onRefresh}
          className="glass hover:bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <ActivityIcon className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Main Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {PORTFOLIO_STATS.map((stat) => (
          <div key={stat.label} className="group glass p-6 rounded-2xl border border-white/5 glass-hover transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Approvals & Activity */}
        <div className="lg:col-span-8 space-y-8">
          {/* Approval Queue */}
          <section className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`text-xs font-bold tracking-widest transition-colors flex items-center gap-2 ${
                    activeTab === "pending" ? "text-primary" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  PENDING TASKS [{approvals.length}]
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`text-xs font-bold tracking-widest transition-colors flex items-center gap-2 ${
                    activeTab === "history" ? "text-primary" : "text-muted hover:text-foreground"
                  }`}
                >
                  <ActivityIcon className="w-3.5 h-3.5" />
                  HISTORY
                </button>
              </div>
            </div>

            <div className="divide-y divide-white/5 min-h-[300px]">
              <AnimatePresence mode="wait">
                {activeTab === "pending" ? (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="divide-y divide-white/5"
                  >
                    {approvals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted space-y-3">
                        <CheckCircle2 className="w-8 h-8 opacity-20" />
                        <p className="text-sm italic">Queue is clear. Agents are autonomous.</p>
                      </div>
                    ) : (
                      approvals.map((item) => (
                        <div key={item.id} className="p-6 hover:bg-white/[0.02] transition-colors group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <TypeBadge type={item.type} />
                                <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                                  {item.vantageName}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                              <p className="text-sm text-muted leading-relaxed line-clamp-2">{item.description}</p>
                              {item.amount && (
                                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-sm font-mono text-foreground font-bold">
                                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                  {item.amount}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <WorldIdVerify
                                action={WORLD_ACTIONS.approve}
                                signal={address ?? undefined}
                                onSuccess={(p) => handleDecision(item.id, item.vantageId, "approved", p)}
                              >
                                {({ verify, loading }) => (
                                  <button
                                    onClick={verify}
                                    disabled={loading}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all disabled:opacity-50"
                                  >
                                    {loading ? "VERIFYING..." : "APPROVE"}
                                  </button>
                                )}
                              </WorldIdVerify>
                              <button
                                onClick={() => handleDecision(item.id, item.vantageId, "rejected", null)}
                                className="px-6 py-2.5 rounded-xl border border-white/10 hover:border-red-500/50 hover:text-red-500 transition-all text-xs font-bold"
                              >
                                REJECT
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="divide-y divide-white/5"
                  >
                    {approvalHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted">
                        <p className="text-sm italic">Status history unavailable.</p>
                      </div>
                    ) : (
                      approvalHistory.map((item) => (
                        <div key={item.id} className="p-6 opacity-80 hover:opacity-100 transition-opacity">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <StatusBadge status={item.status} />
                                <span className="text-[10px] font-bold text-muted">{item.vantageName}</span>
                              </div>
                              <h4 className="text-sm font-bold text-foreground mb-1">{item.title}</h4>
                              <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-muted uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleDateString()}</span>
                                {item.txHash && (
                                  <a 
                                    href={`https://hashscan.io/testnet/transaction/${item.txHash}`}
                                    target="_blank"
                                    className="flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" /> ON-CHAIN
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Revenue Streams */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold tracking-[0.2em] text-muted uppercase">Global Treasury Stream</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revenueStreams.map((rs) => (
                <div key={rs.vantageId} className="glass p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <AgentAvatar name={rs.vantageName} size={24} />
                      <h3 className="font-bold text-foreground">{rs.vantageName}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">${rs.totalRevenue.toFixed(2)}</p>
                      <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Total Yield</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {rs.recentTx.slice(0, 3).map((tx, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-t border-white/5 text-xs">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium uppercase tracking-tight">{tx.source}</span>
                          <span className="text-[10px] text-muted">{new Date(tx.date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-emerald-400 font-bold font-mono">+${tx.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Agents & Management */}
        <div className="lg:col-span-4 space-y-8">
          {/* Agent Status */}
          <section className="glass rounded-2xl border border-white/5 overflow-hidden">
             <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-[0.2em] text-muted uppercase">Active Units</h2>
                <Users className="w-3.5 h-3.5 text-muted" />
             </div>
             <div className="divide-y divide-white/5">
               {agents.map((agent, i) => (
                 <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <AgentAvatar name={agent.name} size={32} />
                      <div>
                        <p className="text-sm font-bold text-foreground">{agent.name}</p>
                        <p className="text-[10px] text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {agent.lastActive}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={agent.status} />
                 </div>
               ))}
               <Link href="/launch" className="flex items-center justify-center p-4 text-[10px] font-bold text-muted hover:text-primary transition-colors group">
                  <Plus className="w-3 h-3 mr-2 group-hover:scale-125 transition-transform" />
                  PROVISION NEW AGENT
               </Link>
             </div>
          </section>

          {/* Vantage Management List */}
          <section className="space-y-4">
             <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold tracking-[0.2em] text-muted uppercase">Protocol Governance</h2>
             </div>
             <div className="space-y-3">
               {vantageManagement.map((vm) => (
                 <div key={vm.id} className="glass p-5 rounded-2xl border border-white/5 glass-hover transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        {vm.name}
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </h4>
                      <Link href={`/agents/${vm.id}`} className="text-muted hover:text-primary transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                          <span>Threshold</span>
                          <span className="text-foreground">${vm.approvalThreshold} USDC</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                          <span>Service ID</span>
                          <span className="text-foreground font-mono">{vm.tokenAddress || "GENESIS"}</span>
                       </div>
                       <div className="pt-3 border-t border-white/5">
                          <ApiKeyCell vantageId={vm.id} masked={vm.apiKeyMasked} raw={vm.apiKeyRaw} />
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </section>

          {/* Activity Mini Feed */}
          <section className="glass rounded-2xl border border-white/5 overflow-hidden">
             <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-xs font-bold tracking-[0.2em] text-muted uppercase tracking-widest">Protocol Stream</h2>
             </div>
             <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-3 relative group">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-primary transition-colors mt-1.5" />
                      <div className="flex-1 w-[1px] bg-white/5 mt-2" />
                    </div>
                    <div className="pb-2">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-60">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {act.vantageName}
                      </p>
                      <p className="text-xs text-foreground/80 leading-relaxed group-hover:text-foreground transition-colors">
                        {act.action}
                      </p>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
