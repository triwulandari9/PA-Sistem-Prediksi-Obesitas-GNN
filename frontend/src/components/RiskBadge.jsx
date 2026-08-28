import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export const RiskBadge = ({ risk, showIcon = true, size = 'md' }) => {
  const normalized = (risk || '').toUpperCase();

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold',
    md: 'px-3 py-1 text-sm font-semibold',
    lg: 'px-4 py-1.5 text-base font-bold'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (normalized === 'LOW' || normalized === 'RENDAH') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses[size]}`}>
        {showIcon && <ShieldCheck className={`${iconSizes[size]} text-emerald-600`} />}
        <span>Risiko Rendah</span>
      </span>
    );
  }

  if (normalized === 'MEDIUM' || normalized === 'SEDANG') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 ${sizeClasses[size]}`}>
        {showIcon && <AlertTriangle className={`${iconSizes[size]} text-amber-600`} />}
        <span>Risiko Sedang (Waspada)</span>
      </span>
    );
  }

  // High
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses[size]}`}>
      {showIcon && <AlertOctagon className={`${iconSizes[size]} text-rose-600`} />}
      <span>Risiko Tinggi</span>
    </span>
  );
};
