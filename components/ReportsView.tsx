
import React, { useState, useMemo } from 'react';
import { FlightStatus, FlightData } from '../types';
import { 
  FileText, CheckCircle, Clock, AlertTriangle, XCircle, 
  Printer, Download, ChevronLeft, Calendar, FileBarChart,
  User, MapPin, Hash, Truck, History, MessageSquare, Headphones, Search, TimerOff
} from 'lucide-react';

interface ReportsViewProps {
    flights: FlightData[];
}

type ReportTab = 'FINALIZADOS' | 'ATRASADOS' | 'TROCADOS' | 'CANCELADOS';

// Densidade média Jet A-1 para conversão aproximada
const AVG_DENSITY = 0.803; 
// Fator de conversão Litros para Galões (US)
const L_TO_GAL = 0.264172;

// Helper de simulação de atraso
const isDelayed = (flight: FlightData) => {
    if (!flight.endTime || !flight.etd) return false;
    const [h, m] = flight.etd.split(':').map(Number);
    const etdDate = new Date(flight.endTime); 
    etdDate.setHours(h, m, 0, 0);
    return flight.endTime.getTime() > etdDate.getTime();
};

export const ReportsView: React.FC<ReportsViewProps> = ({ flights }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('FINALIZADOS');
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const historicalData = useMemo(() => {
      const base = flights.filter(f => f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO);
      return {
          finalizados: base, // Agora inclui TODOS os finalizados/cancelados
          atrasados: base.filter(f => f.status === FlightStatus.FINALIZADO && isDelayed(f)),
          trocados: base.filter(f => f.status === FlightStatus.FINALIZADO && f.logs.some(l => l.message.toLowerCase().includes('troca'))), 
          cancelados: base.filter(f => f.status === FlightStatus.CANCELADO),
      };
  }, [flights]);

  const currentList = useMemo(() => {
      let list: FlightData[] = [];
      switch(activeTab) {
          case 'FINALIZADOS': list = historicalData.finalizados; break;
          case 'ATRASADOS': list = historicalData.atrasados; break;
          case 'TROCADOS': list = historicalData.trocados; break;
          case 'CANCELADOS': list = historicalData.cancelados; break;
      }

      if (!searchTerm) return list;

      const lowerTerm = searchTerm.toLowerCase();
      return list.filter(f => 
          f.flightNumber.toLowerCase().includes(lowerTerm) ||
          f.registration.toLowerCase().includes(lowerTerm) ||
          f.positionId.toLowerCase().includes(lowerTerm) ||
          f.airline.toLowerCase().includes(lowerTerm) ||
          (f.operator && f.operator.toLowerCase().includes(lowerTerm))
      );
  }, [activeTab, historicalData, searchTerm]);

  const handlePrint = () => {
      window.print();
  };

  const handlePdf = () => {
      // Altera temporariamente o título da página para que o arquivo PDF salvo tenha um nome decente
      const originalTitle = document.title;
      document.title = `RELATORIO_ABASTECIMENTO_${selectedFlight?.flightNumber || 'VOO'}_${selectedFlight?.registration || 'NAV'}`;
      window.print(); // Aciona o diálogo de impressão onde "Salvar como PDF" é uma opção nativa
      document.title = originalTitle;
  };

  const tabs: { id: ReportTab; label: string; icon: React.ElementType; color: string; count: number }[] = [
      { id: 'FINALIZADOS', label: 'Histórico Geral', icon: CheckCircle, color: 'text-slate-400', count: historicalData.finalizados.length },
      { id: 'ATRASADOS', label: 'Atrasados', icon: Clock, color: 'text-amber-500', count: historicalData.atrasados.length },
      { id: 'TROCADOS', label: 'Trocados', icon: AlertTriangle, color: 'text-purple-500', count: historicalData.trocados.length },
      { id: 'CANCELADOS', label: 'Cancelados', icon: XCircle, color: 'text-red-500', count: historicalData.cancelados.length },
  ];

  const getStatusBadge = (flight: FlightData) => {
      if (flight.status === FlightStatus.CANCELADO) {
          return { label: 'CANCELADO', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
      }
      
      const hasSwap = flight.logs.some(l => l.message.toLowerCase().includes('troca'));
      if (hasSwap) {
          return { label: 'COM TROCA', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      }

      if (isDelayed(flight) || flight.delayJustification) {
          return { label: 'COM ATRASO', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
      }

      return { label: 'COM SUCESSO', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const getReportIconStyle = (flight: FlightData) => {
      const isDelay = isDelayed(flight) || !!flight.delayJustification;
      const hasSwap = flight.logs.some(l => l.message.toLowerCase().includes('troca'));
      const hasLogs = flight.logs.length > 0; // Assumindo >0 pois sempre tem logs de sistema

      if (isDelay || hasSwap) {
          return 'text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'; // Alerta
      }
      
      // Se tiver logs manuais (filtrando os de sistema para saber se é "curiosidade")
      const manualLogs = flight.logs.filter(l => l.type === 'MANUAL' || l.type === 'OBSERVACAO');
      if (manualLogs.length > 0) {
          return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20'; // Curiosidade
      }

      return 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'; // Padrão Sucesso
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#020617] overflow-hidden">
        
        {selectedFlight ? (
            // === VISUALIZAÇÃO DE RELATÓRIO TÉCNICO ===
            <div className="flex-1 flex flex-col items-center overflow-y-auto bg-slate-900/90 backdrop-blur-sm p-8 animate-in fade-in zoom-in-95 duration-300 relative z-50">
                
                {/* ACTIONS BAR (Classe no-print oculta isso na impressão) */}
                <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 text-white no-print">
                    <button 
                        onClick={() => setSelectedFlight(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} /> Voltar
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium"
                        >
                            <Printer size={16} /> Imprimir
                        </button>
                        <button 
                            onClick={handlePdf}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-lg shadow-emerald-600/20"
                            title="Gerar PDF via Impressão"
                        >
                            <Download size={16} /> PDF
                        </button>
                    </div>
                </div>

                {/* A4 SHEET SIMULATION - ID usado pelo CSS @media print */}
                <div id="printable-report-container" className="w-[210mm] min-h-[297mm] bg-white text-slate-950 p-12 shadow-2xl rounded-sm flex flex-col font-sans">
                    
                    {/* CABEÇALHO */}
                    <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight mb-1 flex items-center gap-2">
                                <FileBarChart size={24} className="text-slate-900" />
                                Relatório de Operações
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Registro Operacional • ID: {selectedFlight.id.toUpperCase()}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="block text-3xl font-mono font-black text-slate-900">{selectedFlight.flightNumber}</span>
                            <span className="block text-xs font-bold uppercase text-slate-500 mt-1">
                                {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>

                    {/* ALERT DE ATRASO SE HOUVER */}
                    {selectedFlight.delayJustification && (
                        <div className="mb-8 border border-amber-500/50 bg-amber-50 rounded-lg p-4 flex gap-4 items-start">
                            <div className="text-amber-600 shrink-0 mt-1">
                                <TimerOff size={24} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">
                                    Análise de Discrepância de Horário (Atraso)
                                </h3>
                                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                                    <span className="font-bold">ETD Previsto:</span> {selectedFlight.etd} • <span className="font-bold">Finalização Real:</span> {selectedFlight.endTime?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </p>
                                <div className="mt-2 text-xs text-slate-900 border-l-2 border-amber-500 pl-3 italic">
                                    "{selectedFlight.delayJustification}"
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DADOS DO VOO (GRID SIMPLES) */}
                    <div className="mb-8">
                        <h2 className="text-xs font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-600">
                            Dados da Missão
                        </h2>
                        <div className="grid grid-cols-4 gap-y-4 gap-x-8 text-sm">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Companhia</span>
                                <span className="font-bold text-slate-900">{selectedFlight.airline} ({selectedFlight.airlineCode})</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Aeronave</span>
                                <span className="font-bold text-slate-900 font-mono">{selectedFlight.registration}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Modelo</span>
                                <span className="font-bold text-slate-900">{selectedFlight.model}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Rota</span>
                                <span className="font-bold text-slate-900">{selectedFlight.origin} / {selectedFlight.destination}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Posição</span>
                                <span className="font-bold text-slate-900">{selectedFlight.positionId}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">ETD (Saída)</span>
                                <span className="font-bold text-slate-900 font-mono">{selectedFlight.etd}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Frota Utilizada</span>
                                <span className="font-bold text-slate-900 uppercase">{selectedFlight.fleet ? `CTA-${selectedFlight.fleet}` : 'REDE HIDRANTE'}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Tipo Eqp.</span>
                                <span className="font-bold text-slate-900 uppercase">{selectedFlight.vehicleType}</span>
                            </div>
                        </div>
                    </div>

                    {/* DADOS OPERACIONAIS E VOLUMETRIA */}
                    <div className="mb-8">
                        <h2 className="text-xs font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-600">
                            Execução e Volumetria
                        </h2>
                        
                        {/* Linha de Tempos */}
                        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded border border-slate-200">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Hora Designação</span>
                                <span className="font-mono font-bold text-slate-900">
                                    {selectedFlight.designationTime ? selectedFlight.designationTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Início Abastecimento</span>
                                <span className="font-mono font-bold text-slate-900">
                                    {selectedFlight.startTime ? selectedFlight.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Término Abastecimento</span>
                                <span className="font-mono font-bold text-slate-900">
                                    {selectedFlight.endTime ? selectedFlight.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Operador Responsável</span>
                                <span className="font-bold text-slate-900 uppercase">{selectedFlight.operator || 'NÃO ATRIBUÍDO'}</span>
                            </div>
                        </div>

                        {/* Tabela de Volumes */}
                        <div className="border border-slate-300 rounded overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2 border-r border-slate-300">Unidade</th>
                                        <th className="px-4 py-2 text-right">Quantidade Fornecida</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-slate-900 font-mono font-bold">
                                    <tr>
                                        <td className="px-4 py-2 border-r border-slate-200 text-xs uppercase">Litros (L)</td>
                                        <td className="px-4 py-2 text-right">{selectedFlight.volume?.toLocaleString() || 0}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border-r border-slate-200 text-xs uppercase">Quilogramas (KG) <span className="text-[9px] text-slate-400 font-normal">@0.803</span></td>
                                        <td className="px-4 py-2 text-right">
                                            {selectedFlight.volume ? Math.round(selectedFlight.volume * AVG_DENSITY).toLocaleString() : 0}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border-r border-slate-200 text-xs uppercase">Galões (US GAL)</td>
                                        <td className="px-4 py-2 text-right">
                                            {selectedFlight.volume ? Math.round(selectedFlight.volume * L_TO_GAL).toLocaleString() : 0}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CAIXA PRETA - LOG DE EVENTOS */}
                    <div className="mb-8">
                        <h2 className="text-xs font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-4 text-slate-600 flex items-center gap-2">
                            <History size={14} /> Log de Eventos (Caixa Preta)
                        </h2>
                        
                        <div className="border-l-2 border-slate-200 ml-2 space-y-3 py-1">
                            {selectedFlight.logs && selectedFlight.logs.length > 0 ? (
                                selectedFlight.logs.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()).map((log, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                            log.type === 'SISTEMA' ? 'bg-slate-400' : 
                                            log.type === 'MANUAL' ? 'bg-blue-500' :
                                            log.type === 'ATRASO' ? 'bg-amber-500' :
                                            log.type === 'OBSERVACAO' ? 'bg-amber-500' : 'bg-red-500'
                                        }`}></div>
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-2 text-[10px] uppercase font-bold text-slate-500">
                                                <span className="font-mono text-slate-800">{log.timestamp.toLocaleTimeString()}</span>
                                                <span>•</span>
                                                <span>{log.type}</span>
                                                <span>•</span>
                                                <span className="text-slate-700">{log.author}</span>
                                            </div>
                                            <p className="text-xs text-slate-800 mt-0.5 font-medium leading-relaxed">
                                                {log.message}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="pl-6 text-xs text-slate-400 italic">Nenhum evento registrado.</div>
                            )}
                        </div>
                    </div>

                    {/* RODAPÉ DO SISTEMA */}
                    <div className="mt-auto pt-6 border-t border-slate-200 text-[9px] font-mono text-slate-400 text-center uppercase tracking-widest">
                        JETFUEL-SIM Audit System • Documento Gerado Eletronicamente • Não Requer Assinatura
                    </div>

                </div>
            </div>
        ) : (
            // === LISTA DE RELATÓRIOS (DASHBOARD) ===
            <>
                <div className="h-20 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
                    <div>
                        <h1 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <FileBarChart className="text-emerald-500" />
                            Relatórios de Operações
                        </h1>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">A caixa preta dos abastecimentos!</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="BUSCAR REGISTRO..." 
                                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-[10px] text-white font-mono uppercase focus:border-emerald-500/50 outline-none w-48 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                                        ${activeTab === tab.id 
                                            ? 'bg-slate-800 text-white shadow-lg border border-slate-700' 
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}
                                    `}
                                >
                                    <tab.icon size={14} className={activeTab === tab.id ? tab.color : 'opacity-50'} />
                                    {tab.label}
                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] ${activeTab === tab.id ? 'bg-slate-950 text-white' : 'bg-slate-900 text-slate-600'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-1">
                        {/* HEADER DA TABELA */}
                        <div className="grid grid-cols-12 px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 rounded-t-xl border-b border-slate-800">
                            <div className="col-span-1 text-center">Voo</div>
                            <div className="col-span-1 text-center">Prefixo</div>
                            <div className="col-span-1 text-center">Posição</div>
                            <div className="col-span-2 text-center">Rota</div>
                            <div className="col-span-2 text-center">Horários (Início - Fim)</div>
                            <div className="col-span-1 text-center">Volume</div>
                            <div className="col-span-2 text-center">Status Final</div>
                            <div className="col-span-2 text-right pr-4">Ação</div>
                        </div>

                        {currentList.length > 0 ? (
                            currentList.map(flight => {
                                const badge = getStatusBadge(flight);
                                const iconStyle = getReportIconStyle(flight);

                                return (
                                <div 
                                    key={flight.id}
                                    onClick={() => setSelectedFlight(flight)}
                                    className="grid grid-cols-12 items-center px-6 py-4 bg-[#0a0f1d] border border-slate-800/50 hover:border-emerald-500/30 hover:bg-slate-900 transition-all cursor-pointer group"
                                >
                                    <div className="col-span-1 text-center font-mono font-bold text-white text-sm">{flight.flightNumber}</div>
                                    <div className="col-span-1 text-center font-mono text-emerald-500 text-xs">{flight.registration}</div>
                                    <div className="col-span-1 text-center">
                                        <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300">{flight.positionId}</span>
                                    </div>
                                    <div className="col-span-2 text-center flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400">
                                        <span>{flight.origin}</span>
                                        <div className="w-4 h-[1px] bg-slate-700"></div>
                                        <span>{flight.destination}</span>
                                    </div>
                                    <div className="col-span-2 text-center font-mono text-xs text-slate-400">
                                        {flight.startTime ? flight.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} - {flight.endTime ? flight.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                    </div>
                                    <div className="col-span-1 text-center font-mono text-xs text-white">{flight.volume?.toLocaleString() || 0} L</div>
                                    
                                    {/* STATUS BADGE VISUAL */}
                                    <div className="col-span-2 flex justify-center">
                                        <div className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-wider ${badge.color}`}>
                                            {badge.label}
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex justify-end">
                                        <button className={`flex items-center gap-2 text-[9px] font-black border px-3 py-1.5 rounded transition-all uppercase tracking-widest ${iconStyle}`}>
                                            <FileText size={12} /> Relatório
                                        </button>
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div className="py-20 text-center flex flex-col items-center opacity-30">
                                <FileBarChart size={48} className="mb-4 text-slate-500" />
                                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Nenhum registro encontrado nesta categoria</span>
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
    </div>
  );
};
