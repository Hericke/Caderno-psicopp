import Dexie, { type Table } from 'dexie';

export interface Patient {
  id?: number;
  name: string;
  birthDate: string;
  cid: string;
  parents: string;
  contact: string;
  schooling?: string;
  createdAt: number;
}

export interface PortageAssessment {
  id?: number;
  patientId: number;
  date: number;
  scores: {
    socialization: number;
    language: number;
    selfCare: number;
    cognitive: number;
    motor: number;
  };
  details: Record<string, number>; // itemKey: score (0, 0.5, 1)
}

export interface IARAssessment {
  id?: number;
  patientId: number;
  date: number;
  items: Record<string, number>; // 0, 0.5, 1
}

export interface EOCAAssessment {
  id?: number;
  patientId: number;
  date: number;
  thematic?: string[];
  dynamic?: string[];
  product?: string[];
  thematicObs?: string;
  dynamicObs?: string;
  productObs?: string;
  learningModality?: 'hipoassimilativa' | 'hiperassimilativa' | 'hipoacomodativa' | 'hiperacomodativa';
  conclusions?: string;
  ponto_conclusivo?: string;
  hipotese_diagnostica?: string;
  orientacao?: string;
}

export interface HumanizzareAssessment {
  id?: number;
  patientId: number;
  date: number;
  scores?: Record<string, number>; // 0-4
  items?: Record<string, number>; // 0, 0.5, 1
}

export interface PTIGoal {
  text: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface PTI {
  id?: number;
  patientId: number;
  date: number;
  goals?: {
    communication: PTIGoal[];
    social: PTIGoal[];
    motor: PTIGoal[];
    cognitive: PTIGoal[];
    custom: PTIGoal[]; // For the "[+] Outro" button
    other: string; // General observations
  };
  frequencia?: string;
  duracao?: string;
  objetivos?: string;
  areas_foco?: string[];
  estrategias?: string;
  recursos?: string;
}

export interface EvolutionRecord {
  id?: number;
  patientId: number;
  date: number;
  type: 'session' | 'abc';
  content: string;
  abc?: {
    antecedent: string;
    behavior: string;
    consequence: string;
  };
  photo?: string; // base64
}

export class AppDatabase extends Dexie {
  patients!: Table<Patient>;
  portage!: Table<PortageAssessment>;
  iar!: Table<IARAssessment>;
  eoca!: Table<EOCAAssessment>;
  humanizzare!: Table<HumanizzareAssessment>;
  pti!: Table<PTI>;
  evolutions!: Table<EvolutionRecord>;
  settings!: Table<{ key: string, value: any }>;

  constructor() {
    super('EvolucaoPsicopedagogicaDB');
    this.version(2).stores({
      patients: '++id, name, createdAt',
      portage: '++id, patientId, date',
      iar: '++id, patientId, date',
      eoca: '++id, patientId, date',
      humanizzare: '++id, patientId, date',
      pti: '++id, patientId, date',
      evolutions: '++id, patientId, date, type',
      settings: 'key'
    });
  }
}

export const db = new AppDatabase();
