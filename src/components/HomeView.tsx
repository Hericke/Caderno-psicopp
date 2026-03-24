import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Users, ChevronRight, Activity, TrendingUp, Clock, FileText, Search } from 'lucide-react';
import { calculateAge, formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfWeek, isAfter } from 'date-fns';

export function HomeView({ onSelectPatient, onAddPatient }: { onSelectPatient: (id: number) => void, onAddPatient: () => void }) {
  const patients = useLiveQuery(() => db.patients.toArray());
  const evolutions = useLiveQuery(() => db.evolutions.toArray());
  const iar = useLiveQuery(() => db.iar.toArray());
  const portage = useLiveQuery(() => db.portage.toArray());
  const eoca = useLiveQuery(() => db.eoca.toArray());
  const pti = useLiveQuery(() => db.pti.toArray());
  
  const recentPatients = useLiveQuery(() => db.patients.orderBy('createdAt').reverse().limit(3).toArray());
  const recentEvolutions = useLiveQuery(() => db.evolutions.orderBy('date').reverse().limit(3).toArray());

  const sessionsThisWeek = React.useMemo(() => {
    if (!evolutions) return 0;
    const weekStart = startOfWeek(new Date());
    return evolutions.filter(ev => isAfter(new Date(ev.date), weekStart)).length;
  }, [evolutions]);

  const totalReports = (iar?.length || 0) + (portage?.length || 0) + (eoca?.length || 0) + (pti?.length || 0);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!evolutions) return [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const counts = new Array(12).fill(0);
    
    evolutions.forEach(ev => {
      const month = new Date(ev.date).getMonth();
      counts[month]++;
    });

    return months.map((name, i) => ({ name, total: counts[i] }));
  }, [evolutions]);

  const stats = [
    { label: 'Pacientes', value: patients?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Esta Semana', value: sessionsThisWeek, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avaliações', value: totalReports, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-6 space-y-8 w-full pb-24">
      {/* Welcome Header */}
      <header className="space-y-1">
        <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Olá, Profissional</h2>
        <p className="text-slate-500 text-sm">Aqui está o resumo da sua clínica hoje.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div className="text-left">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-display font-bold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions & Chart */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Ações Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={onAddPatient}
                className="w-full bg-slate-900 text-white p-6 rounded-[2rem] shadow-lg shadow-slate-200 flex items-center justify-between group overflow-hidden relative"
              >
                <div className="relative z-10 text-left">
                  <p className="font-bold text-lg">Novo Paciente</p>
                  <p className="text-xs opacity-60">Cadastre um novo prontuário</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center relative z-10">
                  <Plus size={24} />
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              </button>
              
              <button 
                className="w-full bg-white text-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group overflow-hidden relative"
              >
                <div className="relative z-10 text-left">
                  <p className="font-bold text-lg">Buscar</p>
                  <p className="text-xs text-slate-400">Localizar paciente</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-600 relative z-10">
                  <Search size={24} />
                </div>
              </button>
            </div>
          </section>

          {/* Chart Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-600" />
                <h3 className="font-bold text-slate-800">Evolução Mensal</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessões</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#0ea5e9' : '#f1f5f9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.section>
        </div>

        {/* Recent Activity & Patients */}
        <div className="space-y-8">
          {/* Recent Patients */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest text-slate-400">Pacientes Recentes</h3>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {recentPatients?.map((p, i) => (
                <motion.button 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  key={p.id} 
                  onClick={() => onSelectPatient(p.id!)}
                  className="w-full bg-white p-4 rounded-2xl flex items-center justify-between hover:border-brand-300 hover:shadow-md transition-all group border border-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      {p.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {calculateAge(p.birthDate)} anos • {p.cid || 'Sem CID'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest text-slate-400">Últimas Atividades</h3>
              <Clock size={18} className="text-slate-300" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {recentEvolutions?.map((ev, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  key={ev.id} 
                  className="bg-white p-4 rounded-2xl flex items-start gap-4 border border-slate-50"
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <Activity size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-800 truncate">Evolução</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(ev.date)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {ev.content || (ev.type === 'abc' ? `Registro ABC: ${ev.abc?.behavior}` : '')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
