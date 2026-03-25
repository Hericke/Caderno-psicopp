import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { cn, formatDate } from '../../lib/utils';
import { Camera, Trash2, Plus, X, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function EvolutionTab({ patientId }: { patientId: number }) {
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [type, setType] = useState<'session' | 'abc'>('session');
  const [content, setContent] = useState('');
  const [abc, setAbc] = useState({ antecedent: '', behavior: '', consequence: '' });
  const [photo, setPhoto] = useState<string | null>(null);

  const evolutions = useLiveQuery(() => 
    db.evolutions.where('patientId').equals(patientId).reverse().sortBy('date'), 
  [patientId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (type === 'session' && !content.trim()) return;
    if (type === 'abc' && (!abc.behavior.trim())) return;

    await db.evolutions.add({
      patientId,
      date: Date.now(),
      type,
      content,
      abc: type === 'abc' ? abc : undefined,
      photo: photo || undefined
    });
    setIsAdding(false);
    setContent('');
    setAbc({ antecedent: '', behavior: '', consequence: '' });
    setPhoto(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await db.evolutions.delete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Excluir Registro</h3>
            <p className="text-slate-500 text-center mb-8">
              Deseja excluir este registro permanentemente? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 font-bold text-white bg-red-500 rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setType('session')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2", 
                  type === 'session' ? "bg-brand-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <BookOpen size={18} />
                Sessão Comum
              </button>
              <button 
                onClick={() => setType('abc')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2", 
                  type === 'abc' ? "bg-red-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <AlertCircle size={18} />
                Registro ABC
              </button>
            </div>

            <div className="glass-card p-6 rounded-3xl space-y-4">
              {type === 'abc' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Antecedente (O que ocorreu antes?)</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]" 
                      value={abc.antecedent} 
                      onChange={e => setAbc({...abc, antecedent: e.target.value})} 
                      placeholder="Ex: Estávamos na atividade de pintura..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comportamento (O que a criança fez?)</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]" 
                      value={abc.behavior} 
                      onChange={e => setAbc({...abc, behavior: e.target.value})} 
                      placeholder="Ex: Gritou e jogou o pincel no chão..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consequência (O que ocorreu depois?)</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]" 
                      value={abc.consequence} 
                      onChange={e => setAbc({...abc, consequence: e.target.value})} 
                      placeholder="Ex: Foi retirada do ambiente para se acalmar..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Relato da Sessão</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none min-h-[200px]" 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="Descreva como foi a sessão, avanços e dificuldades observadas..."
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 text-brand-600 font-bold cursor-pointer hover:bg-brand-50 px-3 py-2 rounded-xl transition-colors">
                  <Camera size={20} />
                  <span className="text-sm">Anexar Foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {photo && (
                  <button onClick={() => setPhoto(null)} className="text-red-500 p-2 hover:bg-red-50 rounded-full">
                    <X size={20} />
                  </button>
                )}
              </div>
              {photo && <img src={photo} className="mt-2 rounded-2xl w-full h-48 object-cover shadow-inner" alt="Preview" />}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsAdding(false)} 
                className="flex-1 bg-white text-slate-500 font-bold py-4 rounded-2xl border border-slate-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className={cn(
                  "flex-[2] text-white font-bold py-4 rounded-2xl shadow-lg transition-all",
                  type === 'abc' ? "bg-red-600 shadow-red-100" : "bg-brand-600 shadow-brand-100"
                )}
              >
                Salvar Registro
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setIsAdding(true)} 
              className="w-full bg-white border-2 border-dashed border-slate-200 text-slate-400 font-bold py-6 rounded-3xl flex flex-col items-center gap-2 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-all"
            >
              <Plus size={32} />
              <span>Novo Registro de Evolução</span>
            </button>

            <div className="space-y-4 relative before:absolute before:left-6 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100">
              {evolutions?.map((ev, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={ev.id} 
                  className="relative pl-12"
                >
                  <div className={cn(
                    "absolute left-4 top-6 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10",
                    ev.type === 'abc' ? "bg-red-500" : "bg-brand-500"
                  )} />
                  
                  <div className={cn(
                    "glass-card p-5 rounded-3xl border transition-all hover:shadow-md",
                    ev.type === 'abc' ? "bg-red-50/50 border-red-100" : "bg-white border-slate-100"
                  )}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                          ev.type === 'abc' ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-700"
                        )}>
                          {ev.type === 'abc' ? 'Crise / ABC' : 'Sessão'}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                          <Clock size={12} />
                          {formatDate(ev.date)}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(ev.id!)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {ev.type === 'abc' ? (
                      <div className="space-y-3 text-sm">
                        <div className="bg-white/50 p-3 rounded-xl border border-red-100/50">
                          <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Antecedente</p>
                          <p className="text-slate-700">{ev.abc?.antecedent}</p>
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-red-100/50">
                          <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Comportamento</p>
                          <p className="text-slate-700 font-bold">{ev.abc?.behavior}</p>
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-red-100/50">
                          <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Consequência</p>
                          <p className="text-slate-700">{ev.abc?.consequence}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ev.content}</p>
                    )}

                    {ev.photo && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                        <img src={ev.photo} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" alt="Anexo" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {evolutions?.length === 0 && (
                <div className="text-center py-10 pl-12">
                  <p className="text-slate-400 text-sm italic">Nenhum registro de evolução ainda.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
