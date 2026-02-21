
import React from 'react';
import { FlightStatus } from '../types';
import { Droplet, Clock, CheckCircle2, User, PlaneLanding, ListOrdered, XCircle } from 'lucide-react';

export const STATUS_LABELS: Record<FlightStatus, string> = {
  [FlightStatus.CHEGADA]: 'CHEGADA',
  [FlightStatus.FILA]: 'FILA',
  [FlightStatus.DESIGNADO]: 'DESIGNADO',
  [FlightStatus.AGUARDANDO]: 'AGUARDANDO',
  [FlightStatus.ABASTECENDO]: 'ABASTECENDO',
  [FlightStatus.FINALIZADO]: 'FINALIZADO',
  [FlightStatus.CANCELADO]: 'CANCELADO',
};

export const StatusBadge: React.FC<{ status: FlightStatus; customLabel?: string; className?: string }> = ({ status, customLabel, className }) => {
  const styles = {
    [FlightStatus.CHEGADA]: 'text-slate-400 bg-slate-800/30 border border-slate-700',
    [FlightStatus.FILA]: 'text-amber-400 bg-amber-500/10 border border-amber-500/30',
    [FlightStatus.DESIGNADO]: 'text-indigo-400 bg-indigo-500/20 border border-indigo-500/30',
    [FlightStatus.AGUARDANDO]: 'text-orange-400 bg-orange-500/10 border border-orange-500/30',
    [FlightStatus.ABASTECENDO]: 'text-blue-400 bg-blue-500/20 border border-blue-500/30 animate-pulse',
    [FlightStatus.FINALIZADO]: 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30',
    [FlightStatus.CANCELADO]: 'text-red-400 bg-red-500/10 border border-red-500/30',
  };

  const icons = {
    [FlightStatus.CHEGADA]: <PlaneLanding size={12} className="mr-2" />,
    [FlightStatus.FILA]: <ListOrdered size={12} className="mr-2" />,
    [FlightStatus.DESIGNADO]: <User size={12} className="mr-2" />,
    [FlightStatus.AGUARDANDO]: <Clock size={12} className="mr-2" />,
    [FlightStatus.ABASTECENDO]: <Droplet size={12} className="mr-2" />,
    [FlightStatus.FINALIZADO]: <CheckCircle2 size={12} className="mr-2" />,
    [FlightStatus.CANCELADO]: <XCircle size={12} className="mr-2" />,
  };

  return (
    <div className={`flex items-center justify-center w-full h-full min-h-[28px] px-2 rounded text-[9px] font-black uppercase tracking-[0.1em] transition-colors duration-300 ${styles[status] || 'bg-slate-900 text-slate-500'} ${className}`}>
      {icons[status]}
      {customLabel || STATUS_LABELS[status]}
    </div>
  );
};

export const FuelBar: React.FC<{ value: number; status: FlightStatus }> = ({ value, status }) => {
  let color = 'bg-slate-400';
  if (status === FlightStatus.FINALIZADO) color = 'bg-emerald-500 shadow-sm';
  else if (status === FlightStatus.ABASTECENDO) color = 'bg-blue-500 shadow-sm';
  else if (status === FlightStatus.FILA) color = 'bg-amber-500 shadow-sm';
  else if (status === FlightStatus.AGUARDANDO) color = 'bg-orange-500 shadow-sm';
  else if (status === FlightStatus.CANCELADO) color = 'bg-red-500 shadow-sm';
  else color = 'bg-slate-600';

  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${color}`} 
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono font-black w-10 text-right text-slate-500`}>
        {value}%
      </span>
    </div>
  );
};
