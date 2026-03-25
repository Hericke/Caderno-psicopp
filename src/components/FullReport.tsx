import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Patient } from '../db';
import { formatDate, calculateAge, cn } from '../lib/utils';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Share2, Printer, X, ArrowLeft, User, Calendar, Phone, Users, ClipboardCheck, Brain, Activity, Heart, Target, History, Copy, Loader2, Download } from 'lucide-react';
import { PORTAGE_ITEMS } from '../constants';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export function FullReport({ patient, onClose }: { patient: Patient, onClose: () => void }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const iar = useLiveQuery(() => db.iar.where('patientId').equals(patient.id!).toArray(), [patient.id]);
  const portage = useLiveQuery(() => db.portage.where('patientId').equals(patient.id!).toArray(), [patient.id]);
  const eoca = useLiveQuery(() => db.eoca.where('patientId').equals(patient.id!).toArray(), [patient.id]);
  const pti = useLiveQuery(() => db.pti.where('patientId').equals(patient.id!).toArray(), [patient.id]);
  const evolutions = useLiveQuery(() => db.evolutions.where('patientId').equals(patient.id!).toArray(), [patient.id]);
  const settings = useLiveQuery(() => db.settings.toArray());

  const latestIar = iar?.[iar.length - 1];
  const latestPortage = portage?.[portage.length - 1];
  const latestEoca = eoca?.[eoca.length - 1];
  const latestPti = pti?.[pti.length - 1];
  const profName = settings?.find(s => s.key === 'profName')?.value || 'Daniele Rodrigues';
  const profSpecialty = settings?.find(s => s.key === 'profSpecialty')?.value || 'Psicopedagoga';
  const profCRP = settings?.find(s => s.key === 'profCRP')?.value || '';

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

  const generatePDFBlob = async (): Promise<{ blob: Blob, pdf: jsPDF } | null> => {
    if (!reportRef.current) return null;
    
    setIsGenerating(true);
    const toastId = toast.loading('Gerando PDF profissional...');
    
    try {
      const element = reportRef.current;
      
      // Ensure all images are loaded
      const images = element.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Use a higher scale for better quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const controls = clonedDoc.querySelectorAll('.print-controls');
          controls.forEach(c => (c as HTMLElement).style.display = 'none');
          
          // Force visibility and dimensions in the clone
          const clonedElement = clonedDoc.getElementById('report-content');
          if (clonedElement) {
            clonedElement.style.maxWidth = 'none';
            clonedElement.style.width = '1000px';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.height = 'auto';
            clonedElement.style.backgroundColor = '#ffffff';
          }

          // Add a style tag to the clone to override any remaining oklch colors
          // and simplify shadows which can also cause issues in html2canvas
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
            .glass-card {
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              background-color: rgba(255, 255, 255, 0.95) !important;
            }
            /* Explicit hex overrides for common classes used in the report */
            [class*="bg-slate-50"] { background-color: #f8fafc !important; }
            [class*="bg-purple-50"] { background-color: #faf5ff !important; }
            [class*="bg-blue-50"] { background-color: #eff6ff !important; }
            [class*="bg-white"] { background-color: #ffffff !important; }
            
            [class*="text-slate-900"] { color: #0f172a !important; }
            [class*="text-slate-700"] { color: #334155 !important; }
            [class*="text-slate-600"] { color: #475569 !important; }
            [class*="text-slate-500"] { color: #64748b !important; }
            [class*="text-slate-400"] { color: #94a3b8 !important; }
            
            [class*="text-purple-600"] { color: #9333ea !important; }
            [class*="text-purple-700"] { color: #7e22ce !important; }
            [class*="text-blue-600"] { color: #2563eb !important; }
            [class*="text-blue-700"] { color: #1d4ed8 !important; }
            
            [class*="border-slate-100"] { border-color: #f1f5f9 !important; }
            [class*="border-purple-100"] { border-color: #f3e8ff !important; }
            [class*="border-blue-100"] { border-color: #dbeafe !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      
      // Add subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      toast.dismiss(toastId);
      return { blob: pdf.output('blob'), pdf };
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Falha ao gerar PDF. Tente novamente.');
      toast.dismiss(toastId);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const result = await generatePDFBlob();
    if (!result) return;

    const fileName = `Relatorio_${patient.name.replace(/\s+/g, '_')}.pdf`;
    
    try {
      result.pdf.save(fileName);
      toast.success('PDF baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao baixar:', err);
      // Fallback to blob download
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF baixado com sucesso!');
    }
  };

  const handleShare = async () => {
    const result = await generatePDFBlob();
    if (!result) return;

    const fileName = `Relatorio_${patient.name.replace(/\s+/g, '_')}.pdf`;
    
    try {
      const pdfBlob = result.blob;
      const url = URL.createObjectURL(pdfBlob);
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Check if sharing is supported for this file
      const canShare = navigator.canShare && navigator.canShare({ files: [file] });
      
      if (navigator.share && canShare) {
        await navigator.share({
          files: [file],
          title: 'Relatório Evolução',
          text: `Segue o relatório em anexo de ${patient.name}.`
        });
        toast.success('Relatório compartilhado com sucesso!');
      } else {
        // Fallback to opening in new tab if sharing is not supported
        window.open(url, '_blank');
        toast.info('O PDF foi aberto para visualização/download manual.');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
      if ((err as Error).name !== 'AbortError') {
        toast.error('Não foi possível compartilhar o arquivo.');
        // Final fallback to download
        handleDownload();
      }
    }
  };

  const iarData = latestIar ? [
    { subject: 'Esquema Corporal', A: latestIar.items['esquema_corporal'] || 0, full: 1 },
    { subject: 'Lateralidade', A: latestIar.items['lateralidade'] || 0, full: 1 },
    { subject: 'Orientação Espacial', A: latestIar.items['orientacao_espacial'] || 0, full: 1 },
    { subject: 'Orientação Temporal', A: latestIar.items['orientacao_temporal'] || 0, full: 1 },
    { subject: 'Discriminação Visual', A: latestIar.items['discriminacao_visual'] || 0, full: 1 },
    { subject: 'Discriminação Auditiva', A: latestIar.items['discriminacao_auditiva'] || 0, full: 1 },
  ] : [];

  const iarTotal = latestIar ? Object.values(latestIar.items).reduce((acc, val) => acc + val, 0) : 0;
  const iarMax = 6; // Based on the 6 categories above

  const portageData = latestPortage ? Object.entries(latestPortage.scores).map(([area, score]) => ({
    area,
    score,
    color: AREA_COLORS[area] || '#cbd5e1'
  })) : [];

  const handlePrint = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      const result = await generatePDFBlob();
      if (!result) return;
      
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.click();
      toast.info('O PDF foi aberto para visualização.');
    } else {
      toast.info('Preparando relatório para impressão...', { duration: 2000 });
      setTimeout(() => {
        window.print();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-auto p-4 sm:p-8 print:p-0 print:static print:overflow-visible">
      <div id="report-content" ref={reportRef} className="max-w-4xl mx-auto space-y-8 sm:space-y-12 pb-20 print:pb-0 bg-white">
        
        {/* Top Controls (Mobile Friendly) */}
        <div className="flex justify-between items-center mb-4 sm:mb-8 print:hidden print-controls">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50"
              title="Baixar PDF"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            </button>
            <button 
              onClick={handleShare}
              disabled={isGenerating}
              className="p-3 bg-brand-50 text-brand-600 rounded-2xl hover:bg-brand-100 transition-all disabled:opacity-50"
              title="Compartilhar PDF"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
            </button>
            <button 
              onClick={handlePrint}
              disabled={isGenerating}
              className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
              title="Salvar/Imprimir"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-tighter">Relatório Psicopedagógico</h1>
            <p className="text-slate-500 font-medium italic text-sm sm:text-base">Documento Confidencial de Avaliação e Intervenção</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-bold text-slate-800">{profName}</p>
            <p className="text-sm text-slate-500">{profSpecialty}</p>
            <p className="text-sm text-slate-500">{profCRP}</p>
          </div>
        </div>

        {/* Patient Info */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 bg-slate-50 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paciente</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900">{patient.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Idade</p>
                <p className="font-bold text-slate-700">{calculateAge(patient.birthDate)} anos</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CID</p>
                <p className="font-bold text-slate-700">{patient.cid || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
              <p className="font-bold text-slate-700">{patient.parents || 'Não informado'}</p>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contato</p>
              <p className="font-bold text-slate-700">{patient.contact || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Escolaridade</p>
              <p className="font-bold text-slate-700">{patient.schooling || 'Não informada'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data do Relatório</p>
              <p className="font-bold text-slate-700">{formatDate(Date.now())}</p>
            </div>
          </div>
        </section>

        {/* IAR Assessment */}
        {latestIar && (
          <section className="space-y-6 break-inside-avoid">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <h2 className="text-xl font-black text-purple-600 uppercase tracking-tight">Protocolo IAR Adaptado</h2>
              <p className="text-xs font-bold text-slate-400">Índice de Prontidão: {((iarTotal / iarMax) * 100).toFixed(1)}%</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-[350px] bg-white rounded-3xl border border-slate-50 p-4 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={iarData}>
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
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {iarData.map(item => (
                    <div key={item.subject} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{item.subject}</p>
                      <p className="text-sm font-black text-slate-700">{item.A === 1 ? 'Desenvolvido' : item.A === 0.5 ? 'Em Processo' : 'Necessita Estímulo'}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-purple-50 p-5 rounded-[1.5rem] border border-purple-100">
                  <p className="text-xs font-bold text-purple-700 uppercase mb-2 tracking-widest">Informações Conclusivas</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    O Protocolo IAR avalia pré-requisitos fundamentais para a alfabetização. 
                    A pontuação total de <strong>{iarTotal.toFixed(1)} de {iarMax}</strong> indica o nível de prontidão atual.
                    {iarTotal >= 5 ? ' O paciente apresenta excelente prontidão para os processos de leitura e escrita.' : 
                     iarTotal >= 3 ? ' O paciente apresenta prontidão parcial, necessitando de estímulos específicos em áreas de déficit.' : 
                     ' O paciente necessita de intervenção intensiva nos pré-requisitos de alfabetização.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Portage Assessment */}
        {latestPortage && (
          <section className="space-y-6 break-inside-avoid">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">Inventário Portage</h2>
              <p className="text-xs font-bold text-slate-400">Avaliação do Desenvolvimento</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-[350px] bg-white rounded-3xl border border-slate-50 p-6 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portageData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      dataKey="area" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={24} isAnimationActive={false}>
                      {portageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(latestPortage.scores).map(([area, score]) => {
                    const idMonths = calculatePortageID(latestPortage.details || {}, area);
                    const cronoMonths = calculateAge(patient.birthDate) * 12;
                    const delay = cronoMonths - idMonths;
                    
                    return (
                      <div key={area} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{area}</p>
                          <p className={cn(
                            "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                            delay > 12 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                          )}>
                            ID: {idMonths}m
                          </p>
                        </div>
                        <p className="text-lg font-black text-slate-700">{score}%</p>
                        <p className="text-[9px] text-slate-400 italic">Idade de Desenv.: {Math.floor(idMonths/12)}a {idMonths%12}m</p>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-blue-50 p-5 rounded-[1.5rem] border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-2 tracking-widest">Parâmetros de Desenvolvimento</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    O Inventário Portage avalia o desenvolvimento global. Os resultados indicam a porcentagem de metas alcançadas em cada área. 
                    A <strong>Idade de Desenvolvimento (ID)</strong> é comparada com a idade cronológica para identificar possíveis atrasos ou áreas de potencialidade.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* EOCA */}
        {latestEoca && (
          <section className="space-y-6 break-inside-avoid">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <h2 className="text-xl font-black text-amber-600 uppercase tracking-tight">4. Entrevista Operativa (EOCA)</h2>
              <p className="text-xs font-bold text-slate-400 italic">Avaliação do Vínculo com a Aprendizagem</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Modalidade de Aprendizagem Predominante</p>
                <p className="text-2xl font-black text-amber-900 capitalize">{latestEoca.learningModality}</p>
                <p className="text-xs text-amber-600 mt-2 italic">
                  {latestEoca.learningModality === 'hipoassimilativa' ? 'Pobreza no contato com o objeto, dificuldade em internalizar.' :
                   latestEoca.learningModality === 'hiperassimilativa' ? 'Predomínio da imaginação, dificuldade em focar no real.' :
                   latestEoca.learningModality === 'hipoacomodativa' ? 'Dificuldade em transformar o conhecimento, rigidez.' :
                   'Excesso de imitação, falta de criatividade própria.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['thematic', 'dynamic', 'product'].map(cat => (
                  <div key={cat} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-slate-900 mb-3 uppercase text-[10px] tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {cat === 'thematic' ? 'Temática' : cat === 'dynamic' ? 'Dinâmica' : 'Produto'}
                    </h3>
                    <div className="space-y-3">
                      {Array.isArray(latestEoca[cat as keyof typeof latestEoca]) && (latestEoca[cat as keyof typeof latestEoca] as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(latestEoca[cat as keyof typeof latestEoca] as string[]).map((item: string) => (
                            <span key={item} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                      {latestEoca[`${cat}Obs` as keyof typeof latestEoca] && (
                        <p className="text-xs text-slate-500 italic leading-relaxed pt-2 border-t border-slate-200/50">
                          {latestEoca[`${cat}Obs` as keyof typeof latestEoca] as string}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Conclusões e Hipóteses Diagnósticas</p>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{latestEoca.conclusions}</p>
              </div>
            </div>
          </section>
        )}

        {/* PTI */}
        {latestPti && (
          <section className="space-y-6 break-inside-avoid">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <h2 className="text-xl font-black text-emerald-600 uppercase tracking-tight">5. Plano Terapêutico Individual (PTI)</h2>
              <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-slate-400">Pendente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-600">Em Andamento</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600">Concluído</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Frequência</p>
                <p className="text-sm font-bold text-slate-700">{latestPti.frequencia || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Duração</p>
                <p className="text-sm font-bold text-slate-700">{latestPti.duracao || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Objetivos Terapêuticos</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{latestPti.objetivos || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Áreas de Foco e Legenda</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PTI_AREAS.map(area => {
                    const isActive = latestPti.areas_foco?.includes(area.label) || false;
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Estratégias</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{latestPti.estrategias || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Recursos</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{latestPti.recursos || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Photos and Evolutions */}
        {evolutions && evolutions.length > 0 && (
          <section className="space-y-6 break-inside-avoid">
            <h2 className="text-xl font-black text-slate-900 border-l-4 border-slate-900 pl-4 uppercase tracking-tight">Histórico de Evolução</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evolutions.slice(-4).map((ev) => (
                <div key={ev.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded-lg">
                      {ev.type === 'abc' ? 'Registro ABC' : 'Sessão'} • {formatDate(ev.date)}
                    </span>
                  </div>
                  {ev.type === 'abc' ? (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-600"><strong className="text-slate-900 uppercase text-[9px]">Antecedente:</strong> {ev.abc?.antecedent}</p>
                      <p className="text-slate-600"><strong className="text-slate-900 uppercase text-[9px]">Comportamento:</strong> {ev.abc?.behavior}</p>
                      <p className="text-slate-600"><strong className="text-slate-900 uppercase text-[9px]">Consequência:</strong> {ev.abc?.consequence}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed italic line-clamp-4">{ev.content}</p>
                  )}
                  {ev.photo && (
                    <div className="mt-4">
                      <img src={ev.photo} className="w-full h-32 object-cover rounded-xl border border-white shadow-sm" alt="Anexo" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="pt-20 border-t border-slate-100 text-center space-y-10">
          <div className="inline-block border-t-2 border-slate-900 pt-4 px-20">
            <p className="font-black text-slate-900 uppercase tracking-tighter">{profName}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{profSpecialty}</p>
            <p className="text-[10px] text-slate-400">{profCRP}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-slate-300 uppercase tracking-[0.3em] font-bold">Gerado por Caderno Psicopedagógico Avançado</p>
            <p className="text-[9px] text-slate-200 italic">Este documento é confidencial e seu conteúdo é de responsabilidade do profissional emissor.</p>
          </div>
        </div>

        {/* Print Controls */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row gap-3 sm:gap-4 print:hidden z-[110] w-[90%] sm:w-auto print-controls">
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <button 
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 sm:flex-none bg-white text-slate-600 font-black px-4 sm:px-6 py-4 rounded-2xl shadow-2xl border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <X size={20} />
              <span className="hidden sm:inline">Fechar</span>
            </button>
            <button 
              onClick={handlePrint}
              disabled={isGenerating}
              className="flex-1 sm:flex-none bg-slate-900 text-white font-black px-4 sm:px-10 py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
              <span>Visualizar PDF</span>
            </button>
          </div>
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <button 
              onClick={handleShare}
              disabled={isGenerating}
              className="flex-1 sm:flex-none bg-brand-600 text-white font-black px-4 sm:px-6 py-4 rounded-2xl shadow-2xl border border-brand-500 flex items-center justify-center gap-2 hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
              <span>Enviar por WhatsApp/Compartilhar</span>
            </button>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="hidden sm:flex bg-slate-100 text-slate-600 font-black px-4 sm:px-6 py-4 rounded-2xl shadow-2xl border border-slate-200 items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              <span className="hidden sm:inline">Baixar</span>
            </button>
          </div>
          <p className="sm:hidden text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {isGenerating ? 'Processando relatório...' : 'Dica: Use "Visualizar" se o compartilhamento falhar'}
          </p>
        </div>
      </div>
    </div>
  );
}
