import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ArrowLeft, Printer, MessageSquare, Trash2, Camera, User, Activity, ClipboardCheck, Brain, Heart, Target, History, Calendar, Users, Share2, X } from 'lucide-react';
import { cn, calculateAge, formatDate } from '../lib/utils';
import { PortageTab } from './tabs/PortageTab';
import { IARTab } from './tabs/IARTab';
import { EOCATab } from './tabs/EOCATab';
import { HumanizzareTab } from './tabs/HumanizzareTab';
import { PTITab } from './tabs/PTITab';
import { EvolutionTab } from './tabs/EvolutionTab';

import { PORTAGE_ITEMS } from '../constants';

const AREA_COLORS: Record<string, string> = {
  'Socialização': '#3b82f6',
  'Linguagem': '#10b981',
  'Autocuidados': '#f59e0b',
  'Cognição': '#8b5cf6',
  'Motor': '#ef4444'
};

const PTI_AREAS = [
  { id: 'cognicao', label: 'Cognição', color: '#8b5cf6', desc: 'Processos de pensamento, memória e atenção.' },
  { id: 'linguagem', label: 'Linguagem', color: '#10b981', desc: 'Comunicação verbal e não-verbal.' },
  { id: 'socioemocional', label: 'Socioemocional', color: '#3b82f6', desc: 'Interação social e regulação emocional.' },
  { id: 'psicomotricidade', label: 'Psicomotricidade', color: '#ef4444', desc: 'Coordenação motora e esquema corporal.' },
  { id: 'autonomia', label: 'Autonomia', color: '#f59e0b', desc: 'Independência em atividades diárias.' },
  { id: 'leitura_escrita', label: 'Leitura e Escrita', color: '#6366f1', desc: 'Alfabetização e letramento.' },
  { id: 'raciocinio_logico', label: 'Raciocínio Lógico', color: '#f97316', desc: 'Habilidades matemáticas e resolução de problemas.' },
];

export function PatientDetail({ patientId, onBack }: { patientId: number, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('info');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const patient = useLiveQuery(() => db.patients.get(patientId), [patientId]);
  const pti = useLiveQuery(() => db.pti.where('patientId').equals(patientId).first(), [patientId]);
  const iar = useLiveQuery(() => db.iar.where('patientId').equals(patientId).first(), [patientId]);
  const portage = useLiveQuery(() => db.portage.where('patientId').equals(patientId).first(), [patientId]);
  const humanizzare = useLiveQuery(() => db.humanizzare.where('patientId').equals(patientId).first(), [patientId]);
  const eoca = useLiveQuery(() => db.eoca.where('patientId').equals(patientId).first(), [patientId]);
  const evolutions = useLiveQuery(() => db.evolutions.where('patientId').equals(patientId).reverse().sortBy('date'), [patientId]);
  const settings = useLiveQuery(() => db.settings.toArray());

  const profName = settings?.find(s => s.key === 'profName')?.value || 'Daniele Rodrigues';
  const profSpecialty = settings?.find(s => s.key === 'profSpecialty')?.value || 'Psicopedagoga';
  const profCRP = settings?.find(s => s.key === 'profCRP')?.value || '';

  if (!patient) return null;

  const calculatePortageID = (details: Record<string, number>, area: string) => {
    const items = (PORTAGE_ITEMS as any)[area] || [];
    if (items.length === 0) return 0;
    const ageRanges = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6'];
    let totalMonths = 0;
    ageRanges.forEach(range => {
      const rangeItems = items.filter((i: any) => i.ageRange === range);
      if (rangeItems.length > 0) {
        const rangePoints = rangeItems.reduce((acc: number, item: any) => acc + (details[item.id] || 0), 0);
        totalMonths += (rangePoints / rangeItems.length) * 12;
      }
    });
    return Math.round(totalMonths);
  };

  const handleShare = async () => {
    const shareText = `
Relatório Psicopedagógico - ${patient.name}
Data: ${new Date().toLocaleDateString('pt-BR')}

Paciente: ${patient.name}
Idade: ${calculateAge(patient.birthDate)} anos
Responsável: ${patient.parents}
Contato: ${patient.contact}
CID: ${patient.cid}

Profissional: ${profName}
${profSpecialty} ${profCRP}

Documento gerado pelo Caderno Psicopedagógico Avançado.
    `.trim();
    
    try {
      if (navigator.share && /mobile/i.test(navigator.userAgent)) {
        await navigator.share({
          title: `Relatório - ${patient.name}`,
          text: shareText,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Dados do relatório copiados para a área de transferência! Você pode colar no WhatsApp ou E-mail.');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Dados do relatório copiados para a área de transferência!');
      } catch (clipErr) {
        console.error('Erro ao copiar:', clipErr);
      }
    }
  };

  const tabs = [
    { id: 'info', label: 'Cadastro', icon: User, color: 'blue' },
    { id: 'portage', label: 'Portage', icon: Activity, color: 'emerald' },
    { id: 'iar', label: 'IAR', icon: ClipboardCheck, color: 'amber' },
    { id: 'eoca', label: 'EOCA', icon: Brain, color: 'purple' },
    { id: 'humanizzare', label: 'Autonomia', icon: Heart, color: 'rose' },
    { id: 'pti', label: 'PTI', icon: Target, color: 'orange' },
    { id: 'evolution', label: 'Evolução', icon: History, color: 'indigo' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-4 z-40 justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-slate-900 truncate">{patient.name}</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">{calculateAge(patient.birthDate)} anos • {patient.cid}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="p-2 text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
            title="Compartilhar"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm shadow-lg shadow-brand-100"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Salvar</span>
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
            title="Excluir Paciente"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Excluir Paciente</h3>
            <p className="text-slate-500 text-center mb-8">
              Tem certeza que deseja excluir <strong>{patient.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  try {
                    await db.transaction('rw', [db.patients, db.portage, db.iar, db.eoca, db.humanizzare, db.pti, db.evolutions], async () => {
                      await db.patients.delete(patientId);
                      await db.portage.where('patientId').equals(patientId).delete();
                      await db.iar.where('patientId').equals(patientId).delete();
                      await db.eoca.where('patientId').equals(patientId).delete();
                      await db.humanizzare.where('patientId').equals(patientId).delete();
                      await db.pti.where('patientId').equals(patientId).delete();
                      await db.evolutions.where('patientId').equals(patientId).delete();
                    });
                    onBack();
                  } catch (error) {
                    console.error('Erro ao excluir paciente:', error);
                    alert('Erro ao excluir paciente. Por favor, tente novamente.');
                  }
                }}
                className="flex-1 py-3 font-bold text-white bg-red-500 rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-100 overflow-x-auto no-scrollbar flex px-4 sticky top-16 z-30 print:hidden">
        <div className="max-w-6xl mx-auto w-full flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all",
                activeTab === tab.id 
                  ? `border-brand-600 text-brand-600` 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-8 print:p-0">
        <div className="max-w-6xl mx-auto print:max-w-none">
          {activeTab === 'info' && <PatientInfoTab patient={patient} />}
          {activeTab === 'portage' && <PortageTab patientId={patient.id!} />}
          {activeTab === 'iar' && <IARTab patientId={patient.id!} />}
          {activeTab === 'eoca' && <EOCATab patientId={patient.id!} />}
          {activeTab === 'humanizzare' && <HumanizzareTab patientId={patient.id!} />}
          {activeTab === 'pti' && <PTITab patientId={patient.id!} />}
          {activeTab === 'evolution' && <EvolutionTab patientId={patient.id!} />}
        </div>

        {/* Print-only Report Content */}
        <div className="hidden print:block print-report bg-white p-10">
          <div className="text-center mb-12 border-b-4 border-slate-900 pb-8">
            <h1 className="text-4xl font-display font-bold uppercase tracking-widest mb-3">Relatório Psicopedagógico</h1>
            <p className="text-xl font-medium text-slate-700">{profName}</p>
            <p className="text-slate-500">{profSpecialty} {profCRP && `• ${profCRP}`}</p>
          </div>

          {/* Patient Info */}
          <section className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-bold border-b-2 border-slate-200 mb-6 pb-2 uppercase text-slate-900">1. Identificação do Paciente</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <p className="border-b border-slate-100 pb-2"><strong>Nome:</strong> {patient.name}</p>
              <p className="border-b border-slate-100 pb-2"><strong>Data de Nascimento:</strong> {formatDate(patient.birthDate)}</p>
              <p className="border-b border-slate-100 pb-2"><strong>Idade:</strong> {calculateAge(patient.birthDate)} anos</p>
              <p className="border-b border-slate-100 pb-2"><strong>CID:</strong> {patient.cid || 'N/A'}</p>
              <p className="border-b border-slate-100 pb-2"><strong>Responsáveis:</strong> {patient.parents}</p>
              <p className="border-b border-slate-100 pb-2"><strong>Contato:</strong> {patient.contact}</p>
              <p className="border-b border-slate-100 pb-2"><strong>Escolaridade:</strong> {patient.schooling || 'Não informada'}</p>
              <p className="border-b border-slate-100 pb-2"><strong>Data do Relatório:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </section>

          {portage && (
            <section className="mb-10 page-break-inside-avoid">
              <div className="flex justify-between items-end border-b-2 border-slate-200 mb-6 pb-2">
                <h2 className="text-xl font-bold uppercase text-slate-900">2. Inventário Portage</h2>
                <p className="text-xs font-bold text-slate-500 italic">Avaliação do Desenvolvimento Global</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-6">
                <div className="h-[300px] bg-white rounded-3xl border border-slate-100 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={Object.entries(portage.scores).map(([area, score]) => ({
                        area,
                        score,
                        color: AREA_COLORS[area] || '#cbd5e1'
                      }))} 
                      layout="vertical" 
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis 
                        dataKey="area" 
                        type="category" 
                        width={100} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20} isAnimationActive={false}>
                        {Object.entries(portage.scores).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={AREA_COLORS[entry[0]] || '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(portage.scores).map(([area, score]) => {
                    const idMonths = calculatePortageID(portage.details || {}, area);
                    const cronoMonths = calculateAge(patient.birthDate) * 12;
                    const delay = cronoMonths - idMonths;
                    return (
                      <div key={area} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{area}</p>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                            delay > 12 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                          )}>
                            ID: {idMonths}m
                          </span>
                        </div>
                        <p className="text-lg font-black text-slate-700">{score}%</p>
                        <p className="text-[9px] text-slate-400 italic">Idade de Desenv.: {Math.floor(idMonths/12)}a {idMonths%12}m</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Parâmetros de Desenvolvimento</p>
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  O Inventário Portage avalia o desenvolvimento global. A Idade de Desenvolvimento (ID) é comparada com a idade cronológica para identificar possíveis atrasos ou áreas de potencialidade.
                </p>
              </div>
            </section>
          )}

          {iar && (
            <section className="mb-10 page-break-inside-avoid">
              <div className="flex justify-between items-end border-b-2 border-slate-200 mb-6 pb-2">
                <h2 className="text-xl font-bold uppercase text-slate-900">3. Protocolo IAR Adaptado</h2>
                <p className="text-xs font-bold text-slate-500">Índice de Prontidão: {((Object.values(iar.items).reduce((a, b) => a + b, 0) / 6) * 100).toFixed(1)}%</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-6">
                <div className="h-[300px] bg-white rounded-3xl border border-slate-100 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Esq. Corp.', A: iar.items['esquema_corporal'] || 0, full: 1 },
                      { subject: 'Lateral.', A: iar.items['lateralidade'] || 0, full: 1 },
                      { subject: 'Ori. Esp.', A: iar.items['orientacao_espacial'] || 0, full: 1 },
                      { subject: 'Ori. Temp.', A: iar.items['orientacao_temporal'] || 0, full: 1 },
                      { subject: 'Disc. Vis.', A: iar.items['discriminacao_visual'] || 0, full: 1 },
                      { subject: 'Disc. Aud.', A: iar.items['discriminacao_auditiva'] || 0, full: 1 },
                    ]}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                      <Radar 
                        name="IAR" 
                        dataKey="A" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.5} 
                        strokeWidth={3}
                        isAnimationActive={false}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(iar.items).map(([id, score]) => (
                    <div key={id} className="flex justify-between items-center p-2 border-b border-slate-100 text-xs">
                      <span className="text-slate-600 capitalize">{id.replace(/_/g, ' ')}</span>
                      <span className="font-bold">{score === 1 ? 'Desenvolvido' : score === 0.5 ? 'Em Desenv.' : 'Dificuldade'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Informações Conclusivas</p>
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  O Protocolo IAR avalia pré-requisitos fundamentais para a alfabetização. 
                  A pontuação total indica o nível de prontidão atual para os processos de leitura e escrita.
                </p>
              </div>
            </section>
          )}

          {eoca && (
            <section className="mb-10 page-break-inside-avoid">
              <div className="flex justify-between items-end border-b-2 border-slate-200 mb-6 pb-2">
                <h2 className="text-xl font-bold uppercase text-slate-900">4. Entrevista Operativa (EOCA)</h2>
                <p className="text-xs font-bold text-slate-500 italic">Vínculo com a Aprendizagem</p>
              </div>
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ponto Conclusivo</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{eoca.ponto_conclusivo || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Hipótese Diagnóstica</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{eoca.hipotese_diagnostica || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Orientação</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{eoca.orientacao || 'N/A'}</p>
                </div>
              </div>
            </section>
          )}

          {pti && (
            <section className="mb-10 page-break-inside-avoid">
              <div className="flex justify-between items-end border-b-2 border-slate-200 mb-6 pb-2">
                <h2 className="text-xl font-bold uppercase text-slate-900">5. Plano Terapêutico Individual (PTI)</h2>
                <p className="text-xs font-bold text-slate-500 italic">Planejamento de Intervenção</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Frequência</p>
                  <p className="text-sm font-bold text-slate-700">{pti.frequencia || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Duração</p>
                  <p className="text-sm font-bold text-slate-700">{pti.duracao || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Objetivos Terapêuticos</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{pti.objetivos || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Áreas de Foco e Legenda</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PTI_AREAS.map(area => {
                      const isActive = pti.areas_foco?.includes(area.label) || false;
                      return (
                        <div key={area.id} className={cn(
                          "p-3 rounded-xl border transition-all",
                          isActive ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50/50 border-transparent opacity-40"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: area.color }} />
                            <p className="text-xs font-bold text-slate-700">{area.label}</p>
                          </div>
                          <p className="text-[10px] text-slate-500 italic">{area.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {humanizzare && humanizzare.items && (
            <section className="mb-10 page-break-inside-avoid">
              <div className="flex justify-between items-end border-b-2 border-slate-200 mb-6 pb-2">
                <h2 className="text-xl font-bold uppercase text-slate-900">6. Avaliação Humanizzare</h2>
                <p className="text-xs font-bold text-slate-500 italic">Aspectos Emocionais e Sociais</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(humanizzare.items).map(([id, score]) => (
                  <div key={id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{id.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-bold text-slate-700">{score === 1 ? 'Desenvolvido' : score === 0.5 ? 'Em Desenv.' : 'Dificuldade'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {evolutions && evolutions.length > 0 && (
            <section className="mb-10 page-break-inside-avoid">
              <h2 className="text-xl font-bold border-b-2 border-slate-200 mb-6 pb-2 uppercase text-slate-900">7. Histórico de Evolução</h2>
              <div className="space-y-4">
                {evolutions.map((ev) => (
                  <div key={ev.id} className="border-l-4 border-slate-200 pl-4 py-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {ev.type === 'abc' ? 'Registro ABC' : 'Sessão'} • {formatDate(ev.date)}
                      </span>
                    </div>
                    {ev.type === 'abc' ? (
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <p><strong>Antecedente:</strong> {ev.abc?.antecedent}</p>
                        <p><strong>Comportamento:</strong> {ev.abc?.behavior}</p>
                        <p><strong>Consequência:</strong> {ev.abc?.consequence}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{ev.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-32 text-center">
            <div className="w-72 h-px bg-slate-900 mx-auto mb-3"></div>
            <p className="font-bold text-lg">{profName}</p>
            <p className="text-slate-600">{profSpecialty}</p>
            {profCRP && <p className="text-sm text-slate-500">{profCRP}</p>}
            <p className="text-xs text-slate-400 mt-12 italic">Documento gerado digitalmente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientInfoTab({ patient }: { patient: any }) {
  const handleWhatsApp = () => {
    const number = patient.contact.replace(/\D/g, '');
    window.open(`https://wa.me/55${number}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-600 text-4xl font-bold shadow-inner">
            {patient.name.charAt(0)}
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-display font-bold text-slate-900">{patient.name}</h3>
            <p className="text-slate-500 font-medium">Paciente desde {formatDate(patient.createdAt)}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{patient.cid}</span>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{calculateAge(patient.birthDate)} Anos</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nascimento</p>
                <p className="font-bold text-slate-700">{formatDate(patient.birthDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsáveis</p>
                <p className="font-bold text-slate-700">{patient.parents}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <Brain size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escolaridade</p>
                <p className="font-bold text-slate-700">{patient.schooling || 'Não informada'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contato</p>
                <p className="font-bold text-slate-700">{patient.contact}</p>
              </div>
            </div>
            <button 
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
            >
              <MessageSquare size={20} />
              Abrir no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
