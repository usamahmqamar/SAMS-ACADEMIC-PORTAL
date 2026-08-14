import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      accent: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      accent: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      accent: 'bg-amber-500',
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-950',
      icon: <Info className="w-5 h-5 text-indigo-600 shrink-0" />,
      accent: 'bg-indigo-500',
    },
  }[type];

  return (
    <div id="toast-notification-root" className="fixed bottom-6 right-6 z-50 pointer-events-none max-w-sm w-full sm:w-auto">
      <motion.div
        layout
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${config.bg} relative overflow-hidden`}
      >
        {config.icon}
        <div className="flex-1 mr-4">
          <p className="text-xs font-bold leading-normal font-sans pr-2 whitespace-pre-line">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100/50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        {/* Progress bar line representing duration */}
        <motion.div 
          className={`absolute bottom-0 left-0 right-0 h-1 ${config.accent}`}
          initial={{ width: '100%' }}
          animate={{ width: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
}
