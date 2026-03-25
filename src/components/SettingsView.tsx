import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Save, Download, Upload, Trash2, User, Shield, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function SettingsView() {
  const settings = useLiveQuery(() => db.settings.toArray());
  const [profName, setProfName] = useState('');
  const [profSpecialty, setProfSpecialty] = useState('');
  const [profCRP, setProfCRP] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'import' | 'clear', file?: File } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      const name = settings.find(s => s.key === 'profName')?.value || '';
      const specialty = settings.find(s => s.key === 'profSpecialty')?.value || 'Psicopedagoga';
      const crp = settings.find(s => s.key === 'profCRP')?.value || '';
      setProfName(name);
      setProfSpecialty(specialty);
      setProfCRP(crp);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await db.settings.put({ key: 'profName', value: profName });
    await db.settings.put({ key: 'profSpecialty', value: profSpecialty });
    await db.settings.put({ key: 'profCRP', value: profCRP });
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const exportData = async () => {
    const data = {
      patients: await db.patients.toArray(),
      portage: await db.portage.toArray(),
      iar: await db.iar.toArray(),
      eoca: await db.eoca.toArray(),
      humanizzare: await db.humanizzare.toArray(),
      pti: await db.pti.toArray(),
      evolutions: await db.evolutions.toArray(),
      settings: await db.settings.toArray(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-caderno-psico-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConfirmAction({ type: 'import', file });
  };

  const executeImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        await db.transaction('rw', [db.patients, db.portage, db.iar, db.eoca, db.humanizzare, db.pti, db.evolutions, db.settings], async () => {
          await db.patients.clear();
          await db.portage.clear();
          await db.iar.clear();
          await db.eoca.clear();
          await db.humanizzare.clear();
          await db.pti.clear();
          await db.evolutions.clear();
          await db.settings.clear();

          if (data.patients) await db.patients.bulkAdd(data.patients);
          if (data.portage) await db.portage.bulkAdd(data.portage);
          if (data.iar) await db.iar.bulkAdd(data.iar);
          if (data.eoca) await db.eoca.bulkAdd(data.eoca);
          if (data.humanizzare) await db.humanizzare.bulkAdd(data.humanizzare);
          if (data.pti) await db.pti.bulkAdd(data.pti);
          if (data.evolutions) await db.evolutions.bulkAdd(data.evolutions);
          if (data.settings) await db.settings.bulkAdd(data.settings);
        });
        
        setAlertMessage('Dados importados com sucesso!');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setAlertMessage('Erro ao importar arquivo. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
  };

  const executeClear = async () => {
    await db.delete();
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-6 z-40">
        <h1 className="text-xl font-display font-bold text-slate-900">Configurações</h1>
      </header>

      <div className="p-6 space-y-8 flex-1 overflow-auto w-full">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <User size={18} className="text-brand-600" />
              <h3 className="font-bold text-slate-800">Perfil Profissional</h3>
            </div>
            
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 h-full">
              <div className="h-2 bg-brand-500" />
              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profName} 
                    onChange={e => setProfName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Especialidade</label>
                  <input 
                    type="text" 
                    value={profSpecialty} 
                    onChange={e => setProfSpecialty(e.target.value)}
                    placeholder="Ex: Psicopedagoga Clínica"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registro (CRP/CBO)</label>
                  <input 
                    type="text" 
                    value={profCRP} 
                    onChange={e => setProfCRP(e.target.value)}
                    placeholder="Seu registro profissional"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                  />
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={cn(
                    "w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4",
                    showSuccess ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"
                  )}
                >
                  {showSuccess ? <CheckCircle2 size={20} /> : <Save size={20} />}
                  <span>{showSuccess ? 'Salvo com Sucesso!' : isSaving ? 'Salvando...' : 'Salvar Perfil'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Shield size={18} className="text-brand-600" />
              <h3 className="font-bold text-slate-800">Segurança e Backup</h3>
            </div>

            <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full">
              <div className="h-2 bg-indigo-500" />
              <div className="p-8 space-y-8 flex-1">
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Seus dados são armazenados localmente no navegador. Recomendamos exportar backups regularmente para manter sua clínica segura e permitir a restauração em outros dispositivos.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <button 
                      onClick={exportData}
                      className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-100"
                    >
                      <Download size={18} />
                      Exportar Backup
                    </button>
                    
                    <label className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
                      <Upload size={18} />
                      Importar Backup
                      <input type="file" accept=".json" onChange={importData} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-4 mt-auto">
                  <div className="flex items-center gap-2 text-red-600">
                    <Trash2 size={16} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Zona de Perigo</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Apagar todos os dados permanentemente. Esta ação não pode ser desfeita. Certifique-se de ter um backup antes de prosseguir.
                  </p>
                  <button 
                    onClick={() => setConfirmAction({ type: 'clear' })}
                    className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors"
                  >
                    Limpar Todos os Dados
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                {confirmAction.type === 'import' ? 'Importar Dados' : 'Limpar Tudo'}
              </h3>
              <p className="text-slate-500 text-center mb-8">
                {confirmAction.type === 'import' 
                  ? 'Isso irá substituir todos os dados atuais pelos dados do arquivo. Deseja continuar?' 
                  : 'TEM CERTEZA? Todos os pacientes e evoluções serão apagados permanentemente.'}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-4 font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (confirmAction.type === 'import' && confirmAction.file) {
                      executeImport(confirmAction.file);
                    } else if (confirmAction.type === 'clear') {
                      executeClear();
                    }
                    setConfirmAction(null);
                  }}
                  className="flex-1 py-4 font-bold text-white bg-red-500 rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        {alertMessage && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-brand-600" size={32} />
              </div>
              <p className="text-slate-700 text-center font-bold mb-8">
                {alertMessage}
              </p>
              <button 
                onClick={() => setAlertMessage(null)}
                className="w-full py-4 font-bold text-white bg-brand-600 rounded-2xl hover:bg-brand-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <footer className="pt-10 flex flex-col items-center gap-2 text-slate-300 text-xs text-center pb-10">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <p>Versão 2.1.0 • Caderno Psicopedagógico</p>
          </div>
          <p className="opacity-60">Desenvolvido com foco em excelência clínica e acessibilidade</p>
        </footer>
      </div>
    </div>
  );
}
