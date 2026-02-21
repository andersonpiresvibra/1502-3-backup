
import React, { useState, useEffect, useRef } from 'react';
import { FlightData, FlightLog } from '../types';
import { StatusBadge } from './SharedStats';
import { 
  Plane, X, MapPin, Clock, Hash, Truck, Droplet, 
  UserPlus, RefreshCw, Pen, Anchor, Calendar, Tag, Activity, Users, AlertCircle, Globe, GripHorizontal,
  MessageCircle
} from 'lucide-react';

interface FlightDetailsModalProps {
  flight: FlightData;
  onClose: () => void;
  onUpdate: (updatedFlight: FlightData) => void;
  onOpenChat?: () => void; // Nova prop para abrir chat
}

export const FlightDetailsModal: React.FC<FlightDetailsModalProps> = ({ flight, onClose, onUpdate, onOpenChat }) => {
  const [localFlight, setLocalFlight] = useState<FlightData>(flight);
  
  // Window Position State for Draggable Popup - Lazy Initialization to prevent jumping
  const [position, setPosition] = useState(() => {
      if (typeof window !== 'undefined') {
          return { 
              x: Math.max(0, window.innerWidth / 2 - 384),
              y: Math.max(20, window.innerHeight / 2 - 300)
          };
      }
      return { x: 0, y: 0 };
  });

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Editing States
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [destInput, setDestInput] = useState(flight.destination);

  const [isEditingReg, setIsEditingReg] = useState(false);
  const [regInput, setRegInput] = useState(flight.registration);

  const [isEditingPos, setIsEditingPos] = useState(false);
  const [posInput, setPosInput] = useState(flight.positionId);
  
  const [isEditingChock, setIsEditingChock] = useState(false);
  const [chockInput, setChockInput] = useState(flight.eta); 

  const [isEditingVolume, setIsEditingVolume] = useState(false);
  const [volumeInput, setVolumeInput] = useState(flight.volume?.toString() || '');
  const [volumeError, setVolumeError] = useState<string | null>(null);

  const [isEditingOperator, setIsEditingOperator] = useState(false);
  const [operatorInput, setOperatorInput] = useState(flight.operator || '');

  const [isEditingSupport, setIsEditingSupport] = useState(false);
  const [supportInput, setSupportInput] = useState(flight.supportOperator || '');

  useEffect(() => {
    setLocalFlight(flight);
    setDestInput(flight.destination);
    setRegInput(flight.registration);
    setPosInput(flight.positionId);
    setVolumeInput(flight.volume?.toString() || '');
    setChockInput(flight.eta);
    setOperatorInput(flight.operator || '');
    setSupportInput(flight.supportOperator || '');
    setVolumeError(null);
  }, [flight]);

  // DRAG LOGIC
  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
        isDragging.current = true;
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
      });
  };

  const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
  };

  // Helper para gerar log de auditoria
  const generateAuditLog = (field: string, oldValue: string | number | undefined, newValue: string | number | undefined): FlightLog => ({
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'MANUAL',
      message: `${field} alterado manualmente: ${oldValue || '--'} > ${newValue || '--'}`,
      author: 'GESTOR_MESA'
  });

  const handleSaveDest = () => {
    const formatted = destInput.toUpperCase().slice(0, 4);
    if (formatted === localFlight.destination) { setIsEditingDest(false); return; }

    const newLog = generateAuditLog('Destino', localFlight.destination, formatted);
    const updated = { 
        ...localFlight, 
        destination: formatted,
        logs: [...localFlight.logs, newLog]
    };
    
    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingDest(false);
  };

  const handleSaveReg = () => {
    if (regInput === localFlight.registration) { setIsEditingReg(false); return; }

    const newLog = generateAuditLog('Prefixo', localFlight.registration, regInput);
    const updated = { 
        ...localFlight, 
        registration: regInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingReg(false);
  };

  const handleSavePos = () => {
    if (posInput === localFlight.positionId) { setIsEditingPos(false); return; }

    const newLog = generateAuditLog('Posição', localFlight.positionId, posInput);
    const updated = { 
        ...localFlight, 
        positionId: posInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingPos(false);
  };

  const handleSaveChock = () => {
      if (chockInput === localFlight.eta) { setIsEditingChock(false); return; }

      const newLog = generateAuditLog('Horário Calço', localFlight.eta, chockInput);
      const updated = { 
          ...localFlight, 
          eta: chockInput,
          logs: [...localFlight.logs, newLog]
      };

      setLocalFlight(updated);
      onUpdate(updated);
      setIsEditingChock(false);
  };

  const handleSaveVolume = () => {
    const sanitizedInput = volumeInput.trim();
    if (!sanitizedInput) {
        setVolumeError('Obrigatório');
        return;
    }
    if (!/^\d+$/.test(sanitizedInput)) {
        setVolumeError('Apenas números');
        return;
    }
    const vol = parseInt(sanitizedInput, 10);
    if (vol <= 0) {
        setVolumeError('Valor deve ser positivo');
        return;
    }
    
    if (vol === localFlight.volume) { setIsEditingVolume(false); return; }

    setVolumeError(null);
    const newLog = generateAuditLog('Volume Estimado', localFlight.volume, vol);
    const updated = { 
        ...localFlight, 
        volume: vol,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingVolume(false);
  };

  const handleSaveOperator = () => {
    if (operatorInput === localFlight.operator) { setIsEditingOperator(false); return; }

    const newLog = generateAuditLog('Operador (Líder)', localFlight.operator, operatorInput);
    const updated = { 
        ...localFlight, 
        operator: operatorInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingOperator(false);
  };

  const handleSaveSupport = () => {
    if (supportInput === localFlight.supportOperator) { setIsEditingSupport(false); return; }

    const newLog = generateAuditLog('Apoio Técnico', localFlight.supportOperator, supportInput);
    const updated = { 
        ...localFlight, 
        supportOperator: supportInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingSupport(false);
  };

  return (
    <div 
        ref={windowRef}
        style={{ left: position.x, top: position.y }}
        className="fixed z-50 w-full max-w-3xl flex flex-col rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-slate-800 bg-slate-900 animate-in zoom-in-95 duration-200"
    >
        <div 
            onMouseDown={handleMouseDown}
            className="bg-slate-950/90 backdrop-blur rounded-t-2xl border-b border-slate-800 p-6 flex justify-between items-center shrink-0 cursor-move select-none group"
        >
            <div className="flex items-center gap-5 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                    <Plane className="text-emerald-500 relative z-10" size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            <Globe size={11} className="text-indigo-400" />
                            {localFlight.airline}
                        </span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {localFlight.model}
                        </span>
                    </div>
                    <h2 className="text-4xl font-bold text-white font-mono tracking-tight leading-none">
                        {localFlight.flightNumber}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600 uppercase text-[10px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripHorizontal size={14} />
                    Mover Painel
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
        </div>

        <div className="flex-1 p-6 bg-slate-900 rounded-b-2xl overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                        <Calendar size={14} /> Dados Operacionais
                    </h3>
                    
                    <div className="bg-slate-800/20 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                        
                            <div className="p-3 flex justify-between items-center hover:bg-slate-800/30 transition-colors group">
                            <span className="text-xs text-slate-500 flex items-center gap-2">
                                <MapPin size={14} className="text-emerald-400"/> Destino (ICAO)
                            </span>
                            {isEditingDest ? (
                                <input 
                                    autoFocus
                                    className="w-16 bg-slate-900 border border-emerald-500 text-white text-sm px-1 rounded font-mono text-center outline-none uppercase"
                                    value={destInput}
                                    onChange={e => setDestInput(e.target.value.toUpperCase().slice(0, 4))}
                                    onBlur={handleSaveDest}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveDest()}
                                    placeholder="ABCD"
                                    maxLength={4}
                                />
                            ) : (
                                <div onClick={() => setIsEditingDest(true)} className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-sm font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700 group-hover:border-emerald-500/50 transition-all">
                                        {localFlight.destination}
                                    </span>
                                    <Pen size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                </div>
                            )}
                        </div>

                        <div className="p-3 flex justify-between items-center hover:bg-slate-800/30 transition-colors group">
                            <span className="text-xs text-slate-500 flex items-center gap-2"><Tag size={14} className="text-slate-400"/> Prefixo</span>
                            {isEditingReg ? (
                                <input 
                                    autoFocus
                                    className="w-24 bg-slate-900 border border-emerald-500 text-white text-sm px-1 rounded font-mono text-right outline-none uppercase"
                                    value={regInput}
                                    onChange={e => setRegInput(e.target.value)}
                                    onBlur={handleSaveReg}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveReg()}
                                />
                            ) : (
                                <div onClick={() => setIsEditingReg(true)} className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-sm font-mono text-emerald-400 border-b border-transparent group-hover:border-emerald-500/50 transition-all">{localFlight.registration}</span>
                                    <Pen size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                </div>
                            )}
                        </div>

                        <div className="p-3 flex justify-between items-center hover:bg-slate-800/30 transition-colors group">
                            <span className="text-xs text-slate-500 flex items-center gap-2"><Hash size={14} className="text-indigo-400"/> Posição Pátio</span>
                            {isEditingPos ? (
                                <input 
                                    autoFocus
                                    className="w-16 bg-slate-900 border border-emerald-500 text-white text-sm px-1 rounded font-mono text-center outline-none uppercase"
                                    value={posInput}
                                    onChange={e => setPosInput(e.target.value)}
                                    onBlur={handleSavePos}
                                    onKeyDown={e => e.key === 'Enter' && handleSavePos()}
                                />
                            ) : (
                                <div onClick={() => setIsEditingPos(true)} className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-sm font-bold text-white font-mono border-b border-transparent group-hover:border-emerald-500/50 transition-all">
                                        {localFlight.positionId}
                                    </span>
                                    <Pen size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors"/>
                                </div>
                            )}
                        </div>

                        <div className="p-3 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                            <span className="text-xs text-slate-500 flex items-center gap-2"><Clock size={14} className="text-blue-400"/> ETD (Saída)</span>
                            <span className="text-sm font-mono text-white">
                                {localFlight.etd}
                            </span>
                        </div>

                        <div className="p-3 flex justify-between items-center hover:bg-slate-800/30 transition-colors group">
                            <span className="text-xs text-slate-500 flex items-center gap-2"><Anchor size={14} className="text-orange-400"/> Calço (Chegada)</span>
                            {isEditingChock ? (
                                <input 
                                    autoFocus
                                    className="w-20 bg-slate-900 border border-indigo-500 text-white text-sm px-1 rounded font-mono text-right outline-none"
                                    value={chockInput}
                                    onChange={e => setChockInput(e.target.value)}
                                    onBlur={handleSaveChock}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveChock()}
                                />
                            ) : (
                                <div onClick={() => setIsEditingChock(true)} className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-sm font-mono text-white border-b border-transparent group-hover:border-indigo-500/50 transition-all">
                                        {chockInput}
                                    </span>
                                    <Pen size={12} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                        <Truck size={14} /> Logística Pátio
                    </h3>

                    <div className="bg-slate-800/20 rounded-xl border border-slate-800 p-4 space-y-5">
                        
                        <div>
                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">Equipe Operacional</label>
                            
                            {isEditingOperator ? (
                                <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-lg border border-indigo-500/50">
                                    <input 
                                        autoFocus
                                        className="w-full bg-transparent text-white text-sm px-2 py-1 outline-none placeholder:text-slate-400"
                                        value={operatorInput}
                                        onChange={e => setOperatorInput(e.target.value)}
                                        onBlur={handleSaveOperator}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveOperator()}
                                        placeholder="Nome do operador..."
                                    />
                                    <div className="px-2 text-[10px] text-slate-500 font-mono">ENTER</div>
                                </div>
                            ) : localFlight.operator ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-800 group hover:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
                                                {localFlight.operator.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white leading-none">{localFlight.operator}</div>
                                                <div className="text-[10px] text-slate-500 mt-1">LÍDER DE SOLO</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setIsEditingOperator(true)}
                                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-white hover:bg-slate-800 transition-all opacity-100 group-hover:bg-slate-800"
                                            title="Alterar Operador"
                                        >
                                            <Pen size={12} />
                                            <span>Trocar</span>
                                        </button>
                                    </div>
                                    
                                    {/* Botão de Enviar Mensagem */}
                                    {onOpenChat && (
                                        <button 
                                            onClick={onOpenChat}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 rounded-lg text-xs font-bold transition-all uppercase tracking-wider"
                                        >
                                            <MessageCircle size={14} />
                                            Enviar Mensagem
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsEditingOperator(true)}
                                    className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={14} /> Designar Líder
                                </button>
                            )}

                            {localFlight.operator && (
                                <div className="mt-2 pl-4 border-l-2 border-slate-800 ml-4">
                                    {isEditingSupport ? (
                                        <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-lg border border-slate-600">
                                            <input 
                                                autoFocus
                                                className="w-full bg-transparent text-white text-sm px-2 py-1 outline-none placeholder:text-slate-400"
                                                value={supportInput}
                                                onChange={e => setSupportInput(e.target.value)}
                                                onBlur={handleSaveSupport}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveSupport()}
                                                placeholder="Nome do apoio..."
                                            />
                                        </div>
                                    ) : localFlight.supportOperator ? (
                                        <div className="flex items-center justify-between bg-slate-900/30 p-2 rounded-lg border border-slate-800 group hover:border-slate-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                                                    {localFlight.supportOperator.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-300 leading-none">{localFlight.supportOperator}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">AUXILIAR</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setIsEditingSupport(true)}
                                                className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                                            >
                                                <RefreshCw size={10} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setIsEditingSupport(true)}
                                            className="w-full py-1.5 border border-dashed border-slate-800 rounded-lg text-[11px] text-slate-500 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-start gap-2 px-3"
                                        >
                                            <Users size={12} /> + Apoio Técnico
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
 
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block flex items-center gap-1">
                                    <Truck size={10} /> Asset (CTA)
                                </label>
                                <div className="font-mono text-sm text-slate-300 bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-center uppercase">
                                    {localFlight.fleet ? `CTA-${localFlight.fleet}` : '--'}
                                </div>
                            </div>
 
                            <div className="relative">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block flex items-center gap-1">
                                    <Droplet size={10} /> Volume (L)
                                </label>
                                {isEditingVolume ? (
                                    <div className="relative">
                                        <input 
                                            autoFocus
                                            className={`w-full bg-slate-900 border text-white text-sm px-2 py-1.5 rounded font-mono text-center outline-none transition-colors ${
                                                volumeError 
                                                ? 'border-red-500 focus:border-red-500 text-red-200 bg-red-950/20' 
                                                : 'border-emerald-500 focus:border-emerald-400'
                                            }`}
                                            value={volumeInput}
                                            onChange={e => {
                                                setVolumeInput(e.target.value);
                                                if(volumeError) setVolumeError(null);
                                            }}
                                            onBlur={handleSaveVolume}
                                            onKeyDown={e => e.key === 'Enter' && handleSaveVolume()}
                                            placeholder="0000"
                                        />
                                        {volumeError && (
                                            <div className="absolute top-full mt-1.5 left-0 w-full bg-slate-950 border border-red-900/50 rounded px-2 py-1 text-[10px] text-red-400 flex items-center justify-center gap-1 shadow-lg z-20 animate-in fade-in slide-in-from-top-1">
                                                <AlertCircle size={10} />
                                                {volumeError}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => {
                                            setIsEditingVolume(true);
                                            setVolumeError(null);
                                        }}
                                        className="font-mono text-sm text-white bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all"
                                    >
                                        {localFlight.volume ? localFlight.volume.toLocaleString() : '--'}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-800/50">
                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 flex items-center gap-2">
                                <Activity size={12} /> Status da Missão
                            </label>
                            <div className="flex justify-start">
                                <StatusBadge status={localFlight.status} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
