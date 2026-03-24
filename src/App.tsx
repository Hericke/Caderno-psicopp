import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Home, Users, FileText, Settings, Plus, Search, Menu, X } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { HomeView } from './components/HomeView';
import { PatientListView } from './components/PatientListView';
import { PatientDetail } from './components/PatientDetail';
import { AddPatientForm } from './components/AddPatientForm';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const settings = useLiveQuery(() => db.settings.toArray());
  const profName = settings?.find(s => s.key === 'profName')?.value || 'Daniele Rodrigues';
  const profSpecialty = settings?.find(s => s.key === 'profSpecialty')?.value || 'Psicopedagoga';

  const handleBack = () => {
    if (selectedPatientId) {
      setSelectedPatientId(null);
    } else if (isAddingPatient) {
      setIsAddingPatient(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const renderContent = () => {
    if (selectedPatientId) {
      return (
        <motion.div 
          key="patient-detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="h-full"
        >
          <PatientDetail patientId={selectedPatientId} onBack={handleBack} />
        </motion.div>
      );
    }

    if (isAddingPatient) {
      return (
        <motion.div 
          key="add-patient"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="h-full"
        >
          <AddPatientForm onCancel={() => setIsAddingPatient(false)} onSave={() => setIsAddingPatient(false)} />
        </motion.div>
      );
    }

    return (
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {(() => {
          switch (activeTab) {
            case 'home':
              return <HomeView onSelectPatient={setSelectedPatientId} onAddPatient={() => setIsAddingPatient(true)} />;
            case 'patients':
              return <PatientListView onSelectPatient={setSelectedPatientId} onAddPatient={() => setIsAddingPatient(true)} />;
            case 'reports':
              return <ReportsView />;
            case 'settings':
              return <SettingsView />;
            default:
              return null;
          }
        })()}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 z-50">
        <div className="p-8">
          <h1 className="text-2xl font-display font-black text-brand-600 uppercase tracking-tighter">PsicoApp</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Caderno Avançado</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedPatientId(null);
                setIsAddingPatient(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all",
                activeTab === item.id && !selectedPatientId && !isAddingPatient
                  ? "bg-brand-50 text-brand-600 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-black">
              {profName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{profName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{profSpecialty}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen relative">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto w-full h-full">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        {!selectedPatientId && !isAddingPatient && (
          <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center h-16 pb-safe z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all flex-1 py-2", 
                  activeTab === item.id ? "text-brand-600" : "text-slate-400"
                )}
              >
                <item.icon size={20} className={cn(activeTab === item.id && "scale-110")} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="w-1 h-1 bg-brand-600 rounded-full mt-0.5"
                  />
                )}
              </button>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
}
