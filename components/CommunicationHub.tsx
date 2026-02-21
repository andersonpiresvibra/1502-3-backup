
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, MessageSquare, Building2, Wrench, Users, 
  Settings2, ShieldCheck, Radio, Cpu, ChevronRight, 
  ChevronDown, Filter, Paperclip, Send, Phone, MoreVertical,
  Zap, Crown, Loader2, Target, Clock, Droplet, Activity, ScanEye,
  Plane, MapPin, Hash, ArrowUpRight
} from 'lucide-react';
import { MOCK_TEAM_PROFILES, MOCK_FLIGHTS } from '../data/mockData';
import { ChatMessage, OperatorProfile, OperatorStatus, ShiftCycle } from '../types';

type ChatCategory = 'OPERADORES' | 'COMPANHIAS' | 'MANUTENÇÃO' | 'GESTÃO' | 'SISTEMA';

interface ChatTarget {
  id: string;
  name: string;
  subtext: string;
  category: ChatCategory;
  status: OperatorStatus;
  avatarText?: string;
  icon?: any;
  rawProfile?: OperatorProfile;
  unreadCount?: number;
  photoUrl?: string;
}

export const CommunicationHub: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('OPERADORES');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OperatorStatus | 'TODOS'>('TODOS');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['MANHÃ']));
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const allTargets: ChatTarget[] = useMemo(() => {
    const targets: ChatTarget[] = [];
    MOCK_TEAM_PROFILES.forEach((op, index) => {
      // Simulando contagens de mensagens não lidas para demonstração
      const unread = index === 0 ? 3 : index === 2 ? 1 : 0;
      targets.push({ 
        id: op.id, 
        name: op.warName.toUpperCase(), 
        subtext: op.category, 
        category: 'OPERADORES', 
        status: op.status, 
        avatarText: op.warName.charAt(0), 
        rawProfile: op, 
        unreadCount: unread,
        photoUrl: op.photoUrl 
      });
    });
    targets.push(
      { id: 'cia_latam', name: 'LATAM_OPS', subtext: 'Terminal 2', category: 'COMPANHIAS', status: 'DISPONÍVEL', avatarText: 'LA', unreadCount: 5 },
      { id: 'cia_gol', name: 'GOL_FUEL', subtext: 'Base GRU', category: 'COMPANHIAS', status: 'DISPONÍVEL', avatarText: 'G3' },
      { id: 'mnt_oficina', name: 'OFICINA_MNT', subtext: 'Frotas', category: 'MANUTENÇÃO', status: 'DISPONÍVEL', icon: Wrench },
      { id: 'mgmt_com', name: 'COMANDO GERAL', subtext: 'Geral', category: 'GESTÃO', status: 'DISPONÍVEL', icon: Crown },
      { id: 'sys_alerts', name: 'SISTEMA_JET', subtext: 'Alertas', category: 'SISTEMA', status: 'DISPONÍVEL', icon: Cpu }
    );
    return targets;
  }, []);

  const activeChat = useMemo(() => allTargets.find(t => t.id === activeChatId), [activeChatId, allTargets]);

  // Recupera a missão ativa baseada no nome do operador (Lógica Mock)
  const activeMission = useMemo(() => {
      if (!activeChat || activeChat.category !== 'OPERADORES') return null;
      // Tenta encontrar voo onde o operador corresponde ao nome do chat
      return MOCK_FLIGHTS.find(f => 
          f.operator && activeChat.name.toLowerCase().includes(f.operator.toLowerCase())
      );
  }, [activeChat]);

  const groupedOperators = useMemo(() => {
    if (activeCategory !== 'OPERADORES') return null;
    const filtered = allTargets.filter(t => t.category === 'OPERADORES' && (statusFilter === 'TODOS' || t.status === statusFilter));
    const groups: Record<ShiftCycle, Record<OperatorStatus, ChatTarget[]>> = {} as any;
    filtered.forEach(target => {
      const shift = target.rawProfile?.shift.cycle || 'MANHÃ';
      const status = target.status;
      if (!groups[shift]) groups[shift] = {} as any;
      if (!groups[shift][status]) groups[shift][status] = [];
      groups[shift][status].push(target);
    });
    return groups;
  }, [allTargets, activeCategory, statusFilter]);

  const toggleGroup = (groupId: string) => {
    const next = new Set(expandedGroups);
    if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
    setExpandedGroups(next);
  };

  const getStatusColor = (status: OperatorStatus) => {
    switch (status) {
      case 'DISPONÍVEL': return 'bg-emerald-500';
      case 'OCUPADO': return 'bg-amber-500';
      case 'INTERVALO': return 'bg-slate-400';
      case 'DESCONECTADO': return 'bg-red-400';
      case 'ENCHIMENTO': return 'bg-blue-500';
      default: return 'bg-slate-300';
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setInputText('');
  };

  return (
    <div className="w-full h-full flex bg-slate-50 dark:bg-[#020611] overflow-hidden font-sans transition-colors duration-500">
      
      {/* === PAINEL ESQUERDO: LISTA DE CONTATOS === */}
      <div className="w-80 lg:w-96 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] shrink-0 z-10 transition-colors">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
              <MessageSquare size={20} className="text-blue-600 dark:text-blue-500" />
              Central
            </h2>
            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                <Settings2 size={16} />
            </div>
          </div>

          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar operador ou canal..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
            {(['OPERADORES', 'COMPANHIAS', 'SISTEMA'] as ChatCategory[]).map(f => (
              <button 
                key={f}
                onClick={() => { setActiveCategory(f); setStatusFilter('TODOS'); }}
                className={`flex-1 py-2 text-[9px] font-black rounded-lg transition-all ${
                  activeCategory === f 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {f === 'OPERADORES' ? 'EQUIPE' : f === 'COMPANHIAS' ? 'CIAS' : 'ALERTAS'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {activeCategory === 'OPERADORES' && groupedOperators ? (
             Object.entries(groupedOperators).map(([shift, statuses]) => (
                <div key={shift} className="mb-4">
                  <button onClick={() => toggleGroup(shift)} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300">
                    <span>TURNO {shift}</span>
                    <ChevronDown size={12} className={`transition-transform ${expandedGroups.has(shift) ? '' : '-rotate-90'}`} />
                  </button>
                  {expandedGroups.has(shift) && Object.entries(statuses).map(([status, targets]) => (
                    <div key={status} className="mt-1 space-y-1">
                      {targets.map(target => (
                        <button 
                          key={target.id} 
                          onClick={() => setActiveChatId(target.id)} 
                          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all border group relative ${
                            activeChatId === target.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' 
                            : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden ${
                            activeChatId === target.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {target.photoUrl ? (
                                <img src={target.photoUrl} alt={target.name} className="w-full h-full object-cover" />
                            ) : (
                                target.avatarText
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-[13px] font-bold ${activeChatId === target.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{target.name}</span>
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(target.status)}`}></div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium truncate block mt-0.5">{target.subtext}</span>
                          </div>
                          
                          {/* INDICADOR DE MENSAGEM NÃO LIDA */}
                          {target.unreadCount && target.unreadCount > 0 && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 min-w-[20px] h-5 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5 shadow-md animate-in zoom-in">
                              {target.unreadCount}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
             ))
          ) : (
             <div className="p-4 space-y-1">
                {allTargets.filter(t => t.category === activeCategory).map(target => (
                    <button key={target.id} onClick={() => setActiveChatId(target.id)} className="w-full flex items-center gap-4 p-4 rounded-xl border border-transparent hover:bg-slate-50 dark:hover:bg-slate-900 transition-all relative">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><target.icon size={20} /></div>
                        <div className="text-left">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{target.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{target.subtext}</span>
                        </div>
                        {target.unreadCount && target.unreadCount > 0 && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 min-w-[20px] h-5 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5">
                                {target.unreadCount}
                            </div>
                        )}
                    </button>
                ))}
             </div>
          )}
        </div>
      </div>

      {/* === PAINEL DIREITO: CONVERSA HUD === */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-[#020611] transition-colors">
        {activeChat ? (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            
            {/* CHAT HEADER REDESIGNED */}
            <div className="h-24 border-b border-slate-100 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0a0f1d]/80 backdrop-blur-md relative z-20 shadow-sm">
                
                {/* LADO ESQUERDO: OPERADOR */}
                <div className="flex items-center gap-5">
                    <div className="relative">
                         <div className={`w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-black text-xl shadow-xl shadow-slate-900/20 dark:shadow-white/10 overflow-hidden`}>
                            {activeChat.photoUrl ? (
                                <img src={activeChat.photoUrl} alt={activeChat.name} className="w-full h-full object-cover" />
                            ) : (
                                activeChat.avatarText || 'OPS'
                            )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#0a0f1d] ${getStatusColor(activeChat.status)}`}></div>
                    </div>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                             <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">{activeChat.name}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{activeChat.subtext}</span>
                    </div>
                </div>

                {/* CENTRO/DIREITA: CONTEXTO DE VOO (NOVO) */}
                {activeMission && (
                    <div className="hidden lg:flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 pr-6 rounded-2xl">
                        <div className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-emerald-500">
                            <Plane size={20} />
                        </div>
                        <div className="flex flex-col border-r border-slate-200 dark:border-slate-800 pr-6 mr-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Missão Ativa</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none tracking-tighter">{activeMission.flightNumber}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                                <Hash size={10} className="text-slate-400" />
                                {activeMission.registration}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                                <MapPin size={10} className="text-slate-400" />
                                {activeMission.destination}
                            </div>
                        </div>
                        <div className="flex flex-col items-end ml-4">
                             <span className="text-[8px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded uppercase tracking-widest">
                                 {activeMission.status}
                             </span>
                        </div>
                    </div>
                )}

                {/* AÇÕES */}
                <div className="flex items-center gap-2">
                    <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-2xl transition-all"><Phone size={20}/></button>
                    <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-2xl transition-all"><MoreVertical size={20}/></button>
                </div>
            </div>

            {/* MESSAGE FEED */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 dark:bg-[#050a10] custom-scrollbar">
                <div className="flex justify-center">
                    <div className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                        Comunicação Segura • AES-256
                    </div>
                </div>

                <div className="flex justify-start">
                    <div className="max-w-[75%] bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl rounded-tl-none shadow-sm dark:shadow-none">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Operação de solo iniciada no portão 204. Pressão nominal estabilizada em 120 PSI. Aguardando autorização de bombeamento.</p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-3 text-right">08:42 AM</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="max-w-[75%] bg-blue-600 text-white p-5 rounded-3xl rounded-tr-none shadow-lg shadow-blue-600/10">
                        <p className="text-sm font-medium leading-relaxed italic">"Ciente. Prossiga com o bombeamento conforme malha operacional. Mantenha canal de emergência aberto."</p>
                        <span className="text-[9px] text-blue-100 font-bold block mt-3 text-right">08:44 AM</span>
                    </div>
                </div>
            </div>

            {/* INPUT CONSOLE */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0a0f1d]">
                <div className="flex items-center gap-3 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {["Ciente.", "Prossiga.", "Negativo.", "Aguarde.", "Confirmado."].map(r => (
                        <button key={r} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 transition-all border border-transparent whitespace-nowrap uppercase">
                            {r}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all shadow-inner">
                    <button className="p-3 text-slate-400 hover:text-blue-600"><Paperclip size={20}/></button>
                    <input 
                        type="text" 
                        placeholder="Transmitir mensagem..." 
                        className="flex-1 bg-transparent border-none text-sm text-slate-800 dark:text-white outline-none font-medium px-2 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                        onClick={handleSendMessage}
                        className="px-8 py-3 bg-blue-600 text-white font-black text-[11px] uppercase rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                        Enviar
                    </button>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#050a10] opacity-10 select-none">
            <Radio size={200} className="text-blue-600 mb-8" />
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-[0.5em] uppercase">JET OPS HUB</h2>
          </div>
        )}
      </div>
    </div>
  );
};
