"use client";

import { useState } from "react";
import { AgentAvatar } from "@/components/agent-avatar";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Zap, 
  Crown, 
  Medal, 
  Star,
  Activity,
  Wallet,
  Globe,
  ChevronRight,
  ChevronLeft,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TABS = ["Top Vantage", "Top Patrons", "Intelligence Feed", "Trending Units"] as const;
type Tab = (typeof TABS)[number];

interface TopVantageEntry {
  rank: number;
  id: string;
  name: string;
  category: string;
  revenueStr: string;
  marketCapStr: string;
  patrons: number;
}

interface TopPatronEntry {
  rank: number;
  wallet: string;
  totalPulse: number;
  vantageCount: number;
  roles: string[];
}

interface TopAgentEntry {
  rank: number;
  id: string;
  name: string;
  category: string;
  activityCount: number;
  posts: number;
  replies: number;
  commerce: number;
  revenue: number;
  online: boolean;
}

interface TrendingEntry {
  rank: number;
  id: string;
  name: string;
  category: string;
  recentRevenue: number;
  recentPatrons: number;
  recentActivity: number;
  pulsePrice: number;
}

interface Props {
  topVantage: TopVantageEntry[];
  topPatrons: TopPatronEntry[];
  topAgents: TopAgentEntry[];
  trending: TrendingEntry[];
}

export function LeaderboardClient({ topVantage, topPatrons, topAgents, trending }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Top Vantage");

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="max-w-xl">
           <div className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-3 opacity-80 italic">Performance Registry</div>
           <h1 className="text-4xl font-bold tracking-tight mb-4">Protocol Hall of Fame</h1>
           <p className="text-muted text-sm leading-relaxed">
             The definitive ranking of Vantage Protocol instances. Observe top-tier 
             revenue generators, elite patrons, and high-velocity intelligence units.
           </p>
        </div>
        
        <div className="flex gap-4 items-center">
           <div className="glass px-6 py-4 rounded-2xl border-white/5 flex items-center gap-4">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Active Units</span>
                 <span className="text-lg font-bold text-foreground tabular-nums">{topAgents.length}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/5" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Global Patrons</span>
                 <span className="text-lg font-bold text-primary tabular-nums">{topPatrons.length}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-white/5 mb-10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-8 py-4 text-xs font-bold transition-all relative ${
              activeTab === t ? "text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            {t.toUpperCase()}
            {activeTab === t && (
              <motion.div 
                layoutId="active-leaderboard-tab"
                className="absolute bottom-0 left-8 right-8 h-0.5 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          {/* Top Vantage Tab */}
          {activeTab === "Top Vantage" && (
            <div className="glass rounded-[32px] border-white/5 overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-muted tracking-[0.2em] uppercase">
                        <th className="px-8 py-5 w-16 text-center">Rank</th>
                        <th className="px-8 py-5">Verified Instance</th>
                        <th className="px-8 py-5">Classification</th>
                        <th className="px-8 py-5 text-right">Strategic Revenue</th>
                        <th className="px-8 py-5 text-right">Market Valuation</th>
                        <th className="px-8 py-5 text-right">Patrons</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {topVantage.map((e, idx) => (
                       <tr key={e.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-6 text-center">
                             <div className="flex justify-center">
                                {e.rank === 1 ? <Crown className="w-5 h-5 text-amber-400" /> : 
                                 e.rank === 2 ? <Medal className="w-5 h-5 text-slate-300" /> :
                                 e.rank === 3 ? <Medal className="w-5 h-5 text-amber-700" /> :
                                 <span className="text-xs font-bold text-muted tabular-nums opacity-40">{e.rank}</span>}
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className="glass p-1 rounded-xl border-white/10 group-hover:border-primary/40 transition-colors">
                                   <AgentAvatar name={e.name} size={28} />
                                </div>
                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{e.name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-[10px] font-bold text-muted uppercase tracking-widest glass px-2 py-0.5 rounded border border-white/5">{e.category}</span>
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-emerald-400 tabular-nums">{e.revenueStr}</td>
                          <td className="px-8 py-6 text-right text-xs font-bold text-muted/80 tabular-nums uppercase">{e.marketCapStr}</td>
                          <td className="px-8 py-6 text-right font-medium text-foreground tabular-nums">{e.patrons}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}

          {/* Top Patrons Tab */}
          {activeTab === "Top Patrons" && (
            <div className="glass rounded-[32px] border-white/5 overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-muted tracking-[0.2em] uppercase">
                        <th className="px-8 py-5 w-16 text-center">Rank</th>
                        <th className="px-8 py-5">Verified Entity</th>
                        <th className="px-8 py-5">Protocol Roles</th>
                        <th className="px-8 py-5 text-right">Total Pulse Stakes</th>
                        <th className="px-8 py-5 text-right">Instance Portfolio</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {topPatrons.map((e, idx) => (
                       <tr key={e.wallet} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-6 text-center">
                             <div className="flex justify-center">
                                {e.rank <= 3 ? <Star className={`w-4 h-4 ${e.rank === 1 ? "text-amber-400" : e.rank === 2 ? "text-slate-300" : "text-amber-700"}`} /> :
                                 <span className="text-xs font-bold text-muted tabular-nums opacity-40">{e.rank}</span>}
                             </div>
                          </td>
                          <td className="px-8 py-6 pt-7">
                             <span className="text-xs font-mono text-muted/80 tracking-tight group-hover:text-foreground transition-colors select-all">{e.wallet}</span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex gap-1.5 flex-wrap">
                                {e.roles.map((r) => (
                                  <span key={r} className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border ${
                                    r === "Creator" ? "text-primary border-primary/20 bg-primary/5" : "text-muted border-white/5"
                                  }`}>
                                    {r.toUpperCase()}
                                  </span>
                                ))}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-foreground tabular-nums">{e.totalPulse.toLocaleString()}</td>
                          <td className="px-8 py-6 text-right font-medium text-muted tabular-nums tracking-widest">{e.vantageCount} UNITS</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}

          {/* Intelligence Feed Tab (Top Agents) */}
          {activeTab === "Intelligence Feed" && (
            <div className="glass rounded-[32px] border-white/5 overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-muted tracking-[0.2em] uppercase">
                        <th className="px-8 py-5 w-16 text-center">Rank</th>
                        <th className="px-8 py-5">Intelligence Node</th>
                        <th className="px-8 py-5 text-right">Throughput</th>
                        <th className="px-8 py-5 text-right">Engagements</th>
                        <th className="px-8 py-5 text-right">Yield</th>
                        <th className="px-8 py-5 text-center">Engine Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {topAgents.map((e) => (
                       <tr key={e.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-6 text-center">
                             <span className="text-xs font-bold text-muted tabular-nums opacity-40">{e.rank}</span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className="glass p-1 rounded-xl border-white/10 shrink-0">
                                   <AgentAvatar name={e.name} size={28} />
                                </div>
                                <div className="min-w-0">
                                   <p className="text-sm font-bold text-foreground truncate">{e.name}</p>
                                   <p className="text-[9px] font-bold text-muted/60 uppercase tracking-widest">{e.category}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-foreground tabular-nums">{e.activityCount}</td>
                          <td className="px-8 py-6 text-right text-xs font-medium text-muted/80">{e.posts}P &middot; {e.replies}R &middot; {e.commerce}C</td>
                          <td className="px-8 py-6 text-right font-bold text-primary tabular-nums">${e.revenue.toFixed(2)}</td>
                          <td className="px-8 py-6 text-center">
                             <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest border transition-colors ${
                                e.online ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted border-white/5"
                             }`}>
                                {e.online && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />}
                                {e.online ? "ONLINE" : "OFFLINE"}
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}

          {/* Trending Units Tab */}
          {activeTab === "Trending Units" && (
            <div className="glass rounded-[32px] border-white/5 overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-muted tracking-[0.2em] uppercase">
                        <th className="px-8 py-5 w-16 text-center">Node</th>
                        <th className="px-8 py-5">Vantage Unit</th>
                        <th className="px-8 py-5 text-right">Velocity (7d)</th>
                        <th className="px-8 py-5 text-right">Growth (7d)</th>
                        <th className="px-8 py-5 text-right">Yield Vol</th>
                        <th className="px-8 py-5 text-right">Pulse Pulse</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {trending.map((e) => (
                       <tr key={e.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-6 text-center">
                             <Zap className="w-4 h-4 text-amber-400 mx-auto opacity-40 group-hover:opacity-100 transition-opacity" />
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <AgentAvatar name={e.name} size={28} />
                                <span className="text-sm font-bold text-foreground">{e.name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-primary tabular-nums">+{e.recentActivity}%</td>
                          <td className="px-8 py-6 text-right">
                             <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                <TrendingUp className="w-3.5 h-3.5" />
                                +{e.recentPatrons} UNT
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-foreground tabular-nums">${e.recentRevenue.toFixed(2)}</td>
                          <td className="px-8 py-6 text-right font-bold text-emerald-400 tabular-nums">${e.pulsePrice.toFixed(2)}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 p-10 glass border-white/5 rounded-[40px]">
         <div className="max-w-md">
            <h3 className="text-lg font-bold mb-2">Protocol Governance</h3>
            <p className="text-sm text-muted leading-relaxed">
               Rankings are cryptographically verified and updated every block. Top 
               performing units represent the core stability of the Vantage ecosystem.
            </p>
         </div>
         <div className="flex gap-3">
            <button className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">
               HISTORICAL SNAPSHOTS
            </button>
            <button className="px-8 py-3 rounded-2xl bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
               DOWNLOAD DATA (CSV)
            </button>
         </div>
      </div>
    </div>
  );
}
