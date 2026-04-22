"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function HeroClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Premium charcoal/graphite palette chars
    const chars = " .:-=+*#%@";
    const fontSize = 12;

    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(W / (fontSize * 0.6));
      rows = Math.floor(H / fontSize);
    }

    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let animId: number;

    function draw() {
      // Very slight trail effect or clear
      ctx!.clearRect(0, 0, W, H);
      ctx!.font = `bold ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cx = x / cols - 0.5;
          const cy = y / rows - 0.5;
          const dist = Math.sqrt(cx * cx + cy * cy);
          
          // Smoother, deeper waves
          const wave = Math.sin(dist * 8 - frame * 0.02) * 0.5 + 0.5;
          const noise =
            Math.sin(x * 0.2 + frame * 0.01) *
            Math.cos(y * 0.2 + frame * 0.015);
          
          const val = wave * 0.8 + noise * 0.2;
          const charIdx = Math.floor(
            Math.max(0, Math.min(1, val)) * (chars.length - 1)
          );

          // Vivid Emerald/Primary accents in wave peaks
          const alpha = 0.05 + val * 0.15;
          const isPeak = wave > 0.8;
          
          if (isPeak) {
            ctx!.fillStyle = `rgba(16, 185, 129, ${alpha * 1.5})`;
          } else {
            ctx!.fillStyle = `rgba(100, 116, 139, ${alpha})`; // Slate 500
          }
          
          ctx!.fillText(chars[charIdx], x * fontSize * 0.6, y * fontSize + fontSize);
        }
      }
      frame++;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, ease: "easeOut" }}
      className="absolute inset-0 z-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-40 pointer-events-none"
      />
      {/* Radial fade to hide edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none" />
    </motion.div>
  );
}
