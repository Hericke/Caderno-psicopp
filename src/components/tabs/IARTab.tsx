import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { cn, formatDate } from '../../lib/utils';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Palette, 
  User, 
  ArrowLeftRight, 
  Move, 
  Eye, 
  Ear,
  Save,
  Plus,
  Activity,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

const IAR_STEPS = [
  { 
    id: 'cores', 
    label: 'Cores', 
    instruction: 'Diga as cores abaixo:',
    visual: (
      <div className="flex gap-4 justify-center">
        <div className="w-12 h-12 rounded-full bg-red-500 shadow-sm" />
        <div className="w-12 h-12 rounded-full bg-yellow-400 shadow-sm" />
        <div className="w-12 h-12 rounded-full bg-green-500 shadow-sm" />
        <div className="w-12 h-12 rounded-full bg-blue-600 shadow-sm" />
      </div>
    ),
    icon: Palette
  },
  { 
    id: 'esquema_comandos', 
    label: 'Esquema Corporal (Comandos)', 
    instruction: 'Siga os comandos: Toque a cabeça; Levante os braços; Toque as pernas; Pisque os olhos; Toque o nariz; Dê um sorriso.',
    visual: (
      <div className="flex justify-center gap-4">
        <User size={80} className="text-slate-300" />
        <div className="flex flex-col justify-center gap-1">
          <div className="w-8 h-2 bg-slate-100 rounded-full" />
          <div className="w-12 h-2 bg-slate-100 rounded-full" />
          <div className="w-6 h-2 bg-slate-100 rounded-full" />
        </div>
      </div>
    ),
    icon: User
  },
  { 
    id: 'esquema_nomes', 
    label: 'Esquema Corporal (Nomes)', 
    instruction: 'Diga os nomes das partes do corpo que eu apontar.',
    visual: (
      <div className="grid grid-cols-3 gap-4">
        <div className="text-2xl text-center">👂</div>
        <div className="text-2xl text-center">👁️</div>
        <div className="text-2xl text-center">👄</div>
        <div className="text-2xl text-center">🦶</div>
        <div className="text-2xl text-center">🖐️</div>
        <div className="text-2xl text-center">💇</div>
      </div>
    ),
    icon: User
  },
  { 
    id: 'lateralidade_arvore', 
    label: 'Lateralidade (Árvore)', 
    instruction: 'Qual a cor da árvore que está à direita?',
    visual: (
      <div className="flex justify-around items-end gap-4">
        <div className="text-center">
          <div className="text-4xl">🌳</div>
          <p className="text-[8px] font-bold text-slate-300 mt-1">VERDE</p>
        </div>
        <div className="text-3xl">🏠</div>
        <div className="text-center">
          <div className="text-4xl text-amber-600">🌳</div>
          <p className="text-[8px] font-bold text-slate-300 mt-1">AMARELA</p>
        </div>
      </div>
    ),
    icon: ArrowLeftRight
  },
  { 
    id: 'lateralidade_carro', 
    label: 'Lateralidade (Carro)', 
    instruction: 'Qual a cor do carro que está à esquerda?',
    visual: (
      <div className="flex justify-around items-center gap-4">
        <div className="text-4xl text-emerald-500">🚗</div>
        <div className="text-3xl">🏠</div>
        <div className="text-4xl text-blue-600">🚗</div>
      </div>
    ),
    icon: ArrowLeftRight
  },
  { 
    id: 'lateralidade_maos', 
    label: 'Lateralidade (Mãos)', 
    instruction: 'Qual fruta a menina tem na mão direita? E na esquerda?',
    visual: (
      <div className="text-center">
        <div className="text-5xl mb-2">👧</div>
        <div className="flex justify-center gap-12">
          <div className="text-2xl">🍇</div>
          <div className="text-2xl">🍎</div>
        </div>
      </div>
    ),
    icon: ArrowLeftRight
  },
  { 
    id: 'posicao_gato', 
    label: 'Posição (Gato)', 
    instruction: 'A bola está abaixo do gato de qual cor? E em cima?',
    visual: (
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col items-center">
          <div className="text-3xl text-red-500">🐈</div>
          <div className="text-xl">⚽</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xl">⚽</div>
          <div className="text-3xl text-yellow-400">🐈</div>
        </div>
      </div>
    ),
    icon: Move
  },
  { 
    id: 'posicao_vaso', 
    label: 'Posição (Vaso)', 
    instruction: 'Qual a cor do vaso com a flor dentro? E com a flor ao lado?',
    visual: (
      <div className="flex justify-center gap-6">
        <div className="relative">
          <div className="text-4xl text-red-500">🏺</div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xl">🌸</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="text-4xl text-yellow-400">🏺</div>
          <div className="text-xl">🌸</div>
        </div>
      </div>
    ),
    icon: Move
  },
  { 
    id: 'direcao_carro', 
    label: 'Direção', 
    instruction: 'Qual carro está indo para baixo? E para cima?',
    visual: (
      <div className="w-full h-24 relative overflow-hidden bg-slate-50 rounded-xl">
        <div className="absolute left-4 top-4 text-3xl rotate-12">🚙</div>
        <div className="absolute right-4 bottom-4 text-3xl -rotate-12">🚕</div>
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -rotate-6" />
      </div>
    ),
    icon: Move
  },
  { 
    id: 'tamanho_pato', 
    label: 'Tamanho (Pato)', 
    instruction: 'Qual a cor do pato maior? E do menor?',
    visual: (
      <div className="flex items-end justify-center gap-4">
        <div className="text-xl text-red-500">🦆</div>
        <div className="text-3xl text-yellow-400">🦆</div>
        <div className="text-5xl text-blue-600">🦆</div>
        <div className="text-4xl text-green-500">🦆</div>
      </div>
    ),
    icon: Move
  },
  { 
    id: 'quantidade_borboleta', 
    label: 'Quantidade', 
    instruction: 'Qual cor tem mais borboletas? E menos?',
    visual: (
      <div className="flex justify-around">
        <div className="p-2 border-2 border-red-200 rounded-full">🦋🦋</div>
        <div className="p-2 border-2 border-blue-200 rounded-full">🦋</div>
        <div className="p-2 border-2 border-green-200 rounded-full">🦋🦋🦋</div>
      </div>
    ),
    icon: Plus
  },
  { 
    id: 'formas', 
    label: 'Formas', 
    instruction: 'Diga os nomes das formas: Círculo, Triângulo, Quadrado, Retângulo.',
    visual: (
      <div className="flex flex-wrap justify-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-500" />
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-bottom-[40px] border-bottom-yellow-400" />
        <div className="w-10 h-10 bg-red-500" />
        <div className="w-16 h-10 bg-green-500" />
      </div>
    ),
    icon: Palette
  },
  { 
    id: 'visual_diferente', 
    label: 'Discriminação Visual', 
    instruction: 'Qual o desenho diferente?',
    visual: (
      <div className="flex justify-center gap-4">
        <div className="text-3xl">🚩</div>
        <div className="text-3xl rotate-45">🚩</div>
        <div className="text-3xl">🚩</div>
        <div className="text-3xl">🚩</div>
      </div>
    ),
    icon: Eye
  },
  { 
    id: 'auditiva_silaba', 
    label: 'Discriminação Auditiva', 
    instruction: 'Qual figura começa com a mesma sílaba do modelo?',
    visual: (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-brand-50 rounded-lg border-2 border-brand-200 text-2xl">✈️</div>
          <div className="flex gap-2">
            <div className="p-2 bg-slate-50 rounded-lg text-xl">🍳</div>
            <div className="p-2 bg-slate-50 rounded-lg text-xl">💍</div>
            <div className="p-2 bg-slate-50 rounded-lg text-xl">🍇</div>
          </div>
        </div>
      </div>
    ),
    icon: Ear
  },
  { 
    id: 'verbalizacao', 
    label: 'Verbalização', 
    instruction: 'Repita as palavras: CASA, GATO, FACA, VACA, JANELA, CHAVE...',
    visual: (
      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 uppercase">
        <span>CASA / GATO</span>
        <span>FACA / VACA</span>
        <span>LÃ / IRMÃ</span>
        <span>PRATO / BRIGA</span>
      </div>
    ),
    icon: Ear
  },
  { 
    id: 'analise_sintese', 
    label: 'Análise Síntese', 
    instruction: 'Qual conjunto contém todas as partes do modelo?',
    visual: (
      <div className="flex gap-6 items-center">
        <div className="p-2 border-2 border-slate-200 rounded-lg">
          <div className="w-8 h-8 bg-red-400 rounded-full mx-auto mb-1" />
          <div className="w-12 h-12 bg-blue-500" />
        </div>
        <div className="space-y-2">
          <div className="text-xs font-bold p-1 bg-slate-100 rounded">Opção 1</div>
          <div className="text-xs font-bold p-1 bg-slate-100 rounded">Opção 2</div>
        </div>
      </div>
    ),
    icon: Eye
  },
  { 
    id: 'motora_fina', 
    label: 'Coordenação Motora Fina', 
    instruction: 'Faça este desenho no ar:',
    visual: (
      <div className="space-y-4">
        <div className="w-24 h-12 border-t-4 border-l-4 border-slate-800 mx-auto" />
        <div className="w-24 h-8 border-b-4 border-slate-800 rounded-full mx-auto" />
      </div>
    ),
    icon: Activity
  },
  { 
    id: 'temporal', 
    label: 'Orientação Temporal', 
    instruction: 'O que aconteceu primeiro? E depois?',
    visual: (
      <div className="flex gap-2 justify-center">
        <div className="w-12 h-16 bg-slate-100 rounded flex items-center justify-center text-xl">🌱</div>
        <div className="w-12 h-16 bg-slate-100 rounded flex items-center justify-center text-xl">🌿</div>
        <div className="w-12 h-16 bg-slate-100 rounded flex items-center justify-center text-xl">🌻</div>
      </div>
    ),
    icon: History
  }
];

export function IARTab({ patientId }: { patientId: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  
  const assessments = useLiveQuery(() => db.iar.where('patientId').equals(patientId).toArray(), [patientId]);
  const latest = assessments?.[assessments.length - 1];

  const handleScore = (score: number) => {
    const stepId = IAR_STEPS[currentStep].id;
    setScores(prev => ({ ...prev, [stepId]: score }));
    if (currentStep < IAR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSave = async () => {
    await db.iar.add({
      patientId,
      date: Date.now(),
      items: scores
    });
    setIsEditing(false);
    setCurrentStep(0);
    setScores({});
  };

  if (isEditing) {
    const step = IAR_STEPS[currentStep];
    const progress = ((currentStep + 1) / IAR_STEPS.length) * 100;

    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-brand-600 h-full"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Child Visual Area */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[240px]">
              <div className="mb-6">{step.visual}</div>
              <p className="text-center text-slate-500 font-medium italic">"{step.instruction}"</p>
            </div>

            {/* Professional Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <step.icon size={18} className="text-brand-600" />
                <h3 className="font-bold text-slate-800">{step.label}</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleScore(1)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    scores[step.id] === 1 ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-100 text-slate-400"
                  )}
                >
                  <CheckCircle2 size={24} />
                  <span className="text-[10px] font-bold uppercase">Acertou</span>
                </button>
                <button
                  onClick={() => handleScore(0.5)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    scores[step.id] === 0.5 ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-white border-slate-100 text-slate-400"
                  )}
                >
                  <HelpCircle size={24} />
                  <span className="text-[10px] font-bold uppercase">Ajuda</span>
                </button>
                <button
                  onClick={() => handleScore(0)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    scores[step.id] === 0 ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-slate-100 text-slate-400"
                  )}
                >
                  <XCircle size={24} />
                  <span className="text-[10px] font-bold uppercase">Errou</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl disabled:opacity-50"
          >
            Anterior
          </button>
          {currentStep === IAR_STEPS.length - 1 ? (
            <button 
              onClick={handleSave}
              className="flex-[2] py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Finalizar IAR
            </button>
          ) : (
            <button 
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex-[2] py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-lg"
            >
              Próximo
            </button>
          )}
        </div>
      </div>
    );
  }

  const chartData = latest ? IAR_STEPS.map(step => ({
    subject: step.label,
    score: (latest.items[step.id] || 0) * 100,
    fullMark: 100
  })) : [];

  return (
    <div className="space-y-6 pb-24">
      {latest ? (
        <div className="space-y-6">
          {/* Result Card */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-800">Resultado IAR</h4>
              <span className="text-xs text-slate-400 font-medium">{formatDate(latest.date)}</span>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Desempenho"
                    dataKey="score"
                    stroke="#0284c7"
                    fill="#0ea5e9"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {IAR_STEPS.map(step => (
                <div key={step.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{step.label}</p>
                  <p className={cn(
                    "text-xs font-bold",
                    latest.items[step.id] === 1 ? "text-emerald-600" :
                    latest.items[step.id] === 0.5 ? "text-amber-600" : "text-red-600"
                  )}>
                    {latest.items[step.id] === 1 ? 'Desenvolvido' : 
                     latest.items[step.id] === 0.5 ? 'Em Desenv.' : 'Dificuldade'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-400 font-medium">Nenhuma avaliação IAR realizada.</p>
        </div>
      )}

      <button 
        onClick={() => setIsEditing(true)} 
        className="w-full bg-brand-50 text-brand-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-100 transition-colors"
      >
        <Plus size={20} />
        Nova Avaliação IAR
      </button>
    </div>
  );
}
