
import { FlightData, FlightStatus, Operator, OperatorProfile, FlightLog, ChatMessage } from '../types';

// Helper para criar logs
const createLog = (minutesAgo: number, type: 'SISTEMA' | 'MANUAL' | 'OBSERVACAO' | 'ALERTA', message: string, author: string = 'SISTEMA'): FlightLog => ({
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(new Date().getTime() - minutesAgo * 60000),
    type,
    message,
    author
});

// Helper para criar mensagens de chat
const createMsg = (minutesAgo: number, sender: string, text: string, isManager: boolean = false): ChatMessage => ({
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(new Date().getTime() - minutesAgo * 60000),
    sender,
    text,
    isManager
});

// === LISTA DE OPERADORES ===
export const MOCK_OPERATORS: Operator[] = [
    { id: 'op_horacio', name: 'Horácio', status: 'OCUPADO', vehicleType: 'SERVIDOR' },
    { id: 'op_carlos', name: 'Carlos', status: 'OCUPADO', vehicleType: 'SERVIDOR' },
    { id: 'op_bruno', name: 'Bruno', status: 'OCUPADO', vehicleType: 'SERVIDOR' },
    { id: 'op_felipe', name: 'Felipe', status: 'DISPONÍVEL', vehicleType: 'SERVIDOR' },
    { id: 'op_andre', name: 'André', status: 'OCUPADO', vehicleType: 'SERVIDOR' },
    { id: 'op_gabriel', name: 'Gabriel', status: 'OCUPADO', vehicleType: 'SERVIDOR' },
    { id: 'op_rodrigo', name: 'Rodrigo', status: 'OCUPADO', vehicleType: 'SERVIDOR' },
    { id: 'op_marcelo', name: 'Marcelo', status: 'DISPONÍVEL', vehicleType: 'SERVIDOR' },
    { id: 'op_sergio', name: 'Sérgio', status: 'DISPONÍVEL', vehicleType: 'SERVIDOR' },
    { id: 'op_ricardo', name: 'Ricardo', status: 'OCUPADO', vehicleType: 'SERVIDOR' },
    { id: 'op_betao', name: 'Betão', status: 'ENCHIMENTO', vehicleType: 'CTA' },
    { id: 'op_tiago', name: 'Tiago', status: 'ENCHIMENTO', vehicleType: 'CTA' },
    { id: 'op_lucas', name: 'Lucas', status: 'DISPONÍVEL', vehicleType: 'CTA' },
    { id: 'op_eduardo', name: 'Eduardo', status: 'OCUPADO', vehicleType: 'CTA' },
    { id: 'op_roberto', name: 'Roberto', status: 'DISPONÍVEL', vehicleType: 'CTA' },
    { id: 'op_mariana', name: 'Mariana', status: 'OCUPADO', vehicleType: 'CTA' },
];

export const MOCK_FLIGHTS: FlightData[] = [
  { 
    id: '1', 
    flightNumber: 'RG-1442', 
    departureFlightNumber: 'RG-1443',
    airline: 'GOL', 
    airlineCode: 'RG', 
    model: 'B737-MAX8',
    registration: 'PR-XMA',
    origin: 'SBRJ', 
    destination: 'SBGL', 
    eta: '14:30', 
    etd: '15:15',
    positionId: '204', 
    fuelStatus: 100, 
    status: FlightStatus.FINALIZADO,
    operator: 'Horácio',
    fleet: '2125',
    vehicleType: 'SERVIDOR',
    volume: 6500,
    designationTime: new Date(new Date().getTime() - 60 * 60000),
    startTime: new Date(new Date().getTime() - 45 * 60000),
    endTime: new Date(new Date().getTime() - 15 * 60000),
    maxFlowRate: 1150,
    messages: [
        createMsg(55, 'Horácio', 'Cheguei na posição. Vou conectar.', false),
        createMsg(54, 'Mesa', 'Ok, avisa se tiver fila.', true),
        createMsg(40, 'Horácio', 'Finalizei aqui. Deu 6500 litros.', false),
        createMsg(39, 'Mesa', 'Beleza, liberado.', true),
    ],
    logs: [
        createLog(120, 'SISTEMA', 'Voo criado via integração malha GOL.', 'INTEGRAÇÃO'),
        createLog(60, 'MANUAL', 'Operador Horácio designado.', 'Mesa'),
        createLog(45, 'SISTEMA', 'Início de abastecimento detectado.', 'Horácio'),
        createLog(15, 'SISTEMA', 'Abastecimento finalizado. Volume: 6500L.', 'Horácio'),
    ]
  },
  { 
    id: '2', 
    flightNumber: 'CM-0400', 
    departureFlightNumber: 'CM-0401',
    airline: 'COPA', 
    airlineCode: 'CM', 
    model: 'B737-800',
    registration: 'HP-1822',
    origin: 'MPTO', 
    destination: 'MPTO', 
    eta: '14:45', 
    etd: '15:45',
    positionId: '210', 
    fuelStatus: 45, 
    status: FlightStatus.ABASTECENDO,
    operator: 'Carlos',
    fleet: '2144',
    vehicleType: 'SERVIDOR',
    volume: 12400,
    designationTime: new Date(new Date().getTime() - 25 * 60000),
    startTime: new Date(new Date().getTime() - 15 * 60000),
    maxFlowRate: 1200,
    messages: [
        createMsg(20, 'Carlos', 'Tô acoplando a mangueira.', false),
        createMsg(5, 'Carlos', 'Tá indo normal o fluxo.', false)
    ],
    logs: [
        createLog(40, 'SISTEMA', 'Aeronave em calço.', 'SISTEMA'),
        createLog(25, 'MANUAL', 'Operador Carlos designado.', 'Mesa'),
        createLog(15, 'SISTEMA', 'Fluxo iniciado.', 'Carlos'),
    ]
  },
  { 
    id: '3', 
    flightNumber: 'RG-2022', 
    departureFlightNumber: 'RG-2023',
    airline: 'GOL', 
    airlineCode: 'RG', 
    model: 'B737-800',
    registration: 'PR-GGU',
    origin: 'SBPA', 
    destination: 'SBNT', 
    eta: '16:00', 
    etd: '16:45', 
    positionId: '202', 
    fuelStatus: 0, 
    status: FlightStatus.FILA, 
    operator: undefined,
    fleet: undefined,
    vehicleType: 'SERVIDOR',
    volume: 0,
    isOnGround: true,
    messages: [],
    logs: [
        createLog(10, 'SISTEMA', 'Voo entrou na FILA (ETD < 1h).', 'SISTEMA'),
    ]
  },
  { 
    id: '4', 
    flightNumber: 'LA-4540', 
    departureFlightNumber: 'LA-4541',
    airline: 'LATAM', 
    airlineCode: 'LA', 
    model: 'A321',
    registration: 'PT-MXP',
    origin: 'SBCT', 
    destination: 'SBKP', 
    eta: '14:50', 
    etd: '15:40',
    positionId: '208', 
    fuelStatus: 10, 
    status: FlightStatus.DESIGNADO,
    operator: 'André',
    fleet: '2177',
    vehicleType: 'SERVIDOR',
    volume: 0,
    designationTime: new Date(new Date().getTime() - 8 * 60000), 
    messages: [
        createMsg(5, 'LATAM_OPS', 'Coloca 5 mil agora e espera a gente fechar o peso.', false),
        createMsg(4, 'Mesa', 'Ok, avisei o operador.', true)
    ],
    logs: [
        createLog(8, 'MANUAL', 'Operador André designado.', 'Mesa'),
        createLog(2, 'OBSERVACAO', 'Solicitado abastecimento parcial de 5.000kg primeiro.', 'Mesa'),
    ]
  },
  { 
    id: '5', 
    flightNumber: 'RG-1105', 
    departureFlightNumber: 'RG-1106',
    airline: 'GOL', 
    airlineCode: 'RG', 
    model: 'B737-800',
    registration: 'PR-GTQ',
    origin: 'SBSV', 
    destination: 'SBGL', 
    eta: '15:10', 
    etd: '16:00',
    positionId: '211', 
    fuelStatus: 85, 
    status: FlightStatus.ABASTECENDO,
    operator: 'Bruno',
    fleet: '2160',
    vehicleType: 'SERVIDOR',
    volume: 4500,
    designationTime: new Date(new Date().getTime() - 35 * 60000),
    startTime: new Date(new Date().getTime() - 20 * 60000),
    maxFlowRate: 980,
    messages: [],
    logs: [
        createLog(35, 'MANUAL', 'Operador Bruno designado.', 'Mesa'),
        createLog(20, 'SISTEMA', 'Fluxo iniciado.', 'Bruno'),
    ]
  },
  { 
    id: '6', 
    flightNumber: 'TP-0088', 
    departureFlightNumber: 'TP-0089',
    airline: 'TAP', 
    airlineCode: 'TP', 
    model: 'A330-900', 
    registration: 'CS-TUI',
    origin: 'LPPT', 
    destination: 'LPPT', 
    eta: '14:00', 
    etd: '16:30',
    positionId: '302', 
    fuelStatus: 60, 
    status: FlightStatus.ABASTECENDO,
    operator: 'Gabriel',
    fleet: '2145', // Servidor para Widebody
    vehicleType: 'SERVIDOR', 
    volume: 45000,
    designationTime: new Date(new Date().getTime() - 50 * 60000),
    startTime: new Date(new Date().getTime() - 30 * 60000),
    maxFlowRate: 2400,
    messages: [
        createMsg(40, 'Gabriel', 'O painel não tá aceitando o pré-set. Vou no manual.', false),
        createMsg(39, 'Mesa', 'Cuidado pra não passar do peso.', true)
    ],
    logs: [
        createLog(50, 'MANUAL', 'Operador Gabriel designado.', 'Mesa'),
        createLog(30, 'SISTEMA', 'Fluxo iniciado. Alta vazão.', 'Gabriel'),
    ]
  },
  { 
    id: '7', 
    flightNumber: 'LH-0507', 
    departureFlightNumber: 'LH-0508',
    airline: 'LUFTHANSA', 
    airlineCode: 'LH', 
    model: 'B747-8',
    registration: 'D-ABYA',
    origin: 'EDDF', 
    destination: 'EDDF', 
    eta: '18:00', 
    etd: '20:50',
    positionId: '305', 
    fuelStatus: 0, 
    status: FlightStatus.CHEGADA,
    operator: undefined,
    fleet: undefined,
    vehicleType: 'SERVIDOR', 
    volume: 0,
    messages: [],
    logs: []
  },
  { 
    id: '8', 
    flightNumber: 'AZ-0675', 
    departureFlightNumber: 'AZ-0676',
    airline: 'ITA', 
    airlineCode: 'AZ', 
    model: 'A350-900', 
    registration: 'EI-IFA',
    origin: 'LIRF', 
    destination: 'LIRF', 
    eta: '16:05', 
    etd: '16:25',
    positionId: '308', 
    fuelStatus: 20, 
    status: FlightStatus.FILA,
    operator: undefined,
    fleet: undefined,
    vehicleType: 'SERVIDOR', 
    volume: 0,
    isOnGround: true,
    messages: [],
    logs: [
        createLog(5, 'ALERTA', 'Tempo de solo curto. Atenção.', 'SISTEMA'),
    ]
  },
  { 
    id: '9', 
    flightNumber: 'AA-0930', 
    departureFlightNumber: 'AA-0931',
    airline: 'AMERICAN', 
    airlineCode: 'AA', 
    model: 'B777-300', 
    registration: 'N720AN',
    origin: 'KMIA', 
    destination: 'KMIA', 
    eta: '09:00', 
    etd: '21:00',
    positionId: '402', 
    fuelStatus: 100, 
    status: FlightStatus.FINALIZADO,
    operator: 'Ricardo',
    fleet: '2140', // 2140 é Servidor VW, correto para Widebody
    vehicleType: 'SERVIDOR', 
    volume: 98000,
    designationTime: new Date(new Date().getTime() - 120 * 60000),
    startTime: new Date(new Date().getTime() - 100 * 60000),
    endTime: new Date(new Date().getTime() - 10 * 60000),
    maxFlowRate: 2800,
    messages: [
        createMsg(110, 'AMERICAN_OPS', 'Vai ser tanque cheio, umas 100 toneladas.', false),
        createMsg(109, 'Mesa', 'Tranquilo, o servidor 2140 já tá aí.', true),
        createMsg(15, 'Ricardo', 'Terminei aqui. Bateu 98 mil litros.', false)
    ],
    logs: [
        createLog(120, 'MANUAL', 'Operador Ricardo designado.', 'Mesa'),
        createLog(100, 'SISTEMA', 'Fluxo iniciado.', 'Ricardo'),
        createLog(10, 'SISTEMA', 'Abastecimento finalizado. Volume: 98.000L.', 'Ricardo'),
    ]
  },
  { 
    id: '10', 
    flightNumber: 'DL-0104', 
    departureFlightNumber: 'DL-0105',
    airline: 'DELTA', 
    airlineCode: 'DL', 
    model: 'A350-900', 
    registration: 'N501DN',
    origin: 'KATL', 
    destination: 'KATL', 
    eta: '14:10', 
    etd: '15:20',
    positionId: '406', 
    fuelStatus: 0, 
    status: FlightStatus.FILA,
    isStandby: true,
    standbyReason: "Aguardando MNT",
    operator: undefined,
    fleet: undefined,
    vehicleType: 'SERVIDOR', 
    volume: 0,
    messages: [],
    logs: [
        createLog(30, 'MANUAL', 'Voo em Standby. Aguardando pessoal da mecânica liberar.', 'Mesa'),
    ]
  },
];

// === CONFIGURAÇÃO DAS SUAS IMAGENS LOCAIS ===
// Mapeamento direto das imagens fornecidas para os operadores
// SALVE AS IMAGENS NA PASTA /public/avatars/ COM OS NOMES ABAIXO
const USER_DEFINED_AVATARS: Record<string, string> = {
    'Horácio': 'face_1.png',  // Homem negro, dreads
    'Carlos': 'face_2.png',   // Homem branco, polo azul
    'Bruno': 'face_3.png',    // Homem mais velho, barba grisalha
    'Felipe': 'face_4.png',   // Homem, camisa amarela
    'André': 'face_5.png',    // Homem, sweater verde
    'Gabriel': 'face_6.png',  // Homem negro, polo azul
    'Rodrigo': 'face_7.png',  // Homem branco, barba loira
    'Marcelo': 'face_8.png',  // Homem asiático, jaqueta verde
    'Sérgio': 'face_9.png',   // Homem mais velho, Henley azul
    'Ricardo': 'face_10.png', // Homem negro, careca
    'Betão': 'face_11.png',   // Homem branco, Henley branco
    'Tiago': 'face_12.png',   // Homem, sweater amarelo
    'Lucas': 'face_13.png',   // Homem, jaqueta jeans
    'Eduardo': 'face_14.png', // Homem asiático, sweater verde
    'Roberto': 'face_15.png', // Homem, camiseta azul
    'Mariana': 'face_16.png', // Homem negro, tranças (usando img 16 do set)
};

// Função para buscar a imagem local
const getAvatarPath = (warName: string) => {
    const filename = USER_DEFINED_AVATARS[warName];
    if (filename) {
        return `/avatars/${filename}`; // Caminho absoluto para a pasta public/avatars
    }
    return ''; // Retorna vazio se não encontrar, o componente usará o ícone padrão
};

// Gerador de perfis usando as imagens locais
const createProfile = (id: string, name: string, warName: string, category: 'AERODROMO' | 'VIP' | 'ILHA', status: any, shift: any): OperatorProfile => ({
    id, fullName: name, warName, companyId: `FUNC-${Math.floor(Math.random()*9000)+1000}`, gruId: '237293', vestNumber: '0000', 
    
    // AQUI ESTÁ A MUDANÇA: Usando a função que busca seu arquivo local
    photoUrl: getAvatarPath(warName), 
    
    status, category, lastPosition: 'SBGR',
    shift: { cycle: shift, start: '06:00', end: '14:00' }, airlines: ['LATAM'], ratings: { speed: 5, safety: 5, airlineSpecific: {} }, expertise: { servidor: 95, cta: 60 },
    stats: { flightsWeekly: 42, flightsMonthly: 180, volumeWeekly: 650000, volumeMonthly: 2800000 }
});

export const MOCK_TEAM_PROFILES: OperatorProfile[] = [
    createProfile('op_horacio', 'Anderson Horácio Pires', 'Horácio', 'AERODROMO', 'OCUPADO', 'MANHÃ'),
    createProfile('op_carlos', 'Carlos Eduardo Mendes', 'Carlos', 'AERODROMO', 'OCUPADO', 'MANHÃ'),
    createProfile('op_bruno', 'Bruno Rodrigues Alves', 'Bruno', 'AERODROMO', 'OCUPADO', 'MANHÃ'),
    createProfile('op_felipe', 'Felipe Costa', 'Felipe', 'AERODROMO', 'DISPONÍVEL', 'MANHÃ'),
    createProfile('op_andre', 'André Santos', 'André', 'AERODROMO', 'OCUPADO', 'MANHÃ'),
    createProfile('op_gabriel', 'Gabriel Lima', 'Gabriel', 'AERODROMO', 'OCUPADO', 'TARDE'),
    createProfile('op_rodrigo', 'Rodrigo Silva', 'Rodrigo', 'AERODROMO', 'OCUPADO', 'TARDE'),
    createProfile('op_marcelo', 'Marcelo Souza', 'Marcelo', 'AERODROMO', 'DISPONÍVEL', 'TARDE'),
    createProfile('op_sergio', 'Sérgio Oliveira', 'Sérgio', 'AERODROMO', 'DISPONÍVEL', 'NOITE'),
    createProfile('op_ricardo', 'Ricardo Gomes', 'Ricardo', 'AERODROMO', 'OCUPADO', 'NOITE'),
    createProfile('op_betao', 'Roberto da Silva', 'Betão', 'ILHA', 'ENCHIMENTO', 'MANHÃ'),
    createProfile('op_tiago', 'Tiago Nunes', 'Tiago', 'ILHA', 'ENCHIMENTO', 'TARDE'),
    createProfile('op_lucas', 'Lucas Ferreira', 'Lucas', 'ILHA', 'DISPONÍVEL', 'NOITE'),
    createProfile('op_eduardo', 'Eduardo Martins', 'Eduardo', 'VIP', 'OCUPADO', 'MANHÃ'),
    createProfile('op_roberto', 'Roberto Carlos', 'Roberto', 'VIP', 'DISPONÍVEL', 'TARDE'),
    createProfile('op_mariana', 'Mariana Dias', 'Mariana', 'VIP', 'OCUPADO', 'NOITE'),
];
