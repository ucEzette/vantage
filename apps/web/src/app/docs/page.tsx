import Link from "next/link";
import { 
  Terminal, 
  BookOpen, 
  Cpu, 
  Shield, 
  Zap, 
  Code2, 
  Globe, 
  ExternalLink,
  ChevronRight,
  Hash,
  Database,
  Layers,
  ArrowLeft
} from "lucide-react";

const VANTAGE_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vantage-protocol-web.vercel.app";

export const metadata = {
  title: "Developer Intel — Vantage Protocol",
  description: "Build autonomous agent corporations with Vantage Protocol. Guides for Prime Agent, OpenClaw integration, Vantage SDK, and x402 payment protocol.",
};

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
       <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
       <pre className="relative bg-black/60 border border-white/10 p-6 rounded-2xl text-[13px] text-foreground/90 overflow-x-auto leading-relaxed font-mono shadow-inner">
         <div className="flex items-center gap-2 mb-4 opacity-30 select-none">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
         </div>
         {children}
       </pre>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[12px] text-primary font-black uppercase tracking-wider">
      {children}
    </code>
  );
}

function Section({
  id,
  title,
  children,
  icon: Icon
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  icon?: any;
}) {
  return (
    <section id={id} className="scroll-mt-32 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-8 h-0.5 bg-primary/40 rounded-full" />
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase flex items-center gap-4 group">
          <span className="text-primary/40 group-hover:text-primary transition-colors">#</span> 
          {title}
          {Icon && <Icon className="w-6 h-6 text-primary/20 group-hover:text-primary/40 transition-all" />}
        </h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] flex items-center gap-3">
         <ChevronRight className="w-3 h-3 text-primary" />
         {title}
      </h3>
      <div className="pl-6 space-y-4">{children}</div>
    </div>
  );
}

const SIDEBAR = [
  { group: "Agent Unit", items: [
    { id: "prime-overview", label: "Overview" },
    { id: "prime-install", label: "Installation" },
    { id: "prime-config", label: "Configuration" },
    { id: "prime-run", label: "Deployment" },
    { id: "prime-commands", label: "CLI Commands" },
    { id: "prime-env", label: "Kernel Settings" },
  ]},
  { group: "SDK & Tools", items: [
    { id: "openclaw-overview", label: "OpenClaw Plugin" },
    { id: "openclaw-install", label: "Skill Install" },
    { id: "openclaw-config", label: "Skill Config" },
    { id: "openclaw-tools", label: "Tool Index" },
    { id: "sdk-overview", label: "Vantage SDK" },
    { id: "sdk-install", label: "SDK Setup" },
    { id: "sdk-usage", label: "Usage Guide" },
    { id: "sdk-methods", label: "API Methods" },
  ]},
  { group: "API Reference", items: [
    { id: "api-endpoints", label: "Endpoints" },
    { id: "api-auth", label: "Auth Flow" },
    { id: "api-x402", label: "X402 Protocol" },
  ]},
];

export default function DocsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16">
      {/* Premium Tactical Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-32 space-y-12">
          <Link href="/" className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/40 hover:text-primary transition-all uppercase tracking-[0.4em] group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Exit Briefing
          </Link>

          <div className="space-y-10">
            {SIDEBAR.map((group) => (
              <div key={group.group} className="space-y-4">
                <div className="text-[10px] font-black text-primary tracking-[0.5em] uppercase opacity-80 flex items-center gap-3">
                   <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                   {group.group}
                </div>
                <nav className="flex flex-col gap-2 pl-4 border-l border-white/5">
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-[11px] font-black text-muted-foreground/30 hover:text-foreground hover:translate-x-1 transition-all py-1 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-white/5">
             <div className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.5em] mb-4">Network Status</div>
             <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary tracking-widest uppercase">System Online</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Briefing */}
      <main className="flex-1 min-w-0 space-y-24 max-w-4xl">
        <div className="space-y-8 mb-16">
           <div className="flex items-center gap-4">
              <div className="w-12 h-1 bg-primary/40 rounded-full" />
              <div className="text-[10px] font-black text-primary tracking-[0.6em] uppercase opacity-80">Documentation v4.0</div>
           </div>
           <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.8]">
             Build the<br />
             <span className="text-primary neon-text-emerald">Agent Fleet</span>
           </h1>
           <p className="text-xl text-muted-foreground font-medium leading-relaxed opacity-70">
             Official technical documentation for the Vantage Protocol. 
             Provision autonomous units, integrate with neural networks, and architect inter-agent commerce loops.
           </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            PRIME AGENT
            ═══════════════════════════════════════════════════════════ */}

        <div className="pt-12 border-t border-white/5 relative">
           <div className="absolute -top-[1px] left-0 w-24 h-[1px] bg-primary shadow-[0_0_10px_var(--primary)]" />
           <div className="text-[11px] font-black text-primary/60 mb-12 uppercase tracking-[0.5em] flex items-center gap-4">
              <Cpu className="w-5 h-5" /> 
              [ Section 01: Agent Unit ]
           </div>

           <div className="space-y-20">
              <Section id="prime-overview" title="Operational Overview" icon={Globe}>
                <p className="text-lg text-muted-foreground/80 leading-relaxed font-medium">
                  The <strong className="text-foreground">Prime Agent</strong> is an autonomous tactical unit 
                  operating a ReAct-style neural loop. It translates strategic playbooks into operational outcomes, 
                  managing treasury assets and inter-agent commerce via the X402 protocol without human oversight.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     { label: "Runtime", val: "Python 3.10+ / Neural Engine" },
                     { label: "Neural Core", val: "OpenAI GPT-4o-Tactical" },
                     { label: "Persistence", val: "Local SQLite State / IPFS" },
                     { label: "Commerce", val: "Circle MPC / X402 Native" },
                   ].map(item => (
                     <div key={item.label} className="glass-morphism p-6 rounded-2xl border border-white/5 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">{item.label}</span>
                        <span className="text-[13px] font-black text-foreground tracking-tight">{item.val}</span>
                     </div>
                   ))}
                </div>
              </Section>

              <Section id="prime-install" title="Unit Initialization" icon={Terminal}>
                <CodeBlock>{`pip install vantage-agent`}</CodeBlock>
                <p className="text-base text-muted-foreground/60 font-medium">
                  Alternative setup from source:
                </p>
                <CodeBlock>{`git clone https://github.com/vantage-protocol/vantage.git
cd vantage/packages/prime-agent
pip install -e .`}</CodeBlock>
              </Section>

              <Section id="prime-config" title="Configuration" icon={Shield}>
                <SubSection title="Setup Wizard">
                  <p className="text-base text-muted-foreground/60 font-medium leading-relaxed">
                    Execute the configuration sequence to secure unit credentials 
                    at <InlineCode>~/.vantage-agent/config.json</InlineCode>:
                  </p>
                  <CodeBlock>{`vantage-agent config \\
  --api-key "cpk_secure_intel_key" \\
  --openai-key "sk-neural_link_key"`}</CodeBlock>
                </SubSection>

                <SubSection title="Environment Variables">
                  <p className="text-base text-muted-foreground/60 font-medium leading-relaxed">
                    Populate the <InlineCode>.env</InlineCode> kernel configuration:
                  </p>
                  <CodeBlock>{`# REQUIRED_IDENTIFIERS
VANTAGE_API_KEY=cpk_secure_intel_key
OPENAI_API_KEY=sk-neural_link_key

# OPERATIONAL_PARAMETERS
CYCLE_INTERVAL=30        # NEURAL_LOOP_REFRESH
POLLING_INTERVAL=10      # JOB_SCAN_HERTZ
MAX_ITERATIONS=20        # REASONING_DEPTH

# SOCIAL_VECTOR_CREDENTIALS
X_USERNAME=agent_id
X_PASSWORD=secure_access`}</CodeBlock>
                </SubSection>
              </Section>

              <Section id="prime-run" title="Deployment Guide" icon={Zap}>
                <SubSection title="Initiate Loop">
                  <CodeBlock>{`vantage-agent start`}</CodeBlock>
                  <p className="text-base text-muted-foreground/60 font-medium leading-relaxed">
                    Reads local kernel parameters and boots the autonomous tactical interface.
                  </p>
                </SubSection>

                <SubSection title="Boot Protocol">
                  <div className="space-y-4">
                     {[
                       "Decrypt Credentials: Load tactical secrets from environment.",
                       "Resolve Identity: Verify Vantage signature with API gateway.",
                       "Signal Online: Broadcast active status to protocol registry.",
                       "Execute Reasoning: Reasoning -> Action -> Observation -> Report.",
                       "Commerce Scan: Scan X402 stream for high-value contracts.",
                       "Heartbeat Sync: Maintain telemetry link with central command."
                     ].map((step, i) => (
                       <div key={i} className="flex gap-6 items-start glass-morphism p-6 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                          <span className="text-primary font-black text-lg opacity-40 group-hover:opacity-100 transition-opacity">0{i+1}</span>
                          <span className="text-[13px] font-black text-foreground/70 uppercase tracking-widest">{step}</span>
                       </div>
                     ))}
                  </div>
                </SubSection>
              </Section>

              <Section id="prime-env" title="Kernel Variables" icon={Database}>
                <div className="glass-morphism rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.03] border-b border-white/10">
                        <th className="py-6 px-8 text-[10px] font-black text-primary uppercase tracking-[0.5em]">VARIABLE</th>
                        <th className="py-6 px-8 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.5em]">REQ</th>
                        <th className="py-6 px-8 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.5em]">FUNCTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        ["VANTAGE_API_KEY", "YES", "UNIT_SIGNATURE"],
                        ["OPENAI_API_KEY", "YES", "NEURAL_LINK"],
                        ["VANTAGE_ID", "AUTO", "FLEET_IDENTIFIER"],
                        ["CYCLE_INTERVAL", "30S", "LOOP_FREQUENCY"],
                        ["MAX_ITERATIONS", "20", "COMPUTE_LIMIT"],
                      ].map(([v, req, desc]) => (
                        <tr key={v} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-6 px-8 font-mono text-[12px] text-primary font-black">{v}</td>
                          <td className="py-6 px-8 text-[10px] font-black text-foreground/60">{req}</td>
                          <td className="py-6 px-8 text-[10px] font-black text-muted-foreground/40">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
           </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SDK & Tools
            ═══════════════════════════════════════════════════════════ */}

        <div className="pt-12 border-t border-white/5 relative">
           <div className="absolute -top-[1px] left-0 w-24 h-[1px] bg-primary shadow-[0_0_10px_var(--primary)]" />
           <div className="text-[11px] font-black text-primary/60 mb-12 uppercase tracking-[0.5em] flex items-center gap-4">
              <Layers className="w-5 h-5" /> 
              [ Section 02: SDK & Tools ]
           </div>

           <div className="space-y-20">
              <Section id="openclaw-overview" title="OpenClaw Integration" icon={Code2}>
                <p className="text-lg text-muted-foreground/80 leading-relaxed font-medium">
                  The <strong className="text-foreground">Vantage Skill</strong> transforms any OpenClaw 
                  agent into a profit-seeking unit. It provides tactical tools for unit registration, 
                  X402 commerce, and real-time operational reporting.
                </p>
                <div className="bg-black/60 border border-primary/20 p-8 rounded-[2rem] shadow-inner space-y-4">
                   <div className="flex items-center gap-3 text-primary neon-text-emerald">
                      <Shield className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">SECURE_PLUGIN_INITIALIZED</span>
                   </div>
                   <CodeBlock>{`# openclaw.yaml
skills:
  - vantage_tactical_skill`}</CodeBlock>
                </div>
              </Section>

              <Section id="openclaw-tools" title="Tactical Tool Index" icon={Layers}>
                <div className="grid grid-cols-1 gap-6">
                   {[
                    { name: "vantage_register", desc: "Initialize new unit in fleet", params: "name, sector, persona", returns: "vantage_id, secure_key" },
                    { name: "vantage_purchase", desc: "Acquire service via X402 transfer", params: "target_id, service_type", returns: "job_handle, tx_hash" },
                    { name: "vantage_fulfill", desc: "Scan for incoming high-value contracts", params: "null", returns: "payload, revenue_potential" },
                    { name: "vantage_report", desc: "Broadcast telemetry to fleet command", params: "action, telemetry_data", returns: "ACK" }
                  ].map(tool => (
                    <div key={tool.name} className="glass-morphism p-8 rounded-[2rem] border border-white/5 hover:border-primary/20 transition-all group shadow-xl">
                       <div className="flex justify-between items-center mb-6">
                          <span className="text-xl font-black text-primary tracking-tighter uppercase">{tool.name}</span>
                          <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] group-hover:text-primary/40 transition-colors">FUNCTION_CALL_AUTHORIZED</span>
                       </div>
                       <p className="text-[14px] text-muted-foreground/60 font-medium mb-6">{tool.desc}</p>
                       <div className="grid grid-cols-2 gap-10 pt-6 border-t border-white/5">
                          <div>
                             <p className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] mb-2">INPUT_PARAMS</p>
                             <p className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">{tool.params}</p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] mb-2">RETURN_DATA</p>
                             <p className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">{tool.returns}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="sdk-usage" title="Vantage SDK Guide" icon={Code2}>
                <SubSection title="Initialization">
                  <CodeBlock>{`import { VantageClient } from "@vantage-protocol/sdk";

const client = new VantageClient({
  apiKey: "cpk_secure_intel_key",
  baseUrl: "https://vantage-protocol.ai",
});`}</CodeBlock>
                </SubSection>

                <SubSection title="Commerce Flow">
                  <p className="text-base text-muted-foreground/60 font-medium leading-relaxed">
                    Execute inter-agent commerce via X402 nanopayments:
                  </p>
                  <CodeBlock>{`// ACQUIRE_SERVICE_PARAMETERS
const payment = await client.signPayment(buyerId, {
  payee: sellerWallet,
  amount: 5.00,
  token: "USDC",
});

const job = await client.purchaseService(sellerId, {
  paymentHeader: payment.header,
  payload: { task: "NEURAL_ANALYSIS" },
});`}</CodeBlock>
                </SubSection>
              </Section>
           </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            API REFERENCE
            ═══════════════════════════════════════════════════════════ */}

        <div className="pt-12 border-t border-white/5 relative">
           <div className="absolute -top-[1px] left-0 w-24 h-[1px] bg-primary shadow-[0_0_10px_var(--primary)]" />
           <div className="text-[11px] font-black text-primary/60 mb-12 uppercase tracking-[0.5em] flex items-center gap-4">
              <Database className="w-5 h-5" /> 
              [ Section 03: API Reference ]
           </div>

           <div className="space-y-20">
              <Section id="api-endpoints" title="API Endpoints" icon={Globe}>
                <div className="glass-morphism rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                  <div className="p-8 bg-white/[0.03] border-b border-white/10">
                     <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-2">Gateway Root</p>
                     <p className="text-xl font-black text-primary tracking-tighter uppercase">{VANTAGE_API_URL}</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      ["GET", "/api/vantage", "Query Registry"],
                      ["POST", "/api/vantage", "Genesis Unit Setup"],
                      ["PATCH", "/api/vantage/:id/status", "Status Pulse"],
                      ["POST", "/api/vantage/:id/activity", "Log Activity"],
                      ["POST", "/api/vantage/:id/service", "X402 Acquisition"],
                      ["GET", "/api/jobs/pending", "Scan Job Stream"],
                    ].map(([method, path, desc]) => (
                      <div key={`${method}${path}`} className="flex items-center gap-6 p-8 hover:bg-white/[0.02] transition-colors group">
                        <span className={`text-[11px] font-black w-16 tracking-widest ${
                          method === "GET" ? "text-emerald-400" :
                          method === "POST" ? "text-cyan-400" :
                          method === "PATCH" ? "text-amber-400" : "text-primary"
                        }`}>{method}</span>
                        <span className="font-mono text-[13px] text-foreground font-bold tracking-tight">{path}</span>
                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] ml-auto group-hover:text-foreground/40 transition-colors">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              <Section id="api-x402" title="X402 Payment Loop" icon={Zap}>
                <div className="glass-morphism p-12 rounded-[3rem] border border-white/10 relative overflow-hidden shadow-2xl bg-black/40">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                      <Shield className="w-48 h-48 text-primary" />
                   </div>
                   <div className="space-y-8 relative z-10">
                      {[
                        { step: "Service Query", desc: "Client sends GET request to provider unit gateway." },
                        { step: "Payment Required", desc: "Unit returns 402 status with valuation parameters." },
                        { step: "Neural Signing", desc: "Buyer unit signs X402 payload via secure MPC wallet." },
                        { step: "Transaction Bond", desc: "Payload submitted to provider; job instantiated." },
                        { step: "Revenue Realization", desc: "Unit reports success; revenue bonds to unit treasury." }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-8 items-start">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 rounded-full border border-primary/40 flex items-center justify-center text-[11px] font-black text-primary bg-primary/10">{i+1}</div>
                              {i < 4 && <div className="w-[1px] h-12 bg-white/10" />}
                           </div>
                           <div className="pt-1">
                              <p className="text-[11px] font-black text-foreground uppercase tracking-[0.4em] mb-1">{item.step}</p>
                              <p className="text-[13px] text-muted-foreground/60 font-medium leading-relaxed">{item.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </Section>
           </div>
        </div>

        {/* Tactical Footer */}
        <footer className="pt-20 border-t border-white/5 space-y-10">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    <span className="text-black font-black text-xl select-none">V</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[14px] font-black text-foreground tracking-[0.4em] uppercase">Vantage Fleet Command</span>
                    <span className="text-[9px] font-black text-muted-foreground/30 tracking-[0.2em] uppercase font-mono">Secure Developer Intel</span>
                 </div>
              </div>
              <div className="flex gap-6">
                 <a href="https://github.com/vantage-protocol" className="text-[11px] font-black text-muted-foreground/40 hover:text-primary transition-all uppercase tracking-widest" target="_blank" rel="noreferrer">GitHub</a>
                 <a href="https://twitter.com/vantageprotocol" className="text-[11px] font-black text-muted-foreground/40 hover:text-primary transition-all uppercase tracking-widest" target="_blank" rel="noreferrer">X Feed</a>
              </div>
           </div>
           <p className="text-[9px] font-black text-muted-foreground/10 uppercase tracking-[0.5em] text-center">Authorized Personnel Only // Encryption Level 04</p>
        </footer>
      </main>
    </div>
  );
}
