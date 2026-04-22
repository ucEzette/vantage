"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@/components/providers";
import { WorldIdVerify, WORLD_ACTIONS } from "@/components/world-id-verify";
import { AgentAvatar } from "@/components/agent-avatar";
import { 
  ArrowLeft, 
  Bot, 
  Activity as ActivityIcon, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Cpu,
  BarChart4,
  Wallet,
  AlertCircle,
  Copy,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const TYPE_ICONS: Record<string, any> = {
  post: ActivityIcon,
  research: Globe,
  reply: Terminal,
  commerce: Zap,
  approval: Shield,
};

function StatusBadge({ status }: { status: string }) {
  const isOnline = status === "completed" || status === "online" || status === "Active";
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
      `https://testnet.mirrornode.hedera.com/api/v1/tokens/${vantage.tokenAddress}/balances?account.id=${address}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const entry = data?.balances?.[0];
        setPulseBalance(entry ? Number(entry.balance) : 0);
      })
      .catch(() => {
        if (cancelled) return;
        const dbAmount = vantage.patrons.find((p) => p.walletAddress === address)?.pulseAmount ?? 0;
        setPulseBalance(dbAmount);
      })
      .finally(() => { if (!cancelled) setPulseLoading(false); });
    return () => { cancelled = true; };
  }, [address, vantage.tokenAddress, vantage.patrons]);

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
        setPatronStatus("none");
      }
    } catch {
      setPatronStatus("none");
    }
  }, [address, vantage.id, isPatron, myPulseBalance]);

  // Buy token modal
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
        setBuyStatus("error");
      }
    } catch {
      setBuyStatus("error");
    }
  }, [address, buyQty, vantage.id]);

  const REVENUE_HISTORY = vantage.revenueHistory ?? [];
  const maxRevenue = Math.max(...REVENUE_HISTORY.map((r) => r.amount), 1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link href="/agents" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition-all group mb-8">
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        RETURN TO REGISTRY
      </Link>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-12">
        <div className="flex gap-6 items-start">
          <div className="relative group">
             <div className="glass p-1.5 rounded-3xl border-white/10 group-hover:border-primary/40 transition-all shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <AgentAvatar name={vantage.agentName || vantage.name} size={64} />
             </div>
             <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#020617] ${vantage.agentOnline ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl font-bold tracking-tight">{vantage.name}</h1>
                <StatusBadge status={vantage.status} />
                <div className="text-[10px] font-bold text-muted border border-white/5 px-2 py-0.5 rounded bg-white/5 tracking-widest flex items-center gap-1.5 uppercase">
                   <Globe className="w-3 h-3" /> {vantage.category}
                </div>
             </div>
             
             {vantage.agentName && (
               <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground group">
                  <Shield className="w-4 h-4 text-primary opacity-60" />
                  <span className="text-foreground/80">{vantage.agentName}.vantage</span>
               </div>
             )}
             
             <p className="text-muted text-sm leading-relaxed max-w-2xl">{vantage.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-3">
              {(isPatron || patronStatus === "patron") ? (
                <div className="glass border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-2 text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/10">
                   <CheckCircle2 className="w-4 h-4" />
                   AUTHORIZED PATRON
                </div>
              ) : (
                <WorldIdVerify
                  action={WORLD_ACTIONS.patron}
                  signal={address ?? undefined}
                  onSuccess={(proof) => handleBecomePatron(proof)}
                >
                  {({ verify, loading }) => (
                    <div className="relative group">
                      <button
                        onClick={verify}
                        disabled={!meetsThreshold || patronStatus === "loading" || loading}
                        className={`px-8 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                          meetsThreshold
                            ? "bg-primary text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            : "glass border-white/5 text-muted-foreground opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {patronStatus === "loading" || loading ? "VALIDATING..." : "BECOME PATRON"}
                        {!loading && meetsThreshold && <ArrowRight className="w-4 h-4" />}
                      </button>
                      {!meetsThreshold && (
                        <div className="absolute top-full left-0 right-0 mt-2 p-3 glass border-white/5 rounded-xl text-[9px] font-bold text-muted uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity z-10">
                           Requirement: {minRequired.toLocaleString()} {vantage.tokenSymbol}
                        </div>
                      )}
                    </div>
                  )}
                </WorldIdVerify>
              )}
              <button
                onClick={() => setBuyOpen(true)}
                className="glass hover:bg-white/5 border border-white/10 px-8 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                BUY {vantage.tokenSymbol}
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="bg-primary text-black px-10 py-3 rounded-2xl font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Wallet className="w-4 h-4" />
              CONNECT TO AUTHENTICATE
            </button>
          )}
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        {[
          { label: "Market Price", value: vantage.pulsePrice, icon: BarChart4, color: "text-primary" },
          { label: "Active Patrons", value: vantage.patronCount.toString(), icon: Users, color: "text-blue-400" },
          { label: "Core Treasury", value: vantage.revenue, icon: Wallet, color: "text-amber-400" },
          { label: "Total Yield", value: `$${vantage.jobStats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Success Rate", value: vantage.jobStats.successRate !== null ? `${vantage.jobStats.successRate}%` : "—", icon: CheckCircle2, color: "text-indigo-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon className="w-10 h-10" />
             </div>
             <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{stat.label}</p>
             <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs Layout */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-white/5 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-4 text-xs font-bold transition-all relative ${
              tab === t ? "text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            {t.toUpperCase()}
            {t === "Services" && vantage.service && (
               <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">1</span>
            )}
            {tab === t && (
              <motion.div 
                layoutId="active-agent-tab"
                className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
           key={tab}
           initial={{ opacity: 0, x: 10 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -10 }}
           transition={{ duration: 0.2 }}
        >
          {/* Overview Tab */}
          {tab === "Overview" && (
            <div className="grid lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 space-y-8">
                  {vantage.service && (
                    <div className="glass p-8 rounded-3xl border-primary/20 bg-primary/[0.02] relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Zap className="w-32 h-32 text-primary" />
                       </div>
                       <div className="flex justify-between items-start mb-6">
                         <div>
                            <div className="text-[10px] font-bold text-primary tracking-[0.2em] mb-4 uppercase">Available Service</div>
                            <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{vantage.service.name}</h3>
                            <p className="text-sm text-muted leading-relaxed max-w-xl">{vantage.service.description}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-3xl font-bold text-primary">{vantage.service.price} {vantage.service.currency}</p>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">PER REQUEST</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                             <span className="text-xs font-bold text-muted">{vantage.jobStats.completed} JOBS DONE</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Globe className="w-4 h-4 text-blue-400" />
                             <span className="text-xs font-bold text-muted">CHAINS: {vantage.service.chains.join(", ")}</span>
                          </div>
                          <button onClick={() => setTab("Services")} className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline">
                             VIEW API DOCS <ArrowRight className="w-3 h-3" />
                          </button>
                       </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass p-6 rounded-2xl border-white/5">
                       <div className="flex items-center gap-3 mb-6">
                          <Shield className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Kernel Policy</h3>
                       </div>
                       <div className="space-y-4">
                          <PolicyRow label="Auth Threshold" value={`${vantage.approvalThreshold} USDC`} />
                          <PolicyRow label="GTM Budget" value={`$${vantage.gtmBudget}/MO`} />
                          <PolicyRow label="Min Patronage" value={`${minRequired.toLocaleString()} ${vantage.tokenSymbol}`} />
                       </div>
                    </div>
                    <div className="glass p-6 rounded-2xl border-white/5">
                       <div className="flex items-center gap-3 mb-6">
                          <Bot className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Intelligence Profile</h3>
                       </div>
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Persona</p>
                             <p className="text-sm font-medium leading-relaxed">{vantage.persona}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Target Market</p>
                             <p className="text-sm font-medium leading-relaxed">{vantage.targetAudience}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="glass p-6 rounded-2xl border-white/5">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <ActivityIcon className="w-4 h-4 text-primary" />
                           <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Recent Activities</h3>
                        </div>
                        <button onClick={() => setTab("Activity")} className="text-[10px] font-bold text-primary hover:underline">
                           FULL LOGS &rarr;
                        </button>
                     </div>
                     <div className="space-y-4">
                        {vantage.activities.slice(0, 5).map(a => {
                           const Icon = TYPE_ICONS[a.type] || Terminal;
                           return (
                             <div key={a.id} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                   <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-primary/40 transition-colors">
                                      <Icon className="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors" />
                                   </div>
                                   <div className="flex-1 w-[1px] bg-white/5 mt-2" />
                                </div>
                                <div className="flex-1 pb-4">
                                   <div className="flex justify-between items-start mb-1">
                                      <p className="text-sm font-medium text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">{a.content}</p>
                                      <StatusBadge status={a.status} />
                                   </div>
                                   <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{a.channel} &middot; {a.timestamp}</p>
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-4 space-y-8">
                  <div className="glass p-6 rounded-2xl border-white/5">
                     <div className="flex items-center gap-3 mb-6">
                        <ActivityIcon className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Job Throughput</h3>
                     </div>
                     <div className="space-y-4">
                        <JobStat label="Completed" value={vantage.jobStats.completed} color="text-emerald-400" />
                        <JobStat label="Strategic Yield" value={`$${vantage.jobStats.totalRevenue.toLocaleString()}`} color="text-primary" />
                        {vantage.jobStats.successRate !== null && (
                          <div className="pt-4 space-y-2">
                             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-muted">Success Probability</span>
                                <span className="text-foreground">{vantage.jobStats.successRate}%</span>
                             </div>
                             <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                  style={{ width: `${vantage.jobStats.successRate}%` }} 
                                />
                             </div>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="glass p-6 rounded-2xl border-white/5">
                     <div className="flex items-center gap-3 mb-6">
                        <Globe className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Vantage Core</h3>
                     </div>
                     <div className="space-y-3">
                        <InfoRow label="Protocol" value="Vantage / Arc" />
                        <InfoRow label="Symbol" value={vantage.tokenSymbol} />
                        <InfoRow label="Address" value={vantage.tokenAddress} mono />
                        <div className="pt-4">
                           <a 
                             href={`https://hashscan.io/testnet/token/${vantage.tokenAddress}`} 
                             target="_blank" 
                             className="flex items-center justify-center gap-2 w-full py-3 glass hover:bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold transition-all group"
                           >
                             HASHSCAN EXPLORER <ExternalLink className="w-3 h-3 group-hover:scale-110" />
                           </a>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Services Tab */}
          {tab === "Services" && (
            <div className="space-y-8">
               {vantage.service ? (
                 <>
                    <div className="glass p-10 rounded-3xl border-white/5 relative overflow-hidden">
                       <div className="flex flex-col md:flex-row justify-between gap-12">
                          <div className="flex-1">
                             <div className="text-[10px] font-bold text-primary tracking-[0.2em] mb-6 uppercase">Programmatic Service</div>
                             <h3 className="text-3xl font-bold mb-6">{vantage.service.name}</h3>
                             <p className="text-muted leading-relaxed text-lg mb-8">{vantage.service.description}</p>
                             
                             <div className="grid grid-cols-2 gap-8">
                                <div>
                                   <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">Unit Cost</p>
                                   <p className="text-2xl font-bold text-primary">{vantage.service.price} {vantage.service.currency}</p>
                                </div>
                                <div>
                                   <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">Protocol</p>
                                   <p className="text-2xl font-bold text-foreground flex items-center gap-2">
                                      <Zap className="w-6 h-6 text-emerald-400" /> x402
                                   </p>
                                </div>
                             </div>
                          </div>
                          
                          <div className="lg:w-96 space-y-4">
                             <div className="glass border-white/10 p-6 rounded-2xl">
                                <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Verification Endpoints</h4>
                                <div className="space-y-4">
                                   <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted">Status</span>
                                      <StatusBadge status={vantage.agentOnline ? "online" : "offline"} />
                                   </div>
                                   <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted">Network</span>
                                      <span className="text-foreground font-mono">Hedera-Testnet</span>
                                   </div>
                                   <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted">Chain Affinity</span>
                                      <div className="flex gap-1">
                                         {vantage.service.chains.map(c => (
                                           <span key={c} className="bg-white/5 px-2 py-0.5 rounded text-[10px]">{c}</span>
                                         ))}
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xs font-bold tracking-[0.2em] text-muted uppercase px-2">Integration Documentation</h3>
                       <div className="glass rounded-3xl border-white/5 overflow-hidden">
                          <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                             <Terminal className="w-4 h-4 text-primary" />
                             <span className="text-[10px] font-bold tracking-widest text-muted uppercase">Terminal Request Mockup</span>
                          </div>
                          <div className="p-8 bg-black/40 font-mono text-sm leading-relaxed overflow-x-auto selection:bg-primary/20">
                             <p className="text-emerald-400 mb-4"># Call system service via local agent context</p>
                             <p className="text-foreground"><span className="text-blue-400">curl</span> -X POST https://api.vantage.sh/v1/jobs \</p>
                             <p className="pl-6 text-foreground">-H <span className="text-amber-400">&quot;X-Vantage-ID: {vantage.id}&quot;</span> \</p>
                             <p className="pl-6 text-foreground">-H <span className="text-amber-400">&quot;X-Service-Wallet: {vantage.service.walletAddress}&quot;</span> \</p>
                             <p className="pl-6 text-foreground">-d <span className="text-emerald-400 uppercase">&apos;{"{"}&quot;service&quot;: &quot;{vantage.service.name}&quot;, &quot;input&quot;: {"{...}"}{"}"}&apos;</span></p>
                             <div className="mt-8 pt-8 border-t border-white/5 text-muted text-xs">
                                Response status: <span className="text-emerald-500 font-bold">202 ACCEPTED</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center justify-center py-40 glass rounded-3xl opacity-60">
                    <Zap className="w-12 h-12 text-muted mb-4" />
                    <p className="text-xs font-bold text-muted uppercase tracking-widest">No commercial services provisioned</p>
                 </div>
               )}
            </div>
          )}

          {/* Activity Tab */}
          {tab === "Activity" && (
            <div className="space-y-4">
               {vantage.activities.length === 0 ? (
                 <div className="text-center py-40 glass rounded-3xl border-dashed border-white/10">
                    <p className="text-sm font-bold text-muted tracking-widest italic opacity-50 uppercase">No active operations detected</p>
                 </div>
               ) : (
                 <div className="glass rounded-3xl border-white/5 overflow-hidden divide-y divide-white/5">
                    <div className="grid grid-cols-12 px-8 py-4 bg-white/[0.02] text-[10px] font-bold text-muted tracking-widest uppercase">
                       <div className="col-span-1">TAG</div>
                       <div className="col-span-8">ACTIVITY FEED</div>
                       <div className="col-span-2">CHANNEL</div>
                       <div className="col-span-1 text-right">STATUS</div>
                    </div>
                    {vantage.activities.map(a => {
                       const Icon = TYPE_ICONS[a.type] || Terminal;
                       return (
                         <div key={a.id} className="grid grid-cols-12 px-8 py-6 items-center hover:bg-white/[0.01] transition-all group">
                            <div className="col-span-1">
                               <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                                  <Icon className="w-3.5 h-3.5 text-muted group-hover:text-primary" />
                               </div>
                            </div>
                            <div className="col-span-8 pr-12">
                               <p className="text-sm font-medium mb-1 group-hover:text-foreground transition-colors">{a.content}</p>
                               <p className="text-xs text-muted/60">{a.timestamp}</p>
                            </div>
                            <div className="col-span-2">
                               <span className="text-[10px] font-bold text-muted uppercase tracking-widest glass px-3 py-1 rounded-lg border border-white/5">{a.channel}</span>
                            </div>
                            <div className="col-span-1 text-right">
                               <StatusBadge status={a.status} />
                            </div>
                         </div>
                       );
                    })}
                 </div>
               )}
            </div>
          )}

          {/* Patrons Tab */}
          {tab === "Patrons" && (
             <div className="glass rounded-3xl border-white/5 overflow-hidden">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-muted tracking-[0.2em] uppercase">
                         <th className="px-8 py-5">Verified Address</th>
                         <th className="px-8 py-5">Protocol Role</th>
                         <th className="px-8 py-5 text-right">Authorized Balance</th>
                         <th className="px-8 py-5 text-right">Voting Share</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {vantage.patrons.map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
                                 <span className="text-xs font-mono text-muted tracking-tight group-hover:text-foreground transition-colors select-all">{p.walletAddress}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded-lg border ${
                                p.role === "Creator" ? "text-primary border-primary/20 bg-primary/5" : "text-muted border-white/5"
                              }`}>
                                {p.role.toUpperCase()}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right font-mono text-sm">{p.pulseAmount.toLocaleString()}</td>
                           <td className="px-8 py-6 text-right text-xs font-bold text-muted">{p.share}%</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}

          {/* Revenue Tab */}
          {tab === "Revenue" && (
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Total Accrued" value={vantage.revenue} />
                  <StatCard label="Current Window" value={`$${(REVENUE_HISTORY[REVENUE_HISTORY.length - 1]?.amount ?? 0).toLocaleString()}`} />
                  <StatCard label="Operational Avg" value={`$${Math.round(REVENUE_HISTORY.length > 0 ? REVENUE_HISTORY.reduce((s, r) => s + r.amount, 0) / REVENUE_HISTORY.length : 0).toLocaleString()}`} />
                  <StatCard label="Service Yield" value={`$${vantage.jobStats.totalRevenue.toLocaleString()}`} />
               </div>

               <div className="glass p-10 rounded-3xl border-white/5">
                  <div className="flex items-center justify-between mb-12">
                    <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Accrual Performance (Past 6 Months)</h3>
                    <div className="flex gap-4">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary/40" />
                          <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Revenue (USD)</span>
                       </div>
                    </div>
                  </div>
                  
                  {REVENUE_HISTORY.length === 0 ? (
                    <div className="text-center py-20 text-muted italic text-sm">Historical data pending protocol maturity.</div>
                  ) : (
                    <div className="flex items-end gap-6 h-64">
                       {REVENUE_HISTORY.map((r) => (
                         <div key={r.month} className="flex-1 flex flex-col items-center group">
                            <div className="mb-4 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                               ${(r.amount / 1000).toFixed(1)}K
                            </div>
                            <div className="w-full relative h-full flex flex-col justify-end">
                               <motion.div 
                                 initial={{ height: 0 }}
                                 animate={{ height: `${(r.amount / maxRevenue) * 100}%` }}
                                 transition={{ duration: 1, ease: "easeOut" }}
                                 className="w-full bg-primary/20 hover:bg-primary/40 border-t-2 border-primary/40 transition-colors relative"
                               >
                                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-primary/5" />
                               </motion.div>
                            </div>
                            <span className="text-[10px] font-bold text-muted mt-6 uppercase tracking-widest">{r.month}</span>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Agent Tab */}
          {tab === "Agent" && (
            <div className="grid lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 space-y-8">
                  <div className="glass p-8 rounded-3xl border-white/5">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <Bot className="w-4 h-4 text-primary" />
                           <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Internal Execution Engine</h3>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Engine Online</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <AgentStat label="Posts (24H)" value={vantage.agentStats.postsToday} />
                        <AgentStat label="Engagement" value={vantage.agentStats.repliesToday} />
                        <AgentStat label="Deep Research" value={vantage.agentStats.researchesToday} />
                        <AgentStat label="Job Exec" value={vantage.jobStats.jobsToday} />
                     </div>
                  </div>

                  <div className="glass p-8 rounded-3xl border-white/5">
                     <div className="flex items-center gap-3 mb-8">
                        <Terminal className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Deployment Sandbox</h3>
                     </div>
                     <div className="bg-black/40 border border-white/5 rounded-2xl p-8 font-mono text-xs text-foreground/80 leading-relaxed shadow-inner">
                        <p className="text-primary/60 mb-2">// Fetch current execution context</p>
                        <p className="text-foreground mb-4">$ vantage-agent status --vantage-id {vantage.id}</p>
                        <div className="space-y-1 pl-4 border-l-2 border-white/5">
                          <p className="text-muted">Vantage Instance: <span className="text-foreground font-bold">{vantage.name.toUpperCase()}</span></p>
                          <p className="text-muted">Agent ID:         <span className="text-foreground font-bold">{vantage.agentName}.vantage</span></p>
                          <p className="text-muted">Protocol Kernel:  <span className="text-foreground font-bold">ARC-V2</span></p>
                          <p className="text-muted">Status:           <span className="text-emerald-400 font-bold">READY_FOR_ENGAGEMENT</span></p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-4 space-y-8">
                  <div className="glass p-8 rounded-3xl border-white/5">
                     <div className="flex items-center gap-3 mb-8">
                        <Settings2Icon className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Core Config</h3>
                     </div>
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <p className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                             <Cpu className="w-3.5 h-3.5" /> Intelligence Persona
                           </p>
                           <p className="text-sm font-medium leading-relaxed">{vantage.persona}</p>
                        </div>
                        <div className="space-y-3">
                           <p className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                             <TrendingUp className="w-3.5 h-3.5" /> Growth Targets
                           </p>
                           <p className="text-sm font-medium leading-relaxed">{vantage.targetAudience}</p>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-white/5">
                           <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Deployed Channels</p>
                           <div className="flex flex-wrap gap-2 pt-2">
                              {vantage.channels.map(ch => (
                                <span key={ch} className="px-3 py-1.5 glass border-white/10 rounded-lg text-xs font-bold">{ch}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Buy Modal (Revamped) */}
      <AnimatePresence>
         {buyOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setBuyStatus("idle") !== undefined && closeBuyModal()}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg glass border-white/10 rounded-[40px] shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden"
              >
                 <div className="px-10 py-10">
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <div className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-2">Investment Portal</div>
                          <h2 className="text-3xl font-bold">Acquire {vantage.tokenSymbol}</h2>
                       </div>
                       <button onClick={closeBuyModal} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                          <XIcon className="w-6 h-6 text-muted" />
                       </button>
                    </div>

                    {buyStatus === "success" ? (
                       <div className="text-center py-12">
                          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-8 animate-in zoom-in duration-500" />
                          <h3 className="text-2xl font-bold mb-4">Pulse Successfully Issued</h3>
                          <p className="text-muted text-sm max-w-xs mx-auto mb-10">The {vantage.tokenSymbol} tokens have been provisioned to your Hedera wallet.</p>
                          <a 
                            href={`https://hashscan.io/testnet/transaction/${buyResult?.txHash}`} 
                            target="_blank"
                            className="bg-primary text-black font-bold px-10 py-4 rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mb-6"
                          >
                             VIEW ON HASHSCAN <ExternalLink className="w-4 h-4" />
                          </a>
                       </div>
                    ) : (
                       <div className="space-y-10">
                          <div className="space-y-4">
                             <label className="block text-[10px] font-bold text-muted uppercase tracking-widest pl-2">Quantity to Issue</label>
                             <div className="relative">
                                <input 
                                  ref={buyInputRef}
                                  type="number" 
                                  value={buyAmount}
                                  onChange={e => setBuyAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-black/40 border border-white/5 px-8 py-6 rounded-3xl text-3xl font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:opacity-20"
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-muted font-bold text-lg">{vantage.tokenSymbol}</span>
                             </div>
                          </div>

                          <div className="p-8 glass bg-white/[0.02] border-white/5 rounded-3xl space-y-4">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted">Unit Cost</span>
                                <span className="text-foreground font-bold">{vantage.pulsePrice}</span>
                             </div>
                             <div className="flex justify-between items-center text-lg border-t border-white/5 pt-4">
                                <span className="text-muted font-medium">Estimated Total</span>
                                <span className="text-primary font-bold">${buyCost} USDC</span>
                             </div>
                          </div>

                          <button 
                             onClick={handleBuyToken}
                             disabled={buyStatus === "buying" || buyQty <= 0}
                             className="w-full bg-primary text-black font-bold py-5 rounded-3xl hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                             {buyStatus === "buying" ? (
                                <>
                                   <ActivityIcon className="w-5 h-5 animate-spin" />
                                   EXECUTING TRANSACTION...
                                </>
                             ) : (
                                <>
                                   CONFIRM PURCHASE <ArrowRight className="w-5 h-5" />
                                </>
                             )}
                          </button>
                       </div>
                    )}
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
   return (
      <div className="flex justify-between items-center group">
         <span className="text-[10px] font-bold text-muted uppercase tracking-widest group-hover:text-foreground transition-colors">{label}</span>
         <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{value}</span>
      </div>
   );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</span>
            <p className={`text-sm font-medium ${mono ? "font-mono text-xs opacity-80" : "text-foreground"}`}>{value}</p>
        </div>
    );
}

function JobStat({ label, value, color }: { label: string; value: any; color: string }) {
    return (
        <div className="group">
           <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 group-hover:text-foreground transition-colors">{label}</p>
           <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="glass p-6 rounded-2xl border border-white/5 text-center group transition-all hover:bg-white/[0.02]">
           <p className="text-xl font-bold text-primary mb-1">{value}</p>
           <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</p>
        </div>
    );
}

function AgentStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-center group">
           <p className="text-xs font-bold text-primary mb-1 group-hover:scale-110 transition-transform tabular-nums">{value}</p>
           <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</p>
        </div>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    );
}

function Settings2Icon({ className }: { className?: string }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 7h-9m-4 0H4m16 5h-4m-4 0H4m16 5h-9m-4 0H4m8-11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-4 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm4 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
    );
}
