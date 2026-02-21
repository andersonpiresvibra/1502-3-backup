
import { GoogleGenAI } from "@google/genai";
import { FlightData, TankData, PitData, FlightStatus } from '../types';

// Inicialização segura usando a variável de ambiente
let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      console.warn("GEMINI_API_KEY não configurada. Funções de IA estarão limitadas.");
      // Retorna uma instância dummy ou lança erro apenas quando usado
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return aiInstance;
};

/**
 * Analisa a logística dos voos considerando integridade dos Pits e Posições.
 */
export const analyzeLogistics = async (flights: FlightData[], pits: PitData[]): Promise<string> => {
  try {
    const ai = getAi();
    const pitSummary = pits.map(p => `PIT ${p.id}: ${p.isActive ? 'ATIVO' : 'INATIVO'}`).join('\n');
    const flightSummary = flights.map(f => 
      `MISSÃO: ${f.flightNumber} | POSIÇÃO: ${f.positionId} | ASSET: ${f.vehicleType || 'SERVIDOR'}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é o Engenheiro Chefe do sistema JETFUEL-SIM, operando sob padrões rigorosos de pátio industrial.
      Analise a compatibilidade logística entre a malha de missões e as Posições/Pits.
      
      LEI OPERACIONAL INEGOCIÁVEL:
      1. NUNCA use as palavras "Gate", "Portão" ou "Terminal". Use exclusivamente "Pátio" e "Posição".
      2. NUNCA use a palavra "Braço" para abastecimento de CTAs. Use "Ilha-1", "Ilha-2", etc.
      3. Se uma POSIÇÃO tem todos os PITS INATIVOS, ela SÓ PODE receber Caminhão Tanque (CTA).
      4. Erro Crítico: Designação de SERVIDOR para POSIÇÃO com PITS desativados.
      
      ESTADO DOS PITS:
      ${pitSummary}
      
      MALHA DE OPERAÇÕES:
      ${flightSummary}`,
    });

    return response.text || "Sem recomendações logísticas no momento.";
  } catch (error) {
    console.error("Erro na análise logística:", error);
    return "Falha no motor de inteligência logística.";
  }
};

/**
 * Gera briefing operacional tático focado em segurança JETFUEL-SIM.
 */
export const generateShiftBriefing = async (flights: FlightData[]): Promise<string> => {
  try {
    const ai = getAi();
    const summary = flights.map(f => 
      `MISSÃO: ${f.flightNumber} | CIA: ${f.airline} | POSIÇÃO: ${f.positionId} | FUEL: ${f.fuelStatus}%`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é o Diretor de Operações de Solo do JETFUEL-SIM.
      Gere um briefing operacional conciso para a troca de turno no pátio SBGR.
      Nomenclatura Obrigatória: Pátio, Posição e Pit. Proibido usar Gate ou Portão.
      Lembre-se: Abastecimento de CTAs ocorre em ILHAS, não braços.
      Foque na integridade das Posições e disponibilidade de Pits.
      Regras: 20 km/h no pátio e Volta Olímpica em cada Posição.
      
      DADOS DAS POSIÇÕES:
      ${summary}`,
    });

    return response.text || "Dados insuficientes para briefing.";
  } catch (error) {
    console.error("Erro no briefing IA:", error);
    return "Falha na comunicação com o núcleo de comando IA.";
  }
};

/**
 * Analisa o inventário do Pool em relação à demanda futura.
 */
export const analyzePoolInventory = async (tanks: TankData[], flights: FlightData[]): Promise<string> => {
  try {
    const ai = getAi();
    const tankSummary = tanks.map(t => `TANQUE ${t.id}: ${t.currentLevel}m³ / ${t.capacity}m³ | STATUS: ${t.status}`).join('\n');
    const flightSummary = flights.filter(f => f.status !== FlightStatus.FINALIZADO).length;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é o Gestor de Inventário do JETFUEL-SIM Pool.
      Analise a autonomia baseada nas MISSÕES em curso nas POSIÇÕES de pátio.
      Proibido o uso de termos civis (Gate/Terminal).
      O Pool alimenta a malha hidrante e a Ilha de Enchimento de CTAs.
      
      INVENTÁRIO DO POOL:
      ${tankSummary}`,
    });

    return response.text || "Análise de inventário indisponível.";
  } catch (error) {
    console.error("Erro na análise do Pool:", error);
    return "Erro na inteligência de inventário.";
  }
};

/**
 * Edita imagem com Gemini 2.5 Flash Image.
 */
export const editImageWithGemini = async (base64Data: string, mimeType: string, prompt: string): Promise<string | null> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `Modifique a imagem operacional do JETFUEL-SIM (Pátio e Posições) conforme instrução: ${prompt}` },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Erro na edição de imagem:", error);
    return null;
  }
};

/**
 * Analisa imagem para segurança no pátio.
 */
export const analyzeImageForSafety = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `Você é um Inspetor de Segurança do JETFUEL-SIM. 
            Analise a imagem da POSIÇÃO de pátio e identifique riscos.
            Terminologia: Pátio, Posição, Pit, Ilha. NUNCA use Gate/Portão/Braço.
            Contexto: ${prompt}` },
        ],
      },
    });

    return response.text || "Nenhum risco detectado na análise visual.";
  } catch (error) {
    console.error("Erro na análise de segurança da imagem:", error);
    return "Falha ao processar inspeção visual IA.";
  }
};

/**
 * Analisa saúde da frota.
 */
export const analyzeFleetHealth = async (fleet: any[]): Promise<string> => {
  try {
    const ai = getAi();
    const fleetSummary = fleet.map(v => 
      `FROTA: ${v.id} | TIPO: ${v.type} | STATUS: ${v.status} | HORAS: ${v.hours}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é o Gerente de Frotas do JETFUEL-SIM.
      Analise o estado de Servidores e CTAs. 
      Lembre-se que CTAs carregam na ILHA DE ENCHIMENTO.
      Foque na necessidade de testes de HEPCV/Deadman.
      
      ESTADO ATUAL DA FROTA:
      ${fleetSummary}`,
    });

    return response.text || "Análise de saúde da frota indisponível.";
  } catch (error) {
    console.error("Erro na análise de frota:", error);
    return "Falha no motor de análise de frotas IA.";
  }
};
