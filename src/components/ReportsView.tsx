import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Patient } from '../db';
import { ChevronRight, FileText, Search, UserCheck, X } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { FullReport } from './FullReport';

export function ReportsView() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const patients = useLiveQuery(() => 
    search 
      ? db.patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).toArray()
      : db.patients.toArray()
  , [search]);

  if (selectedPatient) {
    return <FullReport patient={selectedPatient} onClose={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-6 z-40">
        <h1 className="text-xl font-display font-bold text-slate-900">Relatórios Profissionais</h1>
      </header>
      
      <div className="p-6 space-y-6 flex-1 overflow-auto w-full">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="bg-brand-600 p-8 rounded-[2rem] text-white shadow-lg shadow-brand-100 relative overflow-hidden">
              <div className="relative z-10 max-w-lg">
                <h2 className="text-2xl font-bold mb-2">Gerador de PDF Profissional</h2>
                <p className="text-sm opacity-90 leading-relaxed">
                  Selecione um paciente para compilar todos os testes (IAR, Portage, EOCA, PTI) em um único documento A4 profissional pronto para impressão.
                </p>
              </div>
              <FileText className="absolute -right-4 -bottom-4 text-white/10" size={160} />
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Buscar paciente pelo nome..." 
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {patients?.map((p, i) => (
                <motion.button 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  key={p.id} 
                  onClick={() => setSelectedPatient(p)}
                  className="w-full bg-white p-5 rounded-2xl flex items-center justify-between hover:border-brand-300 hover:shadow-md transition-all group border border-slate-100 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <UserCheck size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-lg truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        Pronto para exportação
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline text-[10px] font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full uppercase tracking-wider">Compilar PDF</span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>

            {patients?.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={40} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Nenhum paciente encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
