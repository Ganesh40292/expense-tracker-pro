import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiTrendingUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function HealthScoreGauge({ healthScore }) {
  const score = healthScore?.score || 70;
  const savingsRate = healthScore?.savingsRate || 0;
  const discipline = healthScore?.discipline || 'GOOD';
  const explanations = healthScore?.explanations || [];
  const suggestions = healthScore?.suggestions || [];

  // Gauge calculation (semi-circle 180 degrees)
  const angle = Math.min(Math.max((score / 100) * 180 - 90, -90), 90);

  const getScoreColor = (val) => {
    if (val >= 80) return '#10b981'; // Emerald Green
    if (val >= 50) return '#f59e0b'; // Amber Yellow
    return '#ef4444'; // Rose Red
  };

  const scoreColor = getScoreColor(score);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-8">
      {/* Semi-circle SVG Speed Gauge */}
      <div className="relative flex flex-col items-center justify-center shrink-0 w-56 h-36">
        <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 110">
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Active Color Arc */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={scoreColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="251.2"
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 - (251.2 * score) / 100 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${scoreColor}80)` }}
          />
          {/* Dial Needle */}
          <g transform={`rotate(${angle} 100 100)`}>
            <polygon points="97,100 103,100 100,25" fill="#f8fafc" />
            <circle cx="100" cy="100" r="8" fill={scoreColor} />
          </g>
        </svg>

        {/* Center Score Text */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <motion.span
            className="text-4xl font-extrabold text-white tracking-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {score}
          </motion.span>
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
            Health Score / 100
          </span>
        </div>
      </div>

      {/* Details & Insights */}
      <div className="flex-1 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiShield className="w-5 h-5" style={{ color: scoreColor }} />
            <h3 className="text-base font-semibold text-slate-100">Financial Wellness Index</h3>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: `${scoreColor}20`,
              color: scoreColor,
              border: `1px solid ${scoreColor}40`,
            }}
          >
            {discipline.replace('_', ' ')}
          </span>
        </div>

        {/* Savings Rate Pill */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5">
          <FiTrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300">
            Monthly Savings Rate: <strong className="text-white font-bold">{savingsRate}%</strong>
          </span>
        </div>

        {/* Explanations list */}
        <div className="space-y-1.5 text-xs text-slate-300">
          {explanations.slice(0, 2).map((exp, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{exp}</span>
            </div>
          ))}
          {suggestions.slice(0, 1).map((sug, idx) => (
            <div key={idx} className="flex items-start gap-2 text-amber-300">
              <FiAlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{sug}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
