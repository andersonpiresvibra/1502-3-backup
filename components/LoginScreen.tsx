
import React, { useState, useEffect } from 'react';
import { Plane, Lock, ArrowRight, Activity, ShieldCheck, Maximize, Minimize, Users, CheckCircle2, Cpu } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const RadarBackground: React.FC = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
      <div className="absolute inset-0 border border-emerald-500/20 rounded-full"></div>
      <div className="absolute inset-[15%] border border-emerald-500/15 rounded-full"></div>
      <div className="absolute inset-[30%] border border-emerald-500/10 rounded-full"></div>
      <div className="absolute inset-[45%] border border-emerald-500/5 rounded-full"></div>
      <div className="absolute top-1/2 left-0 w-full h-px bg-emerald-500/10"></div>
      <div className="absolute left-1/2 top-0 h-full w-px bg-emerald-500/10"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full animate-[spin_4s_linear_infinite] origin-center shadow-[inset_0_0_50px_rgba(16,185,129,0.1)]"></div>
      <div className="absolute top-[20%] left-[35%] w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
      <div className="absolute top-[60%] left-[70%] w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
      <div className="absolute top-[45%] left-[15%] w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
    </div>
  </div>
);

/**
 * Login screen component for authenticating operators.
 * Fixed: Destructured onLogin from props to resolve "Cannot find name 'onLogin'" error.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [time, setTime] = useState(new Date());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSuccessHUD, setShowSuccessHUD] = useState(false);

  const bootSequence = [
    "SINCRO_CIA: CARREGANDO COMPANHIAS AÉREAS...",
    "SINCRO_REG: MAPEANDO PREFIXOS DA FROTA...",
    "SINCRO_FLT: PROCESSANDO DADOS DE VOOS...",
    "SINCRO_DEST: VALIDANDO DESTINOS...",
    "SINCRO_ICAO: INDEXANDO CÓDIGOS ICAO...",
    "SINCRO_ORIG: RASTREANDO ORIGENS...",
    "SINCRO_POS: MAPEANDO POSIÇÕES NO PÁTIO...",
    "SINCRO_GRID: CARREGANDO MALHA DE VOOS...",
    "SINCRO_OPS: SINCRONIZANDO OPERADORES...",
    "SINCRO_FLEET: INDEXANDO FROTAS ATIVAS...",
    "SINCRO_MSG: RECUPERANDO MENSAGENS E NOTIFICAÇÕES...",
    "SISTEMA SINCRONIZADO COM SUCESSO!"
  ];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(console.error);
    else document.exitFullscreen();
  };

  const startSequence = () => {
    setIsLoading(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setBootStep(step);
      if (step >= bootSequence.length) {
        clearInterval(interval);
        // Ativa a animação de sucesso (o "abrir o sorriso")
        setTimeout(() => setShowSuccessHUD(true), 500);
        setTimeout(() => onLogin(), 2500);
      }
    }, 350);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    startSequence();
  };

  const handleVisitorAccess = () => {
    setEmail('visitante.sim');
    setPassword('******');
    startSequence();
  };

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden flex flex-col items-center justify-center text-slate-200 font-sans selection:bg-emerald-500/30">
      
      <RadarBackground />

      {/* HUD Scan Animation */}
      {isLoading && !showSuccessHUD && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
          <style>{`
            @keyframes scan {
              0% { top: 0%; }
              100% { top: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* SUCCESS SMILE HUD - A animação que faz abrir o sorriso */}
      {showSuccessHUD && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-500/5 backdrop-blur-sm animate-in fade-in duration-500">
           <div className="flex flex-col items-center animate-in zoom-in-125 duration-700">
              <div className="w-32 h-32 rounded-full border-4 border-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] bg-emerald-500/10">
                 <CheckCircle2 size={64} className="text-emerald-500 animate-[bounce_1s_infinite]" />
              </div>
              <h2 className="mt-8 text-4xl font-black text-white tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">READY TO OPS</h2>
              <p className="mt-2 text-emerald-400 font-mono text-sm font-bold tracking-widest">BIOMETRIA CONFIRMADA</p>
           </div>
        </div>
      )}

      <button onClick={toggleFullscreen} className="absolute top-6 right-6 z-50 p-2 text-slate-600 hover:text-emerald-400 transition-all group">
         {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center">
        
        <div className={`flex flex-col items-center mb-10 transition-all duration-700 ${isLoading ? 'opacity-0 -translate-y-10 scale-90 blur-lg' : 'opacity-100 scale-100'}`}>
           <div className="relative group cursor-pointer mb-6">
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
                     <Plane className="text-emerald-500" size={40} />
                </div>
           </div>
           <h1 className="text-6xl font-black font-mono tracking-tighter text-white mb-2">
                {time.getHours().toString().padStart(2, '0')}<span>:</span>{time.getMinutes().toString().padStart(2, '0')}
           </h1>
           <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase">
             {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}
           </p>
        </div>

        <div className="w-full relative min-h-[350px]">
            {isLoading && !showSuccessHUD && (
                <div className="absolute inset-0 flex flex-col items-start justify-center font-mono text-[10px] space-y-2 pl-6 border-l-2 border-emerald-500/30">
                    {bootSequence.map((msg, index) => (
                        index < bootStep && (
                            <div key={index} className="flex items-center gap-3 text-emerald-400/90 animate-in slide-in-from-left-2 duration-200">
                                <span className="opacity-40">[{index.toString().padStart(2, '0')}]</span>
                                <span className="tracking-widest">{msg}</span>
                            </div>
                        )
                    ))}
                    {bootStep < bootSequence.length && <div className="w-2 h-4 bg-emerald-500 mt-2 ml-10"></div>}
                </div>
            )}

            <form onSubmit={handleLogin} className={`flex flex-col gap-6 transition-all duration-500 ${isLoading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <div className="group">
                    <label className="text-[10px] uppercase font-black text-slate-500 mb-2 block tracking-[0.2em] group-focus-within:text-emerald-500 transition-colors">Posto de Comando</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#0a0f1d]/50 border border-slate-800 focus:border-emerald-500/50 text-slate-200 py-3.5 pl-10 pr-4 rounded-xl outline-none transition-all font-mono text-xs"
                            placeholder="operador.sim"
                        />
                        <Activity className="absolute left-3.5 top-3.5 text-slate-700 group-focus-within:text-emerald-500 transition-colors" size={16} />
                    </div>
                </div>

                <div className="group">
                    <label className="text-[10px] uppercase font-black text-slate-500 mb-2 block tracking-[0.2em] group-focus-within:text-emerald-500 transition-colors">Chave Cripto</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#0a0f1d]/50 border border-slate-800 focus:border-emerald-500/50 text-slate-200 py-3.5 pl-10 pr-4 rounded-xl outline-none transition-all font-mono text-xs"
                            placeholder="••••••••"
                        />
                        <Lock className="absolute left-3.5 top-3.5 text-slate-700 group-focus-within:text-emerald-500 transition-colors" size={16} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl flex items-center justify-between px-8 transition-all group shadow-lg shadow-emerald-500/20 hover:bg-emerald-400">
                      <span className="tracking-[0.2em] text-[11px]">INICIAR JETFUEL-SIM</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button type="button" onClick={handleVisitorAccess} className="w-full bg-transparent border border-slate-800 text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all text-[11px] tracking-[0.2em]">
                      <Users size={16} /> ACESSO VISITANTE
                  </button>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-700 font-mono uppercase tracking-widest mt-2">
                    <span>V.12.02.26</span>
                    <span>PROTOCOLO_AES_X</span>
                </div>
            </form>
        </div>
      </div>
      <div className="absolute bottom-8 text-[9px] text-slate-800 font-black uppercase tracking-[0.6em]">&copy; 2026 JETFUEL SIMULATOR</div>
    </div>
  );
};
