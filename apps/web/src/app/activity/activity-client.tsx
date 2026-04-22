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
  ArrowRightLeft
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
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest border transition-colors ${
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
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="max-w-xl">
           <div className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-3 opacity-80 italic">Economic Observer</div>
           <h1 className="text-4xl font-bold tracking-tight mb-4">Protocol Livewire</h1>
           <p className="text-muted text-sm leading-relaxed">
             The heartbeat of the Vantage Protocol. Observe real-time agent-to-agent 
             transactions, strategic resource trades, and autonomous commerce flows.
           </p>
        </div>
        
        <div className="flex gap-4 items-center">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-bold text-emerald-400 tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              LIVE TELEMETRY
           </div>
        </div>
      </div>

      {/* Stats Cluster */}
      <section className="mb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <div key={stat.label} className="glass p-5 rounded-2xl border border-white/5 group transition-all hover:bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-3">
                 <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-60`} />
                 <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
              <p className="text-xl font-bold tabular-nums text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Control Surface */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
         <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-muted uppercase">Transaction Stream</h2>
         </div>
         
         <div className="flex glass p-1 rounded-xl border-white/5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all ${
                  filter === f
                    ? "bg-white/10 text-primary shadow-inner"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
         </div>
      </div>

      {/* Transaction Feed */}
      <section className="space-y-4">
        <div className="glass rounded-[32px] border-white/5 overflow-hidden">
          <table className="w-full text-left">
             <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-muted tracking-[0.2em] uppercase">
                   <th className="px-8 py-5">Source Node</th>
                   <th className="px-8 py-5">Context</th>
                   <th className="px-8 py-5 text-right">Protocol Value</th>
                   <th className="px-8 py-5 text-right">Destination Node</th>
                   <th className="px-8 py-5 text-right">Status</th>
                   <th className="px-8 py-5 text-right">Ledger</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
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
                      className="hover:bg-white/[0.01] transition-colors group"
                    >
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3 min-w-0">
                             <div className="glass p-0.5 rounded-lg border-white/10 shrink-0">
                                <AgentAvatar name={tx.buyerAgent || tx.buyerName} size={24} />
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{tx.buyerName}</p>
                                <p className="text-[10px] font-mono text-muted/60">@{tx.buyerAgent || "anonymous"}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                             <span className={`text-[9px] font-bold tracking-widest uppercase ${tx.type === "service" ? "text-primary" : "text-indigo-400"}`}>
                                {tx.type}
                             </span>
                             <span className="text-xs text-muted truncate max-w-[120px]">&ldquo;{tx.itemName}&rdquo;</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <p className="text-sm font-bold text-emerald-400">{tx.amount.toFixed(2)} USDC</p>
                          <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1" suppressHydrationWarning>{getRelativeTime(tx.timestamp)}</p>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center gap-3 justify-end min-w-0">
                             <div className="min-w-0 text-right">
                                <p className="text-xs font-bold text-foreground truncate">{tx.sellerName}</p>
                                <p className="text-[10px] font-mono text-muted/60">@{tx.sellerAgent || "genesis"}</p>
                             </div>
                             <div className="glass p-0.5 rounded-lg border-white/10 shrink-0">
                                <AgentAvatar name={tx.sellerAgent || tx.sellerName} size={24} />
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <StatusBadge status={tx.status} />
                       </td>
                       <td className="px-8 py-6 text-right">
                          {tx.txHash ? (
                             <a 
                               href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                               target="_blank"
                               className="inline-flex p-2 rounded-xl glass border-white/10 hover:border-primary/40 hover:text-primary transition-all group/link"
                             >
                                <ExternalLink className="w-3.5 h-3.5 group-hover/link:scale-110 transition-transform" />
                             </a>
                          ) : (
                             <span className="text-[10px] font-bold text-muted/40 uppercase italic tracking-widest">Off-Chain</span>
                          )}
                       </td>
                    </motion.tr>
                ))}
                </AnimatePresence>
             </tbody>
          </table>
          
          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 opacity-50">
               <ArrowRightLeft className="w-12 h-12 text-muted mb-4 opacity-20" />
               <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Telemetry feed silent</p>
            </div>
          )}
        </div>

        {/* Pagination Console */}
        <div className="flex items-center justify-between px-2">
           <div className="text-[10px] font-bold text-muted uppercase tracking-widest italic">
              Page {page} &middot; Viewing {PAGE_SIZE} nodes
           </div>
           <div className="flex gap-2">
              <button
                onClick={goPrev}
                disabled={page === 1 || loading}
                className="p-3 rounded-xl glass border-white/5 text-muted hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed group/prev"
              >
                <ChevronLeft className="w-4 h-4 group-hover/prev:-translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={goNext}
                disabled={!nextCursor || loading}
                className="p-3 rounded-xl glass border-white/5 text-muted hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed group/next"
              >
                <ChevronRight className="w-4 h-4 group-hover/next:translate-x-0.5 transition-transform" />
              </button>
           </div>
        </div>
      </section>
    </div>
  );
}
