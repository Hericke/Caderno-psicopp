import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { cn, formatDate } from '../../lib/utils';
import { Plus, Save, ClipboardList, Zap, Package, GraduationCap, FileText } from 'lucide-react';
import { motion } from 'motion/react';

const MODALITIES = [
  { 
    id: 'hipoassimilativa', 
    label: 'Hipoassimilativa', 
    description: 'A criança é bastante tímida, quase não fala, não explora objetos na mesa, costuma querer ficar em uma mesma atividade.' 
  },
  { 
    id: 'hiperassimilativa', 
    label: 'Hiperassimilativa', 
    description: 'A criança traz vários assuntos enquanto realiza a atividade, conversa, pergunta, questiona, mas não costuma ouvir pois está formulando outra pergunta.' 
  },
  { 
    id: 'hipoacomodativa', 
    label: 'Hipoacomodativa', 
    description: 'Apresenta dificuldade de estabelecer vínculos emocionais e cognitivos. Pode ser confundido com um ser preguiçoso. Também não explora muito os objetos como se eles fossem machucá-lo. Normalmente permanece na mesma atividade.' 
  },
  { 
    id: 'hiperacomodativa', 
    label: 'Hiperacomodativa', 
    description: 'Tem dificuldade de criar, prefere copiar, repete o que aprende sem questionar, sem investigar, é muito obediente, é muito submisso, aceita tudo.' 
  },
];

const CHECKLIST_ITEMS = {
  thematic: [
    'Fala muito durante todo o tempo da sessão',
    'Fala pouco durante todo o tempo da sessão',
    'Verbaliza bem as palavras',
    'Expressa com facilidade',
    'Apresenta dificuldades para se expressar verbalmente',
    'Fala de suas idéias, vontades e desejos',
    'Mostra-se retraído para se expor',
    'Sua fala tem lógica e seqüência de fatos',
    'Parece viver num mundo de fantasias',
    'Tem consciência do que é real e do que é imaginário',
    'Conversa com o terapeuta sem constrangimento'
  ],
  dynamic: [
    'O tom de voz é baixo',
    'O tom de voz é alto',
    'Sabe usar o tom de voz adequadamente',
    'Gesticula muito para falar',
    'Não consegue ficar assentado',
    'Tem atenção e concentração',
    'Anda o tempo todo',
    'Muda de lugar e troca de materiais constantemente',
    'Pensa antes de criar ou montar algo',
    'Apresenta baixa tolerância à frustração',
    'Diante de dificuldades desiste fácil',
    'Tem persistência e paciência',
    'Realiza as atividades com capricho',
    'Mostra-se desorganizado e descuidado',
    'Possui hábitos de higiene e zelo com os materiais',
    'Sabe usar os materiais disponíveis, conhece a utilidade de cada um',
    'Ao pegar os materiais, devolve no lugar depois de usá-los',
    'Não guarda o material que usou',
    'Apresenta iniciativa',
    'Ocupa todo o espaço disponível',
    'Possui boa postura corporal',
    'Deixa cair objetos que pega',
    'Faz brincadeiras simbólicas',
    'Expressa sentimentos nas brincadeiras',
    'Leitura adequada à escolaridade',
    'Interpretação de texto adequada à escolaridade faz cálculos',
    'Escrita adequada à escolar',
    'Demonstra agressividade em sua conduta'
  ],
  product: [
    'Desenha e depois escreve',
    'Escreve primeiro e depois desenha',
    'Apresenta os seus desenhos com forma e compreensão',
    'Não consegue contar ou falar sobre os seus desenhos e escrita',
    'Se nega a descrever sua produção para o terapeuta',
    'Sente prazer ao terminar sua atividade e mostrar',
    'Demonstra insatisfação com os seus feitos',
    'Sente-se capaz para executar o que foi proposto',
    'Sente-se incapaz para executar o que foi proposto',
    'Os desenhos estão no nível da idade do entrevistado',
    'Prefere matérias que lhe possibilite construir, montar criar',
    'Fica preso no papel e lápis',
    'Executa a atividade com tranqüilidade',
    'Demonstra agressividade de alguma forma em seus desenhos e suas criações',
    'É criativo(a)'
  ]
};

export function EOCATab({ patientId }: { patientId: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    thematic: [] as string[],
    dynamic: [] as string[],
    product: [] as string[],
    thematicObs: '',
    dynamicObs: '',
    productObs: '',
    learningModality: 'hipoassimilativa' as any,
    conclusions: ''
  });

  const assessments = useLiveQuery(() => db.eoca.where('patientId').equals(patientId).toArray(), [patientId]);
  const latest = assessments?.[assessments.length - 1];

  const handleToggleCheck = (category: 'thematic' | 'dynamic' | 'product', item: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(item) 
        ? prev[category].filter(i => i !== item)
        : [...prev[category], item]
    }));
  };

  const handleSave = async () => {
    await db.eoca.add({
      patientId,
      date: Date.now(),
      ...formData
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-6 pb-32">
        {/* Temática */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="h-2 bg-purple-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={18} className="text-purple-600" />
              <h4 className="font-bold text-slate-800">Em relação à temática</h4>
            </div>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {CHECKLIST_ITEMS.thematic.map(item => (
                <button
                  key={item}
                  onClick={() => handleToggleCheck('thematic', item)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl text-xs font-medium transition-all border",
                    formData.thematic.includes(item)
                      ? "bg-purple-50 border-purple-200 text-purple-700"
                      : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <textarea 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[80px] focus:ring-2 focus:ring-purple-500"
              placeholder="Observação da temática..."
              value={formData.thematicObs}
              onChange={e => setFormData({...formData, thematicObs: e.target.value})}
            />
          </div>
        </div>

        {/* Dinâmica */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="h-2 bg-indigo-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-indigo-600" />
              <h4 className="font-bold text-slate-800">Em relação à dinâmica</h4>
            </div>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {CHECKLIST_ITEMS.dynamic.map(item => (
                <button
                  key={item}
                  onClick={() => handleToggleCheck('dynamic', item)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl text-xs font-medium transition-all border",
                    formData.dynamic.includes(item)
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <textarea 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500"
              placeholder="Observação da dinâmica..."
              value={formData.dynamicObs}
              onChange={e => setFormData({...formData, dynamicObs: e.target.value})}
            />
          </div>
        </div>

        {/* Produto */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="h-2 bg-pink-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-pink-600" />
              <h4 className="font-bold text-slate-800">Em relação ao produto</h4>
            </div>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {CHECKLIST_ITEMS.product.map(item => (
                <button
                  key={item}
                  onClick={() => handleToggleCheck('product', item)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl text-xs font-medium transition-all border",
                    formData.product.includes(item)
                      ? "bg-pink-50 border-pink-200 text-pink-700"
                      : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <textarea 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[80px] focus:ring-2 focus:ring-pink-500"
              placeholder="Observação do produto..."
              value={formData.productObs}
              onChange={e => setFormData({...formData, productObs: e.target.value})}
            />
          </div>
        </div>

        {/* Modalidade */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="h-2 bg-amber-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={18} className="text-amber-600" />
              <h4 className="font-bold text-slate-800">Modalidade de Aprendizagem</h4>
            </div>
            <div className="space-y-3">
              {MODALITIES.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setFormData({ ...formData, learningModality: mod.id as any })}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left transition-all border-2",
                    formData.learningModality === mod.id 
                      ? "bg-amber-50 border-amber-500 shadow-sm" 
                      : "bg-white border-slate-50"
                  )}
                >
                  <p className={cn("font-bold text-sm", formData.learningModality === mod.id ? "text-amber-700" : "text-slate-700")}>
                    {mod.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{mod.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conclusão */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="h-2 bg-slate-800" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-slate-800" />
              <h4 className="font-bold text-slate-800">Observações e Encaminhamentos</h4>
            </div>
            <textarea 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-slate-800"
              placeholder="Síntese diagnóstica e próximos passos..."
              value={formData.conclusions}
              onChange={e => setFormData({...formData, conclusions: e.target.value})}
            />
          </div>
        </div>

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <button 
            onClick={handleSave} 
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Save size={20} />
            Salvar EOCA Completa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {latest ? (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800">Entrevista Operativa (EOCA)</h4>
            <span className="text-xs text-slate-400 font-medium">{formatDate(latest.date)}</span>
          </div>
          
          <div className="space-y-6">
            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-full" />
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Modalidade</p>
              <p className="font-bold text-slate-800 capitalize">{latest.learningModality}</p>
              <p className="text-[10px] text-slate-500 mt-1 italic">
                {MODALITIES.find(m => m.id === latest.learningModality)?.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Temática', items: latest.thematic, obs: latest.thematicObs, color: 'bg-purple-500' },
                { label: 'Dinâmica', items: latest.dynamic, obs: latest.dynamicObs, color: 'bg-indigo-500' },
                { label: 'Produto', items: latest.product, obs: latest.productObs, color: 'bg-pink-500' },
              ].map(category => (category.items?.length > 0 || category.obs) && (
                <div key={category.label} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">{category.label}</p>
                  {Array.isArray(category.items) && category.items.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {category.items.map((item: string) => (
                        <span key={item} className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  {!Array.isArray(category.items) && category.items && (
                    <p className="text-sm text-slate-600 mb-3">{category.items}</p>
                  )}
                  {category.obs && (
                    <p className="text-xs text-slate-600 leading-relaxed italic border-t border-slate-200 pt-2">
                      {category.obs}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {latest.conclusions && (
              <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Conclusões e Encaminhamentos</p>
                <p className="text-sm leading-relaxed opacity-90">{latest.conclusions}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-400 font-medium">Nenhuma EOCA registrada.</p>
        </div>
      )}

      <button 
        onClick={() => setIsEditing(true)} 
        className="w-full bg-brand-50 text-brand-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-100 transition-colors"
      >
        <Plus size={20} />
        Nova EOCA
      </button>
    </div>
  );
}
