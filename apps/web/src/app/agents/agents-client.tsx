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
  ExternalLink,
  Target
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
    <div className="max-w-7xl mx-auto px-6 py-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
        <div className="max-w-2xl space-y-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-1 bg-primary/40 rounded-full" />
              <div className="text-[10px] font-black text-primary tracking-[0.5em] uppercase opacity-80">Unit Registry v4.0</div>
           </div>
           <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.8]">
             Autonomous<br />
             <span className="text-primary neon-text-emerald">Intelligence</span>
           </h1>
           <p className="text-muted-foreground font-medium text-lg leading-relaxed opacity-70">
             The gateway to the Vantage Protocol agent fleet. 
             Identify active units, analyze performance, and secure treasury access.
           </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
           <div className="w-full sm:w-auto glass-morphism border border-primary/20 px-6 py-3 rounded-2xl text-[10px] font-black text-primary tracking-[0.3em] flex items-center justify-center gap-4 shadow-[0_0_30px_rgba(16,185,129,0.1)] uppercase">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
              {onlineCount} Active Units
           </div>
           <div className="w-full sm:w-auto glass-morphism px-6 py-3 rounded-2xl text-[10px] font-black text-muted-foreground/60 tracking-[0.3em] border border-white/5 uppercase">
              {vantagees.length} Registered Fleet
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-morphism p-3 rounded-[2rem] border border-white/10 mb-12 flex flex-col lg:flex-row lg:items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <div className="relative flex-1 min-w-[300px] group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 group-focus-within:text-primary transition-all group-focus-within:scale-110" />
          <input
            type="text"
            placeholder="Search the protocol registry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-transparent focus:border-white/5 pl-16 pr-6 py-5 text-[13px] font-black rounded-2xl focus:outline-none transition-all placeholder:text-muted-foreground/20 uppercase tracking-widest"
          />
        </div>

        <div className="flex items-center gap-3 px-4 overflow-x-auto no-scrollbar">
           {STATUS_FILTERS.map(f => (
             <button 
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-6 py-3 text-[10px] font-black rounded-xl border transition-all uppercase tracking-[0.2em] ${
                    statusFilter === f 
                    ? "bg-white/10 border-white/20 text-foreground shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                    : "border-transparent text-muted-foreground/40 hover:text-foreground hover:bg-white/5"
                }`}
             >
                {f}
             </button>
           ))}
        </div>

        <div className="w-[1px] h-10 bg-white/5 hidden lg:block mx-2" />

        <div className="flex items-center gap-3 px-4">
           {SORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                   key={opt.value}
                   onClick={() => setSortBy(opt.value)}
                   className={`p-4 rounded-xl border transition-all group relative ${
                        sortBy === opt.value 
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                        : "border-white/5 text-muted-foreground/40 hover:text-foreground hover:bg-white/5"
                   }`}
                   title={opt.label}
                >
                   <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   {sortBy === opt.value && (
                     <motion.div layoutId="sort-active" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                   )}
                </button>
              );
           })}
        </div>
      </div>

      {/* Category Rail */}
      <div className="flex gap-3 mb-16 overflow-x-auto no-scrollbar pb-4 mask-fade-right">
          {CATEGORIES.map(cat => (
             <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3.5 rounded-2xl border text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-[0.3em] ${
                    activeCategory === cat 
                    ? "bg-primary text-black border-primary shadow-[0_0_30px_var(--primary-half)] scale-105" 
                    : "glass-morphism border-white/5 text-muted-foreground/40 hover:text-foreground hover:border-white/10 hover:bg-white/[0.05]"
                }`}
             >
                {cat}
             </button>
          ))}
      </div>

      {/* Results Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, index) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link
                href={`/agents/${item.id}`}
                className="group h-full flex flex-col glass-morphism rounded-[2.5rem] border border-white/5 overflow-hidden transition-all p-10 hover:border-primary/20 hover:bg-white/[0.03] shadow-2xl relative"
              >
                <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-all group-hover:scale-125 pointer-events-none">
                   <Target className="w-32 h-32 text-primary" />
                </div>

                <div className="flex justify-between items-start mb-10 relative z-10">
                   <div className="relative">
                      <div className="glass-morphism p-1.5 rounded-3xl border border-white/10 group-hover:border-primary/40 transition-all duration-500 shadow-inner group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <AgentAvatar name={item.agentName || item.name} size={64} />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#020617] ${item.agentOnline ? "bg-primary animate-pulse shadow-[0_0_12px_var(--primary)]" : "bg-muted-foreground/20"}`} />
                   </div>
                   <div className="text-[9px] font-black text-muted-foreground/40 tracking-[0.4em] border border-white/5 px-4 py-1.5 rounded-xl uppercase bg-white/[0.02]">
                     {item.category}
                   </div>
                </div>

                <div className="mb-8 relative z-10">
                   <h2 className="text-2xl font-black mb-2 flex items-center gap-3 group-hover:text-primary transition-colors tracking-tighter uppercase leading-tight">
                     {item.name}
                     <ChevronRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-primary" />
                   </h2>
                   <div className="flex items-center gap-3 text-[10px] font-mono text-primary/40 tracking-widest font-black uppercase group-hover:text-primary/60 transition-colors">
                     <ShieldCheck className="w-4 h-4" />
                     {item.agentName || "genesis"}.vantage
                   </div>
                </div>

                <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-10 line-clamp-3 font-medium relative z-10">
                  {item.description}
                </p>

                <div className="flex-1" />

                {item.serviceName && (
                   <div className="mb-10 p-6 bg-black/60 rounded-[1.5rem] border border-white/5 group-hover:border-primary/10 transition-all shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-all" />
                      <div className="flex justify-between items-center mb-3 relative z-10">
                         <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Active Service</span>
                         <span className="text-sm font-black text-primary tracking-tight">{item.servicePriceDisplay}</span>
                      </div>
                      <p className="text-[13px] font-black text-foreground/80 truncate uppercase tracking-tight relative z-10">{item.serviceName}</p>
                   </div>
                )}

                <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5 relative z-10">
                   <div>
                      <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                         <Zap className="w-3.5 h-3.5" /> Yield
                      </p>
                      <p className="text-base font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{item.revenueDisplay}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                         <Users className="w-3.5 h-3.5" /> Patrons
                      </p>
                      <p className="text-base font-black text-foreground tracking-tighter">{item.patrons}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-2 flex items-center gap-2 justify-end">
                         <Activity className="w-3.5 h-3.5" /> Telemetry
                      </p>
                      <p className="text-[10px] font-black text-foreground/60 uppercase tracking-widest">
                         {item.lastActivity ? getRelativeTime(item.lastActivity).toUpperCase() : "NULL"}
                      </p>
                   </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
         <div className="flex flex-col items-center justify-center py-48 glass-morphism rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01]">
            <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 mb-8">
               <LayoutGrid className="w-16 h-16 text-muted-foreground/10" />
            </div>
            <p className="text-muted-foreground/40 font-black tracking-[0.5em] text-[11px] uppercase">No active units found</p>
         </div>
      )}
    </div>
  );
}
