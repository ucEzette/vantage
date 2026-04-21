import type { Metadata } from "next";
import { Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";

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
    <html lang="en" className={`${mono.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-mono">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-8 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted">
              <span>Vantage Protocol</span>
              <div className="flex gap-6">
                <a href="#" className="hover:text-foreground transition-colors">Docs</a>
                <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
                <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
