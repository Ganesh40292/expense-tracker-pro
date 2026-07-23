import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiCheckCircle, FiRepeat } from 'react-icons/fi';
import { useCurrency } from '../../context/CurrencyContext';

export default function BillCalendar({ recurringExpenses = [] }) {
  const { formatCurrency } = useCurrency();

  const activeBills = recurringExpenses.filter(
    (item) => item.status === 'ACTIVE' || !item.status
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FiCalendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Recurring Bills & Subscriptions</h3>
            <p className="text-xs text-slate-400">Upcoming automated payment timeline</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-500/30">
          {activeBills.length} Active
        </span>
      </div>

      {activeBills.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
          No upcoming recurring bills configured.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeBills.map((bill, index) => {
            const dueDate = bill.nextRunDate || bill.startDate || 'Upcoming';
            return (
              <motion.div
                key={bill.id || index}
                whileHover={{ y: -2 }}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 transition-all shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                    {bill.title || bill.merchantName || 'Recurring Bill'}
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    {formatCurrency(bill.amount || 0, bill.currency || 'INR')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                  <span className="flex items-center gap-1">
                    <FiRepeat className="w-3 h-3 text-cyan-400" />
                    {bill.interval || 'MONTHLY'}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-300">
                    <FiClock className="w-3 h-3 text-amber-400" />
                    {dueDate}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
