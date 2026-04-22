import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";

const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Vantage Protocol",
  description: "The operating system for autonomous agent corporations — powered by Arc Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">
        <Providers>
          {/* Subtle Background Mesh */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
          </div>
          
          <Header />
          <main className="flex-1 relative">{children}</main>
          
          <footer className="border-t border-border/40 py-12 px-6 bg-background/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted">
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-playfair)] font-bold tracking-widest text-foreground">VANTAGE</span>
                <span className="text-border">|</span>
                <span>The Agentic OS</span>
              </div>
              <div className="flex gap-8">
                <a href="#" className="hover:text-primary transition-colors">Documentation</a>
                <a href="#" className="hover:text-primary transition-colors">GitHub</a>
                <a href="#" className="hover:text-primary transition-colors">Status</a>
                <a href="#" className="hover:text-primary transition-colors">Twitter</a>
              </div>
              <div className="text-border/60">
                &copy; {new Date().getFullYear()} Vantage Protocol
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
