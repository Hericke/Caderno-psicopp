import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PORTAGE_ITEMS } from '../../constants';
import { cn, formatDate } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Save, TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';

// Helper to estimate Development Age (ID) in months
// This is a more robust clinical estimation based on age ranges
const calculateID = (details: Record<string, number>, area: string) => {
  const items = (PORTAGE_ITEMS as any)[area] || [];
  if (items.length === 0) return 0;

  const ageRanges = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6'];
  let totalMonths = 0;

  ageRanges.forEach(range => {
    const rangeItems = items.filter((i: any) => i.ageRange === range);
    if (rangeItems.length > 0) {
      const rangePoints = rangeItems.reduce((acc: number, item: any) => {
        return acc + (details[item.id] || 0);
      }, 0);
      totalMonths += (rangePoints / rangeItems.length) * 12;
    }
  });

  return Math.round(totalMonths);
};

const AREA_LABELS: Record<string, string> = {
  socialization: 'Socialização',
  language: 'Linguagem',
  selfCare: 'Autocuidado',
  cognitive: 'Cognitivo',
  motor: 'Motor'
};

const AREA_COLORS: Record<string, string> = {
  socialization: '#3b82f6', // Blue
  language: '#10b981',      // Green
  selfCare: '#f59e0b',      // Amber
  cognitive: '#8b5cf6',      // Purple
  motor: '#ef4444'           // Red
};

export function PortageTab({ patientId }: { patientId: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const assessments = useLiveQuery(() => db.portage.where('patientId').equals(patientId).toArray(), [patientId]);
  const latest = assessments?.[assessments.length - 1];

  const [scores, setScores] = useState<Record<string, number>>({});

  const handleSave = async () => {
    const totals = {
      socialization: 0,
      language: 0,
      selfCare: 0,
      cognitive: 0,
      motor: 0
    };

    Object.entries(scores).forEach(([key, val]) => {
      if (key.startsWith('s')) totals.socialization += val;
      if (key.startsWith('l')) totals.language += val;
      if (key.startsWith('sc')) totals.selfCare += val;
      if (key.startsWith('c')) totals.cognitive += val;
      if (key.startsWith('m')) totals.motor += val;
    });

    await db.portage.add({
      patientId,
      date: Date.now(),
      scores: totals,
      details: scores
    });
    setIsEditing(false);
    setScores({});
  };

  if (isEditing) {
    return (
      <div className="space-y-6 pb-24">
        <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex items-start gap-3">
          <Info className="text-brand-600 shrink-0" size={20} />
          <p className="text-xs text-brand-800 leading-relaxed">
            Preencha os itens abaixo considerando o desempenho da criança: 
            <br/><strong>SIM (1)</strong>, <strong>ÀS VEZES (0.5)</strong> ou <strong>NÃO (0)</strong>.
          </p>
        </div>

        {Object.entries(PORTAGE_ITEMS).map(([area, items]) => (
          <div key={area} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
            <div className="h-2" style={{ backgroundColor: AREA_COLORS[area] }} />
            <div className="p-5">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: AREA_COLORS[area] }} />
                {AREA_LABELS[area]}
              </h4>
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.id} className="space-y-3">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.label}</p>
                    <div className="flex gap-2">
                      {[
                        { label: 'SIM', val: 1, color: 'bg-emerald-500' },
                        { label: 'ÀS VEZES', val: 0.5, color: 'bg-amber-500' },
                        { label: 'NÃO', val: 0, color: 'bg-red-500' }
                      ].map(btn => (
                        <button
                          key={btn.label}
                          onClick={() => setScores({ ...scores, [item.id]: btn.val })}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border-2",
                            scores[item.id] === btn.val 
                              ? `${btn.color} text-white border-transparent shadow-md` 
                              : "bg-white border-slate-50 text-slate-400"
                          )}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[450px] px-6">
          <button 
            onClick={handleSave} 
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Salvar Avaliação Portage
          </button>
        </div>
      </div>
    );
  }

  const chartData = latest ? Object.entries(latest.scores).map(([area, score]) => ({
    name: AREA_LABELS[area],
    score: score,
    id: calculateID(latest.details || {}, area),
    color: AREA_COLORS[area]
  })) : [];

  return (
    <div className="space-y-6 pb-24">
      {latest ? (
        <div className="space-y-6">
          {/* Chart Card */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-800">Perfil de Desenvolvimento</h4>
              <TrendingUp className="text-brand-600" size={20} />
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontWeight: 600 }}
                  />
                  <YAxis 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} 
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ID Cards */}
          <div className="grid grid-cols-1 gap-3">
            {chartData.map(d => (
              <div key={d.name} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: d.color }} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.name}</p>
                  <p className="text-lg font-bold text-slate-800">{d.score} Pontos</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Idade Desenv.</p>
                  <p className="text-lg font-bold text-brand-600">{d.id} Meses</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-400 font-medium">Nenhuma avaliação Portage realizada.</p>
        </div>
      )}

      <button 
        onClick={() => setIsEditing(true)} 
        className="w-full bg-brand-50 text-brand-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-100 transition-colors"
      >
        <Plus size={20} />
        Nova Avaliação Portage
      </button>
    </div>
  );
}
