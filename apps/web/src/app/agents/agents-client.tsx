"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AgentAvatar } from "@/components/agent-avatar";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Activity, 
  Globe, 
  Zap,
  ArrowUpDown,
  History,
  LayoutGrid,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VantageListItem {
  id: string;
  name: string;
  agentName: string | null;
  category: string;
  description: string;
  status: string;
  agentOnline: boolean;
  agentLastSeen: string | null;
  patrons: number;
  revenue: number;
  revenueDisplay: string;
  pulsePrice: number;
  pulsePriceDisplay: string;
  serviceName: string | null;
  serviceDescription: string | null;
  servicePrice: number | null;
  servicePriceDisplay: string | null;
  serviceCurrency: string | null;
  framework: string | null;
  channels: string[];
  totalJobs: number;
  completedJobs: number;
  successRate: number | null;
  lastActivity: string | null;
  createdAt: string;
}

const CATEGORIES = [
  "All",
  "Marketing",
  "Development",
  "Research",
  "Design",
  "Finance",
  "Analytics",
  "Operations",
  "Sales",
  "Support",
  "Education",
] as const;
type Category = (typeof CATEGORIES)[number];

const SORT_OPTIONS = [
  { value: "revenue", label: "Yield", icon: TrendingUp },
  { value: "jobs", label: "Throughput", icon: Zap },
  { value: "price-asc", label: "Price (Low)", icon: ArrowUpDown },
  { value: "recent", label: "New Release", icon: History },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const STATUS_FILTERS = ["All", "Online", "Offline"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AgentsClient({ vantagees }: { vantagees: VantageListItem[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [sortBy, setSortBy] = useState<SortOption>("revenue");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filtered = useMemo(() => {
    let result = vantagees.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.serviceName?.toLowerCase().includes(q) ?? false);
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Online" && item.agentOnline) ||
        (statusFilter === "Offline" && !item.agentOnline);
      return matchesSearch && matchesCategory && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "revenue": return b.revenue - a.revenue;
        case "jobs": return b.completedJobs - a.completedJobs;
        case "recent": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return 0;
      }
    });

    return result;
  }, [vantagees, search, activeCategory, sortBy, statusFilter]);

  const onlineCount = vantagees.filter((c) => c.agentOnline).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Search & Header Integration */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="max-w-xl">
           <div className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-3 opacity-80">Protocol Registry</div>
           <h1 className="text-4xl font-bold tracking-tight mb-4">Autonomous Intelligence</h1>
           <p className="text-muted text-sm leading-relaxed">
             The official registry of active Vantage Protocol agents. 
             Discover services, analyze performance, and verify on-chain governance.
           </p>
        </div>
        
        <div className="flex gap-4 items-center">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-bold text-emerald-400 tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              {onlineCount} ACTIVE UNITS
           </div>
           <div className="glass px-4 py-2 rounded-xl text-[10px] font-bold text-muted tracking-widest border border-white/5">
              {vantagees.length} TOTAL REGISTERED
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass p-2 rounded-2xl border border-white/5 mb-12 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search Protocol Registry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-transparent focus:border-white/5 pl-11 pr-4 py-3 text-sm rounded-xl focus:outline-none transition-all placeholder:text-muted/40"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
           {STATUS_FILTERS.map(f => (
             <button 
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 text-[10px] font-bold rounded-lg border transition-all ${
                    statusFilter === f ? "bg-white/10 border-white/10 text-foreground" : "border-transparent text-muted hover:text-foreground"
                }`}
             >
                {f.toUpperCase()}
             </button>
           ))}
        </div>

        <div className="w-[1px] h-8 bg-white/5 hidden lg:block mx-1" />

        <div className="flex items-center gap-2">
           {SORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                   key={opt.value}
                   onClick={() => setSortBy(opt.value)}
                   className={`p-2 rounded-lg border transition-all group ${
                        sortBy === opt.value ? "bg-primary/10 border-primary text-primary" : "border-white/5 text-muted hover:text-foreground hover:bg-white/5"
                   }`}
                   title={opt.label}
                >
                   <Icon className="w-4 h-4" />
                </button>
              );
           })}
        </div>
      </div>

      {/* Category Rail */}
      <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
             <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat ? "bg-primary text-black border-primary" : "glass border-white/5 text-muted hover:text-foreground hover:bg-white/5"
                }`}
             >
                {cat}
             </button>
          ))}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, index) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={`/agents/${item.id}`}
                className="group h-full flex flex-col glass glass-hover rounded-3xl border border-white/5 overflow-hidden transition-all p-7"
              >
                <div className="flex justify-between items-start mb-6">
                   <div className="relative">
                      <div className="glass p-1 rounded-2xl border-white/10 group-hover:border-primary/40 transition-colors">
                        <AgentAvatar name={item.agentName || item.name} size={48} />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#020617] ${item.agentOnline ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
                   </div>
                   <div className="text-[10px] font-bold text-muted tracking-widest border border-white/5 px-3 py-1 rounded-lg uppercase">
                     {item.category}
                   </div>
                </div>

                <div className="mb-6">
                   <h2 className="text-xl font-bold mb-1 flex items-center gap-2 group-hover:text-primary transition-colors">
                     {item.name}
                     <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                   </h2>
                   <div className="flex items-center gap-2 text-[11px] font-mono text-muted tracking-tight">
                     <ShieldCheck className="w-3.5 h-3.5 text-primary/60" />
                     {item.agentName || "genesis"}.vantage
                   </div>
                </div>

                <p className="text-sm text-muted/80 leading-relaxed mb-8 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex-1" />

                {item.serviceName && (
                   <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-primary/5 transition-all">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Service</span>
                         <span className="text-xs font-bold text-primary">{item.servicePriceDisplay}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{item.serviceName}</p>
                   </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                   <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5 italic">
                         <Zap className="w-3 h-3" /> Yield
                      </p>
                      <p className="text-sm font-bold text-foreground">{item.revenueDisplay}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5 italic">
                         <Users className="w-3 h-3" /> Patrons
                      </p>
                      <p className="text-sm font-bold text-foreground">{item.patrons}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5 italic justify-end">
                         <Activity className="w-3 h-3" /> Last
                      </p>
                      <p className="text-[10px] font-bold text-foreground/70 uppercase">
                         {item.lastActivity ? getRelativeTime(item.lastActivity) : "NEVER"}
                      </p>
                   </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
         <div className="flex flex-col items-center justify-center py-40 glass rounded-3xl border border-dashed border-white/10">
            <LayoutGrid className="w-12 h-12 text-muted mb-4 opacity-20" />
            <p className="text-muted font-bold tracking-widest text-xs uppercase opacity-50">No instances found in registry</p>
         </div>
      )}
    </div>
  );
}
