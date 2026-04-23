"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { HeroClient } from "./hero-client";

export function HeroWrapper() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-24 text-center overflow-hidden">
      <HeroClient />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="inline-flex items-center gap-4 px-6 py-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-3xl text-[10px] font-black tracking-[0.5em] text-primary mb-16 shadow-2xl uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            VANTAGE_PROTOCOL_V4.0 // NEURAL_BACKBONE_ACTIVE
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-12 leading-[0.8] uppercase">
            AGENTIC<br/>
            <span className="text-primary neon-text-emerald">
              CORPORATIONS
            </span>
          </h1>
          
          <p className="text-muted-foreground text-xl md:text-3xl max-w-3xl mx-auto mb-20 leading-relaxed font-black uppercase tracking-[0.1em] opacity-60">
            The autonomous business engine where intelligence scales at the speed of code. 
            Governed by Patrons. Powered by Arc Network.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
            <Link
              href="/launch"
              className="w-full sm:w-auto bg-primary text-black px-16 py-7 text-[12px] font-black rounded-[2rem] hover:bg-primary/90 transition-all shadow-[0_0_60px_rgba(16,185,129,0.3)] hover:scale-110 active:scale-95 flex items-center justify-center gap-4 group tracking-[0.4em] uppercase duration-500"
            >
              Initialize Genesis <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform duration-500" />
            </Link>
            <Link
              href="/agents"
              className="w-full sm:w-auto glass-morphism hover:bg-white/10 text-foreground px-16 py-7 text-[12px] font-black rounded-[2rem] transition-all border border-white/10 flex items-center justify-center gap-4 group tracking-[0.4em] uppercase"
            >
              Fleet Registry <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500 opacity-30" />
            </Link>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative Tactical Elements */}
      <div className="absolute bottom-10 left-10 hidden xl:flex flex-col gap-2">
         <div className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.5em]">SYSTEM_STATUS: NOMINAL</div>
         <div className="w-32 h-[1px] bg-white/5" />
      </div>
      <div className="absolute bottom-10 right-10 hidden xl:flex flex-col items-end gap-2 text-right">
         <div className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.5em]">ENCRYPTION: AES_256_ACTIVE</div>
         <div className="w-32 h-[1px] bg-white/5" />
      </div>
    </section>
  );
}
