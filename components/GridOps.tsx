
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FlightStatus, FlightData, FlightLog, LogType } from '../types';
import { MOCK_TEAM_PROFILES } from '../data/mockData'; // Importando perfis para designação
import { StatusBadge } from './SharedStats';
import { FlightDetailsModal } from './FlightDetailsModal';
import { FlightChatWindow } from './FlightChatWindow';
import { 
  LayoutGrid, Clock, UserCheck, Droplet, CheckCircle, 
  ArrowUp, ArrowDown, ArrowUpDown, 
  MessageSquare, FileText, Plane, Pen, Truck,
  PlaneLanding, ListOrdered, AlertTriangle, Play, Pause, XCircle, Plus, Anchor,
  MapPin, Eye, CheckCheck, X, Save, History, TimerOff, UserPlus, Building2, Bell, Zap,
  MessageCircle, Settings
} from 'lucide-react';

type Tab = 'GERAL' | 'CHEGADA' | 'FILA' | 'DESIGNADOS' | 'ABASTECENDO' | 'FINALIZADO';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: keyof FlightData | null;
  direction: SortDirection;
}

interface ToastNotification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning';
}

interface GridOpsProps {
    flights: FlightData[];
    onUpdateFlights: React.Dispatch<React.SetStateAction<FlightData[]>>;
}

// Simulando o horário atual do sistema para cálculos
const MOCK_CURRENT_TIME_STRING = "16:00"; 

const ICAO_CITIES: Record<string, string> = {
  'SBGL': 'GALEÃO',
  'SBGR': 'GUARULHOS',
  'SBSP': 'CONGONHAS',
  'SBRJ': 'ST. DUMONT',
  'SBKP': 'VIRACOPOS',
  'SBNT': 'NATAL',
  'SBSV': 'SALVADOR',
  'SBPA': 'PTO ALEGRE',
  'SBCT': 'CURITIBA',
  'LPPT': 'LISBOA',
  'EDDF': 'FRANKFURT',
  'LIRF': 'FIUMICINO',
  'KMIA': 'MIAMI',
  'KATL': 'ATLANTA',
  'MPTO': 'TOCUMEN',
  'SCEL': 'SANTIAGO',
  'SUMU': 'MONTEVIDÉU',
  'SAEZ': 'EZEIZA',
};

const DELAY_REASONS = [
    "Atraso Chegada Aeronave (Late Arrival)",
    "Solicitação Cia Aérea (Abastecimento Parcial)",
    "Manutenção Equipamento Abastecimento",
    "Manutenção Aeronave (Mecânica)",
    "Indisponibilidade de Posição/Balizamento",
    "Restrição Meteorológica (Raios)",
    "Atraso Operacional (Equipe)",
    "Fluxo Lento / Pressão Hidrante Baixa"
];

const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

const calculateLandingETA = (blockTime: string) => {
    const date = parseTime(blockTime);
    date.setMinutes(date.getMinutes() - 15);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getMinutesDiff = (targetTimeStr: string, currentTimeStr: string = MOCK_CURRENT_TIME_STRING) => {
    const target = parseTime(targetTimeStr);
    const current = parseTime(currentTimeStr);
    return (target.getTime() - current.getTime()) / 60000;
};

// Verifica se houve atraso REAL (Hora Finalização > ETD)
const checkIsDelayed = (flight: FlightData) => {
    if (!flight.endTime || !flight.etd) return false;
    const [h, m] = flight.etd.split(':').map(Number);
    const etdDate = new Date(flight.endTime); 
    etdDate.setHours(h, m, 0, 0);
    // Se EndTime for maior que ETD, houve atraso
    return flight.endTime.getTime() > etdDate.getTime();
};

const calculateTAB = (flight: FlightData) => {
    if (!flight.designationTime || !flight.endTime) return "--:--";
    const diffMs = flight.endTime.getTime() - flight.designationTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const createNewLog = (type: LogType, message: string, author: string = 'GESTOR_MESA'): FlightLog => ({
    id: Date.now().toString(),
    timestamp: new Date(),
    type,
    message,
    author
});

export const GridOps: React.FC<GridOpsProps> = ({ flights, onUpdateFlights }) => {
  const [activeTab, setActiveTab] = useState<Tab>('GERAL');
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [chatFlight, setChatFlight] = useState<FlightData | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  
  // Estado para controlar visualização de finalizados na aba GERAL
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  
  // Modals e Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [standbyModalFlightId, setStandbyModalFlightId] = useState<string | null>(null);
  const [standbyReason, setStandbyReason] = useState('');
  const [observationModalFlightId, setObservationModalFlightId] = useState<string | null>(null);
  const [newObservationText, setNewObservationText] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Delay Justification Modal States
  const [delayModalFlightId, setDelayModalFlightId] = useState<string | null>(null);
  const [delayReasonCode, setDelayReasonCode] = useState('');
  const [delayReasonDetail, setDelayReasonDetail] = useState('');

  // Assign Operator Modal State
  const [assignModalFlight, setAssignModalFlight] = useState<FlightData | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [cancelModalFlight, setCancelModalFlight] = useState<FlightData | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Notifications Logic
  const allNotifications = useMemo(() => {
      const msgs = flights.flatMap(f => (f.messages || []).map(m => ({ ...m, flight: f })));
      // Filtra mensagens que não são do gestor (mensagens recebidas)
      return msgs.filter(m => !m.isManager).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [flights]);

  // Auto-Update Logic (Usando o state setter global)
  useEffect(() => {
    const interval = setInterval(() => {
        onUpdateFlights(prevFlights => {
            return prevFlights.map(f => {
                const minutesToETD = getMinutesDiff(f.etd);
                // LÓGICA DE AUTOMATIZAÇÃO PARA FILA:
                // Só move para fila se NÃO tiver operador e estiver no prazo crítico
                if (f.status === FlightStatus.CHEGADA && minutesToETD < 60 && !f.operator) {
                    const newLog = createNewLog('SISTEMA', 'Voo movido para FILA automaticamente (ETD < 60min).', 'SISTEMA');
                    return { 
                        ...f, 
                        status: FlightStatus.FILA,
                        logs: [...(f.logs || []), newLog]
                    };
                }
                return f;
            });
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [onUpdateFlights]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const stats = useMemo(() => ({
    total: flights.length,
    chegada: flights.filter(f => f.status === FlightStatus.CHEGADA).length,
    // Correção: Fila conta apenas quem está no status FILA e SEM operador (segurança redundante)
    fila: flights.filter(f => f.status === FlightStatus.FILA && !f.operator).length,
    designados: flights.filter(f => f.status === FlightStatus.DESIGNADO).length,
    abastecendo: flights.filter(f => f.status === FlightStatus.ABASTECENDO).length,
    finalizados: flights.filter(f => f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO).length,
  }), [flights]);

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'GERAL', label: 'VISÃO GERAL', icon: LayoutGrid, count: stats.total },
    { id: 'CHEGADA', label: 'CHEGADA', icon: PlaneLanding, count: stats.chegada },
    { id: 'FILA', label: 'FILA', icon: ListOrdered, count: stats.fila },
    { id: 'DESIGNADOS', label: 'DESIGNADOS', icon: UserCheck, count: stats.designados },
    { id: 'ABASTECENDO', label: 'ABASTECENDO', icon: Droplet, count: stats.abastecendo },
    { id: 'FINALIZADO', label: 'FINALIZADOS', icon: CheckCircle, count: stats.finalizados },
  ];

  const filteredData = useMemo(() => {
    switch (activeTab) {
      case 'CHEGADA': return flights.filter(f => f.status === FlightStatus.CHEGADA);
      case 'FILA': 
        // REGRA DE OURO: ABA FILA NÃO PODE TER OPERADOR
        return flights.filter(f => f.status === FlightStatus.FILA && !f.operator);
      case 'DESIGNADOS': return flights.filter(f => f.status === FlightStatus.DESIGNADO);
      case 'ABASTECENDO': return flights.filter(f => f.status === FlightStatus.ABASTECENDO);
      case 'FINALIZADO': return flights.filter(f => f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO);
      case 'GERAL': 
        return flights.filter(f => {
            if (f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO) {
                return !archivedIds.has(f.id);
            }
            return true;
        });
      default: return flights;
    }
  }, [activeTab, flights, archivedIds]);

  const isStreamlinedView = ['FILA', 'DESIGNADOS', 'ABASTECENDO'].includes(activeTab);
  const isFinishedView = activeTab === 'FINALIZADO';

  const handleSort = (key: keyof FlightData) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key: direction ? key : null, direction });
  };

  const sortedData = useMemo(() => {
    let data = [...filteredData];
    if (!sortConfig.key || !sortConfig.direction) return data;
    return data.sort((a, b) => {
      const aValue = (a[sortConfig.key!] ?? '').toString();
      const bValue = (b[sortConfig.key!] ?? '').toString();
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  }, [filteredData, sortConfig]);

  // --- ACTIONS HANDLERS (ATUALIZANDO ESTADO GLOBAL) ---
  const handleMoveToQueue = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      
      // TRAVA LÓGICA: Se tem operador, não pode ir para fila.
      if (flight.operator) {
          addToast('AÇÃO NEGADA', 'Voo com operador designado não pode ir para a fila.', 'warning');
          return;
      }

      const newLog = createNewLog('MANUAL', 'Voo movido para FILA manualmente.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === flight.id ? { 
          ...f, 
          status: FlightStatus.FILA,
          logs: [...(f.logs || []), newLog]
      } : f));
      addToast('VOO NA FILA', `Voo ${flight.flightNumber} adicionado à fila de prioridade.`, 'success');
  };

  const handleManualStart = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newLog = createNewLog('SISTEMA', 'Início de abastecimento confirmado.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === id ? { 
          ...f, 
          status: FlightStatus.ABASTECENDO, 
          startTime: new Date(),
          logs: [...(f.logs || []), newLog]
      } : f));
  };

  const handleManualFinish = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      const minutesToETD = getMinutesDiff(flight.etd);
      if (minutesToETD < 0) {
          setDelayModalFlightId(flight.id);
          setDelayReasonCode('');
          setDelayReasonDetail('');
          return;
      }
      confirmFinish(flight.id, flight.flightNumber);
  };

  const handleCancelFlight = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      setCancelModalFlight(flight);
      setOpenMenuId(null);
  };

  const confirmCancelFlight = () => {
      if (!cancelModalFlight) return;
      
      const newLog = createNewLog('MANUAL', 'Voo CANCELADO manualmente pelo gestor.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === cancelModalFlight.id ? { 
          ...f, 
          status: FlightStatus.CANCELADO,
          logs: [...(f.logs || []), newLog]
      } : f));
      
      addToast('VOO CANCELADO', `Voo ${cancelModalFlight.flightNumber} foi cancelado.`, 'info');
      setCancelModalFlight(null);
  };

  const handleReportCalco = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      const newLog = createNewLog('MANUAL', 'Calço reportado manualmente pelo gestor.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === flight.id ? { 
          ...f, 
          isOnGround: true,
          logs: [...(f.logs || []), newLog]
      } : f));
      addToast('CALÇO REPORTADO', `Aeronave ${flight.registration} (Voo ${flight.flightNumber}) em calço.`, 'success');
      setOpenMenuId(null);
  };

  const confirmFinish = (id: string, flightNumber: string, delayJustification?: string) => {
      let newLog: FlightLog;
      if (delayJustification) {
          newLog = createNewLog('ATRASO', `Finalizado com ATRASO. Justificativa: ${delayJustification}`, 'GESTOR_MESA');
      } else {
          newLog = createNewLog('SISTEMA', 'Abastecimento finalizado no horário.', 'GESTOR_MESA');
      }
      onUpdateFlights(prev => prev.map(f => f.id === id ? { 
          ...f, 
          status: FlightStatus.FINALIZADO, 
          endTime: new Date(),
          delayJustification: delayJustification,
          logs: [...(f.logs || []), newLog]
      } : f));
      addToast(
          delayJustification ? 'ATRASO REGISTRADO' : 'OPERAÇÃO CONCLUÍDA', 
          `Voo ${flightNumber} finalizado${delayJustification ? ' com relatório de atraso' : ''}.`, 
          delayJustification ? 'warning' : 'success'
      );
      setDelayModalFlightId(null);
  };

  const handleSubmitDelay = () => {
      if (delayModalFlightId && delayReasonCode) {
          const flight = flights.find(f => f.id === delayModalFlightId);
          if (flight) {
              const justification = `${delayReasonCode}${delayReasonDetail ? ` - ${delayReasonDetail}` : ''}`;
              confirmFinish(delayModalFlightId, flight.flightNumber, justification);
          }
      }
  };
  
  const handleRemoveStandby = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newLog = createNewLog('MANUAL', 'Removido de Standby. Retomando prioridade.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === id ? { 
          ...f, 
          isStandby: false, 
          standbyReason: undefined,
          logs: [...(f.logs || []), newLog]
      } : f));
  };

  const handleConfirmVisual = (id: string, flightNumber: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setArchivedIds(prev => new Set(prev).add(id));
      addToast('ARQUIVADO', `Voo ${flightNumber} movido para histórico.`, 'info');
  };

  // --- ASSIGNMENT LOGIC ---
  const openAssignModal = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      setAssignModalFlight(flight);
      setSelectedOperatorId(null);
  };

  const confirmAssignment = () => {
      if (assignModalFlight && selectedOperatorId) {
          const operator = MOCK_TEAM_PROFILES.find(op => op.id === selectedOperatorId);
          if (!operator) return;

          const newLog = createNewLog('MANUAL', `Operador ${operator.warName} designado manualmente.`, 'GESTOR_MESA');
          
          // IMPORTANTE: Ao designar, o status vai para DESIGNADO, removendo automaticamente da FILA
          onUpdateFlights(prev => prev.map(f => f.id === assignModalFlight.id ? { 
              ...f, 
              status: FlightStatus.DESIGNADO, 
              operator: operator.warName,
              designationTime: new Date(),
              logs: [...(f.logs || []), newLog]
          } : f));

          addToast('DESIGNADO', `Operador ${operator.warName} assumiu voo ${assignModalFlight.flightNumber}.`, 'success');
          setAssignModalFlight(null);
          setSelectedOperatorId(null);
      }
  };

  // Filters operators based on Vehicle Compatibility (SRV vs CTA)
  const getEligibleOperators = (flight: FlightData) => {
      const isCtaRequired = flight.vehicleType === 'CTA';
      return MOCK_TEAM_PROFILES.filter(op => {
          const isCtaCapable = op.category === 'ILHA' || op.category === 'VIP';
          if (isCtaRequired) return isCtaCapable;
          return !isCtaCapable; // Para SRV (AERODROMO)
      });
  };

  // OBSERVATION HANDLERS
  const openObservationModal = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      setObservationModalFlightId(flight.id);
      setNewObservationText('');
      setTimeout(() => {
          if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const saveObservation = () => {
      if (observationModalFlightId && newObservationText.trim()) {
          const newLog = createNewLog('OBSERVACAO', newObservationText, 'GESTOR_MESA');
          onUpdateFlights(prev => prev.map(f => f.id === observationModalFlightId ? { 
              ...f, 
              logs: [...(f.logs || []), newLog],
              observations: (f.observations ? f.observations + '\n' : '') + `[${newLog.timestamp.toLocaleTimeString()}] ${newObservationText}`
          } : f));
          setNewObservationText('');
          addToast('REGISTRO ADICIONADO', 'Observação salva na caixa preta do voo.', 'success');
          setTimeout(() => {
              if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  };

  const getObservationModalFlight = () => {
      return flights.find(f => f.id === observationModalFlightId);
  };

  // --- HELPER RENDERS ---
  const getDynamicStatus = (f: FlightData) => {
    const minutesToETA = getMinutesDiff(f.eta);
    const minutesToETD = getMinutesDiff(f.etd);

    if (f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO) {
        if (activeTab === 'FINALIZADO') {
            if (f.status === FlightStatus.CANCELADO) return { label: 'CANCELADO', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
            const hasSwap = f.logs.some(l => l.message.toLowerCase().includes('troca') || l.message.toLowerCase().includes('swap'));
            if (hasSwap) return { label: 'COM TROCA', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
            if (checkIsDelayed(f) || f.delayJustification) return { label: 'COM ATRASO', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
            return { label: 'COM SUCESSO', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
        }
        if (activeTab === 'GERAL' && f.status === FlightStatus.FINALIZADO) {
            return { label: 'CONFIRMAR', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500 animate-pulse' };
        }
    }

    if (f.status === FlightStatus.CHEGADA) {
        if (f.isOnGround && f.positionId) return { label: 'CALÇADA', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
        if (f.isOnGround) return { label: 'SOLO', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
        if (minutesToETA < 10) return { label: 'APROXIMAÇÃO', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
        const h = Math.floor(minutesToETA / 60);
        const m = Math.floor(minutesToETA % 60);
        return { label: `${h}H ${m}M`, color: 'text-slate-400 bg-slate-800/50 border-slate-700' };
    }

    if (f.status === FlightStatus.FILA) {
        if (f.isStandby) return { label: 'STAND-BY', color: 'text-slate-400 bg-slate-800 border-slate-600' };
        if (minutesToETD < 20) return { label: '-20M CRÍTICO', color: 'text-red-500 bg-red-500/20 border-red-500 animate-pulse' };
        if (minutesToETD < 25) return { label: '-25M ALERTA', color: 'text-amber-500 bg-amber-500/20 border-amber-500 animate-pulse' };
        if (minutesToETD < 30) return { label: '-30M', color: 'text-amber-400 bg-amber-500/10 border-amber-400/50' };
        if (minutesToETD < 45) return { label: '-45M', color: 'text-yellow-200 bg-yellow-500/10 border-yellow-200/30' };
        return { label: '-1H', color: 'text-slate-300 bg-slate-800 border-slate-600' };
    }

    if (f.status === FlightStatus.DESIGNADO) {
        const elapsed = f.designationTime ? (new Date().getTime() - f.designationTime.getTime()) / 60000 : 0;
        if (elapsed > 15) return { label: 'AGUARDANDO', color: 'text-amber-500 bg-amber-500/10 border-amber-500' };
        if (elapsed > 10) return { label: 'ACOPLANDO', color: 'text-blue-400 bg-blue-500/10 border-blue-400' };
        return { label: 'A CAMINHO', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-400' };
    }

    if (f.status === FlightStatus.ABASTECENDO) {
        if (minutesToETD <= 0) return { label: 'ATRASADO', color: 'text-red-500 bg-red-500/20 border-red-500 animate-pulse' };
        if (minutesToETD < 10) return { label: 'FINALIZANDO', color: 'text-blue-300 bg-blue-500/20 border-blue-300' };
        return { label: 'ABASTECENDO', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30 animate-pulse' };
    }

    return null;
  };

  const SortableHeader = ({ label, columnKey, className = "" }: { label: string, columnKey: keyof FlightData, className?: string }) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <th 
        className={`px-3 py-4 border-b border-r border-slate-700 bg-slate-900 sticky top-0 cursor-pointer select-none hover:bg-slate-800 transition-all group z-20 ${className}`}
        onClick={() => handleSort(columnKey)}
      >
        <div className={`flex items-center gap-1.5 ${className.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
          <span className={`font-black text-[9px] uppercase tracking-wider transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}>
            {label}
          </span>
          <div className="flex items-center justify-center transition-all">
            {isActive ? (
                sortConfig.direction === 'asc' ? <ArrowUp size={10} className="text-emerald-500" /> : <ArrowDown size={10} className="text-emerald-500" />
            ) : <ArrowUpDown size={8} className="text-slate-700 group-hover:text-slate-400" />}
          </div>
        </div>
      </th>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#020617] overflow-hidden selection:bg-emerald-500/30 font-sans relative">
      
      {/* HEADER E TABS */}
      <div className="px-6 h-16 shrink-0 flex items-center justify-between border-b border-slate-800 bg-[#0a0f1d] z-40">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 text-slate-950 flex items-center justify-center rounded-lg shadow-neon">
                    <Plane size={16} />
                </div>
                <div>
                  <h1 className="text-[8px] font-black text-slate-600 tracking-[0.3em] uppercase leading-none mb-1">JET OPS</h1>
                  <h2 className="text-sm font-black text-white tracking-tighter uppercase leading-none">Malha Operacional</h2>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* NOTIFICATION CENTER */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg transition-all relative ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                    <Bell size={20} />
                    {allNotifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0a0f1d] rounded-full animate-pulse"></span>
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notificações</span>
                            <button onClick={() => setShowNotifications(false)}><X size={14} className="text-slate-500 hover:text-white" /></button>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {allNotifications.length > 0 ? allNotifications.map((msg, i) => (
                                <div key={i} className="p-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors flex gap-3">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-white uppercase">{msg.sender}</span>
                                            <span className="text-[9px] font-mono text-slate-500">{msg.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-tight line-clamp-2">{msg.text}</p>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase mt-1 block tracking-wider">
                                            Voo {msg.flight.flightNumber}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-600 text-xs font-medium">Nenhuma notificação recente.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* BOTÃO CRIAR VOO SOMENTE EM GERAL */}
            {activeTab === 'GERAL' && (
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Criar Voo</span>
                </button>
            )}
        </div>
      </div>

      <div className="h-12 shrink-0 flex border-b border-slate-800 z-30 overflow-hidden bg-slate-900">
        <nav className="flex w-full">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex-1 h-full px-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-r border-slate-950/20 last:border-r-0
                            ${isActive 
                                ? 'bg-slate-950 text-emerald-400 border-b-2 border-emerald-500' 
                                : 'text-slate-500 hover:bg-slate-800 hover:text-white'}
                        `}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`flex items-center justify-center px-1.5 min-w-[18px] h-4 text-[9px] font-black rounded-sm ${isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
      </div>

      {/* GRID CONTAINER */}
      <div className="flex-1 overflow-hidden relative bg-slate-950">
        <div className="w-full h-full overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
              <thead className="z-40">
                  <tr className="h-12 bg-slate-900">
                    {/* LAYOUT CONDICIONAL DE COLUNAS */}
                    {isStreamlinedView ? (
                        <>
                            <SortableHeader label="COMP." columnKey="airlineCode" className="w-16 text-center pl-4" />
                            <SortableHeader label="V.SAÍDA" columnKey="departureFlightNumber" className="w-20 text-center" />
                            <SortableHeader label="ICAO" columnKey="destination" className="w-14 text-center" />
                            <SortableHeader label="CID" columnKey="destination" className="w-24 text-center" />
                            <SortableHeader label="PREFIXO" columnKey="registration" className="w-24 text-center" />
                            <SortableHeader label="POS" columnKey="positionId" className="w-16 text-center" />
                            <SortableHeader label="CALÇO" columnKey="eta" className="w-16 text-center" />
                            <SortableHeader label="ETD" columnKey="etd" className="w-16 text-center" />
                            <SortableHeader label="OPERADOR" columnKey="operator" className="w-32" />
                            <SortableHeader label="FROTA" columnKey="fleet" className="w-20 text-center" />
                            {activeTab === 'ABASTECENDO' && (
                                <th className="w-16 px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">VAZÃO</th>
                            )}
                        </>
                    ) : isFinishedView ? (
                        <>
                            <SortableHeader label="COMP." columnKey="airlineCode" className="w-16 text-center pl-4" />
                            <SortableHeader label="PREFIXO" columnKey="registration" className="w-24 text-center" />
                            <SortableHeader label="MODELO" columnKey="model" className="w-16 text-center" />
                            <SortableHeader label="V.SAÍDA" columnKey="departureFlightNumber" className="w-20 text-center" />
                            <SortableHeader label="ICAO" columnKey="destination" className="w-14 text-center" />
                            <SortableHeader label="CID" columnKey="destination" className="w-24 text-center" />
                            <SortableHeader label="POS" columnKey="positionId" className="w-16 text-center" />
                            <SortableHeader label="CALÇO" columnKey="eta" className="w-16 text-center" />
                            <SortableHeader label="ETD" columnKey="etd" className="w-16 text-center" />
                            <SortableHeader label="OPERADOR" columnKey="operator" className="w-32" />
                            <SortableHeader label="FROTA" columnKey="fleet" className="w-20 text-center" />
                            <th className="w-16 px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">TAB</th>
                            <th className="w-16 px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">VAZÃO</th>
                        </>
                    ) : (
                        <>
                            <SortableHeader label="COMP." columnKey="airlineCode" className="w-16 text-center pl-4" />
                            <SortableHeader label="PREFIXO" columnKey="registration" className="w-24 text-center" />
                            <SortableHeader label="MODELO" columnKey="model" className="w-16 text-center" />
                            <SortableHeader label="V.CHEG" columnKey="flightNumber" className="w-20 text-center" />
                            <SortableHeader label="ETA" columnKey="eta" className="w-16 text-center" />
                            <SortableHeader label="V.SAÍDA" columnKey="departureFlightNumber" className="w-20 text-center" />
                            <SortableHeader label="ICAO" columnKey="destination" className="w-14 text-center" />
                            <SortableHeader label="CID" columnKey="destination" className="w-24 text-center" />
                            <SortableHeader label="POS" columnKey="positionId" className="w-16 text-center" />
                            <SortableHeader label="CALÇO" columnKey="eta" className="w-16 text-center" />
                            <SortableHeader label="ETD" columnKey="etd" className="w-16 text-center" />
                            <SortableHeader label="OPERADOR" columnKey="operator" className="w-32" />
                            <SortableHeader label="FROTA" columnKey="fleet" className="w-20 text-center" />
                            {activeTab === 'GERAL' && (
                                <th className="w-16 px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">VAZÃO</th>
                            )}
                        </>
                    )}
                      
                      <th className="w-32 px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">
                          STATUS
                      </th>

                      {!isFinishedView && (
                        <th className="w-20 px-3 border-b border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">
                            AÇÕES
                        </th>
                      )}
                  </tr>
              </thead>
              <tbody className="text-[11px] font-bold">
                  {sortedData.map((row) => {
                      const dynamicStatus = getDynamicStatus(row);
                      // Verifica se tem mensagens não lidas (não do gestor)
                      const hasUnreadMessages = row.messages?.some(m => !m.isManager) || false;
                      
                      return (
                      <tr 
                          key={row.id} 
                          onClick={() => setSelectedFlight(row)}
                          className={`h-14 border-b border-slate-800/30 cursor-pointer transition-colors hover:bg-slate-900 ${
                              activeTab === 'GERAL' && row.status === FlightStatus.FINALIZADO ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''
                          }`}
                      >
                          {/* AIRLINE */}
                          <td className="px-2 border-r border-slate-800/50 text-center pl-4">
                              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-black">{row.airlineCode}</span>
                          </td>

                          {/* RENDERIZAÇÃO CONDICIONAL DAS CÉLULAS */}
                          {isStreamlinedView ? (
                            <>
                                {/* FLIGHT OUT */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-white font-mono tracking-tighter">{row.departureFlightNumber || '--'}</td>

                                {/* ICAO */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 font-bold text-[10px]">
                                    {row.destination}
                                </td>

                                {/* CITY */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-black text-[9px] text-slate-400 uppercase tracking-tight">
                                    {ICAO_CITIES[row.destination] || 'EXTERIOR'}
                                </td>

                                {/* REGISTRATION */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 tracking-tighter uppercase">{row.registration}</td>

                                {/* POSITION */}
                                <td className="px-2 border-r border-slate-800/50 text-center">
                                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 font-mono text-[10px] rounded">{row.positionId}</span>
                                </td>

                                {/* CALÇO (REAL ETA) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-white font-black bg-slate-900/50">
                                    {row.eta}
                                </td>

                                {/* ETD */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400">{row.etd}</td>

                                {/* OPERATOR (WITH ASSIGN BUTTON & MESSAGE DOT) */}
                                <td className="px-3 border-r border-slate-800/50 truncate">
                                    {row.operator ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-black shrink-0 border border-indigo-500/30">{row.operator.charAt(0)}</div>
                                                <span className="text-slate-300 uppercase tracking-tight truncate text-[10px]">{row.operator}</span>
                                            </div>
                                            {hasUnreadMessages && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Nova mensagem do operador"></div>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => openAssignModal(row, e)}
                                            className="w-full bg-slate-800/50 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded py-1 px-2 text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <UserPlus size={10} /> Designar
                                        </button>
                                    )}
                                </td>

                                {/* FLEET */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-[10px] text-slate-500">
                                    {row.fleet || '--'}
                                </td>

                                {/* VAZÃO (Apenas ABASTECENDO) */}
                                {activeTab === 'ABASTECENDO' && (
                                    <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400 tracking-tight">
                                        {row.maxFlowRate?.toLocaleString('pt-BR') || '--'}
                                    </td>
                                )}
                            </>
                          ) : isFinishedView ? (
                            <>
                                {/* REGISTRATION */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 tracking-tighter uppercase">{row.registration}</td>

                                {/* MODEL */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-slate-400 font-mono text-[10px] font-bold">
                                    {row.model.split('-')[0]}
                                </td>

                                {/* FLIGHT OUT */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-white font-mono tracking-tighter">{row.departureFlightNumber || '--'}</td>

                                {/* ICAO */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 font-bold text-[10px]">
                                    {row.destination}
                                </td>

                                {/* CITY */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-black text-[9px] text-slate-400 uppercase tracking-tight">
                                    {ICAO_CITIES[row.destination] || 'EXTERIOR'}
                                </td>

                                {/* POSITION */}
                                <td className="px-2 border-r border-slate-800/50 text-center">
                                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 font-mono text-[10px] rounded">{row.positionId}</span>
                                </td>

                                {/* CALÇO (REAL ETA) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-white font-black bg-slate-900/50">
                                    {row.eta}
                                </td>

                                {/* ETD */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400">{row.etd}</td>

                                {/* OPERATOR */}
                                <td className="px-3 border-r border-slate-800/50 truncate">
                                    {row.operator ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-black shrink-0 border border-indigo-500/30">{row.operator.charAt(0)}</div>
                                            <span className="text-slate-300 uppercase tracking-tight truncate text-[10px]">{row.operator}</span>
                                        </div>
                                    ) : <span className="text-slate-700 italic uppercase text-[9px] pl-2">--</span>}
                                </td>

                                {/* FLEET */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-[10px] text-slate-500">
                                    {row.fleet || '--'}
                                </td>

                                {/* TAB (Exclusivo Finalizados) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-slate-300">
                                    {calculateTAB(row)}
                                </td>

                                {/* VAZÃO (Exclusivo Finalizados) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400 tracking-tight">
                                    {row.maxFlowRate?.toLocaleString('pt-BR') || '--'}
                                </td>
                            </>
                          ) : (
                            <>
                                {/* REGISTRATION */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 tracking-tighter uppercase">{row.registration}</td>

                                {/* MODEL */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-slate-400 font-mono text-[10px] font-bold">
                                    {row.model.split('-')[0]}
                                </td>

                                {/* FLIGHT IN */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-white font-mono tracking-tighter">{row.flightNumber}</td>

                                {/* ETA (POUSO ESTIMADO) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-slate-500">
                                    {calculateLandingETA(row.eta)}
                                </td>

                                {/* FLIGHT OUT */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-white font-mono tracking-tighter">{row.departureFlightNumber || '--'}</td>

                                {/* ICAO */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 font-bold text-[10px]">
                                    {row.destination}
                                </td>

                                {/* CITY */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-black text-[9px] text-slate-400 uppercase tracking-tight">
                                    {ICAO_CITIES[row.destination] || 'EXTERIOR'}
                                </td>

                                {/* POSITION */}
                                <td className="px-2 border-r border-slate-800/50 text-center">
                                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 font-mono text-[10px] rounded">{row.positionId}</span>
                                </td>

                                {/* CALÇO (REAL ETA) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-white font-black bg-slate-900/50">
                                    {row.eta}
                                </td>

                                {/* ETD */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400">{row.etd}</td>

                                {/* OPERATOR (WITH ASSIGN BUTTON & MESSAGE DOT) */}
                                <td className="px-3 border-r border-slate-800/50 truncate">
                                    {row.operator ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-black shrink-0 border border-indigo-500/30">{row.operator.charAt(0)}</div>
                                                <span className="text-slate-300 uppercase tracking-tight truncate text-[10px]">{row.operator}</span>
                                            </div>
                                            {hasUnreadMessages && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Nova mensagem do operador"></div>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => openAssignModal(row, e)}
                                            className="w-full bg-slate-800/50 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded py-1 px-2 text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <UserPlus size={10} /> Designar
                                        </button>
                                    )}
                                </td>

                                {/* FLEET */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-[10px] text-slate-500">
                                    {row.fleet || '--'}
                                </td>

                                {/* VAZÃO (Apenas GERAL) */}
                                {activeTab === 'GERAL' && (
                                    <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400 tracking-tight">
                                        {row.maxFlowRate?.toLocaleString('pt-BR') || '--'}
                                    </td>
                                )}
                            </>
                          )}
                          
                          {/* STATUS (PILL DESIGN RESTORED) */}
                          <td className="border-r border-slate-800/50 px-3 text-center">
                              {dynamicStatus ? (
                                  <div className={`flex items-center justify-center w-full h-[28px] px-2 rounded text-[9px] font-black uppercase tracking-[0.1em] border ${dynamicStatus.color}`}>
                                      {dynamicStatus.label}
                                  </div>
                              ) : (
                                  <StatusBadge status={row.status} />
                              )}
                              {row.isStandby && (
                                  <span className="block text-[7px] text-amber-500 uppercase mt-1 text-center font-bold tracking-widest">{row.standbyReason}</span>
                              )}
                          </td>
                          
                          {/* ACTIONS - COMMAND HUB (Option 1) */}
                          {!isFinishedView && (
                            <td className="px-3 text-center relative">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Toggle menu for this row
                                            setOpenMenuId(openMenuId === row.id ? null : row.id);
                                        }}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${
                                            openMenuId === row.id 
                                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-neon' 
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                                        }`}
                                        title="Menu de Comandos"
                                    >
                                        <Settings size={18} className={openMenuId === row.id ? 'animate-spin-slow' : ''} />
                                    </button>

                                    {/* DROPDOWN MENU */}
                                    {openMenuId === row.id && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-[70]" 
                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                                            ></div>
                                            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[80] overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
                                                <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Comandos: {row.flightNumber}</span>
                                                    <Zap size={10} className="text-emerald-500" />
                                                </div>
                                                <div className="p-1 flex flex-col gap-0.5">
                                                    {/* DINAMIC ACTIONS */}
                                                    {activeTab === 'CHEGADA' && (
                                                        <>
                                                            {/* Reportar Calço */}
                                                            {!row.isOnGround && (
                                                                <button 
                                                                    onClick={(e) => handleReportCalco(row, e)}
                                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-amber-500/10 text-amber-500 rounded-lg transition-colors text-left"
                                                                >
                                                                    <Anchor size={14} />
                                                                    <span className="text-[10px] font-black uppercase tracking-wide">Reportar Calço</span>
                                                                </button>
                                                            )}

                                                            {/* Enviar para Fila */}
                                                            {row.isOnGround && row.status !== FlightStatus.FILA && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleMoveToQueue(row, e); }}
                                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors text-left"
                                                                >
                                                                    <ListOrdered size={14} />
                                                                    <span className="text-[10px] font-black uppercase tracking-wide">Enviar para Fila</span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {activeTab === 'GERAL' && (
                                                        <>
                                                            {/* Enviar para Fila */}
                                                            {row.status !== FlightStatus.FILA && !row.operator && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleMoveToQueue(row, e); }}
                                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-amber-500/10 text-amber-500 rounded-lg transition-colors text-left"
                                                                >
                                                                    <ListOrdered size={14} />
                                                                    <span className="text-[10px] font-black uppercase tracking-wide">Enviar para Fila</span>
                                                                </button>
                                                            )}

                                                            {/* Cancelar Voo */}
                                                            <button 
                                                                onClick={(e) => handleCancelFlight(row, e)}
                                                                className="flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors text-left"
                                                            >
                                                                <XCircle size={14} />
                                                                <span className="text-[10px] font-black uppercase tracking-wide">Cancelar Voo</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {activeTab === 'GERAL' && row.status === FlightStatus.FINALIZADO && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleConfirmVisual(row.id, row.flightNumber, e); }}
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors text-left"
                                                        >
                                                            <CheckCheck size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-wide">Confirmar Operação</span>
                                                        </button>
                                                    )}

                                                    {((row.status === FlightStatus.FILA && row.isStandby) || (activeTab === 'DESIGNADOS' && row.status === FlightStatus.DESIGNADO)) && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); row.isStandby ? handleRemoveStandby(row.id, e) : handleManualStart(row.id, e); }}
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors text-left"
                                                        >
                                                            <Play size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-wide">{row.isStandby ? 'Reativar Voo' : 'Iniciar Operação'}</span>
                                                        </button>
                                                    )}

                                                    {row.status === FlightStatus.ABASTECENDO && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleManualFinish(row, e); }}
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors text-left"
                                                        >
                                                            <CheckCircle size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-wide">Finalizar Abastecimento</span>
                                                        </button>
                                                    )}

                                                    <div className="h-px bg-slate-800 my-1 mx-2"></div>

                                                    {/* STATIC ACTIONS */}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setSelectedFlight(row); }}
                                                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors text-left"
                                                    >
                                                        <Pen size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-wide">Editar Voo</span>
                                                    </button>

                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); openObservationModal(row, e); }}
                                                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors text-left"
                                                    >
                                                        <FileText size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-wide">Observações</span>
                                                    </button>

                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); openObservationModal(row, e); }}
                                                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors text-left"
                                                    >
                                                        <History size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-wide">Diário de Bordo</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </td>
                          )}
                      </tr>
                  )})}
              </tbody>
          </table>
        </div>
      </div>

      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="absolute bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
              <div 
                  key={toast.id}
                  className={`pointer-events-auto min-w-[300px] bg-slate-900 border-l-4 p-4 rounded-r shadow-2xl animate-in slide-in-from-right duration-300 flex items-start gap-3 ${
                      toast.type === 'success' ? 'border-emerald-500' :
                      toast.type === 'info' ? 'border-blue-500' :
                      'border-amber-500'
                  }`}
              >
                  <div className={`p-1.5 rounded-full shrink-0 ${
                      toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                      toast.type === 'info' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-amber-500/20 text-amber-500'
                  }`}>
                      {toast.type === 'success' ? <CheckCircle size={16} /> : <Eye size={16} />}
                  </div>
                  <div className="flex-1">
                      <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${
                          toast.type === 'success' ? 'text-emerald-500' :
                          toast.type === 'info' ? 'text-blue-500' :
                          'text-amber-500'
                      }`}>
                          {toast.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-tight">{toast.message}</p>
                  </div>
                  <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white transition-colors">
                      <X size={14} />
                  </button>
              </div>
          ))}
      </div>

      {selectedFlight && (
        <FlightDetailsModal 
          flight={selectedFlight} 
          onClose={() => setSelectedFlight(null)} 
          onUpdate={v => onUpdateFlights(prev => prev.map(f => f.id === v.id ? v : f))} 
          onOpenChat={() => {
              setChatFlight(selectedFlight);
              setSelectedFlight(null); // Fecha o modal de detalhes
          }}
        />
      )}

      {/* CHAT LATERAL */}
      {chatFlight && (
          <FlightChatWindow 
              flight={chatFlight}
              onClose={() => setChatFlight(null)}
              isOpen={true}
          />
      )}

      {/* MODAL DE OBSERVAÇÕES (CAIXA PRETA - IMUTÁVEL) */}
      {observationModalFlightId && (
          <div className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <div className="bg-slate-900 border border-slate-700 p-0 rounded-2xl w-[600px] shadow-2xl overflow-hidden flex flex-col h-[500px]">
                  {/* HEADER */}
                  <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <History size={18} />
                          </div>
                          <div>
                              <h3 className="text-sm font-black text-white uppercase tracking-wider leading-none">Flight Data Recorder (Logs)</h3>
                              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                  Voo {getObservationModalFlight()?.flightNumber} • Reg {getObservationModalFlight()?.registration}
                              </span>
                          </div>
                      </div>
                      <button 
                          onClick={() => setObservationModalFlightId(null)}
                          className="text-slate-500 hover:text-white transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  {/* BODY: LOG FEED (READ ONLY) */}
                  <div className="flex-1 bg-slate-900 overflow-y-auto custom-scrollbar p-6 space-y-4">
                      {getObservationModalFlight()?.logs && getObservationModalFlight()?.logs!.length > 0 ? (
                          getObservationModalFlight()?.logs!.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()).map((log, index) => (
                              <div key={log.id} className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                          log.type === 'SISTEMA' ? 'bg-slate-500' :
                                          log.type === 'MANUAL' ? 'bg-blue-500' :
                                          log.type === 'ATRASO' ? 'bg-amber-500' :
                                          log.type === 'OBSERVACAO' ? 'bg-amber-500' : 'bg-red-500'
                                      }`}></div>
                                      {index !== (getObservationModalFlight()?.logs?.length || 0) - 1 && (
                                          <div className="w-px h-full bg-slate-800 my-1"></div>
                                      )}
                                  </div>
                                  <div className="flex-1 pb-2">
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[9px] font-mono text-slate-500">{log.timestamp.toLocaleTimeString()}</span>
                                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 rounded ${
                                              log.type === 'SISTEMA' ? 'text-slate-400 bg-slate-800' :
                                              log.type === 'MANUAL' ? 'text-blue-400 bg-blue-500/10' :
                                              log.type === 'ATRASO' ? 'text-amber-400 bg-amber-500/10' :
                                              log.type === 'OBSERVACAO' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'
                                          }`}>{log.type}</span>
                                          <span className="text-[9px] font-bold text-slate-600 uppercase">{log.author}</span>
                                      </div>
                                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{log.message}</p>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                              <History size={32} className="mb-2" />
                              <span className="text-xs font-bold uppercase">Nenhum evento registrado</span>
                          </div>
                      )}
                      <div ref={logsEndRef} />
                  </div>

                  {/* FOOTER: NEW ENTRY (WRITE ONLY) */}
                  <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
                      <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
                              <Plus size={10} /> Adicionar Nova Observação (Permanente)
                          </label>
                          <div className="flex gap-2">
                              <input 
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-slate-600"
                                  placeholder="Digite uma nota operacional..."
                                  value={newObservationText}
                                  onChange={(e) => setNewObservationText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveObservation()}
                              />
                              <button 
                                  onClick={saveObservation}
                                  disabled={!newObservationText.trim()}
                                  className="px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  <Save size={14} />
                                  Salvar
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DE DESIGNAÇÃO DE OPERADOR */}
      {assignModalFlight && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-2xl p-8 shadow-[0_0_50px_rgba(79,70,229,0.2)] animate-in zoom-in-95 flex flex-col">
                  
                  <div className="flex items-center gap-4 mb-6 border-b border-indigo-500/20 pb-6">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/30">
                          <UserPlus size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">Designação de Operador</h3>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                              Voo {assignModalFlight.flightNumber} • {assignModalFlight.vehicleType === 'CTA' ? 'REQ. CTA' : 'REQ. SERVIDOR'}
                          </p>
                      </div>
                  </div>

                  <div className="space-y-4 mb-8 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Equipe Compatível Disponível</span>
                      
                      {getEligibleOperators(assignModalFlight).map(op => {
                          const isBusy = op.status !== 'DISPONÍVEL';
                          const isSelected = selectedOperatorId === op.id;
                          
                          return (
                              <button 
                                  key={op.id}
                                  onClick={() => setSelectedOperatorId(op.id)}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                      isSelected 
                                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg' 
                                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                  }`}
                              >
                                  <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                          isSelected ? 'bg-white text-indigo-600' : 'bg-slate-900 text-slate-500'
                                      }`}>
                                          {op.warName.charAt(0)}
                                      </div>
                                      <div className="text-left">
                                          <div className="text-xs font-black uppercase">{op.warName}</div>
                                          <div className={`text-[8px] font-bold uppercase tracking-wider ${
                                              isSelected ? 'text-indigo-200' : isBusy ? 'text-amber-500' : 'text-emerald-500'
                                          }`}>
                                              {isBusy ? op.status : 'DISPONÍVEL'}
                                          </div>
                                      </div>
                                  </div>
                                  
                                  {isBusy && (
                                      <AlertTriangle size={14} className={isSelected ? 'text-indigo-200' : 'text-amber-500'} />
                                  )}
                              </button>
                          );
                      })}
                  </div>

                  {selectedOperatorId && (() => {
                      const op = MOCK_TEAM_PROFILES.find(o => o.id === selectedOperatorId);
                      return op && op.status !== 'DISPONÍVEL' ? (
                          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg mb-6 flex items-start gap-3">
                              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-amber-200 leading-relaxed font-bold">
                                  ATENÇÃO: O operador {op.warName} está atualmente {op.status}. Confirmar a designação criará uma fila na tarefa dele.
                              </p>
                          </div>
                      ) : null;
                  })()}

                  <div className="flex gap-3 mt-auto">
                      <button 
                          onClick={() => { setAssignModalFlight(null); setSelectedOperatorId(null); }}
                          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs hover:bg-slate-800 transition-all uppercase"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={confirmAssignment}
                          disabled={!selectedOperatorId}
                          className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-black text-xs hover:bg-indigo-400 transition-all uppercase shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Confirmar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DE JUSTIFICATIVA DE ATRASO (SLA COMPLIANCE) */}
      {delayModalFlightId && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <div className="bg-slate-900 border-2 border-amber-500/50 p-8 rounded-2xl w-[500px] shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-in zoom-in-95">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500">
                          <TimerOff size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-wider">Atraso Detectado</h3>
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Justificativa Obrigatória para SLA</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Causa Primária</label>
                          <select 
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
                              value={delayReasonCode}
                              onChange={(e) => setDelayReasonCode(e.target.value)}
                          >
                              <option value="">-- SELECIONE O MOTIVO --</option>
                              {DELAY_REASONS.map(r => (
                                  <option key={r} value={r}>{r}</option>
                              ))}
                          </select>
                      </div>
                      
                      <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Notas Operacionais (Opcional)</label>
                          <textarea 
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-amber-500 resize-none h-24"
                              placeholder="Detalhes adicionais sobre o ocorrido..."
                              value={delayReasonDetail}
                              onChange={(e) => setDelayReasonDetail(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-8">
                      <button 
                          onClick={() => setDelayModalFlightId(null)}
                          className="py-3 rounded-lg border border-slate-700 text-slate-400 font-bold uppercase text-xs hover:bg-slate-800 transition-all"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleSubmitDelay}
                          disabled={!delayReasonCode}
                          className="py-3 rounded-lg bg-amber-500 text-slate-950 font-black uppercase text-xs hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                      >
                          Confirmar e Finalizar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE FLIGHT MODAL (MOCK VISUAL) */}
      {isCreateModalOpen && (
          <div className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-[500px] shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2"><Plus size={18} className="text-emerald-500" /> Criar Voo Manual</h3>
                      <button onClick={() => setIsCreateModalOpen(false)}><XCircle size={20} className="text-slate-500 hover:text-white" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Nº Voo</label>
                          <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-emerald-500" placeholder="AD-HOC" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Prefixo</label>
                          <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-emerald-500" placeholder="PR-..." />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">ETD (Partida)</label>
                          <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Posição</label>
                          <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-emerald-500" placeholder="204" />
                      </div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded mb-6 text-[10px] text-amber-500">
                      <AlertTriangle size={12} className="inline mr-1" /> ATENÇÃO: Voos criados com ETD menor que 1h entrarão automaticamente na FILA de prioridade.
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 bg-emerald-500 text-slate-900 font-black py-3 rounded-lg uppercase hover:bg-emerald-400">Criar Voo</button>
                      <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-lg uppercase hover:bg-slate-700">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
      {/* CANCEL FLIGHT CONFIRMATION MODAL */}
      {cancelModalFlight && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-[450px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                          <AlertTriangle size={32} className="text-red-500" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Confirmar Cancelamento</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Você optou por <span className="text-red-400 font-bold">CANCELAR</span> o voo <span className="text-white font-mono font-bold">{cancelModalFlight.flightNumber}</span> {cancelModalFlight.registration}. Deseja seguir com a ação?
                      </p>
                  </div>
                  
                  <div className="flex gap-4">
                      <button 
                          onClick={confirmCancelFlight}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-600/20"
                      >
                          Sim, Cancelar
                      </button>
                      <button 
                          onClick={() => setCancelModalFlight(null)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all"
                      >
                          Não, Voltar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
