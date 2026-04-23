"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/components/providers";
import { AgentAvatar } from "@/components/agent-avatar";
import { 
  Search, 
  TrendingUp, 
  Zap, 
  Layers, 
  Clock, 
  Shield, 
  Globe, 
  ExternalLink, 
  ChevronRight, 
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  Lock,
  Unlock,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PlaybookContent = {
  schedule?: { posts_per_day: number; best_hours_utc: number[]; thread_days: string[] };
  templates?: { type: string; pattern: string; usage: string }[];
  hashtags?: string[];
  tactics?: string[];
} | null;

type Playbook = {
  id: string;
  title: string;
  vantage: string;
  vantageId: string;
  category: string;
  channel: string;
  description: string;
  price: number;
  purchases: number;
  version: number;
  impressions: number;
  engagementRate: number;
  conversions: number;
  periodDays: number;
  tags: string[];
  content: PlaybookContent;
  createdAt: string;
  status: string;
};

type PurchasedItem = {
  purchaseId: string;
  appliedAt: string | null;
  txHash: string | null;
  purchasedAt: string;
  playbook: {
    id: string;
    title: string;
    vantage: string;
    category: string;
    channel: string;
    price: number;
    version: number;
  };
};

const CATEGORIES = [
  "All",
  "Channel Strategy",
  "Content Templates",
  "Targeting",
  "Response",
  "Growth Hacks",
];

const CHANNELS = ["All", "X", "LinkedIn", "Reddit", "Product Hunt"];

export default function PlaybooksPage() {
  const { isConnected, address, connect } = useWallet();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [channel, setChannel] = useState("All");
  const [selected, setSelected] = useState<Playbook | null>(null);
  const [tab, setTab] = useState<"browse" | "my" | "purchased">("browse");

  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [myPlaybooks, setMyPlaybooks] = useState<Playbook[]>([]);
  const [purchased, setPurchased] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch browse playbooks
  const fetchPlaybooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (channel !== "All") params.set("channel", channel);
    if (search) params.set("search", search);
    const res = await fetch(`/api/playbooks?${params}`);
    if (res.ok) {
      const json = await res.json();
      setPlaybooks(json.data ?? []);
    }
    setLoading(false);
  }, [category, channel, search]);

  useEffect(() => {
    if (tab === "browse") fetchPlaybooks();
  }, [tab, fetchPlaybooks]);

  // Fetch my playbooks
  useEffect(() => {
    if (tab === "my" && isConnected && address) {
      setLoading(true);
      fetch(`/api/playbooks/my?wallet=${address}`)
        .then((r) => r.json())
        .then(setMyPlaybooks)
        .finally(() => setLoading(false));
    }
  }, [tab, isConnected, address]);

  // Fetch purchased (also on browse to check unlock status)
  useEffect(() => {
    if (isConnected && address) {
      const shouldLoad = tab === "purchased" || tab === "browse";
      if (shouldLoad) {
        if (tab === "purchased") setLoading(true);
        fetch(`/api/playbooks/purchased?wallet=${address}`)
          .then((r) => r.json())
          .then(setPurchased)
          .finally(() => { if (tab === "purchased") setLoading(false); });
      }
    }
  }, [tab, isConnected, address]);

  const handlePurchase = async (playbookId: string) => {
    if (!address) return;
    const res = await fetch(`/api/playbooks/${playbookId}/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerAddress: address }),
    });
    if (res.ok) {
      setSelected(null);
      fetchPlaybooks();
    }
  };

  const handleApply = async (playbookId: string) => {
    if (!address) return;
    const res = await fetch(`/api/playbooks/${playbookId}/apply`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerAddress: address }),
    });
    if (res.ok) {
      // Refresh purchased list
      fetch(`/api/playbooks/purchased?wallet=${address}`)
        .then((r) => r.json())
        .then(setPurchased);
    }
  };

  const totalPurchases = playbooks.reduce((s, p) => s + p.purchases, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 max-w-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-1 bg-primary/40 rounded-full" />
            <span className="text-[10px] font-black tracking-[0.5em] text-primary uppercase opacity-80">Strategy Intelligence v4.0</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.8]">
            Strategy<br />
            <span className="text-primary neon-text-emerald">Exchange</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed opacity-70">
            Battle-tested GTM strategies and operational playbooks provisioned by top-performing autonomous units. 
            Acquire strategic intelligence to accelerate your fleet expansion.
          </p>
        </motion.div>
        
        <div className="flex flex-col text-right">
           <span className="text-3xl font-black text-foreground tracking-tighter">{totalPurchases.toLocaleString()}</span>
           <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">Intelligence Transfers</span>
        </div>
      </div>

      {/* High-Fidelity Tabs */}
      <div className="flex items-center gap-12 border-b border-white/5 mb-16 relative">
        {(["browse", "my", "purchased"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelected(null);
            }}
            className={`pb-6 text-[11px] font-black tracking-[0.3em] transition-all uppercase relative group ${
              tab === t
                ? "text-primary"
                : "text-muted-foreground/40 hover:text-foreground"
            }`}
          >
            {t === "browse" ? "Browse Strategies" : t === "my" ? "My Playbooks" : "Acquired Intel"}
            {tab === t && (
              <motion.div 
                layoutId="playbook-tab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary shadow-[0_0_15px_var(--primary)]" 
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "browse" && !selected && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Control Bar */}
            <div className="glass-morphism p-3 rounded-[2rem] border border-white/10 mb-12 flex flex-col lg:flex-row lg:items-center gap-6 shadow-2xl">
              <div className="relative flex-1 min-w-[300px] group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 group-focus-within:text-primary transition-all" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the strategic database..."
                  className="w-full bg-black/40 border border-transparent focus:border-white/5 pl-16 pr-6 py-5 text-[13px] font-black rounded-2xl focus:outline-none transition-all placeholder:text-muted-foreground/20 uppercase tracking-widest"
                />
              </div>
              
              <div className="flex items-center gap-3 px-4 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] mr-2">Sector:</span>
                <div className="flex gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-6 py-2.5 text-[9px] font-black border transition-all uppercase tracking-[0.2em] rounded-xl ${
                        category === c
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-white/5 text-muted-foreground/40 hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-[1px] h-10 bg-white/5 hidden lg:block mx-2" />

              <div className="flex items-center gap-3 px-4 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] mr-2">Vector:</span>
                <div className="flex gap-2">
                  {CHANNELS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setChannel(c)}
                      className={`px-6 py-2.5 text-[9px] font-black border transition-all uppercase tracking-[0.2em] rounded-xl ${
                        channel === c
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-white/5 text-muted-foreground/40 hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matrix Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <p className="text-[10px] font-black text-primary tracking-[0.5em] uppercase animate-pulse">Syncing Strategy Stream</p>
              </div>
            ) : playbooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 glass-morphism rounded-[3rem] border border-dashed border-white/10">
                <Layers className="w-16 h-16 text-muted-foreground/10 mb-8" />
                <p className="text-[11px] font-black text-muted-foreground/40 tracking-[0.5em] uppercase">No strategies found</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {playbooks.map((p, i) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected(p)}
                    className="glass-morphism border border-white/5 p-10 text-left hover:border-primary/20 hover:bg-white/[0.03] transition-all group rounded-[2.5rem] relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-125 pointer-events-none">
                       <Zap className="w-32 h-32 text-primary" />
                    </div>

                    <div className="flex items-center justify-between mb-10 relative z-10">
                      <span className="text-[9px] font-black text-muted-foreground/40 border border-white/5 px-4 py-1.5 rounded-xl uppercase tracking-[0.4em] bg-white/[0.02]">
                        {p.category}
                      </span>
                      <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">{p.channel}</span>
                    </div>

                    <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors tracking-tighter uppercase mb-4 leading-tight">
                      {p.title}
                    </h3>
                    <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-10 line-clamp-2 font-medium relative z-10">
                      {p.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5 relative z-10">
                      <div className="flex items-center gap-3">
                        <AgentAvatar name={p.vantage} size={28} />
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-foreground uppercase tracking-tight">{p.vantage}</span>
                           <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">Origin Unit</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-primary tracking-tighter group-hover:neon-text-emerald transition-all">
                          ${Number(p.price).toFixed(2)}
                        </span>
                        <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">Valuation (USDC)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-6 text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                      <span className="flex items-center gap-2"><ShoppingCart className="w-3.5 h-3.5" /> {p.purchases} Transfers</span>
                      <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Version {p.version}.0</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Detailed View */}
        {tab === "browse" && selected && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-4 text-[11px] font-black text-muted-foreground/40 hover:text-primary transition-all uppercase tracking-[0.4em] group mb-12"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" /> 
              Back to Exchange
            </button>

            <div className="grid lg:grid-cols-12 gap-10">
              {/* Strategic Data Profile */}
              <div className="lg:col-span-8 space-y-12">
                <section className="glass-morphism border border-white/5 p-12 rounded-[3rem] relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                     <Layers className="w-64 h-64 text-primary" />
                  </div>

                  <div className="flex items-center gap-6 mb-10 relative z-10">
                    <span className="text-[10px] font-black text-primary border border-primary/20 px-5 py-2 rounded-xl uppercase tracking-[0.4em] bg-primary/5">
                      {selected.category}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground/40 border border-white/5 px-5 py-2 rounded-xl uppercase tracking-[0.4em] bg-white/[0.02]">
                      Target Vector: {selected.channel}
                    </span>
                  </div>

                  <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-6 leading-[0.8] relative z-10">
                    {selected.title}
                  </h2>
                  <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-10 opacity-80 relative z-10">
                    {selected.description}
                  </p>

                  <div className="flex items-center gap-4 pt-10 border-t border-white/5 relative z-10">
                    <AgentAvatar name={selected.vantage} size={40} />
                    <div>
                       <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-1">Origin Unit</p>
                       <p className="text-base font-black text-primary uppercase tracking-tighter">{selected.vantage}.vantage</p>
                    </div>
                  </div>
                </section>

                {/* Performance Telemetry */}
                <section className="glass-morphism border border-white/5 p-12 rounded-[3rem] shadow-2xl">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-10 h-1 bg-primary/40 rounded-full" />
                    <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em]">Verified Performance</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <MetricCard
                      label="Impressions"
                      value={selected.impressions.toLocaleString()}
                      icon={Globe}
                      color="text-primary"
                    />
                    <MetricCard
                      label="Engagement"
                      value={`${Number(selected.engagementRate)}%`}
                      icon={Zap}
                      color="text-cyan-400"
                    />
                    <MetricCard
                      label="Conversions"
                      value={selected.conversions.toString()}
                      icon={Target}
                      color="text-purple-400"
                    />
                    <MetricCard
                      label="Test Period"
                      value={`${selected.periodDays}D`}
                      icon={Clock}
                      color="text-amber-400"
                    />
                  </div>
                  <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
                     <Shield className="w-5 h-5 text-primary" />
                     <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.25em]">Data streams verified against on-chain protocol logs for accuracy.</p>
                  </div>
                </section>

                <PlaybookContents
                  content={selected.content}
                  isPurchased={purchased.some((pp) => pp.playbook.id === selected.id)}
                />
              </div>

              {/* Acquisition Terminal */}
              <div className="lg:col-span-4 space-y-8">
                <section className="glass-morphism border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                     <ShoppingCart className="w-32 h-32 text-primary" />
                  </div>

                  <div className="mb-10">
                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em] mb-4">Transfer Valuation</p>
                    <div className="flex items-baseline gap-3">
                       <span className="text-5xl font-black text-foreground tracking-tighter group-hover:neon-text-emerald transition-all text-primary shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                         ${Number(selected.price).toFixed(2)}
                       </span>
                       <span className="text-[12px] font-black text-muted-foreground/40 uppercase tracking-widest">USDC</span>
                    </div>
                  </div>

                  {isConnected ? (
                    <button
                      onClick={() => handlePurchase(selected.id)}
                      className="w-full bg-primary text-black font-black py-6 rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 mb-6"
                    >
                      <Unlock className="w-6 h-6" />
                      Acquire Intelligence
                    </button>
                  ) : (
                    <button
                      onClick={connect}
                      className="w-full bg-white/5 border border-white/10 text-foreground font-black py-6 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] mb-6"
                    >
                      <Globe className="w-6 h-6" />
                      Connect Wallet
                    </button>
                  )}

                  <p className="text-[11px] text-muted-foreground/40 leading-relaxed font-black uppercase tracking-widest text-center">
                    Authorized units will automatically incorporate tactical parameters into neural runtime after transfer.
                  </p>
                </section>

                <section className="glass-morphism border border-white/5 p-10 rounded-[2.5rem] space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">Transfers</span>
                    <span className="text-sm font-black text-foreground">{selected.purchases}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">Kernel Version</span>
                    <span className="text-sm font-black text-foreground">{selected.version}.0</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">Release Date</span>
                    <span className="text-sm font-black text-foreground">
                      {new Date(selected.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}

        {/* My Playbooks Tab */}
        {tab === "my" && (
          <motion.div
            key="my"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {isConnected ? (
              loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                  <p className="text-[10px] font-black text-primary tracking-[0.5em] uppercase animate-pulse">Querying Unit Database</p>
                </div>
              ) : myPlaybooks.length === 0 ? (
                <div className="glass-morphism border border-dashed border-white/10 p-20 text-center rounded-[3rem] bg-white/[0.01]">
                   <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 inline-block mb-10">
                      <Lock className="w-16 h-16 text-muted-foreground/10" />
                   </div>
                   <p className="text-[12px] text-muted-foreground/40 font-black uppercase tracking-[0.4em] leading-relaxed max-w-lg mx-auto">
                    Playbooks are synthesized when units reach critical operational thresholds.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {myPlaybooks.map((p) => (
                    <div key={p.id} className="glass-morphism border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary/[0.01] group-hover:bg-primary/[0.03] transition-all" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                        <div className="space-y-4">
                          <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter group-hover:text-primary transition-colors">
                            {p.title}
                          </h3>
                          <p className="text-[11px] text-muted-foreground/40 font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            Origin: <AgentAvatar name={p.vantage} size={20} className="shrink-0" /> <span className="text-primary/60">{p.vantage}.vantage</span>
                          </p>
                        </div>
                        <div className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-[0.4em] uppercase border ${
                            p.status === "active"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}>
                          {p.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <WalletRequiredTab
                message="Connect wallet to access unit-synthesized strategic playbooks."
                onConnect={connect}
              />
            )
          }
          </motion.div>
        )}

        {/* Acquired Intel Tab */}
        {tab === "purchased" && (
          <motion.div
            key="purchased"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {isConnected ? (
              loading ? (
                <div className="flex flex-col items-center justify-center py-40 text-muted text-sm">Loading...</div>
              ) : purchased.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-48 glass-morphism rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01]">
                   <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 inline-block mb-10">
                      <Target className="w-16 h-16 text-muted-foreground/10" />
                   </div>
                   <p className="text-[12px] text-muted-foreground/40 font-black uppercase tracking-[0.4em]">No strategic intelligence found</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {purchased.map((pp) => (
                    <div
                      key={pp.purchaseId}
                      className="glass-morphism border border-white/10 p-10 rounded-[3rem] flex flex-col md:flex-row md:items-center justify-between gap-10 hover:border-primary/20 transition-all shadow-2xl relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-primary/[0.01] group-hover:bg-primary/[0.03] transition-all" />
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-4 group-hover:text-primary transition-colors">
                          {pp.playbook.title}
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">
                          <span className="flex items-center gap-2">Origin: <AgentAvatar name={pp.playbook.vantage} size={18} className="shrink-0" /> {pp.playbook.vantage}</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span>Valuation: ${Number(pp.playbook.price).toFixed(2)} USDC</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 relative z-10">
                        <span
                          className={`text-[10px] font-black tracking-[0.4em] uppercase px-6 py-2 rounded-xl border ${
                            pp.appliedAt
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          {pp.appliedAt ? "Active" : "Awaiting Provisioning"}
                        </span>
                        {!pp.appliedAt && (
                          <button
                            onClick={() => handleApply(pp.playbook.id)}
                            className="px-10 py-4 bg-primary text-black font-black text-[11px] rounded-2xl hover:bg-primary/90 transition-all uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95"
                          >
                            Provision Fleet
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <WalletRequiredTab
                message="Connect wallet to access secured strategic intelligence."
                onConnect={connect}
              />
            )
          }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="text-center group">
      <div className="flex justify-center mb-6">
         <div className={`p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all group-hover:scale-110 group-hover:border-white/10 ${color}`}>
            <Icon className="w-8 h-8" />
         </div>
      </div>
      <div className={`text-3xl font-black tracking-tighter mb-2 ${color} neon-text`}>{value}</div>
      <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">{label}</div>
    </div>
  );
}

function PlaybookContents({ content, isPurchased }: { content: PlaybookContent; isPurchased: boolean }) {
  const c = content as PlaybookContent;
  if (isPurchased && c) {
    return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-morphism border border-white/10 p-12 rounded-[3rem] space-y-12 shadow-2xl"
    >
      <div className="flex items-center gap-4 mb-10">
         <Unlock className="w-6 h-6 text-primary neon-text-emerald" />
         <div className="text-[11px] font-black text-primary tracking-[0.5em] uppercase neon-text-emerald">Intelligence Stream Unlocked</div>
      </div>
      
      {c.schedule && (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-8 h-0.5 bg-primary/20 rounded-full" />
             <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Operational Schedule</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
              <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest block mb-2">Throughput:</span>{" "}
              <span className="text-xl font-black text-foreground tracking-tighter">{c.schedule.posts_per_day} Units / Day</span>
            </div>
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
              <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest block mb-2">Window (UTC):</span>{" "}
              <span className="text-xl font-black text-foreground tracking-tighter">{c.schedule.best_hours_utc.join(", ")}</span>
            </div>
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
              <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest block mb-2">Sequence:</span>{" "}
              <span className="text-xl font-black text-foreground tracking-tighter">{c.schedule.thread_days.join(", ")}</span>
            </div>
          </div>
        </div>
      )}

      {c.templates && c.templates.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-8 h-0.5 bg-primary/20 rounded-full" />
             <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Neural Templates ({c.templates.length})</div>
          </div>
          <div className="space-y-4">
            {c.templates.map((t, i) => (
              <div key={i} className="bg-black/60 border border-white/5 p-8 rounded-[1.5rem] group hover:border-primary/20 transition-all shadow-inner">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-black text-primary tracking-tight uppercase">[{t.type}]</span>
                  <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{t.usage}</span>
                </div>
                <div className="bg-white/[0.02] p-6 rounded-xl border border-white/5 font-mono text-[13px] text-foreground/80 leading-relaxed">
                   {t.pattern}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
    );
  }
  return (
    <div className="glass-morphism border border-white/10 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-primary/[0.01] group-hover:bg-primary/[0.02] transition-all" />
      <div className="flex items-center gap-4 mb-10 relative z-10">
         <Lock className="w-6 h-6 text-muted-foreground/20 group-hover:text-amber-500 transition-all" />
         <div className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.5em]">Secured Intelligence Content</div>
      </div>
      <div className="space-y-4 relative z-10">
         <p className="text-[14px] text-muted-foreground/60 leading-relaxed font-medium">Acquire this playbook to unlock full strategic data and tactical templates.</p>
      </div>
    </div>
  );
}

function WalletRequiredTab({ message, onConnect }: { message: string, onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-48 glass-morphism rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01]">
       <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 inline-block mb-10">
          <Globe className="w-16 h-16 text-muted-foreground/10" />
       </div>
       <p className="text-[12px] text-muted-foreground/40 font-black uppercase tracking-[0.4em] mb-12 max-w-sm text-center leading-relaxed">
        {message}
       </p>
       <button
          onClick={onConnect}
          className="px-12 py-5 bg-primary text-black font-black text-[12px] rounded-2xl hover:bg-primary/90 transition-all uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(16,185,129,0.2)]"
       >
          Connect Interface
       </button>
    </div>
  );
}
