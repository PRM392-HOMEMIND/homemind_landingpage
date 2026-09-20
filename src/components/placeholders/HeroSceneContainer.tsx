"use client";

import { motion } from "framer-motion";

export default function HeroSceneContainer() {
  return (
    <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-video rounded-3xl overflow-hidden glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-center group">
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-[80px] group-hover:scale-110 transition-transform duration-1000 ease-out" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-[80px] group-hover:scale-110 transition-transform duration-1000 ease-out" />

      {/* Grid Pattern backdrop */}
      <div className="absolute inset-0 grid-bg opacity-30 group-hover:opacity-40 transition-opacity duration-500" />

      {/* Abstract 3D geometric visualizer (CSS/Framer motion powered) */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_35px_rgba(99,102,241,0.5)] flex items-center justify-center mb-6"
        >
          {/* Isometric box wireframe svg */}
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </motion.div>
        
        <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Interactive 3D Sandbox</h3>
        <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
          Pre-scaffolded placeholder. R3F canvas bindings configured. Mount your 3D OrbitControls and custom models here.
        </p>

        <span className="mt-4 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-[9px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">
          Canvas Node Enabled
        </span>
      </div>

      {/* Futuristic borders */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-purple-500/40 to-transparent" />
    </div>
  );
}
