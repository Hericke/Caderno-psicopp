import React, { useState } from 'react';
import { db } from '../db';
import { Save, ArrowLeft } from 'lucide-react';

export function AddPatientForm({ onCancel, onSave }: { onCancel: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    cid: '',
    parents: '',
    contact: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.patients.add({
      ...formData,
      createdAt: Date.now()
    });
    onSave();
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-4 z-40">
        <button onClick={onCancel} className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Novo Paciente</h1>
      </header>
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-auto">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Nome Completo</label>
          <input 
            required
            type="text" 
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Data de Nascimento</label>
          <input 
            required
            type="date" 
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            value={formData.birthDate}
            onChange={e => setFormData({...formData, birthDate: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">CID</label>
          <input 
            type="text" 
            placeholder="Ex: F84.0"
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            value={formData.cid}
            onChange={e => setFormData({...formData, cid: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Responsáveis</label>
          <input 
            type="text" 
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            value={formData.parents}
            onChange={e => setFormData({...formData, parents: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Contato (WhatsApp)</label>
          <input 
            type="tel" 
            placeholder="DDD + Número"
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            value={formData.contact}
            onChange={e => setFormData({...formData, contact: e.target.value})}
          />
        </div>
      </form>
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
        >
          <Save size={20} /> Salvar Cadastro
        </button>
      </div>
    </div>
  );
}
