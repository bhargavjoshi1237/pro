'use client';

import { motion } from 'framer-motion';

/**
 * Modern Animated Background Component
 * Sleek animated gradient background with floating orbs and geometric patterns
 * Maintains black & white theme with smooth, sophisticated animations
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Enhanced base gradient with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0a0a] dark:via-[#1c1c1c] dark:to-[#0f0f0f]" />
      
      {/* Radial gradient overlay for depth - Enhanced */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-purple-50/20 to-transparent dark:from-blue-900/20 dark:via-purple-900/10 dark:to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-100/30 via-rose-50/15 to-transparent dark:from-pink-900/15 dark:via-rose-900/8 dark:to-transparent" />
      
      {/* Large animated orbs - Primary - Much more visible */}
      <motion.div
        className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/60 via-purple-200/50 to-pink-200/40 dark:from-blue-500/20 dark:via-purple-500/15 dark:to-pink-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 150, 0],
          y: [0, 100, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Medium animated orbs - Secondary - More vibrant */}
      <motion.div
        className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-gradient-to-bl from-purple-200/50 via-indigo-200/40 to-blue-200/30 dark:from-purple-500/15 dark:via-indigo-500/12 dark:to-blue-500/8 rounded-full blur-3xl"
        animate={{
          x: [0, -120, 0],
          y: [0, 120, 0],
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      {/* Small animated orbs - Accent - Enhanced visibility */}
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-gradient-to-tr from-pink-200/55 via-rose-200/45 to-orange-200/35 dark:from-pink-500/18 dark:via-rose-500/14 dark:to-orange-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.25, 1],
          rotate: [0, 45, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Additional floating orb - More prominent */}
      <motion.div
        className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-indigo-200/45 via-violet-200/35 to-purple-200/25 dark:from-indigo-500/14 dark:via-violet-500/10 dark:to-purple-500/7 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0],
          scale: [1, 1.15, 1],
          rotate: [0, -45, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
      />

      {/* Center accent orb */}
      <motion.div
        className="absolute top-1/3 left-1/2 w-[350px] h-[350px] bg-gradient-to-br from-cyan-200/40 via-blue-200/30 to-indigo-200/20 dark:from-cyan-500/12 dark:via-blue-500/9 dark:to-indigo-500/6 rounded-full blur-3xl"
        animate={{
          x: [0, 60, 0],
          y: [0, -60, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 180, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
      />

      {/* Animated geometric lines - More visible */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[700px] h-[700px] -translate-x-1/2 -translate-y-1/2"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="absolute inset-0 border border-gray-300/20 dark:border-white/10 rounded-full" />
        <div className="absolute inset-12 border border-gray-300/15 dark:border-white/8 rounded-full" />
        <div className="absolute inset-24 border border-gray-300/10 dark:border-white/6 rounded-full" />
      </motion.div>

      {/* Subtle grid pattern with animation - More visible */}
      <motion.div 
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '100px 100px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Diagonal lines pattern - More visible */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 80px,
            currentColor 80px,
            currentColor 81px
          )`,
        }}
      />
      
      {/* Enhanced noise texture overlay - More visible */}
      <div 
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect for focus - Lighter */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />
    </div>
  );
}
