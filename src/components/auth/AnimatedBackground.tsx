"use client";

import { motion } from "framer-motion";

interface AnimatedBackgroundProps {
  palette?: "emerald" | "indigo";
}

export function AnimatedBackground({ palette = "emerald" }: AnimatedBackgroundProps) {
  const isIndigo = palette === "indigo";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} 
      />

      {/* Radial Gradient Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
          opacity: isIndigo ? [0.15, 0.32, 0.15] : [0.15, 0.28, 0.15],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[120px] ${
          isIndigo ? "bg-indigo-500/25" : "bg-emerald-500/20"
        }`}
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -60, 0],
          y: [0, -40, 0],
          opacity: isIndigo ? [0.15, 0.3, 0.15] : [0.12, 0.25, 0.12],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className={`absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] ${
          isIndigo ? "bg-violet-500/25" : "bg-teal-500/20"
        }`}
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: isIndigo ? [0.1, 0.22, 0.1] : [0.08, 0.18, 0.08],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] ${
          isIndigo ? "bg-purple-600/15" : "bg-emerald-600/10"
        }`}
      />

      {/* Floating Ambient Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1.5 h-1.5 rounded-full ${
            isIndigo ? "bg-indigo-400/50" : "bg-emerald-400/40"
          }`}
          style={{
            top: `${15 + i * 14}%`,
            left: `${10 + (i * 17) % 80}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 15, -10],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7,
          }}
        />
      ))}
    </div>
  );
}
