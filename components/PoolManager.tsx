
import React, { useState, useEffect, useMemo } from 'react';
import { TankData, PumpData } from '../types';
import { MOCK_FLIGHTS } from '../data/mockData';
import { analyzePoolInventory } from '../services/geminiService';
import { 
    Database, Activity, Zap, Droplet, Thermometer, 
    ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, 
    AlertTriangle, ShieldCheck, Waves, Settings, Info,
    ChevronRight, Gauge, Filter
} from 'lucide-react';

const MOCK_TANKS: TankData[] = [
    { id: 'TK-01', capacity: 10000, currentLevel: 8200, temperature: 24.2, density: 0.801, status: 'ATIVO' },
    { id: 'TK-02', capacity: 10000, currentLevel: 4500, temperature: 24.5, density: 0.802, status: 'ATIVO' },
    { id: 'TK-03', capacity: 15000, currentLevel: 14200, temperature: 23.8, density: 0.799, status: 'RECEBENDO' },
    { id: 'TK-04', capacity: 15000, currentLevel: 2100, temperature: 25.1, density: 0.805, status: 'DRENAGEM' },
];

const MOCK_PUMPS: PumpData[] = [
    { id: 'MB-01', status: 'RUNNING', rpm: 1750, pressure: 148, flow: 4200 },
    { id: 'MB-02', status: 'RUNNING', rpm: 1745, pressure: 147, flow: 4150 },
    { id: 'MB-03', status: 'STANDBY', rpm: 0, pressure: 0, flow: 0 },
    { id: 'MB-04', status: 'MAINTENANCE', rpm: 0, pressure: 0, flow: 0 },
];

export const PoolManager: React.FC = () => {
    const [tanks, setTanks] = useState<TankData[]>(MOCK_TANKS);
    const [pumps, setPumps] = useState<PumpData[]>(MOCK_PUMPS);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const totalVolume = useMemo(() => tanks.reduce((acc, t) => acc + t.currentLevel, 0), [tanks]);
    const totalCapacity = useMemo(() => tanks.reduce((acc, t) => acc + t.capacity, 0), [tanks]);
    const avgTemperature = useMemo(() => tanks.reduce((acc, t) => acc + t.temperature, 0) / tanks.length, [tanks]);

    const handleAIAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzePoolInventory(tanks, MOCK_FLIGHTS);
            setAnalysis(result);
        } catch (e) {
            setAnalysis("Erro na análise de inventário.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="w-full h-full flex bg-[#020611] overflow-hidden selection:bg-emerald-500/30 font-sans">
            
            {/* SIDEBAR TÉCNICA */}
            <div className="w-80 border-r border-slate-900 bg-[#0a0f1d]/50 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Operação Industrial</h2>
                    <div className="space-y-4">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status da Adutora</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-black text-white">REPLAN-SJK ATIVO</span>
                            </div>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Pressão de Linha (In)</span>
                            <span className="text-xl font-black text-white font-mono tracking-tighter">8.2 <span className="text-[10px] text-slate-600">BAR</span></span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Bombas de Recalque</h3>
                        <span className="text-[9px] font-black text-emerald-500">2/4 ON</span>
                    </div>
                    <div className="space-y-2">
                        {pumps.map(pump => (
                            <div key={pump.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pump.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-950 text-slate-700'}`}>
                                        <Zap size={14} className={pump.status === 'RUNNING' ? 'animate-pulse' : ''} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-white block leading-none mb-1">{pump.id}</span>
                                        <span className="text-[8px] font-bold text-slate-600 uppercase">{pump.status}</span>
                                    </div>
                                </div>
                                {pump.status === 'RUNNING' && (
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-emerald-400 font-mono">{pump.pressure} PSI</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 mt-auto bg-indigo-600/5 border-t border-slate-800">
                    <button 
                        onClick={handleAIAnalysis}
                        disabled={isAnalyzing}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/10 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        Análise de Autonomia
                    </button>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* HEADER */}
                <div className="h-20 border-b border-slate-900 bg-[#0a0f1d]/80 backdrop-blur-md px-10 flex items-center justify-between z-10 shrink-0">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Pool Central • Fuel Farm SCADA</h1>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">SBGR Aviation Fueling Storage & Logistics</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Volume Total Consolidado</span>
                            <span className="text-2xl font-black text-white font-mono tracking-tighter">{(totalVolume/1000).toFixed(1)}M <span className="text-[10px] text-slate-500">LITROS</span></span>
                        </div>
                        <div className="w-px h-10 bg-slate-800"></div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-emerald-500">{( (totalVolume/totalCapacity)*100 ).toFixed(1)}%</span>
                                <span className="text-[8px] font-black text-slate-600 uppercase">Capacidade</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-500">
                                <Database size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT GRID */}
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020611_100%)]">
                    
                    {/* TANK GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-10">
                        {tanks.map(tank => (
                            <div key={tank.id} className="bg-[#0a0f1d] border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Database size={80} />
                                </div>
                                
                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Identificador</span>
                                        <h3 className="text-3xl font-black text-white font-mono tracking-tighter">{tank.id}</h3>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black border ${
                                        tank.status === 'ATIVO' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                        tank.status === 'RECEBENDO' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                    }`}>
                                        {tank.status}
                                    </div>
                                </div>

                                {/* TANK VISUAL REPRESENTATION */}
                                <div className="flex gap-6 mb-8 relative z-10">
                                    <div className="w-16 h-40 bg-slate-950 border-2 border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-end">
                                        <div 
                                            className={`w-full transition-all duration-1000 ${tank.status === 'RECEBENDO' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} 
                                            style={{ height: `${(tank.currentLevel/tank.capacity)*100}%` }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20"></div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-[10px] font-black text-white/40 rotate-90">{tank.capacity}m³</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-4 flex flex-col justify-center">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Nível Atual</span>
                                            <span className="text-xl font-black text-white font-mono">{tank.currentLevel} <span className="text-[10px] text-slate-600">m³</span></span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Temperatura</span>
                                            <div className="flex items-center gap-2">
                                                <Thermometer size={12} className="text-amber-500" />
                                                <span className="text-sm font-black text-slate-300 font-mono">{tank.temperature}°C</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Densidade</span>
                                            <span className="text-sm font-black text-slate-300 font-mono">{tank.density} <span className="text-[8px]">kg/m³</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* AI ANALYSIS BLOCK */}
                    {analysis && (
                        <div className="bg-[#0a1428] border border-indigo-500/30 rounded-[2.5rem] p-10 animate-in fade-in slide-in-from-bottom-4 shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-5">
                                 <Sparkles size={120} className="text-indigo-500" />
                             </div>
                             <div className="flex items-center gap-4 mb-6">
                                 <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                     <Sparkles size={20} />
                                 </div>
                                 <div>
                                     <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Relatório de Autonomia Gemini</h3>
                                     <p className="text-[9px] text-indigo-400 font-black uppercase">Análise Preditiva de Inventário</p>
                                 </div>
                             </div>
                             <div className="font-mono text-xs text-slate-300 leading-relaxed max-w-4xl whitespace-pre-wrap">
                                 {analysis}
                             </div>
                        </div>
                    )}

                    {/* INTERACTIVE FLOW DIAGRAM (SCADA STYLE) */}
                    <div className="mt-10 bg-slate-950/40 border border-slate-900 rounded-[3rem] p-10">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                            <Waves size={16} className="text-blue-500" /> Sinótico de Transferência Hidrante
                        </h3>
                        
                        <div className="flex items-center justify-between relative px-20">
                            {/* Pool Tank Group */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 bg-slate-900 border-2 border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-700 shadow-inner">
                                    <Database size={40} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Storage Tanks</span>
                            </div>

                            {/* Pump Station Group */}
                            <div className="flex flex-col items-center gap-4 relative">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase">Booster Active</span>
                                </div>
                                <div className="w-32 h-20 bg-slate-900 border-2 border-emerald-500/30 rounded-full flex items-center justify-around px-4 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                                    <RefreshCw size={24} className="text-emerald-500 animate-spin-slow" />
                                    <div className="text-center">
                                        <span className="text-[10px] font-black text-white block">148</span>
                                        <span className="text-[7px] text-slate-500 uppercase">PSI</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Pump Station</span>
                            </div>

                            {/* Hydrant Network Group */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 bg-slate-900 border-2 border-blue-500/20 rounded-full flex items-center justify-center text-blue-500/40 shadow-inner">
                                    <Waves size={40} className="animate-pulse" />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hydrant Loop</span>
                            </div>

                            {/* Pipes Visual Connection */}
                            <div className="absolute top-1/2 left-[12%] right-[12%] h-[2px] bg-slate-800 -z-10 -translate-y-1/2 overflow-hidden">
                                <div className="h-full w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent animate-[slide_3s_linear_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
