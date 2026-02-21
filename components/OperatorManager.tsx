
import React, { useState, useMemo } from 'react';
import { 
    Truck, Zap, Fuel, Search, Filter, Gauge, 
    AlertTriangle, CheckCircle2, Wrench, Activity,
    Droplet, Info, Sparkles, X, Bot, User, ChevronRight,
    Save, ChevronDown, MousePointer2, Settings, History
} from 'lucide-react';
import { analyzeFleetHealth } from '../services/geminiService';
import { MOCK_TEAM_PROFILES } from '../data/mockData';

// --- DEFINIÇÕES DE DADOS ---

type Manufacturer = 'FORD' | 'MERCEDES' | 'VOLKSWAGEN';
type FleetType = 'SERVIDOR' | 'CTA';
type FleetStatus = 'DISPONÍVEL' | 'OCUPADO' | 'MANUTENÇÃO';

interface FleetVehicle {
    id: string;
    type: FleetType;
    manufacturer: Manufacturer;
    capacity?: number; // Litros (Apenas para CTA)
    status: FleetStatus;
    hours: number;
    assignedOperatorId?: string; 
    assignedOperatorName?: string;
    assignedOperatorPhoto?: string; // Add photo support
}

// Dados Mock para Operadores (Using MOCK_TEAM_PROFILES as source of truth for IDs)
const AVAILABLE_OPERATORS = MOCK_TEAM_PROFILES.map(op => ({
    id: op.id,
    name: `${op.warName} (${op.fullName.split(' ')[0]} ${op.fullName.split(' ').pop()})`,
    photoUrl: op.photoUrl
}));

const SERVIDORES_FORD = ['2104', '2108', '2111', '2113'];
const SERVIDORES_MB = ['2122', '2123', '2124', '2125', '2126', '2127', '2128', '2129', '2130', '2131', '2132', '2133', '2135', '2136', '2137'];
const SERVIDORES_VW = ['2140', '2145', '2160', '2161', '2164', '2165', '2174', '2177'];
const CTA_MB_15K = ['1405'];
const CTA_MB_20K = ['1425', '1426', '1428', '1435', '1437', '1439', '1499', '1517'];
const MAINTENANCE_IDS = new Set(['2122', '2123', '2127', '2132', '2160', '2161', '1437']);

const buildFleet = (): FleetVehicle[] => {
    const fleet: FleetVehicle[] = [];
    const add = (ids: string[], type: FleetType, manufacturer: Manufacturer, capacity?: number) => {
        ids.forEach(id => {
            let status: FleetStatus = 'DISPONÍVEL';
            let opId = undefined;
            let opName = undefined;
            let opPhoto = undefined;
            if (MAINTENANCE_IDS.has(id)) {
                status = 'MANUTENÇÃO';
            } else if (Math.random() > 0.6) {
                status = 'OCUPADO';
                const randomOp = AVAILABLE_OPERATORS[Math.floor(Math.random() * AVAILABLE_OPERATORS.length)];
                opId = randomOp.id;
                opName = randomOp.name;
                opPhoto = randomOp.photoUrl;
            }
            fleet.push({ id, type, manufacturer, capacity, status, hours: Math.floor(Math.random() * 5000) + 1000, assignedOperatorId: opId, assignedOperatorName: opName, assignedOperatorPhoto: opPhoto });
        });
    };
    add(SERVIDORES_FORD, 'SERVIDOR', 'FORD');
    add(SERVIDORES_MB, 'SERVIDOR', 'MERCEDES');
    add(SERVIDORES_VW, 'SERVIDOR', 'VOLKSWAGEN');
    add(CTA_MB_15K, 'CTA', 'MERCEDES', 15000);
    add(CTA_MB_20K, 'CTA', 'MERCEDES', 20000);
    return fleet;
};

const INITIAL_FLEET = buildFleet();

export const OperatorManager: React.FC = () => {
  const [fleet, setFleet] = useState<FleetVehicle[]>(INITIAL_FLEET);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [tempOperatorId, setTempOperatorId] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectedVehicle = useMemo(() => fleet.find(v => v.id === selectedVehicleId), [fleet, selectedVehicleId]);

  const filteredFleet = useMemo(() => fleet.filter(v => v.id.includes(searchTerm)), [fleet, searchTerm]);

  const handleSaveAssignment = () => {
      if (selectedVehicle) {
          const operator = AVAILABLE_OPERATORS.find(op => op.id === tempOperatorId);
          setFleet(prev => prev.map(v => v.id === selectedVehicle.id ? {
              ...v,
              assignedOperatorId: tempOperatorId || undefined,
              assignedOperatorName: operator?.name || undefined,
              assignedOperatorPhoto: operator?.photoUrl || undefined,
              status: (tempOperatorId ? 'OCUPADO' : 'DISPONÍVEL') as FleetStatus
          } : v));
          setShowAssignModal(false);
      }
  };

  const handleAnalyzeFleet = async () => {
      setShowAnalysis(true);
      if(!analysisResult) {
          setIsAnalyzing(true);
          try {
              const result = await analyzeFleetHealth(fleet);
              setAnalysisResult(result);
          } catch (e) {
              setAnalysisResult("Erro na análise da frota.");
          } finally {
              setIsAnalyzing(false);
          }
      }
  };

  return (
    <div className="w-full h-full flex overflow-hidden relative">
        {/* MODAL DE ATRIBUIÇÃO */}
        {showAssignModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-8 shadow-2xl">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <User size={20} className="text-emerald-500" /> ATRIBUIR FROTA
                    </h3>
                    <div className="space-y-6">
                        <select
                            value={tempOperatorId}
                            onChange={(e) => setTempOperatorId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500"
                        >
                            <option value="">-- LIBERAR FROTA --</option>
                            {AVAILABLE_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                        </select>
                        <button onClick={handleSaveAssignment} className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl shadow-lg hover:bg-emerald-400">SALVAR CONFIGURAÇÃO</button>
                        <button onClick={() => setShowAssignModal(false)} className="w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest">CANCELAR</button>
                    </div>
                </div>
            </div>
        )}

        {/* LISTA DE FROTAS */}
        <div className="w-80 md:w-96 flex flex-col border-r border-slate-800/60 bg-[#0a0f1d]/40">
            <div className="p-6 border-b border-slate-800/60">
                <h2 className="text-lg font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2"><Truck className="text-emerald-500" size={24} /> GESTÃO DE FROTAS</h2>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type="text" placeholder="Localizar frota..." className="w-full bg-[#020617] border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-[11px] text-white outline-none focus:border-emerald-500/30" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {filteredFleet.map(v => (
                    <button key={v.id} onClick={() => setSelectedVehicleId(v.id)} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all border ${selectedVehicleId === v.id ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'border-transparent text-slate-400 hover:bg-slate-800/30'}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${v.type === 'SERVIDOR' ? 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5' : 'border-amber-500/20 text-amber-400 bg-amber-500/5'}`}><Zap size={18} /></div>
                        <div className="flex-1 text-left min-w-0">
                            <span className="text-[12px] font-black font-mono block uppercase">{v.id}</span>
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">{v.type} • {v.status}</span>
                        </div>
                        <ChevronRight size={12} className={selectedVehicleId === v.id ? 'text-emerald-500' : 'opacity-20'} />
                    </button>
                ))}
            </div>
            <div className="p-4 border-t border-slate-800/60">
                <button onClick={handleAnalyzeFleet} className="w-full bg-indigo-500 text-white font-black py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] shadow-lg shadow-indigo-500/20 uppercase tracking-widest"><Bot size={14} /> Análise IA</button>
            </div>
        </div>

        {/* DETALHES DA FROTA */}
        <div className="flex-1 bg-transparent flex flex-col items-center justify-center p-12">
            {selectedVehicle ? (
                <div className="w-full max-w-4xl bg-[#0a0f1d] border border-slate-800 rounded-2xl p-10 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-start mb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500"><Truck size={40} /></div>
                            <div>
                                <h1 className="text-5xl font-black text-white font-mono tracking-tighter leading-none">{selectedVehicle.id}</h1>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">STATUS: <span className="text-emerald-400">{selectedVehicle.status}</span> • FABRICANTE: {selectedVehicle.manufacturer}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">HORÍMETRO</span>
                             <span className="text-3xl font-black text-white font-mono">{selectedVehicle.hours}h</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                             <h4 className="text-[11px] font-black text-white uppercase tracking-widest border-l-2 border-emerald-500 pl-4 mb-4">ESPECIFICAÇÕES TÉCNICAS</h4>
                             <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-4">
                                <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-bold uppercase">Pressão Nominal</span> <span className="text-white font-mono">120 PSI</span></div>
                                <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-bold uppercase">Última Inspeção</span> <span className="text-emerald-500 font-bold">OK</span></div>
                                <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-bold uppercase">Filtro Ativo</span> <span className="text-white font-mono">X-882</span></div>
                             </div>
                        </div>
                        <div className="space-y-6">
                             <h4 className="text-[11px] font-black text-white uppercase tracking-widest border-l-2 border-indigo-500 pl-4 mb-4">OPERADOR DESIGNADO</h4>
                             <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                                {selectedVehicle.assignedOperatorName ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500 text-xl font-black mb-4 border border-emerald-500/20 overflow-hidden">
                                            {selectedVehicle.assignedOperatorPhoto ? (
                                                <img src={selectedVehicle.assignedOperatorPhoto} alt={selectedVehicle.assignedOperatorName} className="w-full h-full object-cover" />
                                            ) : (
                                                selectedVehicle.assignedOperatorName.charAt(0)
                                            )}
                                        </div>
                                        <div className="text-sm font-black text-white uppercase mb-1">{selectedVehicle.assignedOperatorName}</div>
                                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">CERTIFICAÇÃO VÁLIDA</div>
                                    </>
                                ) : (
                                    <>
                                        <User size={32} className="text-slate-700 mb-4" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DISPONÍVEL NO PÁTIO</p>
                                    </>
                                )}
                                <button onClick={() => setShowAssignModal(true)} className="mt-8 w-full bg-white text-slate-950 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">ALTERAR DESIGNAÇÃO</button>
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center opacity-20">
                    <MousePointer2 size={64} className="mx-auto mb-6 text-slate-600" />
                    <p className="text-xl font-black text-slate-600 uppercase tracking-[0.5em]">SELECIONE UMA FROTA</p>
                </div>
            )}
        </div>

        {/* MODAL IA */}
        {showAnalysis && (
            <div className="absolute right-10 top-20 w-96 bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-right">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Bot size={16}/> GEMINI ANALYTICS</span>
                    <button onClick={() => setShowAnalysis(false)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                </div>
                <div className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-auto custom-scrollbar">
                    {isAnalyzing ? "Calculando métricas da frota..." : analysisResult}
                </div>
            </div>
        )}
    </div>
  );
};
