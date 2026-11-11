import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pink' | 'purple' | 'blue' | 'green' | 'amber' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'pink', size = 'sm' }) => {
  const variantStyles = {
    pink: 'bg-[#E90074]/15 text-[#E90074] border-[#E90074]/30',
    purple: 'bg-[#7545C8]/15 text-[#C9C3DF] border-[#7545C8]/40',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    slate: 'bg-slate-700/30 text-slate-300 border-slate-600/40',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};

