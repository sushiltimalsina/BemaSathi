import React, { useEffect } from 'react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'error' // error, success, info, warning
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeConfig = {
    error: {
      icon: <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />,
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      btn: 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
    },
    success: {
      icon: <CheckCircleIcon className="w-8 h-8 text-green-500" />,
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      btn: 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
    },
    warning: {
      icon: <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
    },
    info: {
      icon: <InformationCircleIcon className="w-8 h-8 text-blue-500" />,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      btn: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className="
          relative w-full max-w-sm overflow-hidden
          bg-slate-900 border border-slate-800 rounded-[2rem]
          shadow-2xl shadow-black/50 transform transition-all
          animate-in zoom-in-95 duration-300
        "
      >
        {/* Top Glow */}
        <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent`} />

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            {/* Icon Circle */}
            <div className={`
              mb-6 p-4 rounded-full
              ${config.bg} ${config.border} border
            `}>
              {config.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-black text-slate-100 italic mb-2 tracking-tight">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-slate-400 font-medium leading-relaxed px-2">
              {message}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-8">
            <button
              onClick={onClose}
              className={`
                w-full py-4 rounded-2xl font-black text-sm text-white
                ${config.btn} shadow-lg transition-all active:scale-95
              `}
            >
              OK
            </button>
          </div>
        </div>

        {/* Close Interaction */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Modal;
