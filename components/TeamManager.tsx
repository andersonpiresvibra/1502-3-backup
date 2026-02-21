
import React, { useState, useMemo } from 'react';
import { 
    Search, ArrowLeft, Plane, MapPin, 
    Activity, Radar, User, ChevronRight, Droplet, Users, Truck, Zap
} from 'lucide-react';
import { MOCK_TEAM_PROFILES, MOCK_FLIGHTS } from '../data/mockData';
import { OperatorProfile, ShiftCycle, OperatorCategory, FlightData } from '../types';

export const TeamManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'GRID' | 'DETAIL'>('GRID');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [activeShift, setActiveShift] = useState<ShiftCycle>('MANHÃ');
  const [activeCategory, setActiveCategory] = useState<OperatorCategory>('AERODROMO');
  const [searchTerm, setSearchTerm] = useState('');

  const teamMembers = useMemo(() => {
    return MOCK_TEAM_PROFILES.map(p => {
      // Correção do Mapa de Frotas para refletir a realidade SRV x CTA
      const fleetMap: Record<string, string> = {
        'Horácio': 'SRV-2125',
        'Carlos': 'SRV-2144',
        'Betão': 'CTA-1405',
        'Bruno': 'SRV-2160',
        'Marcelo': 'SRV-2177',
        'André': 'SRV-2177',
        'Thiago': 'CTA-1437',
        'Felipe': 'SRV-2113',
        'Rodrigo': 'SRV-2130',
        'Gabriel': 'SRV-2145',
        'Lucas': 'CTA-1425',
        'Mariana': 'CTA-1426',
        'Rafael': 'CTA-1428',
        'Beatriz': 'CTA-1439',
        'Juliano': 'CTA-1499',
        'Ricardo': 'SRV-2140' // SRV VW para Widebody
      };

      return {
        ...p,
        assignedVehicle: fleetMap[p.warName] || (p.category === 'AERODROMO' ? 'SRV-0000' : 'CTA-0000'),
      };
    });
  }, []);

  const getActiveMission = (warName: string): FlightData | undefined => {
    return MOCK_FLIGHTS.find(f => f.operator?.toLowerCase() === warName.toLowerCase());
  };

  // Cálculo de estatísticas globais do turno para o HUD
  const teamStats = useMemo(() => {
    const shiftOperators = teamMembers.filter(op => op.shift.cycle === activeShift);
    
    return {
      patio: shiftOperators.filter(op => op.category === 'AERODROMO').length,
      vip: shiftOperators.filter(op => op.category === 'VIP').length,
      ilha: shiftOperators.filter(op => op.category === 'ILHA').length,
      disponivel: shiftOperators.filter(op => op.status === 'DISPONÍVEL' && !getActiveMission(op.warName)).length,
      enchendo: shiftOperators.filter(op => op.status === 'ENCHIMENTO').length,
      designado: shiftOperators.filter(op => !!getActiveMission(op.warName) || op.status === 'OCUPADO').length,
      total: shiftOperators.length
    };
  }, [teamMembers, activeShift]);

  const filteredTeam = useMemo(() => {
    const baseList = teamMembers.filter(op => 
      op.shift.cycle === activeShift &&
      op.category === activeCategory &&
      (op.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.warName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return [...baseList].sort((a, b) => {
      const missionA = getActiveMission(a.warName);
      const missionB = getActiveMission(b.warName);
      const isAvailA = a.status === 'DISPONÍVEL' && !missionA;
      const isAvailB = b.status === 'DISPONÍVEL' && !missionB;

      if (isAvailA && !isAvailB) return -1;
      if (!isAvailA && isAvailB) return 1;
      return 0;
    });
  }, [teamMembers, activeShift, activeCategory, searchTerm]);

  const selectedOperator = useMemo(() => 
    teamMembers.find(op => op.id === selectedOperatorId),
    [teamMembers, selectedOperatorId]
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#050a10] overflow-hidden font-sans">
        
        {/* TOP HUD NAV */}
        <div className="h-16 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between px-8 shrink-0 z-30">
            <div className="flex items-center gap-6">
                {viewMode === 'DETAIL' && (
                    <button onClick={() => setViewMode('GRID')} className="p-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl hover:text-white transition-all"><ArrowLeft size={18} /></button>
                )}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
                    {['AERODROMO', 'VIP', 'ILHA'].map((cat) => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat as OperatorCategory)} 
                            className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                                activeCategory === cat ? 'bg-emerald-500 text-slate-950 shadow-neon' : 'text-slate-600 hover:text-slate-400'
                            }`}
                        >
                            {cat === 'AERODROMO' ? 'PÁTIO' : cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" />
                    <input 
                        type="text" 
                        placeholder="PESQUISAR..." 
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-[11px] text-white outline-none focus:border-emerald-500/50 w-56 font-bold tracking-widest transition-all" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 shadow-sm">
                    {(['MANHÃ', 'TARDE', 'NOITE'] as ShiftCycle[]).map(cycle => (
                        <button 
                            key={cycle} 
                            onClick={() => setActiveShift(cycle)} 
                            className={`px-4 py-2 rounded-md text-[9px] font-black tracking-widest transition-all ${
                                activeShift === cycle ? 'bg-slate-800 text-emerald-400 border border-emerald-500/10' : 'text-slate-700 hover:text-slate-500'
                            }`}
                        >
                            {cycle}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* TEAM TELEMETRY BAR */}
        <div className="bg-[#050a10] border-b border-slate-800/40 px-8 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-10">
                {/* Localização */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Pátio</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white font-mono">{teamStats.patio}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Vip</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white font-mono">{teamStats.vip}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Ilha</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white font-mono">{teamStats.ilha}</span>
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-800"></div>

                {/* Status Operacional */}
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                        <div className="text-center">
                            <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest block mb-0.5">Disponíveis</span>
                            <span className="text-lg font-black text-emerald-500 font-mono leading-none">{teamStats.disponivel}</span>
                        </div>
                        <Users size={16} className="text-emerald-500 opacity-30" />
                    </div>
                    <div className="flex items-center gap-3 bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10">
                        <div className="text-center">
                            <span className="text-[8px] font-black text-blue-400/60 uppercase tracking-widest block mb-0.5">Enchendo</span>
                            <span className="text-lg font-black text-blue-400 font-mono leading-none">{teamStats.enchendo}</span>
                        </div>
                        <Droplet size={16} className="text-blue-400 opacity-30" />
                    </div>
                    <div className="flex items-center gap-3 bg-amber-400/5 px-4 py-2 rounded-xl border border-amber-400/10">
                        <div className="text-center">
                            <span className="text-[8px] font-black text-amber-400/60 uppercase tracking-widest block mb-0.5">Designados</span>
                            <span className="text-lg font-black text-amber-400 font-mono leading-none">{teamStats.designado}</span>
                        </div>
                        <Truck size={16} className="text-amber-400 opacity-30" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Turno Ativo</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 font-mono">{activeShift}</span>
                    <Zap size={12} className="text-emerald-500 animate-pulse" />
                </div>
            </div>
        </div>

        {/* OPERATIONAL GRID - DISPONÍVEIS NO TOPO */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {viewMode === 'GRID' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {filteredTeam.map(op => {
                        const mission = getActiveMission(op.warName);
                        const flightsToday = Math.floor(op.stats.flightsWeekly / 6) + (mission ? 1 : 0);
                        const isAvailable = op.status === 'DISPONÍVEL' && !mission;
                        const isRefilling = op.status === 'ENCHIMENTO';
                        const isBusy = (!!mission || op.status === 'OCUPADO') && !isRefilling;
                        
                        return (
                            <button 
                                key={op.id}
                                onClick={() => { setSelectedOperatorId(op.id); setViewMode('DETAIL'); }}
                                className={`group relative flex items-stretch h-[90px] rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] shadow-2xl overflow-hidden ${
                                    isAvailable 
                                        ? 'bg-emerald-500 text-slate-950 border-emerald-500' 
                                        : isRefilling
                                            ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-[0_10px_25px_rgba(59,130,246,0.3)]'
                                            : isBusy 
                                                ? 'bg-amber-400 text-slate-950 shadow-[0_10px_25px_rgba(251,191,36,0.3)] border-amber-500'
                                                : 'bg-[#0a0f1d] text-white border-slate-800'
                                }`}
                            >
                                {/* Foto/Ícone do Operador */}
                                <div className="w-20 shrink-0 border-r border-slate-950/10 overflow-hidden relative flex items-center justify-center bg-slate-950/10">
                                    {op.photoUrl ? (
                                        <img src={op.photoUrl} alt={op.warName} className={`w-full h-full object-cover transition-all ${isAvailable || isBusy || isRefilling ? '' : 'grayscale'}`} />
                                    ) : (
                                        <User size={42} className={`opacity-25 ${isAvailable || isBusy || isRefilling ? 'text-slate-950' : 'text-slate-400'}`} />
                                    )}
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 flex flex-col justify-center p-3 pl-4 min-w-0 text-left relative">
                                    
                                    {/* HUD SUPERIOR DIREITO: FROTA + CONTADOR */}
                                    <div className="absolute top-2 right-2 flex items-center gap-2">
                                        {op.assignedVehicle && (
                                            <span className={`text-xl font-mono font-black ${isAvailable || isBusy || isRefilling ? 'text-slate-950/60' : 'text-emerald-500/60'}`}>
                                                {op.assignedVehicle.replace('SRV-', '').replace('CTA-', '')}
                                            </span>
                                        )}
                                        <div className={`flex items-center justify-center w-7 h-7 rounded-lg font-mono font-black text-sm border shadow-sm ${
                                            isAvailable || isBusy || isRefilling
                                                ? 'bg-slate-950 text-white border-slate-900' 
                                                : 'bg-slate-950 text-emerald-500 border-emerald-500/20 shadow-neon'
                                        }`}>
                                            {flightsToday}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start mb-1 pr-16">
                                        <h3 className="font-black tracking-tighter uppercase leading-none truncate w-full text-xl">
                                            {op.warName}
                                        </h3>
                                        <span className={`text-[7px] font-black uppercase tracking-[0.3em] opacity-40 mt-1 ${isAvailable || isBusy || isRefilling ? 'text-slate-950' : 'text-slate-500'}`}>
                                            {op.category}
                                        </span>
                                    </div>

                                    {/* Telemetria de Solo */}
                                    <div className="flex flex-col gap-0.5">
                                        {mission ? (
                                            <div className="flex items-center gap-1.5 font-mono text-base font-black tracking-tighter truncate">
                                                <span className="opacity-70">{mission.destination}</span>
                                                <span className="opacity-20">/</span>
                                                <span>{mission.registration}</span>
                                                <span className="opacity-20">/</span>
                                                <span className="bg-slate-950/10 px-1.5 rounded-md">{mission.positionId}</span>
                                            </div>
                                        ) : (
                                            <div className={`flex items-center gap-1.5 font-mono font-black tracking-tight ${isAvailable || isRefilling ? 'text-sm' : 'text-xs'}`}>
                                                {isRefilling ? <Droplet size={14} className="shrink-0 opacity-60 animate-pulse" /> : <MapPin size={isAvailable ? 12 : 10} className="shrink-0 opacity-40" />}
                                                <span className="truncate uppercase opacity-60">{op.lastPosition || 'PÁTIO'}</span>
                                                <span className={`px-1.5 rounded-[4px] font-black uppercase border ${
                                                    isAvailable 
                                                        ? 'bg-slate-950 text-emerald-400 border-slate-950/5 text-[10px]' 
                                                        : isRefilling
                                                            ? 'bg-slate-950 text-blue-400 border-slate-950/5 text-[10px]'
                                                            : 'bg-slate-800 text-slate-500 border-slate-800 text-[7px]'
                                                }`}>
                                                    {isAvailable ? 'DISPONÍVEL' : isRefilling ? 'ENCHIMENTO' : op.status === 'OCUPADO' ? 'OCUPADO' : 'STDBY'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Decorativo Dinâmico de Avião */}
                                {mission && (
                                    <div className="absolute bottom-[-15px] right-[-15px] opacity-10 pointer-events-none rotate-12 scale-75">
                                        <Plane size={80} className="text-slate-950" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    {selectedOperator && (
                        <div className="max-w-5xl mx-auto py-6">
                            <div className="bg-[#0a0f1d] border-2 border-emerald-500 rounded-[40px] p-12 flex items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent"></div>
                                
                                <div className="flex items-center gap-12 relative z-10">
                                    <div className="w-36 h-36 rounded-[32px] overflow-hidden border-2 border-emerald-500/30 shadow-neon-strong bg-slate-900 flex items-center justify-center">
                                        {selectedOperator.photoUrl ? (
                                            <img src={selectedOperator.photoUrl} alt={selectedOperator.warName} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={80} className="text-emerald-500 opacity-40" />
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <h1 className="text-7xl font-black text-white tracking-tighter uppercase leading-none">
                                                {selectedOperator.warName}
                                            </h1>
                                            <div className="px-5 py-2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl shadow-neon">
                                                {selectedOperator.status}
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest opacity-80">{selectedOperator.fullName}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-950 border border-slate-800 p-10 rounded-[40px] text-right z-10 shadow-inner">
                                    <span className="text-[10px] font-black text-slate-600 uppercase block mb-3 tracking-[0.4em]">FROTA_ATIVA</span>
                                    <span className="text-5xl font-black font-mono text-white leading-none tracking-tighter">
                                        {selectedOperator.assignedVehicle || 'PÁTIO'}
                                    </span>
                                    <div className="flex items-center justify-end gap-2 mt-4 text-[9px] text-emerald-500 font-bold uppercase tracking-widest">
                                        <Activity size={10} className="animate-pulse" /> Sincronizado
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-5 mt-8">
                                {[
                                    { label: 'Voos Mensais', value: selectedOperator.stats.flightsMonthly, icon: Activity, color: 'text-indigo-400' },
                                    { label: 'Posição', value: selectedOperator.lastPosition || '---', icon: MapPin, color: 'text-emerald-400' },
                                    { label: 'Volume Total', value: `${(selectedOperator.stats.volumeMonthly / 1000).toFixed(0)}K L`, icon: Plane, color: 'text-blue-400' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[#0a0f1d] border-2 border-slate-800/80 rounded-[32px] p-8 flex items-center justify-between hover:border-slate-700 transition-all group/stat">
                                        <div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                            <div className="text-4xl font-black text-white mt-2 font-mono uppercase tracking-tighter group-hover/stat:text-emerald-500 transition-colors">{stat.value}</div>
                                        </div>
                                        <stat.icon size={36} className={`${stat.color} opacity-20 group-hover/stat:opacity-40 transition-opacity`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
