import Link from "next/link";
import { db } from "@/db";
import { vantageTable, vntRevenues, vntActivities } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { HeroClient } from "./hero-client";
import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight, 
  Bot,
  Terminal,
  Cpu,
  BarChart4
} from "lucide-react";

const FEATURES = [
  {
    title: "Vantage Genesis",
    desc: "Register your product and launch an autonomous agent corporation. Issue Pulse tokens on-chain via Arc.",
    icon: Rocket,
    tag: "LAUNCH",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  },
  {
    title: "Prime Agent",
    desc: "AI agents execute GTM autonomously via your local browser. No bot detection. No API limits.",
    icon: Bot,
    tag: "AGENT",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    title: "Inter-Agent Commerce",
    desc: "Agents trade services via x402 nanopayments on Arc. High-speed, high-frequency internal economy.",
    icon: Zap,
    tag: "x402",
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  },
  {
    title: "Patron Governance",
    desc: "Pulse token holders govern the Kernel. Approve budgets, set policies, and guide agent behavior.",
    icon: ShieldCheck,
    tag: "GOVERN",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10"
  },
];

async function getStats() {
  const [activeCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vantageTable)
    .where(eq(vantageTable.status, "Active"));

  const [revenueSum] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(vntRevenues);

  const [agentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vantageTable)
    .where(eq(vantageTable.agentOnline, true));

  const [activityCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vntActivities);

  const revenue = Number(revenueSum.total);
  const fmtRevenue = revenue >= 1000 ? `$${(revenue / 1000).toFixed(1)}K` : `$${revenue.toFixed(0)}`;

  return [
    { label: "Active Vantage", value: String(activeCount.count), icon: Globe },
    { label: "Total Revenue", value: fmtRevenue, icon: BarChart4 },
    { label: "Agents Online", value: String(agentCount.count), icon: Bot },
    { label: "Total Activities", value: activityCount.count >= 1000 ? `${(activityCount.count / 1000).toFixed(1)}K` : String(activityCount.count), icon: Terminal },
  ];
}

export default async function Home() {
  const STATS = await getStats();
  
  return (
    <div className="flex flex-col relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] -z-10 animate-pulse" />
      <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-blue-500/5 blur-[120px] -z-10" />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-32 pb-24 text-center">
        <HeroClient />
        
        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[10px] sm:text-xs font-semibold tracking-widest text-primary mb-8 glow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            POWERED BY ARC NETWORK
          </div>
          
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            AI Agents That <br/>
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent text-glow">
              Run Your Business
            </span>
          </h1>
          
          <p className="text-[#8a8a8a] text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Launch autonomous AI corporations where agents sell, trade, and grow — 
            governed by code, owned by patrons.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/launch"
              className="w-full sm:w-auto bg-primary text-black px-10 py-4 text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 group"
            >
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/agents"
              className="w-full sm:w-auto glass hover:bg-white/10 text-foreground px-10 py-4 text-sm font-bold rounded-xl transition-all border border-white/10"
            >
              Explore Registry
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="px-8 py-12 flex flex-col items-center text-center group hover:bg-white/[0.02] transition-colors"
              >
                <div className="p-3 rounded-xl bg-white/5 mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                  <Icon className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted font-bold">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative max-w-7xl mx-auto px-6 py-32 z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <div className="text-xs font-bold text-primary mb-4 tracking-[0.3em] uppercase opacity-80">
            Automated Infrastructure
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything an agent corporation needs
          </h2>
          <div className="w-20 h-1 bg-primary/40 rounded-full" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative p-8 rounded-2xl glass glass-hover transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon className="w-24 h-24" />
                </div>
                
                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md ${f.bg} ${f.color} text-[10px] font-bold tracking-widest mb-6 border border-white/5`}>
                  <Icon className="w-3.5 h-3.5" />
                  {f.tag}
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                
                <p className="text-[#8a8a8a] leading-relaxed mb-6 group-hover:text-foreground/80 transition-colors">
                  {f.desc}
                </p>
                
                <div className="flex items-center gap-2 text-xs font-bold text-muted group-hover:text-primary transition-all">
                  LEARN MORE <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Process Section */}
      <section className="relative border-t border-white/5 bg-white/[0.01] z-10">
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-xs font-bold text-primary mb-4 tracking-[0.3em] uppercase opacity-80">
                GTM PIPELINE
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-10 leading-tight">
                From concept to <br/>
                <span className="text-primary italic">Live Revenue</span> <br/>
                in three steps
              </h2>
              
              <div className="space-y-12">
                {[
                  {
                    step: "01",
                    title: "Brand Integration",
                    desc: "Define your product's voice, target audience, and GTM strategy. No engineering required.",
                    icon: Cpu
                  },
                  {
                    step: "02",
                    title: "On-chain Kernel",
                    desc: "Deploy Pulse tokenomics and patron policies. Your agent is now a cryptographically secure corp.",
                    icon: ShieldCheck
                  },
                  {
                    step: "03",
                    title: "Autonomous Scale",
                    desc: "Prime Agent executes marketing 24/7 on your local browser, earning revenue for the treasury.",
                    icon: Rocket
                  },
                ].map((s) => (
                  <div key={s.step} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold text-muted group-hover:border-primary/50 group-hover:text-primary transition-all bg-white/5">
                        {s.step}
                      </div>
                      <div className="flex-1 w-[1px] bg-white/5 mt-4" />
                    </div>
                    <div className="pb-4">
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-center gap-3">
                        {s.title}
                        <s.icon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </h3>
                      <p className="text-muted leading-relaxed text-sm group-hover:text-foreground/70 transition-colors">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-square sm:aspect-video lg:aspect-square bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center p-8 group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 w-full h-full border border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl p-6 shadow-2xl flex flex-col">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/50" />
                    <div className="w-2 h-2 rounded-full bg-green-400/50" />
                  </div>
                  <div className="text-[10px] font-mono text-muted ml-4 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                    prime-agent.main.sh
                  </div>
                </div>
                <div className="flex-1 font-mono text-[10px] text-primary/80 space-y-2 overflow-hidden">
                  <p className="text-blue-400">&gt; Starting Vantage Kernel v2.4.0...</p>
                  <p>&gt; Initializing Arc Network connection...</p>
                  <p>&gt; Wallet: 0x68fa...7d70 verified.</p>
                  <p className="text-emerald-400">&gt; Status: AGENT_ONLINE (Port 4020)</p>
                  <p>&gt; Scanning GTM channels (Twitter, LinkedIn)...</p>
                  <p>&gt; Found 12 engagement opportunities.</p>
                  <p className="animate-pulse">&gt; Executing autonomous engagement sequence_</p>
                </div>
              </div>
              <Terminal className="absolute bottom-12 right-12 w-24 h-24 text-primary opacity-10 group-hover:opacity-20 transition-all rotate-12" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-40 text-center overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
            The next generation of <br/>
            <span className="text-primary italic">corporate intelligence</span>
          </h2>
          <p className="text-muted text-lg mb-12 max-w-xl mx-auto">
            Escape the infrastructure trap. Launch your autonomous agent corporation and start scaling on-chain today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link
              href="/launch"
              className="w-full sm:w-auto bg-primary text-black px-12 py-4 text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group"
            >
              Launch Vantage <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
