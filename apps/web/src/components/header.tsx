"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/providers";
import { 
  BarChart3, 
  Bot, 
  Activity, 
  LayoutDashboard, 
  Rocket, 
  BookOpen, 
  Trophy,
  Wallet,
  LogOut,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/playbooks", label: "Playbooks", icon: Layers },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/docs", label: "Docs", icon: BookOpen, highlight: true },
];

export function Header() {
  const pathname = usePathname();
  const { address, isConnected, connect, disconnect } = useWallet();

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <span className="text-black font-bold text-lg select-none">V</span>
            </div>
            <span className="font-[family-name:var(--font-playfair)] font-bold tracking-[0.2em] text-xl text-foreground group-hover:text-primary transition-colors">
              VANTAGE
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm transition-all flex items-center gap-2 rounded-full overflow-hidden group ${
                    item.highlight
                      ? isActive
                        ? "text-primary font-bold"
                        : "text-primary/80 hover:text-primary"
                      : isActive
                        ? "text-foreground font-medium bg-white/5"
                        : "text-muted hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted group-hover:text-foreground"} transition-colors`} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/40 truncate"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 mr-2">
            {isConnected && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
                  pathname === "/dashboard"
                    ? "bg-white/10 text-foreground"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            <Link
              href="/launch"
              className="flex items-center gap-2 bg-primary text-black px-4 py-2 text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            >
              <Rocket className="w-4 h-4" />
              Launch Agent
            </Link>
          </div>

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block mx-1" />

          {isConnected ? (
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/40">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground tracking-tight">
                  {truncatedAddress}
                </span>
              </div>
              <button
                onClick={disconnect}
                className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all group"
                title="Disconnect"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="group relative flex items-center gap-2 px-5 py-2 text-sm rounded-lg border border-white/10 hover:border-white/20 transition-all bg-white/5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Wallet className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              <span className="relative z-10 font-bold group-hover:text-foreground transition-colors">Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
