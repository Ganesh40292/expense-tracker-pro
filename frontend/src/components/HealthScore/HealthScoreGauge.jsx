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
    <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))', border: `1px solid ${scoreColor}35`, boxShadow: `0 8px 32px ${scoreColor}15` }}>
      {/* Background Accent Glow */}
      <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: scoreColor }} />

      {/* Semi-circle SVG Speed Gauge */}
      <div className="relative flex flex-col items-center justify-center shrink-0 w-56 h-36">
        <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 110">
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
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
            style={{ filter: `drop-shadow(0 0 12px ${scoreColor})` }}
          />
          {/* Dial Needle */}
          <g transform={`rotate(${angle} 100 100)`}>
            <polygon points="97,100 103,100 100,25" fill="#f8fafc" />
            <circle cx="100" cy="100" r="8" fill={scoreColor} style={{ filter: `drop-shadow(0 0 8px ${scoreColor})` }} />
          </g>
        </svg>

        {/* Center Score Text */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <motion.span
            className="text-4xl font-black text-white tracking-tight drop-shadow-md"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            Health Index / 100
          </span>
        </div>
      </div>

      {/* Details & Insights */}
      <div className="flex-1 space-y-3.5 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg" style={{ background: `${scoreColor}20`, border: `1px solid ${scoreColor}40` }}>
              <FiShield className="w-5 h-5" style={{ color: scoreColor }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 tracking-tight">Financial Wellness Index</h3>
              <p className="text-[11px] text-slate-400">Algorithmic solvency & savings diagnostic</p>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm"
            style={{
              backgroundColor: `${scoreColor}20`,
              color: scoreColor,
              border: `1px solid ${scoreColor}50`,
            }}
          >
            {discipline.replace('_', ' ')}
          </span>
        </div>

        {/* Savings Rate Pill */}
        <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <FiTrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300">
              Monthly Savings Ratio
            </span>
          </div>
          <strong className="text-white font-extrabold text-sm">{savingsRate}%</strong>
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
