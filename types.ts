
export enum FlightStatus {
  CHEGADA = 'CHEGADA',         // Monitoramento (ETA > 1h ou recém pousado)
  FILA = 'FILA',               // Prioridade (ETD < 1h, Sem Operador)
  DESIGNADO = 'DESIGNADO',     // Operador atribuído
  AGUARDANDO = 'AGUARDANDO',   // Aguardando liberação/calço
  ABASTECENDO = 'ABASTECENDO', // Fluxo ativo
  FINALIZADO = 'FINALIZADO',   // Concluído
  CANCELADO = 'CANCELADO'      // Voo cancelado ou não abastecido
}

export type OperatorStatus = 'DISPONÍVEL' | 'OCUPADO' | 'INTERVALO' | 'DESCONECTADO' | 'ENCHIMENTO';
export type VehicleType = 'SERVIDOR' | 'CTA';

export interface PitData {
  id: string;
  isActive: boolean;
  lastMaintenance?: Date;
  notes?: string;
}

export interface Operator {
  id: string;
  name: string;
  status: OperatorStatus;
  vehicleId?: string;
  vehicleType?: VehicleType;
  shiftStart?: Date;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isManager: boolean;
}

export type ShiftCycle = 'MANHÃ' | 'TARDE' | 'NOITE';
export type OperatorCategory = 'AERODROMO' | 'VIP' | 'ILHA';

export interface OperatorProfile {
  id: string;
  fullName: string;
  warName: string;
  companyId: string;
  gruId: string;
  vestNumber: string;
  photoUrl: string;
  status: OperatorStatus;
  category: OperatorCategory;
  lastPosition: string;
  assignedVehicle?: string; // Propriedade adicionada para o HUD de equipe
  shift: {
    cycle: ShiftCycle;
    start: string;
    end: string;
  };
  airlines: string[];
  ratings: {
    speed: number;
    safety: number;
    airlineSpecific: Record<string, number>;
  };
  expertise: {
    servidor: number;
    cta: number;
  };
  stats: {
    flightsWeekly: number;
    flightsMonthly: number;
    volumeWeekly: number;
    volumeMonthly: number;
  };
}

export interface TankData {
  id: string;
  capacity: number;
  currentLevel: number;
  temperature: number;
  density: number;
  status: 'ATIVO' | 'ISOLADO' | 'RECEBENDO' | 'DRENAGEM';
}

export interface PumpData {
  id: string;
  status: 'RUNNING' | 'STANDBY' | 'MAINTENANCE' | 'OFFLINE';
  rpm: number;
  pressure: number;
  flow: number;
}

export type LogType = 'SISTEMA' | 'MANUAL' | 'OBSERVACAO' | 'ALERTA' | 'ATRASO';

export interface FlightLog {
  id: string;
  timestamp: Date;
  type: LogType;
  message: string;
  author: string; // 'SISTEMA' ou Nome do Gestor
}

export interface FlightData {
  id: string;
  flightNumber: string; // V. Cheg
  departureFlightNumber?: string; // V. Saida
  airline: string;
  airlineCode: string;
  model: string;
  registration: string;
  origin: string;
  destination: string;
  eta: string;
  etd: string;
  positionId: string;
  pitId?: string;
  wingSide?: 'LEFT' | 'RIGHT';
  fuelStatus: number;
  status: FlightStatus;
  operator?: string;
  supportOperator?: string;
  fleet?: string;
  vehicleType?: VehicleType;
  volume?: number;
  messages?: ChatMessage[];
  
  // Novos campos de controle lógico
  isOnGround?: boolean; // Se já pousou (Status SOLO)
  isStandby?: boolean; // Se está em espera (Manutenção, etc)
  standbyReason?: string; // Motivo da espera
  designationTime?: Date; // Hora que foi designado (para calcular "A Caminho")
  startTime?: Date; // Hora que iniciou abastecimento
  endTime?: Date; // Hora que finalizou abastecimento (Para TAB)
  maxFlowRate?: number; // Vazão máxima registrada (L/min)
  
  // Caixa Preta e Justificativas
  logs: FlightLog[]; 
  observations?: string; // Mantido para compatibilidade, mas idealmente derivado de logs
  delayJustification?: string; // Justificativa de atraso se ETD estourado
}

export type ViewState = 'GRID_OPS' | 'AERODROMO' | 'OPERATORS' | 'TEAM' | 'MESSAGES' | 'REFUELING_CONSOLE' | 'POOL_MANAGER' | 'REPORTS';
