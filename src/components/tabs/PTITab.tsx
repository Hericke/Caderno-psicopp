import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PTIGoal } from '../../db';
import { cn, formatDate } from '../../lib/utils';
import { Plus, Save, Target, MessageSquare, Users, Activity, Brain, CheckCircle2, Clock, Circle, Trash2, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'communication', label: 'Comunicação', icon: MessageSquare, color: '#3b82f6', goals: ['Expressar desejos', 'Contato visual', 'Seguir comandos'] },
  { id: 'social', label: 'Social', icon: Users, color: '#10b981', goals: ['Brincar funcional', 'Compartilhar atenção', 'Interação com pares'] },
  { id: 'motor', label: 'Motricidade', icon: Activity, color: '#ef4444', goals: ['Coordenação fina', 'Equilíbrio', 'Pular com dois pés'] },
  { id: 'cognitive', label: 'Cognitivo', icon: Brain, color: '#8b5cf6', goals: ['Identificar cores', 'Pareamento', 'Sequência lógica'] },
];

const STATUS_CONFIG = {
  pending: { label: 'Pendente', icon: Circle, color: 'text-slate-300', bg: 'bg-slate-50', border: 'border-slate-100' },
  'in-progress': { label: 'Em andamento', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  completed: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
};

export function PTITab({ patientId }: { patientId: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    communication: [] as PTIGoal[],
    social: [] as PTIGoal[],
    motor: [] as PTIGoal[],
    cognitive: [] as PTIGoal[],
    custom: [] as PTIGoal[],
    other: ''
  });
  const [customGoalInput, setCustomGoalInput] = useState<Record<string, string>>({});

  const ptis = useLiveQuery(() => db.pti.where('patientId').equals(patientId).toArray(), [patientId]);
  const latest = ptis?.[ptis.length - 1];

  const handleSave = async () => {
    await db.pti.add({
      patientId,
      date: Date.now(),
      goals: formData
    });
    setIsEditing(false);
  };

  const toggleGoalSelection = (category: string, goalText: string) => {
    const catKey = category as Exclude<keyof typeof formData, 'other'>;
    const current = formData[catKey];
    const exists = current.find(g => g.text === goalText);

    if (exists) {
      setFormData({ ...formData, [catKey]: current.filter(g => g.text !== goalText) });
    } else {
      setFormData({ ...formData, [catKey]: [...current, { text: goalText, status: 'pending' }] });
    }
  };

  const addCustomGoal = (category: string) => {
    const text = customGoalInput[category];
    if (!text?.trim()) return;

    const catKey = category as Exclude<keyof typeof formData, 'other'>;
    const current = formData[catKey];
    setFormData({ ...formData, [catKey]: [...current, { text: text.trim(), status: 'pending' }] });
    setCustomGoalInput({ ...customGoalInput, [category]: '' });
  };

  const updateGoalStatus = async (ptiId: number, category: string, goalIndex: number) => {
    if (!latest) return;
    
    const updatedGoals = { ...latest.goals };
    const catKey = category as Exclude<keyof typeof updatedGoals, 'other'>;
    const goals = [...(updatedGoals[catKey] as any[])];
    
    const currentStatus = typeof goals[goalIndex] === 'string' ? 'pending' : goals[goalIndex].status;
    const nextStatus: PTIGoal['status'] = 
      currentStatus === 'pending' ? 'in-progress' : 
      currentStatus === 'in-progress' ? 'completed' : 'pending';

    const goalText = typeof goals[goalIndex] === 'string' ? goals[goalIndex] : goals[goalIndex].text;
    goals[goalIndex] = { text: goalText, status: nextStatus };
    updatedGoals[catKey] = goals;

    await db.pti.update(ptiId, { goals: updatedGoals });
  };

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-24"
      >
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-bold text-slate-800">Novo Plano Terapêutico</h3>
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start">
          <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-blue-700 leading-relaxed">
            Selecione as metas sugeridas ou adicione metas personalizadas para cada categoria. 
            Após salvar, você poderá acompanhar o progresso de cada uma.
          </p>
        </div>

        {CATEGORIES.map(cat => (
          <div key={cat.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
            <div className="h-2" style={{ backgroundColor: cat.color }} />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${cat.color}15` }}>
                  <cat.icon size={18} style={{ color: cat.color }} />
                </div>
                <h4 className="font-bold text-slate-800">{cat.label}</h4>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {cat.goals.map(goal => {
                  const isSelected = (formData[cat.id as Exclude<keyof typeof formData, 'other'>]).some(g => g.text === goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => toggleGoalSelection(cat.id, goal)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2",
                        isSelected
                          ? "bg-slate-900 text-white border-transparent shadow-lg shadow-slate-200"
                          : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Adicionar meta personalizada..."
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-brand-500"
                  value={customGoalInput[cat.id] || ''}
                  onChange={e => setCustomGoalInput({ ...customGoalInput, [cat.id]: e.target.value })}
                  onKeyPress={e => e.key === 'Enter' && addCustomGoal(cat.id)}
                />
                <button 
                  onClick={() => addCustomGoal(cat.id)}
                  className="bg-brand-50 text-brand-600 p-3 rounded-xl hover:bg-brand-100 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* List of custom goals already added */}
              <div className="mt-4 space-y-2">
                {(formData[cat.id as Exclude<keyof typeof formData, 'other'>])
                  .filter(g => !cat.goals.includes(g.text))
                  .map(goal => (
                    <div key={goal.text} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700">{goal.text}</span>
                      <button 
                        onClick={() => toggleGoalSelection(cat.id, goal.text)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="font-bold mb-4 text-slate-800 flex items-center gap-2">
            <Target size={18} className="text-brand-600" />
            Observações Gerais
          </h4>
          <textarea 
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-brand-500"
            placeholder="Digite aqui observações adicionais para o PTI..."
            value={formData.other}
            onChange={e => setFormData({...formData, other: e.target.value})}
          />
        </div>

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[450px] px-6">
          <button 
            onClick={handleSave} 
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Save size={20} />
            Salvar Plano Terapêutico
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {latest ? (
          <motion.div 
            key="latest-pti"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-xl text-slate-900">Plano Terapêutico Atual</h4>
                <p className="text-xs text-slate-400 font-medium">Definido em {formatDate(latest.date)}</p>
              </div>
              <div className="bg-brand-50 p-3 rounded-2xl">
                <Target className="text-brand-600" size={24} />
              </div>
            </div>
            
            <div className="space-y-8">
              {CATEGORIES.map(cat => {
                const goals = latest.goals[cat.id as keyof typeof latest.goals] as any[];
                if (!goals || goals.length === 0) return null;
                
                return (
                  <div key={cat.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {goals.map((g, idx) => {
                        const goalText = typeof g === 'string' ? g : g.text;
                        const goalStatus = typeof g === 'string' ? 'pending' : g.status;
                        const config = STATUS_CONFIG[goalStatus];
                        const Icon = config.icon;

                        return (
                          <button
                            key={idx}
                            onClick={() => updateGoalStatus(latest.id!, cat.id, idx)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md group",
                              config.bg,
                              config.border
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-xl bg-white shadow-sm", config.color)}>
                                <Icon size={16} />
                              </div>
                              <span className={cn(
                                "text-sm font-bold",
                                goalStatus === 'completed' ? "text-slate-400 line-through" : "text-slate-700"
                              )}>
                                {goalText}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>
                                {config.label}
                              </span>
                              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-200 group-hover:text-brand-500 transition-colors">
                                <Plus size={14} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {latest.goals.other && (
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Observações Gerais</p>
                  <p className="text-sm text-slate-600 italic leading-relaxed">{latest.goals.other}</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="empty-pti"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="text-slate-200" size={40} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">Nenhum Plano Definido</h4>
            <p className="text-sm text-slate-400 max-w-[200px] mx-auto">
              Comece criando um novo Plano Terapêutico para este paciente.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button 
        onClick={() => setIsEditing(true)} 
        className="w-full bg-brand-50 text-brand-600 font-bold py-5 rounded-[2rem] flex items-center justify-center gap-2 hover:bg-brand-100 transition-all shadow-lg shadow-brand-50/50"
      >
        <Plus size={20} />
        {latest ? 'Atualizar Plano Terapêutico' : 'Criar Novo PTI'}
      </button>
    </div>
  );
}
