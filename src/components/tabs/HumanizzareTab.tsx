import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { HUMANIZZARE_ITEMS } from '../../constants';
import { cn, formatDate } from '../../lib/utils';
import { Save, Plus, Info, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const SCORE_DESCRIPTIONS: Record<number, { label: string, color: string }> = {
  0: { label: 'Dependência Total', color: 'bg-red-100 text-red-700' },
  1: { label: 'Assistência Máxima', color: 'bg-orange-100 text-orange-700' },
  2: { label: 'Assistência Moderada', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Assistência Mínima', color: 'bg-blue-100 text-blue-700' },
  4: { label: 'Independência Total', color: 'bg-emerald-100 text-emerald-700' }
};

export function HumanizzareTab({ patientId }: { patientId: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const assessments = useLiveQuery(() => db.humanizzare.where('patientId').equals(patientId).toArray(), [patientId]);
  const latest = assessments?.[assessments.length - 1];

  const handleSave = async () => {
    if (Object.keys(scores).length < HUMANIZZARE_ITEMS.length) {
      toast.warning('Por favor, avalie todos os itens antes de salvar.');
      return;
    }
    await db.humanizzare.add({
      patientId,
      date: Date.now(),
      scores
    });
    toast.success('Avaliação salva com sucesso!');
    setIsEditing(false);
    setScores({});
  };

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <Info className="text-brand-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Critérios de Pontuação</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Avalie cada habilidade de 0 a 4, onde 0 representa dependência completa e 4 representa independência total na execução da tarefa.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {HUMANIZZARE_ITEMS.map((item, idx) => (
              <div key={item.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {idx + 1}
                  </span>
                  <p className="font-bold text-slate-800">{item.label}</p>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4].map(val => (
                    <button
                      key={val}
                      onClick={() => setScores({ ...scores, [item.id]: val })}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2",
                        scores[item.id] === val 
                          ? "bg-rose-50 border-rose-200 text-rose-600 scale-105 shadow-sm" 
                          : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <span className="text-lg font-black">{val}</span>
                      <span className="text-[8px] font-bold uppercase text-center leading-tight">
                        {SCORE_DESCRIPTIONS[val].label.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
                {scores[item.id] !== undefined && (
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold inline-block transition-all animate-in fade-in slide-in-from-left-2",
                    SCORE_DESCRIPTIONS[scores[item.id]]?.color || "bg-slate-100 text-slate-500"
                  )}>
                    {SCORE_DESCRIPTIONS[scores[item.id]]?.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-white text-slate-500 font-bold py-4 rounded-2xl border border-slate-200"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            className="flex-[2] bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Salvar Avaliação
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-slate-900">Perfil de Autonomia</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Última atualização: {formatDate(latest.date)}</p>
                </div>
                <div className="bg-rose-50 px-4 py-2 rounded-2xl">
                  <p className="text-[10px] font-bold text-rose-400 uppercase text-center">Média Geral</p>
                  <p className="text-xl font-black text-rose-600 text-center">
                    {(Object.values(latest.scores).reduce((a, b) => a + b, 0) / HUMANIZZARE_ITEMS.length).toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {HUMANIZZARE_ITEMS.map(item => {
                  const score = latest.scores[item.id];
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          SCORE_DESCRIPTIONS[score]?.color || "bg-slate-100 text-slate-500"
                        )}>
                          {score}/4
                        </span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                        {[1, 2, 3, 4].map(v => (
                          <div 
                            key={v} 
                            className={cn(
                              "flex-1 rounded-full transition-all duration-1000",
                              score >= v ? "bg-rose-500" : "bg-slate-200/50"
                            )} 
                          />
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium italic">{SCORE_DESCRIPTIONS[score]?.label || 'Sem avaliação'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Circle className="text-slate-200" size={32} />
            </div>
            <p className="text-slate-400 font-bold">Nenhuma avaliação de autonomia registrada.</p>
            <p className="text-xs text-slate-300 mt-1">Inicie uma nova avaliação para acompanhar o progresso.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsEditing(true)} 
        className="w-full bg-white border-2 border-slate-200 text-rose-600 font-bold py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
      >
        <Plus size={24} />
        Nova Avaliação
      </button>
    </div>
  );
}
