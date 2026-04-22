"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/providers";
import { WalletGate } from "@/components/wallet-gate";
import {
  getRegistryContract,
  getNameServiceContract,
  getNameServiceReadOnly,
  getSignerFromWallet,
  ensureArcTestnet,
} from "@/lib/contracts";
import { BrowserProvider, ethers } from "ethers";
import { 
  Rocket, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Cpu, 
  Shield, 
  Zap, 
  Globe, 
  Wallet,
  Settings2,
  Eye,
  Construction
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: "Product", icon: Construction },
  { id: "Patron", icon: Wallet },
  { id: "Pulse", icon: Globe },
  { id: "Kernel", icon: Shield },
  { id: "Agent", icon: Cpu },
  { id: "Review", icon: Eye },
] as const;

const CHANNELS = ["X (Twitter)", "LinkedIn", "Reddit", "Product Hunt"];

export default function LaunchPage() {
  return (
    <WalletGate
      title="Genesis Authorization Required"
      description="Creating a new Vantage Protocol instance requires an authorized wallet connection to register ownership on the Arc Network."
    >
      <div className="py-12">
        <LaunchForm />
      </div>
    </WalletGate>
  );
}

function LaunchForm() {
  const { address, isConnected } = useWallet();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    productName: "",
    productDesc: "",
    category: "marketing",
    tokenName: "",
    tokenSymbol: "",
    totalSupply: "1000000",
    initialPrice: "0.01",
    approvalThreshold: "10",
    gtmBudget: "100",
    persona: "",
    targetAudience: "",
    tone: "professional",
    creatorWallet: "",
    channels: ["X (Twitter)"] as string[],
    agentName: "",
    serviceName: "",
    serviceDescription: "",
    servicePrice: "",
    serviceCurrency: "USDC" as const,
  });
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameChecking, setNameChecking] = useState(false);
  const [deployStep, setDeployStep] = useState<string | null>(null);
  const [deployProgress, setDeployProgress] = useState(0); 
  const [copied, setCopied] = useState(false);
  const [genesisResult, setGenesisResult] = useState<{
    vantageId: string;
    apiKey: string;
    onChainId: number;
    agentName: string;
  } | null>(null);

  const update = (key: string, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkNameAvailability = useCallback((name: string) => {
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
    if (!name || name.length < 3) {
      setNameAvailable(null);
      setNameChecking(false);
      return;
    }
    setNameChecking(true);
    nameCheckTimer.current = setTimeout(async () => {
      try {
        const [onChainResult, dbResult] = await Promise.all([
          (async () => {
            try {
              const ns = getNameServiceReadOnly();
              return await ns.isNameAvailable(name);
            } catch {
              return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name) && !/--/.test(name);
            }
          })(),
          fetch(`/api/vantage/check-name?name=${encodeURIComponent(name)}`)
            .then((r) => r.json())
            .then((d) => d.available as boolean)
            .catch(() => true),
        ]);
        setNameAvailable(onChainResult && dbResult);
      } catch {
        const valid = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name) && !/--/.test(name);
        setNameAvailable(valid);
      } finally {
        setNameChecking(false);
      }
    }, 400);
  }, []);

  const canNext = () => {
    switch (step) {
      case 0: return form.productName && form.productDesc;
      case 2: {
        const sym = form.tokenSymbol.trim();
        const supply = Number(form.totalSupply);
        const price = Number(form.initialPrice);
        return form.tokenName.trim().length > 0 && sym.length >= 2 && sym.length <= 8 && supply > 0 && price > 0;
      }
      case 3: return form.approvalThreshold && form.gtmBudget;
      case 4: return form.persona && form.targetAudience && form.channels.length > 0 && form.agentName.length >= 3 && nameAvailable === true;
      default: return true;
    }
  };

  const handleLaunch = async () => {
    if (!isConnected) return;
    setSubmitting(true);
    setError(null);
    setDeployStep(null);
    setDeployProgress(0);

    try {
      setDeployStep("Verifying network...");
      setDeployProgress(1);
      const signer = await getSignerFromWallet(window.ethereum);
      await ensureArcTestnet(signer.provider as BrowserProvider);

      setDeployStep("Registering Vantage on-chain...");
      setDeployProgress(2);
      const registry = getRegistryContract(signer);
      const creatorAddr = form.creatorWallet || address;
      
      const patron = {
        creatorShare: 0,
        investorShare: 0,
        treasuryShare: 10000,
        creatorAddr,
        investorAddr: "0x0000000000000000000000000000000000000001",
        treasuryAddr: "0x0000000000000000000000000000000000000002",
      };
      const kernel = {
        approvalThreshold: BigInt(Math.round(Number(form.approvalThreshold) * 100)),
        gtmBudget: BigInt(Math.round(Number(form.gtmBudget) * 100)),
        minPatronPulse: BigInt(Math.floor(Number(form.totalSupply) / 1000)),
      };
      const pulse = {
        tokenAddr: "0x0000000000000000000000000000000000000000",
        totalSupply: BigInt(form.totalSupply),
        priceUsdCents: BigInt(Math.round(Number(form.initialPrice) * 100)),
      };

      const createTx = await registry.createVantage(
        form.productName,
        form.category.charAt(0).toUpperCase() + form.category.slice(1),
        patron,
        kernel,
        pulse,
        form.tokenName,
        form.tokenSymbol
      );
      const receipt = await createTx.wait();

      const createdEvent = receipt.logs
        .map((log: any) => { try { return registry.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "VantageCreated");

      if (!createdEvent) throw new Error("Vantage registration failed");
      const onChainId = Number(createdEvent.args[0]);

      const pulseEvent = receipt.logs
        .map((log: any) => { try { return registry.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "PulseTokenCreated");
      const pulseTokenAddr = pulseEvent?.args?.[1] ?? null;

      setDeployStep("Registering agent identity...");
      setDeployProgress(3);
      const nameService = getNameServiceContract(signer);
      const nameTx = await nameService.registerName(BigInt(onChainId), form.agentName);
      await nameTx.wait();

      setDeployStep("Saving to database...");
      setDeployProgress(4);
      const res = await fetch("/api/vantage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.productName,
          category: form.category.charAt(0).toUpperCase() + form.category.slice(1),
          description: form.productDesc,
          totalSupply: Number(form.totalSupply),
          initialPrice: Number(form.initialPrice),
          approvalThreshold: Number(form.approvalThreshold),
          gtmBudget: Number(form.gtmBudget),
          onChainId,
          agentName: form.agentName,
          tokenAddress: pulseTokenAddr,
        }),
      });

      if (!res.ok) throw new Error("Database synchronization failed");
      const dbData = await res.json();

      setGenesisResult({
        vantageId: dbData.id,
        apiKey: dbData.apiKeyOnce,
        onChainId,
        agentName: form.agentName,
      });
    } catch (err: any) {
      setError(err.message || "Launch failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (genesisResult) {
    return (
      <div className="max-w-3xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass border-emerald-500/20 p-10 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Genesis Complete</h1>
              <p className="text-muted text-sm">Vantage ID {genesisResult.onChainId} is now live on Arc Network</p>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">API CREDENTIALS (SENSITIVE)</p>
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                   <code className="text-primary font-mono text-xs break-all select-all">{genesisResult.apiKey}</code>
                   <button 
                    onClick={() => {
                        navigator.clipboard.writeText(genesisResult.apiKey);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}
                    className="ml-4 p-2 text-muted hover:text-primary transition-colors"
                   >
                     {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Layers className="w-4 h-4" />}
                   </button>
                </div>
                <p className="text-[10px] text-amber-500/80 mt-3 flex items-center gap-2">
                   <Shield className="w-3 h-3" />
                   This key will never be shown again. Save it immediately.
                </p>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Bootstrap Command</p>
                <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl font-mono text-xs text-foreground/80 leading-relaxed shadow-inner">
                   <p className="text-primary/60"># 1. Start your Prime Agent</p>
                   <p className="mb-4">vantage-agent start --id {genesisResult.onChainId} --key <span className="text-primary select-all">{genesisResult.apiKey.slice(0, 8)}...</span></p>
                   <p className="text-primary/60"># 2. Monitor Lifecycle</p>
                   <p>tail -f logs/agent.log</p>
                </div>
             </div>

             <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 bg-primary text-black font-bold py-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  Enter Command Center <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-2 opacity-80">Protocol Genesis</div>
           <h1 className="text-4xl font-bold tracking-tight">Launch Intelligence</h1>
        </div>
        <button 
          onClick={() => {
            setForm({...form, productName: "Paymon", productDesc: "AI Payment Agent", tokenName: "Paymon Pulse", tokenSymbol: "PAYMON", agentName: "paymon"});
            setStep(0);
          }}
          className="glass hover:bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-xs font-bold transition-all text-muted hover:text-foreground"
        >
          Autofill Demo
        </button>
      </div>

      {/* Step Rail */}
      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-12">
        {STEPS.map((s, i) => {
           const Icon = s.icon;
           const isCurrent = step === i;
           const isPast = step > i;
           return (
             <button
                key={s.id}
                onClick={() => i <= step && setStep(i)}
                disabled={i > step}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all whitespace-nowrap ${
                  isCurrent 
                    ? "bg-primary border-primary text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                    : isPast 
                      ? "bg-white/5 border-emerald-500/20 text-emerald-500" 
                      : "bg-white/2 border-white/5 text-muted opacity-40"
                }`}
             >
               <Icon className="w-4 h-4 text-inherit" />
               <span className="text-xs tracking-wide">{s.id}</span>
             </button>
           );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={step}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           className="glass p-10 rounded-3xl border-white/5 min-h-[500px] flex flex-col"
        >
           <div className="flex-1">
             {step === 0 && (
               <div className="space-y-8">
                  <SectionTitle title="Identity & Vision" desc="Define your product and the core problem it solves." />
                  <div className="grid md:grid-cols-2 gap-8">
                    <Field label="Product Name" value={form.productName} onChange={(v) => update("productName", v)} placeholder="e.g. Nexus IA" />
                    <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Industry Vertical</label>
                        <select 
                          value={form.category} 
                          onChange={(e) => update("category", e.target.value)}
                          className="w-full bg-black/40 border border-white/5 px-4 py-3 rounded-xl text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                        >
                          <option value="marketing">Marketing</option>
                          <option value="finance">Finance</option>
                          <option value="operations">Operations</option>
                        </select>
                    </div>
                  </div>
                  <Field label="Strategic Description" value={form.productDesc} onChange={(v) => update("productDesc", v)} placeholder="What will the agent scale?" multiline />
               </div>
             )}

             {step === 1 && (
                <div className="space-y-8 text-center pt-10">
                   <SectionTitle title="Patron Registration" desc="You are currently authenticating as the Vantage Creator." center />
                   <div className="p-8 border border-white/5 rounded-2xl bg-white/[0.02] inline-block">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Linked Wallet</p>
                      <div className="text-2xl font-mono text-primary truncate max-w-sm">{address}</div>
                   </div>
                   <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
                      This address will be the permanent root of trust for your agent. All revenue will flow to the treasury controlled by this key.
                   </p>
                </div>
             )}

             {step === 2 && (
               <div className="space-y-8">
                  <SectionTitle title="Pulse Tokenomics" desc="Configure the ownership structure for your corporation." />
                  <div className="grid md:grid-cols-2 gap-8">
                    <Field label="Token Name" value={form.tokenName} onChange={(v) => update("tokenName", v)} placeholder="e.g. Nexus Pulse" />
                    <Field label="Ticker Symbol" value={form.tokenSymbol} onChange={(v) => update("tokenSymbol", v.toUpperCase().slice(0, 6))} placeholder="e.g. NEXUS" />
                    <Field label="Total Supply" value={form.totalSupply} onChange={(v) => update("totalSupply", v)} type="number" />
                    <Field label="Target Float (USDC)" value={form.initialPrice} onChange={(v) => update("initialPrice", v)} type="number" />
                  </div>
               </div>
             )}

             {step === 3 && (
                <div className="space-y-8">
                   <SectionTitle title="Kernel Policies" desc="Set the autonomous guardrails for your Prime Agent." />
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="glass p-6 rounded-2xl border-white/5">
                         <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-5 h-5 text-primary" />
                            <h3 className="font-bold">Governance</h3>
                         </div>
                         <Field label="Approval Threshold (USDC)" value={form.approvalThreshold} onChange={(v) => update("approvalThreshold", v)} type="number" />
                         <p className="text-[10px] text-muted mt-4 leading-relaxed italic">Transactions above this amount require multiple patron signatures.</p>
                      </div>
                      <div className="glass p-6 rounded-2xl border-white/5">
                         <div className="flex items-center gap-3 mb-6">
                            <Zap className="w-5 h-5 text-primary" />
                            <h3 className="font-bold">Operations</h3>
                         </div>
                         <Field label="Monthly GTM Budget (USDC)" value={form.gtmBudget} onChange={(v) => update("gtmBudget", v)} type="number" />
                         <p className="text-[10px] text-muted mt-4 leading-relaxed italic">The maximum monthly allowance for marketing and service acquisition.</p>
                      </div>
                   </div>
                </div>
             )}

             {step === 4 && (
                <div className="space-y-8">
                   <SectionTitle title="Agent Identity" desc="Provision the intelligence that will run your Vantage." />
                   <div className="grid md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-6">
                        <Field label="Handle (.vantage)" value={form.agentName} onChange={(v) => {
                            const val = v.toLowerCase().replace(/[^a-z0-9-]/g, "");
                            update("agentName", val);
                            checkNameAvailability(val);
                        }} placeholder="e.g. nexus-bot" />
                        <div className="text-[10px] px-2">
                           {nameChecking ? <span className="text-muted italic">Validating on Arc...</span> : (
                             nameAvailable === true ? <span className="text-emerald-500 font-bold tracking-widest">UNIT_AVAILABLE</span> : (
                               nameAvailable === false ? <span className="text-red-500 font-bold tracking-widest">UNIT_UNAVAILABLE</span> : null
                             )
                           )}
                        </div>
                        <Field label="Intelligence Persona" value={form.persona} onChange={(v) => update("persona", v)} multiline />
                      </div>
                      <div className="space-y-6">
                         <Field label="Strategic Target" value={form.targetAudience} onChange={(v) => update("targetAudience", v)} />
                         <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Activation Channels</label>
                            <div className="flex flex-wrap gap-2">
                               {CHANNELS.map(ch => (
                                 <button key={ch} onClick={() => {
                                    const next = form.channels.includes(ch) ? form.channels.filter(c => c !== ch) : [...form.channels, ch];
                                    update("channels", next);
                                 }} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                    form.channels.includes(ch) ? "bg-primary border-primary text-black" : "border-white/10 text-muted hover:border-white/20"
                                 }`}>{ch}</button>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {step === 5 && (
                <div className="space-y-8">
                   <SectionTitle title="Final Validation" desc="Review your configuration before committing to the network." />
                   <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                      <ReviewItem label="Vantage Name" value={form.productName} />
                      <ReviewItem label="Agent Handle" value={`${form.agentName}.vantage`} />
                      <ReviewItem label="Ticker" value={form.tokenSymbol} />
                      <ReviewItem label="Supply" value={form.totalSupply} />
                      <ReviewItem label="Approval Gate" value={`$${form.approvalThreshold}`} />
                      <ReviewItem label="Monthly Budget" value={`$${form.gtmBudget}`} />
                   </div>
                   <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                      <p className="text-xs text-primary leading-relaxed">
                         By launching, you are deploying a set of smart contracts on Arc Network and provisioning your Prime Agent. This action is immutable.
                      </p>
                   </div>
                </div>
             )}
           </div>

           <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
              <button 
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0 || submitting}
                className="flex items-center gap-2 text-muted hover:text-foreground transition-all disabled:opacity-30 font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> PREVIOUS
              </button>
              
              <div className="flex-1 px-12">
                  {submitting && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-primary tracking-widest">
                           <span>{deployStep?.toUpperCase()}</span>
                           <span>{deployProgress * 25}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${deployProgress * 25}%` }}
                           />
                        </div>
                    </div>
                  )}
              </div>

              {step === 5 ? (
                <button 
                  onClick={handleLaunch}
                  disabled={submitting}
                  className="bg-primary text-black font-bold px-10 py-4 rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  {submitting ? "PROVISIONING..." : "COMMIT GENESIS"} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext() || submitting}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 px-10 py-4 rounded-2xl font-bold text-xs transition-all disabled:opacity-30 disabled:grayscale"
                >
                  NEXT STEP
                </button>
              )}
           </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SectionTitle({ title, desc, center = false }: { title: string; desc: string; center?: boolean }) {
    return (
        <div className={center ? "text-center" : ""}>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-sm text-muted">{desc}</p>
        </div>
    );
}

function Field({ label, value, onChange, placeholder = "", type = "text", multiline = false }: any) {
    return (
        <div className="space-y-3">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{label}</label>
            {multiline ? (
                <textarea 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    placeholder={placeholder}
                    className="w-full bg-black/40 border border-white/5 px-4 py-3 rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors min-h-[120px]"
                />
            ) : (
                <input 
                    type={type} 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    placeholder={placeholder}
                    className="w-full bg-black/40 border border-white/5 px-4 py-3 rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
            )}
        </div>
    );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-white/5 group">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</span>
            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{value}</span>
        </div>
    );
}
