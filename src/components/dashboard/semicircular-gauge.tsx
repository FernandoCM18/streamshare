"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from "motion/react";

interface SemicircularGaugeProps {
  collectedAmount: number;
  totalAmount: number;
  remainingAmount: number;
}

export function SemicircularGauge({
  collectedAmount,
  totalAmount,
  remainingAmount,
}: SemicircularGaugeProps) {
  const normalizedCollected = Math.max(0, collectedAmount);
  const normalizedTotal = Math.max(0, totalAmount);
  const normalizedRemaining = Math.max(0, remainingAmount);
  const percent =
    normalizedTotal > 0
      ? Math.min(100, (normalizedCollected / normalizedTotal) * 100)
      : 0;
  const hasDecimals = Math.abs(normalizedRemaining % 1) > Number.EPSILON;

  // Animated remaining amount
  const motionRemaining = useMotionValue(0);
  const springRemaining = useSpring(motionRemaining, {
    stiffness: 100,
    damping: 30,
  });
  const displayRemaining = useTransform(springRemaining, (v) => {
    const hasD = Math.abs(v % 1) > Number.EPSILON;
    return `$${new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: hasD ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(v)}`;
  });

  useEffect(() => {
    motionRemaining.set(normalizedRemaining);
  }, [normalizedRemaining, motionRemaining]);

  // SVG arc calculations
  const cx = 100;
  const cy = 100;
  const r = 80;
  const strokeWidth = 12;

  // Semicircle from 180° to 0° (left to right)
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;
  const progressAngle = startAngle - (percent / 100) * totalArc;

  // Background arc (full semicircle)
  const bgX1 = cx + r * Math.cos(startAngle);
  const bgY1 = cy - r * Math.sin(startAngle);
  const bgX2 = cx + r * Math.cos(endAngle);
  const bgY2 = cy - r * Math.sin(endAngle);

  const bgPath = `M ${bgX1} ${bgY1} A ${r} ${r} 0 0 1 ${bgX2} ${bgY2}`;

  // Progress arc
  const progX1 = cx + r * Math.cos(startAngle);
  const progY1 = cy - r * Math.sin(startAngle);
  const progX2 = cx + r * Math.cos(progressAngle);
  const progY2 = cy - r * Math.sin(progressAngle);
  const largeArcFlag = 0;

  const progPath =
    percent > 0
      ? `M ${progX1} ${progY1} A ${r} ${r} 0 ${largeArcFlag} 1 ${progX2} ${progY2}`
      : "";

  return (
    <svg viewBox="0 0 200 120" className="w-full overflow-visible">
      <defs>
        <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {/* Background arc */}
      <path
        d={bgPath}
        fill="none"
        stroke="#262626"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Progress arc — animated with pathLength */}
      {percent > 0 && (
        <motion.path
          d={progPath}
          fill="none"
          stroke="url(#emeraldGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="gauge-glow"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1,
            ease: "easeOut",
            delay: 0.3,
          }}
        />
      )}

      {/* Center remaining amount text — animated count */}
      <motion.text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        className="fill-white text-2xl font-semibold"
        fontSize="24"
        fontWeight="600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {displayRemaining}
      </motion.text>
      <motion.text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        className="fill-white/50"
        fontSize="10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        PENDIENTE
      </motion.text>
    </svg>
  );
}
