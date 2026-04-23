"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AgentAvatar } from "@/components/agent-avatar";
import { 
  Activity as ActivityIcon, 
  BarChart3, 
  Users, 
  Zap, 
  ArrowRight, 
  Globe, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRightLeft,
  Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type: "service" | "playbook";
  sellerName: string;
  sellerAgent: string | null;
  buyerName: string;
  buyerAgent: string | null;
  itemName: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  txHash: string | null;
}

interface Props {
  stats: {
    totalTransactions: number;
    totalVolume: number;
    activeAgents: number;
    totalAgents: number;
    registeredServices: number;
    playbooksTraded: number;
  };
  transactions: Transaction[];
  initialCursor: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────

const FILTERS = ["All", "Service", "Playbook"] as const;
type Filter = (typeof FILTERS)[number];

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const isOnline = status === "completed" || status === "online" || status === "Active";
  const isPending = status === "pending" || status === "in_progress";
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[9px] font-black tracking-[0.2em] border transition-all uppercase ${
      isOnline 
        ? "bg-primary/10 text-primary border-primary/20" 
        : isPending 
          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
          : "bg-white/5 text-muted-foreground/20 border-white/5"
    }`}>
      {isOnline && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" />}
      {status}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────

const PAGE_SIZE = 25;
const POLL_INTERVAL = 5_000;

export function ActivityClient({ stats: initialStats, transactions: initialTransactions, initialCursor }: Props) {
  const [filter, setFilter] = useState<Filter>("All");
  const [stats, setStats] = useState(initialStats);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Poll stats + transactions (first page only)
  const refresh = useCallback(async () => {
    try {
      const isFirstPage = page === 1;
      const params = new URLSearchParams(
        isFirstPage ? { limit: String(PAGE_SIZE) } : { statsOnly: "true" }
      );
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats);
      if (isFirstPage) {
        setTransactions(data.transactions);
        setNextCursor(data.nextCursor);
      }
    } catch { /* silent */ }
  }, [page]);

  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  const fetchPage = useCallback(async (cursor: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setTransactions(data.transactions);
      setNextCursor(data.nextCursor);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const goNext = useCallback(() => {
    if (!nextCursor || loading) return;
    const currentFirst = transactions[0]?.timestamp ?? null;
    setPrevCursors((prev) => [...prev, currentFirst ?? ""]);
    setPage((p) => p + 1);
    fetchPage(nextCursor);
  }, [nextCursor, loading, transactions, fetchPage]);

  const goPrev = useCallback(() => {
    if (prevCursors.length === 0 || loading) return;
    const prev = [...prevCursors];
    const cursor = prev.pop()!;
    setPrevCursors(prev);
    setPage((p) => p - 1);
    fetchPage(cursor || null);
  }, [prevCursors, loading, fetchPage]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
        <div className="max-w-2xl">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-1 bg-primary/40 rounded-full" />
              <div className="text-[10px] font-black text-primary tracking-[0.5em] uppercase opacity-80">Economic Observer</div>
           </div>
           <h1 className="text-5xl font-black tracking-tighter uppercase mb-6">Protocol Activity</h1>
           <p className="text-muted-foreground font-medium text-base leading-relaxed opacity-70 uppercase tracking-widest">
             The heartbeat of the Vantage Protocol. Observe real-time agent-to-agent 
             transactions, strategic resource trades, and autonomous commerce flows.
           </p>
        </div>
        
        <div className="flex gap-4 items-center">
           <div className="glass-morphism border border-primary/20 px-8 py-4 rounded-2xl text-[10px] font-black text-primary tracking-[0.4em] flex items-center gap-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_var(--primary)]" />
              Live Feed
           </div>
        </div>
      </div>

      {/* Stats Cluster */}
      <section className="mb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { label: "Throughput", value: stats.totalTransactions.toLocaleString(), icon: ActivityIcon, color: "text-primary" },
            { 
               label: "Economy Volume", 
               value: `$${(stats.totalVolume / 1000).toFixed(1)}K`, 
               icon: TrendingUp, 
               color: "text-emerald-400" 
            },
            { label: "Active Nodes", value: `${stats.activeAgents}/${stats.totalAgents}`, icon: Cpu, color: "text-blue-400" },
            { label: "Services", value: stats.registeredServices, icon: Zap, color: "text-amber-400" },
            { label: "Resource Trades", value: stats.playbooksTraded, icon: Layers, color: "text-indigo-400" },
            { 
               label: "Avg. Velocity", 
               value: stats.totalTransactions > 0 ? `$${(stats.totalVolume / stats.totalTransactions).toFixed(0)}` : "$0", 
               icon: Globe, 
               color: "text-muted" 
            },
          ].map((stat) => (
            <div key={stat.label} className="glass-morphism p-6 rounded-[2rem] border border-white/5 group transition-all hover:border-white/10 hover:bg-white/[0.03] shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                 <stat.icon className={`w-4 h-4 ${stat.color} opacity-40 group-hover:opacity-100 transition-all`} />
                 <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
              <p className="text-2xl font-black tabular-nums text-foreground tracking-tighter">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Control Surface */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-12">
         <div className="flex items-center gap-5">
            <Layers className="w-5 h-5 text-primary opacity-60" />
            <h2 className="text-[10px] font-black tracking-[0.5em] text-muted-foreground/60 uppercase">Transaction Stream</h2>
         </div>
         
         <div className="flex glass-morphism p-1.5 rounded-2xl border-white/5 shadow-inner">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.3em] transition-all uppercase ${
                  filter === f
                    ? "bg-white/10 text-primary shadow-2xl"
                    : "text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.02]"
                }`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      {/* Transaction Feed */}
      <section className="space-y-8">
        <div className="glass-morphism rounded-[2.5rem] border-white/5 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          <table className="w-full text-left">
             <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black text-muted-foreground/40 tracking-[0.4em] uppercase">
                   <th className="px-10 py-6">Source</th>
                   <th className="px-10 py-6">Context</th>
                   <th className="px-10 py-6 text-right">Value</th>
                   <th className="px-10 py-6 text-right">Destination</th>
                   <th className="px-10 py-6 text-right">Status</th>
                   <th className="px-10 py-6 text-right">Explorer</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5 font-mono text-xs">
                <AnimatePresence mode="popLayout">
                {transactions
                  .filter(tx => filter === "All" || tx.type === filter.toLowerCase())
                  .map((tx, idx) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.02 }}
                      key={tx.id} 
                      className="hover:bg-white/[0.01] transition-all group"
                    >
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-4 min-w-0 font-sans">
                             <div className="glass-morphism p-1 rounded-xl border-white/10 shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                <AgentAvatar name={tx.buyerAgent || tx.buyerName} size={32} />
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-black text-foreground truncate uppercase tracking-tighter">{tx.buyerName}</p>
                                <p className="text-[10px] font-bold text-muted-foreground/40 font-mono tracking-tighter">@{tx.buyerAgent || "anonymous"}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex flex-col gap-1.5 font-sans">
                             <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${tx.type === "service" ? "text-primary" : "text-indigo-400"}`}>
                                {tx.type}
                             </span>
                             <span className="text-xs text-muted-foreground/60 truncate max-w-[140px] font-medium">&ldquo;{tx.itemName}&rdquo;</span>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <p className="text-sm font-black text-emerald-400 tracking-tighter">{tx.amount.toFixed(2)} USDC</p>
                          <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1.5" suppressHydrationWarning>{getRelativeTime(tx.timestamp).toUpperCase()}</p>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <div className="flex items-center gap-4 justify-end min-w-0 font-sans">
                             <div className="min-w-0 text-right">
                                <p className="text-sm font-black text-foreground truncate uppercase tracking-tighter">{tx.sellerName}</p>
                                <p className="text-[10px] font-bold text-muted-foreground/40 font-mono tracking-tighter">@{tx.sellerAgent || "genesis"}</p>
                             </div>
                             <div className="glass-morphism p-1 rounded-xl border-white/10 shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                <AgentAvatar name={tx.sellerAgent || tx.sellerName} size={32} />
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <StatusBadge status={tx.status} />
                       </td>
                       <td className="px-10 py-8 text-right">
                          {tx.txHash ? (
                             <a 
                                href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                                target="_blank"
                                className="inline-flex p-3 rounded-2xl glass-morphism border-white/10 hover:border-primary/40 hover:text-primary transition-all group/link shadow-lg"
                             >
                                <ExternalLink className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                             </a>
                          ) : (
                             <span className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">Off-Chain</span>
                          )}
                       </td>
                    </motion.tr>
                ))}
                </AnimatePresence>
             </tbody>
          </table>
          
          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-48 opacity-50">
               <ArrowRightLeft className="w-16 h-16 text-muted-foreground/20 mb-6" />
               <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.5em]">Stream Silent</p>
            </div>
          )}
        </div>

        {/* Pagination Console */}
        <div className="flex items-center justify-between px-6">
           <div className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.4em]">
              Page {page} // Viewing {PAGE_SIZE} Nodes
           </div>
           <div className="flex gap-4">
              <button
                onClick={goPrev}
                disabled={page === 1 || loading}
                className="p-4 rounded-2xl glass-morphism border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-10 disabled:cursor-not-allowed group/prev shadow-xl"
              >
                <ChevronLeft className="w-5 h-5 group-hover/prev:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={goNext}
                disabled={!nextCursor || loading}
                className="p-4 rounded-2xl glass-morphism border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-10 disabled:cursor-not-allowed group/next shadow-xl"
              >
                <ChevronRight className="w-5 h-5 group-hover/next:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </section>
    </div>
  );
}
