'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface AuroraOrb {
  id: number;
  color: string;
  size: number;
  x: string;
  y: string;
  delay: number;
  duration: number;
}

export default function AuroraBackground() {
  const orbs: AuroraOrb[] = useMemo(() => [
    {
      id: 1,
      color: 'from-indigo-500/30 via-purple-500/20 to-transparent',
      size: 600,
      x: '10%',
      y: '20%',
      delay: 0,
      duration: 25,
    },
    {
      id: 2,
      color: 'from-cyan-500/25 via-blue-500/15 to-transparent',
      size: 500,
      x: '70%',
      y: '10%',
      delay: 2,
      duration: 30,
    },
    {
      id: 3,
      color: 'from-violet-500/20 via-fuchsia-500/15 to-transparent',
      size: 450,
      x: '50%',
      y: '60%',
      delay: 4,
      duration: 28,
    },
    {
      id: 4,
      color: 'from-emerald-500/15 via-teal-500/10 to-transparent',
      size: 400,
      x: '20%',
      y: '70%',
      delay: 6,
      duration: 22,
    },
    {
      id: 5,
      color: 'from-rose-500/15 via-pink-500/10 to-transparent',
      size: 350,
      x: '80%',
      y: '80%',
      delay: 8,
      duration: 26,
    },
    {
      id: 6,
      color: 'from-amber-500/10 via-orange-500/8 to-transparent',
      size: 300,
      x: '40%',
      y: '30%',
      delay: 3,
      duration: 24,
    },
  ], []);

  return (
    <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden bg-zinc-950 pointer-events-none">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className={`absolute rounded-full bg-gradient-radial ${orb.color} aurora-glow`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 100, -50, 80, 0],
            y: [0, -80, 50, -30, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
            rotate: [0, 10, -5, 8, 0],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
      
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        animate={{
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-[90px] animate-pulse animation-delay-4000" />
    </div>
  );
}
