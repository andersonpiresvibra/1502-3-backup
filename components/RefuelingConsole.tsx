
import React, { useState, useEffect, useMemo } from 'react';
import { FlightData, FlightStatus } from '../types';
import { 
    X, Gauge, Zap, Droplet, Activity, ShieldCheck, 
    AlertTriangle, CheckCircle2, RefreshCw, MousePointer2,
    Settings, Play, Square, Anchor, Info, LocateFixed, User,
    ArrowRight, Waves, Filter, Beaker, ShieldAlert, ThermometerSnowflake,
    ChevronRight
} from 'lucide-react';

interface RefuelingConsoleProps {
    flight: FlightData;
    onExit: () => void;
}

export const RefuelingConsole: React.FC<RefuelingConsoleProps> = ({ flight, onExit }) => {
    const [isFlowActive, setIsFlowActive] = useState(false);
    const [volumeDelivered, setVolumeDelivered] = useState(0);
    const [flowRate, setFlowRate] = useState(0);
    const [isDeadmanHeld, setIsDeadmanHeld] = useState(false);
    
    // Métricas Técnicas Avançadas
    const [deltaP, setDeltaP] = useState(0.5); 
    const [intakePressure, setIntakePressure] = useState(148); 
    const [fuelTemp, setFuelTemp] = useState(24.2);
    
    // Quality Check States
    const [showSampleModal, setShowSampleModal] = useState(false);
    
    // Checklist State
    const [checklist, setChecklist] = useState({
        bonding: false,
        chocks: true,
        pitsConnected: false,
        wingConnected: false,
        extinguisher: true,
        sampling: false
    });

    const isReadyToStart = useMemo(() => 
        checklist.bonding && checklist.chocks && checklist.pitsConnected && 
        checklist.wingConnected && checklist.extinguisher && checklist.sampling, 
    [checklist]);

    // Simulation Loop
    useEffect(() => {
        let interval: any;
        if (isFlowActive && isDeadmanHeld) {
            setFlowRate(1185 + Math.random() * 30);
            interval = setInterval(() => {
                setVolumeDelivered(prev => prev + (flowRate / 60));
                setDeltaP(prev => {
                    const target = 8.5 + (Math.random() * 0.8);
                    return prev + (target - prev) * 0.1;
                });
                setIntakePressure(145 - (Math.random() * 2));
            }, 1000);
        } else {
            setFlowRate(0);
            setDeltaP(prev => prev + (0.5 - prev) * 0.1);
            setIntakePressure(148);
        }
        return () => clearInterval(interval);
    }, [isFlowActive, isDeadmanHeld, flowRate]);

    return (
        <div className="w-full h-full bg-[#020611] flex flex-col animate-in fade-in duration-500 font-sans select-none overflow-hidden">
            
            {/* 1. TOP COMMAND BAR */}
            <div className="h-20 bg-slate-950 border-b border-slate-900 px-10 flex items-center justify-between shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                        <Gauge size={24} />
                    </div>
                    <div>
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-1.5">Console Operacional • Digital Twin</h2>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                            Missão {flight.flightNumber} na Posição {flight.positionId}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Integridade JETFUEL-SIM</span>
                        <div className={`flex items-center gap-2 font-mono text-xs font-black ${checklist.sampling ? 'text-emerald-500' : 'text-red-500'}`}>
                             {checklist.sampling ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} className="animate-pulse" />}
                             {checklist.sampling ? 'AMOSTRA VALIDADA' : 'DRENAGEM PENDENTE'}
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-800"></div>
                    <button onClick={onExit} className="p-3 bg-slate-900 hover:bg-red-500/10 border border-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* 2. MAIN CONSOLE DISPLAY */}
            <div className="flex-1 flex p-10 gap-10 overflow-hidden bg-[radial-gradient(circle_at_top,_#0a1428_0%,_#020611_100%)]">
                
                <div className="flex-1 flex flex-col gap-8">
                    <div className="bg-slate-950/40 border border-slate-900 rounded-[3rem] p-8 relative overflow-hidden h-60">
                         <div className="absolute top-6 left-10">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Fuel Flow Path (Malha Hidrante)</span>
                         </div>
                         
                         <div className="flex items-center justify-between h-full mt-2 px-10">
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${checklist.pitsConnected ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' : 'border-slate-800 text-slate-700'}`}>
                                    <Anchor size={24} />
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase">Posição Pit</span>
                            </div>

                            <div className={`h-0.5 flex-1 mx-2 bg-slate-900 relative overflow-hidden ${isFlowActive ? 'opacity-100' : 'opacity-20'}`}>
                                {isFlowActive && <div className="absolute inset-0 bg-emerald-500/40 animate-[slide_1.5s_linear_infinite]"></div>}
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${isFlowActive ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' : 'border-slate-800 text-slate-700'}`}>
                                    <Filter size={24} />
                                </div>
                                <div className="text-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase block">Filtro Monitor</span>
                                    <span className={`text-[10px] font-mono font-black ${deltaP > 15 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>ΔP: {deltaP.toFixed(1)} PSI</span>
                                </div>
                            </div>

                            <div className={`h-0.5 flex-1 mx-2 bg-slate-900 relative overflow-hidden ${isFlowActive ? 'opacity-100' : 'opacity-20'}`}>
                                {isFlowActive && <div className="absolute inset-0 bg-emerald-500/40 animate-[slide_1.5s_linear_infinite]"></div>}
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${isFlowActive ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-slate-800 text-slate-700'}`}>
                                    <Gauge size={24} />
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase">Medidor LCR</span>
                            </div>

                            <div className={`h-0.5 flex-1 mx-2 bg-slate-900 relative overflow-hidden ${isFlowActive ? 'opacity-100' : 'opacity-20'}`}>
                                {isFlowActive && <div className="absolute inset-0 bg-emerald-500/40 animate-[slide_1.5s_linear_infinite]"></div>}
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${checklist.wingConnected ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' : 'border-slate-800 text-slate-700'}`}>
                                    <Waves size={24} />
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase">Wing Point</span>
                            </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-slate-950/40 border border-slate-900 rounded-[3rem] p-8 flex flex-col items-center justify-center relative group">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">Pressão na Posição</span>
                             <div className={`relative w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 ${isFlowActive ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-slate-900 bg-slate-900/40'}`}>
                                <div className={`text-5xl font-black font-mono tracking-tighter transition-colors ${isFlowActive ? 'text-amber-500' : 'text-slate-800'}`}>
                                    {isFlowActive && isDeadmanHeld ? (45 + Math.random() * 4).toFixed(1) : '0.0'}
                                </div>
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest mt-1">PSI</span>
                             </div>
                             <div className="mt-8 flex items-center gap-2">
                                <ThermometerSnowflake size={14} className="text-blue-500/60" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Jet A-1: {fuelTemp.toFixed(1)}°C</span>
                             </div>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800 rounded-[3rem] p-10 flex flex-col justify-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20"></div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 block">Totalizadores Operacionais</span>
                            <div className="flex justify-between items-end mb-6">
                                <h3 className="text-7xl font-black text-white font-mono tracking-tighter tabular-nums leading-none">
                                    {Math.floor(volumeDelivered).toLocaleString()}
                                </h3>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-emerald-400 font-mono tracking-tighter">{flowRate.toFixed(0)} L/MIN</span>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                <div 
                                    className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300"
                                    style={{ width: `${Math.min((volumeDelivered / 12000) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-[400px] flex flex-col gap-6">
                    <div 
                        onClick={() => setShowSampleModal(true)}
                        className={`
                            p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all cursor-pointer group
                            ${checklist.sampling 
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                            }
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${checklist.sampling ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-700'}`}>
                                <Beaker size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Amostra Pátio</span>
                                <span className="text-xs font-black uppercase">{checklist.sampling ? 'LÍMPIDO E ISENTO' : 'DRENAR AGORA'}</span>
                            </div>
                        </div>
                        <ChevronRight size={20} className="opacity-20 group-hover:opacity-100" />
                    </div>

                    <div 
                        onMouseDown={() => setIsDeadmanHeld(true)}
                        onMouseUp={() => setIsDeadmanHeld(false)}
                        onMouseLeave={() => setIsDeadmanHeld(false)}
                        className={`
                            h-32 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer active:scale-95
                            ${isDeadmanHeld 
                                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_50px_rgba(245,158,11,0.3)]' 
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                            }
                        `}
                    >
                        <Zap size={32} className={isDeadmanHeld ? 'animate-pulse' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Acionamento Deadman</span>
                    </div>

                    <div className="bg-[#0a0f1d] border border-slate-900 rounded-[2.5rem] p-8 flex flex-col flex-1 shadow-xl">
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                            <ShieldCheck size={18} className="text-emerald-500" /> Protocolo de Segurança Pátio
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: 'bonding', label: 'Cabo de Aterramento', icon: Activity },
                                { id: 'pitsConnected', label: 'Conexão Pit Hidrante', icon: Anchor },
                                { id: 'wingConnected', label: 'Mangueiras Conectadas', icon: Waves },
                                { id: 'sampling', label: 'Teste de Drenagem', icon: Beaker },
                            ].map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof checklist] }))}
                                    className={`
                                        w-full flex items-center justify-between p-4 rounded-xl border transition-all
                                        ${checklist[item.id as keyof typeof checklist] 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                            : 'bg-slate-950 border-slate-900 text-slate-600 hover:border-slate-800'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon size={16} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${checklist[item.id as keyof typeof checklist] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-800'}`}>
                                        {checklist[item.id as keyof typeof checklist] && <CheckCircle2 size={10} className="text-slate-950" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button 
                                disabled={!isReadyToStart || isFlowActive}
                                onClick={() => setIsFlowActive(true)}
                                className={`
                                    flex flex-col items-center justify-center gap-2 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
                                    ${isFlowActive 
                                        ? 'bg-slate-900 text-emerald-500/50 cursor-not-allowed' 
                                        : isReadyToStart 
                                            ? 'bg-emerald-500 text-slate-950 shadow-lg hover:bg-emerald-400' 
                                            : 'bg-slate-950 text-slate-700 border border-slate-900'
                                    }
                                `}
                            >
                                <Play size={18} /> Iniciar Fluxo
                            </button>
                            <button 
                                onClick={() => { setIsFlowActive(false); setIsDeadmanHeld(false); }}
                                className="flex flex-col items-center justify-center gap-2 py-5 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-400 transition-all"
                            >
                                <Square size={18} /> Parada Emerg.
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showSampleModal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                            <Beaker className="text-blue-500" /> Inspeção Visual de Drenagem
                        </h3>
                        
                        <div className="flex flex-col items-center gap-8 mb-10">
                            <div className="w-32 h-64 bg-slate-950 border-4 border-slate-800 rounded-[2rem] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-amber-500/30"></div> 
                                <div className="absolute top-1/2 left-0 w-full h-full bg-white/5 pointer-events-none"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Status Jet A-1</span>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">LÍMPIDO / ISENTO</span>
                                </div>
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Qualidade</span>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">DENSIDADE OK</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={() => { setChecklist(p => ({...p, sampling: true})); setShowSampleModal(false); }}
                                className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-400"
                            >
                                Aprovar Amostra e Liberar Fluxo
                            </button>
                            <button 
                                onClick={() => setShowSampleModal(false)}
                                className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest"
                            >
                                Cancelar e Repetir Teste
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isDeadmanHeld && isFlowActive && (
                <div className="bg-amber-500 text-slate-950 py-2 text-center text-[10px] font-black uppercase tracking-[0.5em] animate-pulse relative z-50">
                    <ShieldAlert size={14} className="inline mr-3" /> Atenção: Gatilho Deadman Requer Acionamento para Manter Fluxo
                </div>
            )}

            <style>{`
                @keyframes slide {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
