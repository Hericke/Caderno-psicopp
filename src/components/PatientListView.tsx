import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Plus, ChevronRight, Users, Trash2 } from 'lucide-react';
import { calculateAge } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function PatientListView({ onSelectPatient, onAddPatient }: { onSelectPatient: (id: number) => void, onAddPatient: () => void }) {
  const [search, setSearch] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<{id: number, name: string} | null>(null);
  const patients = useLiveQuery(() => 
    search 
      ? db.patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).toArray()
      : db.patients.toArray()
  , [search]);

  const handleDelete = async () => {
    if (!patientToDelete) return;
    try {
      await db.transaction('rw', [db.patients, db.portage, db.iar, db.eoca, db.humanizzare, db.pti, db.evolutions], async () => {
        await db.patients.delete(patientToDelete.id);
        await db.portage.where('patientId').equals(patientToDelete.id).delete();
        await db.iar.where('patientId').equals(patientToDelete.id).delete();
        await db.eoca.where('patientId').equals(patientToDelete.id).delete();
        await db.humanizzare.where('patientId').equals(patientToDelete.id).delete();
        await db.pti.where('patientId').equals(patientToDelete.id).delete();
        await db.evolutions.where('patientId').equals(patientToDelete.id).delete();
      });
      setPatientToDelete(null);
      toast.success('Paciente excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast.error('Erro ao excluir paciente.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-6 z-40 justify-between">
        <h1 className="text-xl font-display font-bold text-slate-900">Pacientes</h1>
        <button onClick={onAddPatient} className="md:hidden p-2 text-brand-600 hover:bg-brand-50 rounded-full transition-colors">
          <Plus size={24} />
        </button>
      </header>

      <div className="p-6 space-y-6 flex-1 overflow-auto w-full">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CID..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {patients?.map((p, i) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  key={p.id} 
                  className="w-full glass-card p-5 rounded-2xl flex items-center justify-between hover:border-brand-300 hover:shadow-md transition-all group text-left cursor-pointer"
                  onClick={() => onSelectPatient(p.id!)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-lg truncate">{p.name}</p>
                      <p className="text-sm text-slate-500 font-medium">
                        {calculateAge(p.birthDate)} anos • {p.cid || 'Sem CID'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPatientToDelete({ id: p.id!, name: p.name });
                      }}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {patients?.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-20"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={40} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Nenhum paciente encontrado.</p>
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="text-brand-600 font-bold mt-2 hover:underline"
                  >
                    Limpar busca
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={onAddPatient}
        className="hidden md:flex fixed bottom-8 right-8 btn-primary h-14 px-6 items-center gap-2 shadow-xl shadow-brand-200 z-40"
      >
        <Plus size={24} />
        <span>Novo Paciente</span>
      </button>

      {/* Delete Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Excluir Paciente</h3>
            <p className="text-slate-500 text-center mb-8">
              Tem certeza que deseja excluir <strong>{patientToDelete.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPatientToDelete(null)}
                className="flex-1 py-3 font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 font-bold text-white bg-red-500 rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
