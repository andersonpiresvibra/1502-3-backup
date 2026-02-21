
import React, { useState, useEffect } from 'react';
import { ViewState, FlightData } from './types';
import { MOCK_FLIGHTS } from './data/mockData'; // Importação inicial apenas
import { GridOps } from './components/GridOps';
import { Aerodromo } from './components/Aerodromo';
import { OperatorManager } from './components/OperatorManager';
import { TeamManager } from './components/TeamManager';
import { MessageCenter } from './components/MessageCenter';
import { LoginScreen } from './components/LoginScreen';
import { RefuelingConsole } from './components/RefuelingConsole';
import { PoolManager } from './components/PoolManager';
import { ReportsView } from './components/ReportsView';
import { 
  Plane, Settings, Sun, Moon, Maximize, Minimize, User, Table, 
  LogOut, Users, Truck, Radar,
  Database, MessageSquare, FileBarChart
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<ViewState>('GRID_OPS');
  
  // === ESTADO CENTRALIZADO (A VERDADE ÚNICA) ===
  // Todos os componentes filhos agora leem e escrevem nesta lista
  const [globalFlights, setGlobalFlights] = useState<FlightData[]>(MOCK_FLIGHTS);

  const [activeFlight, setActiveFlight] = useState<FlightData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
        clearInterval(timer);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.getHours().toString().padStart(2, '0') + 'H' + date.getMinutes().toString().padStart(2, '0');
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase().split('-')[0];
    return `${weekDay} - ${day}/${month}/${date.getFullYear().toString().slice(-2)}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(console.error);
    else document.exitFullscreen();
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setView('GRID_OPS');
  };

  const handleOpenConsole = (flight: FlightData) => {
    setActiveFlight(flight);
    setView('REFUELING_CONSOLE');
  };

  const getSidebarClasses = () => {
    const base = "bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-900 flex flex-col justify-between shrink-0 transition-all duration-300 z-50 shadow-2xl relative overflow-x-hidden";
    return `${base} ${isSidebarHovered ? "w-48" : "w-20"}`;
  };

  const textVisibilityClass = isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 hidden';

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  const NavButton = ({ target, icon: Icon, label }: { target: ViewState, icon: any, label: string }) => (
    <button 
      onClick={() => setView(target)}
      className={`w-full flex items-center transition-all relative whitespace-nowrap overflow-hidden group h-14 
        hover:bg-emerald-500/[0.06] dark:hover:bg-emerald-500/[0.08] ${
        view === target 
          ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/[0.03]' 
          : 'text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'
      }`}
    >
      <div className={`absolute left-0 w-[3px] transition-all duration-300 rounded-r-full ${
        view === target 
          ? 'h-6 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] opacity-100' 
          : 'h-0 bg-slate-300 dark:bg-slate-800 opacity-0 group-hover:h-4 group-hover:opacity-50'
      }`}></div>

      <div className="w-20 flex items-center justify-center shrink-0">
        <Icon 
          size={20} 
          className={`transition-all duration-300 ${
              view === target ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.6)]' : 'group-hover:text-emerald-500'
          }`} 
        />
      </div>
      
      <span className={`font-black text-[10px] uppercase tracking-[0.1em] transition-all duration-300 ${textVisibilityClass} ${
          view === target ? 'text-white' : ''
      }`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-screen overflow-hidden`}>
      <div className="flex h-full w-full bg-slate-950 dark:bg-[#020611] text-slate-200 transition-colors duration-500 font-sans">
        
        <aside 
            className={getSidebarClasses()}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <div className="flex flex-col h-full justify-between">
              <div>
                <div className="h-20 flex items-center border-b border-slate-800 dark:border-slate-900 overflow-hidden shrink-0">
                  <div className="w-20 flex items-center justify-center shrink-0">
                    <div className="bg-emerald-500 p-1.5 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                       <Plane className="text-white" size={18} />
                    </div>
                  </div>
                  <span className={`font-black text-xs tracking-tighter text-white transition-all duration-300 whitespace-nowrap uppercase ${textVisibilityClass}`}>
                    JETFUEL-SIM
                  </span>
                </div>

                <nav className="py-4 space-y-1">
                  <NavButton target="GRID_OPS" icon={Table} label="Malha" />
                  <NavButton target="AERODROMO" icon={Radar} label="Aeródromo" />
                  <NavButton target="POOL_MANAGER" icon={Database} label="Pool / SCADA" />
                  <NavButton target="OPERATORS" icon={Truck} label="Frotas" />
                  <NavButton target="TEAM" icon={Users} label="Equipe" />
                  <NavButton target="REPORTS" icon={FileBarChart} label="Relatórios" />
                  <NavButton target="MESSAGES" icon={MessageSquare} label="Mensagens" />
                </nav>
              </div>

              <div className="py-4 border-t border-slate-800 dark:border-slate-900 space-y-1">
                 <button className="w-full flex items-center text-slate-400 dark:text-slate-600 hover:text-white hover:bg-emerald-500/[0.06] transition-all overflow-hidden group h-14">
                    <div className="w-20 flex items-center justify-center shrink-0">
                      <Settings size={20} className="transition-colors duration-300 group-hover:text-emerald-500" />
                    </div>
                    <span className={`font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${textVisibilityClass}`}>
                        Ajustes
                    </span>
                 </button>
                 <button onClick={handleLogout} className="w-full flex items-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all overflow-hidden group h-14">
                    <div className="w-20 flex items-center justify-center shrink-0">
                      <LogOut size={20} className="transition-colors duration-300" />
                    </div>
                    <span className={`font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${textVisibilityClass}`}>
                        Sair
                    </span>
                 </button>
              </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="h-20 bg-slate-900/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-800 dark:border-slate-900 flex items-center justify-between px-8 z-40 transition-colors">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SISTEMA:</span>
                  <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> OPERACIONAL
                  </span>
               </div>
               <div className="hidden md:flex items-center gap-3 font-mono">
                  <span className="text-xl font-black text-white tracking-tighter">{formatTime(currentTime)}</span>
                  <span className="text-slate-300 dark:text-slate-800">|</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-0.5">{formatDate(currentTime)}</span>
               </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleFullscreen} className="p-2.5 text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all">
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all">
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2"></div>
              <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                  <div className="hidden lg:flex flex-col items-end">
                      <span className="text-xs font-black text-white group-hover:text-emerald-500 transition-colors">OPERADOR_ADMIN</span>
                      <span className="text-[8px] text-emerald-500 font-black tracking-widest uppercase">Líder de Solo</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg group-hover:border-emerald-500/50 transition-colors">
                      <User size={18} className="text-slate-400 group-hover:text-white" />
                  </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative">
              {/* PASSANDO O ESTADO GLOBAL PARA OS COMPONENTES */}
              {view === 'GRID_OPS' && (
                <GridOps 
                  flights={globalFlights} 
                  onUpdateFlights={setGlobalFlights} 
                />
              )}
              {view === 'AERODROMO' && <Aerodromo onSelectFlight={handleOpenConsole} />}
              {view === 'POOL_MANAGER' && <PoolManager />}
              {view === 'OPERATORS' && <OperatorManager />}
              {view === 'TEAM' && <TeamManager />}
              {view === 'MESSAGES' && <MessageCenter />}
              {/* RELATÓRIOS AGORA RECEBEM OS DADOS GLOBAIS */}
              {view === 'REPORTS' && <ReportsView flights={globalFlights} />}
              {view === 'REFUELING_CONSOLE' && activeFlight && (
                <RefuelingConsole flight={activeFlight} onExit={() => setView('AERODROMO')} />
              )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
