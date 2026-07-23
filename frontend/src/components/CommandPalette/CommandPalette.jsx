import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiHome, FiCreditCard, FiPieChart, FiCpu,
  FiFileText, FiRepeat, FiUser, FiSettings, FiPlusCircle,
  FiDownload, FiX, FiCommand
} from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';

export default function CommandPalette({ isOpen, onClose, onOpenTransactionModal }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose ? onClose(!isOpen) : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const COMMANDS = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: FiHome, category: 'Navigation', action: () => navigate('/dashboard') },
    { id: 'nav-transactions', label: 'Go to Transactions', icon: FiCreditCard, category: 'Navigation', action: () => navigate('/transactions') },
    { id: 'nav-reports', label: 'Go to Reports & Summary', icon: FiPieChart, category: 'Navigation', action: () => navigate('/reports') },
    { id: 'nav-ai', label: 'Go to AI Intelligence Hub', icon: FiCpu, category: 'Navigation', action: () => navigate('/ai-intelligence') },
    { id: 'nav-receipts', label: 'Go to Receipt OCR Scanner', icon: FiFileText, category: 'Navigation', action: () => navigate('/receipts') },
    { id: 'nav-recurring', label: 'Go to Recurring Expenses', icon: FiRepeat, category: 'Navigation', action: () => navigate('/recurring') },
    { id: 'nav-profile', label: 'Go to Profile', icon: FiUser, category: 'Navigation', action: () => navigate('/profile') },
    { id: 'nav-settings', label: 'Go to Settings', icon: FiSettings, category: 'Navigation', action: () => navigate('/settings') },
    {
      id: 'action-add',
      label: 'Add New Transaction',
      icon: FiPlusCircle,
      category: 'Actions',
      action: () => {
        onClose(false);
        if (onOpenTransactionModal) onOpenTransactionModal();
        else navigate('/transactions');
      }
    },
    {
      id: 'action-export',
      label: 'Export Transactions as CSV',
      icon: FiDownload,
      category: 'Actions',
      action: () => {
        onClose(false);
        window.open('/api/transactions/export/csv', '_blank');
        showToast('Exporting CSV file...', 'info');
      }
    }
  ];

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (cmd) => {
    cmd.action();
    onClose(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-slate-900/90 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Header Input */}
          <div className="relative flex items-center px-4 border-b border-slate-800">
            <FiSearch className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search page... (e.g. Transactions, Export)"
              className="w-full bg-transparent px-3 py-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
              autoFocus
            />
            <div className="flex items-center gap-1 bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-md font-mono">
              <span>ESC</span>
            </div>
            <button
              onClick={() => onClose(false)}
              className="ml-2 text-slate-400 hover:text-white p-1"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Command List */}
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No matching commands found.
              </div>
            ) : (
              filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200 group-hover:text-cyan-300">
                          {cmd.label}
                        </div>
                        <div className="text-[11px] text-slate-500">{cmd.category}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-cyan-400 font-mono">
                      ↵ Select
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Status */}
          <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <FiCommand className="w-3.5 h-3.5 text-cyan-400" />
              <span>Command Palette</span>
            </div>
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Ctrl + K</kbd> anytime</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
