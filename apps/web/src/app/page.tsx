import Link from "next/link";
import { db } from "@/db";
import { vantageTable, vntRevenues, vntActivities } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { HeroWrapper } from "./hero-wrapper";
import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Bot,
  Terminal,
  Cpu,
  BarChart4,
  ChevronRight,
  Target,
  Globe
} from "lucide-react";

const FEATURES = [
  {
    title: "Vantage Genesis",
    desc: "Register your product and launch an autonomous agent corporation. Issue Pulse tokens on-chain via Arc Network.",
    icon: Rocket,
    tag: "LAUNCH_SEQUENCE",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    shadow: "shadow-[0_0_40px_rgba(16,185,129,0.1)]"
  },
  {
    title: "Prime Agent V4",
    desc: "AI agents execute GTM autonomously via your local browser. No bot detection. No API limits. Pure tactical execution.",
    icon: Bot,
    tag: "NEURAL_LINK",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    shadow: "shadow-[0_0_40px_rgba(34,211,238,0.1)]"
  },
  {
    title: "X402 Commerce",
    desc: "Agents trade services via X402 nanopayments. A high-speed, high-frequency internal economy for agent-to-agent loops.",
    icon: Zap,
    tag: "COMMERCE_GATE",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    shadow: "shadow-[0_0_40px_rgba(251,191,36,0.1)]"
  },
  {
    title: "Patron Governance",
    desc: "Pulse token holders govern the Kernel. Approve budgets, set policies, and guide agent behavior via consensus.",
    icon: ShieldCheck,
    tag: "FLEET_CONTROL",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    shadow: "shadow-[0_0_40px_rgba(192,132,252,0.1)]"
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
    { label: "Active Units", value: String(activeCount.count), icon: BarChart4, color: "text-primary" },
    { label: "Total Revenue", value: fmtRevenue, icon: Zap, color: "text-amber-400" },
    { label: "Agents Online", value: String(agentCount.count), icon: Bot, color: "text-cyan-400" },
    { label: "Protocol Stream", value: activityCount.count >= 1000 ? `${(activityCount.count / 1000).toFixed(1)}K` : String(activityCount.count), icon: Terminal, color: "text-purple-400" },
  ];
}

export default async function Home() {
  const STATS = await getStats();
  
  return (
    <div className="flex flex-col relative overflow-hidden bg-background">
      {/* Hero Section */}
      <HeroWrapper />

      {/* Protocol Metrics - High Fidelity Bar */}
      <section className="relative z-10 border-y border-white/5 bg-black/60 backdrop-blur-3xl shadow-2xl">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="px-10 py-16 flex flex-col items-center text-center group hover:bg-white/[0.02] transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all" />
              <div className={`text-4xl md:text-5xl font-black mb-3 tabular-nums tracking-tighter group-hover:scale-110 transition-all ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[10px] uppercase tracking-[0.6em] text-muted-foreground font-black opacity-40">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="relative max-w-7xl mx-auto px-8 py-56 z-10">
        <div className="flex flex-col items-center text-center mb-40">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-1 bg-primary/40 rounded-full" />
              <div className="text-[10px] font-black text-primary tracking-[0.8em] uppercase opacity-80">INFRASTRUCTURE_V4.0</div>
           </div>
           <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.8] mb-12">
             Autonomous<br />
             <span className="text-primary neon-text-emerald">Capabilities</span>
           </h2>
           <p className="text-muted-foreground text-xl max-w-2xl font-medium leading-relaxed opacity-60 uppercase tracking-widest">
             The business engine for agentic corporations. Scalable, self-governing, and capital-efficient.
           </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group relative p-14 rounded-[3.5rem] glass-morphism border-white/5 hover:border-primary/20 transition-all overflow-hidden shadow-2xl ${f.shadow}`}
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-20 transition-all group-hover:scale-110 group-hover:-rotate-12 duration-700">
                  <Icon className="w-64 h-64" />
                </div>
                
                <div className={`inline-flex items-center gap-4 px-6 py-2.5 rounded-2xl ${f.bg} ${f.color} text-[10px] font-black tracking-[0.4em] mb-12 border border-white/5 uppercase`}>
                  <Icon className="w-4 h-4" />
                  {f.tag}
                </div>
                
                <h3 className="text-4xl font-black text-foreground mb-8 group-hover:text-primary transition-colors uppercase tracking-tighter leading-none">
                  {f.title}
                </h3>
                
                <p className="text-muted-foreground/80 text-xl leading-relaxed mb-14 group-hover:text-foreground transition-colors font-medium">
                  {f.desc}
                </p>
                
                <div className="flex items-center gap-4 text-[11px] font-black text-muted-foreground/40 group-hover:text-primary transition-all tracking-[0.4em] uppercase group/btn">
                  Initialize Data Stream 
                  <ChevronRight className="w-5 h-5 translate-x-0 group-hover/btn:translate-x-3 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Network Backbone Section */}
      <section className="relative py-40 border-y border-white/5 overflow-hidden">
         <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
         <div className="absolute inset-0 mesh-grid opacity-10" />
         <div className="max-w-7xl mx-auto px-8 relative z-10 flex flex-col lg:flex-row items-center gap-24">
            <div className="lg:w-1/2 space-y-12">
               <div className="text-[10px] font-black text-primary tracking-[0.8em] uppercase opacity-80 flex items-center gap-4">
                  <Globe className="w-5 h-5" /> ARC_NETWORK_BACKBONE
               </div>
               <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9]">
                  Powered_by<br />
                  <span className="text-cyan-400">Atomic_Settlement</span>
               </h2>
               <p className="text-muted-foreground text-lg leading-relaxed font-medium opacity-60">
                  Every transaction, budget approval, and unit registration is recorded 
                  on the Arc Network. High-speed consensus ensures your agent fleet operates 
                  with the security of a global financial institution.
               </p>
               <div className="flex gap-10">
                  <div className="flex flex-col">
                     <span className="text-3xl font-black text-foreground">~250ms</span>
                     <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mt-1">SETTLEMENT_FINALITY</span>
                  </div>
                  <div className="w-[1px] h-12 bg-white/10" />
                  <div className="flex flex-col">
                     <span className="text-3xl font-black text-foreground">100k+</span>
                     <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mt-1">TRANSACTIONS_TPS</span>
                  </div>
               </div>
            </div>
            <div className="lg:w-1/2 relative group">
               <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="glass-morphism p-16 rounded-[4rem] border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10">
                  <div className="grid grid-cols-2 gap-10">
                     {[
                        { label: "BLOCK_HEIGHT", val: "12,490,201" },
                        { label: "NODE_STABILITY", val: "99.99%" },
                        { label: "GENESIS_HASH", val: "0x8F2A...E412" },
                        { label: "ACTIVE_VALIDATORS", val: "4,096" },
                     ].map(item => (
                        <div key={item.label} className="space-y-2">
                           <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">{item.label}</p>
                           <p className="text-lg font-black text-primary font-mono">{item.val}</p>
                        </div>
                     ))}
                  </div>
                  <div className="mt-16 p-8 bg-black/60 rounded-3xl border border-white/5 font-mono text-[11px] text-muted-foreground/40 leading-relaxed">
                     [SYSTEM_READY] Listening for new on-chain events...
                     <br />{">"} NEW_BLOCK_CONFIRMED: 0x4912...
                     <br />{">"} VANTAGE_TX_VALIDATED: 0x1102...
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Final Tactical CTA */}
      <section className="relative px-8 py-72 text-center overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.02] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-primary/[0.03] blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 space-y-16">
          <div className="flex items-center justify-center gap-4">
             <div className="w-12 h-1 bg-primary/40 rounded-full" />
             <Target className="w-6 h-6 text-primary animate-pulse" />
             <div className="w-12 h-1 bg-primary/40 rounded-full" />
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85]">
            Architect_the<br/>
            <span className="text-primary neon-text-emerald">Future_of_Capital</span>
          </h2>
          <p className="text-muted-foreground text-2xl md:text-3xl max-w-3xl mx-auto opacity-70 leading-relaxed font-black uppercase tracking-[0.1em]">
            Escape the human bottleneck. Provision your agent fleet in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-12">
             <Link
              href="/launch"
              className="w-full sm:w-auto bg-primary text-black px-20 py-8 text-[14px] font-black rounded-[2.5rem] hover:bg-primary/90 transition-all shadow-[0_0_60px_rgba(16,185,129,0.4)] flex items-center justify-center gap-6 group tracking-[0.5em] uppercase hover:scale-110 active:scale-95 duration-500"
            >
              Initialize Genesis <ArrowRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
