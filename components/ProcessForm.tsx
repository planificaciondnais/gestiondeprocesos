
import React, { useState } from 'react';
import { PlusCircle, DollarSign, FileText, List } from 'lucide-react';
import { HealthProcess, ProcessType } from '../types';

interface ProcessFormProps {
  onAdd: (process: Omit<HealthProcess, 'id' | 'createdAt'>) => void;
}

const ProcessForm: React.FC<ProcessFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [processType, setProcessType] = useState<ProcessType | ''>('');
  const [budget, setBudget] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !budget || !processType) return;

    onAdd({
      name,
      processType: processType as ProcessType,
      budget: parseFloat(budget),
    });

    setName('');
    setProcessType('');
    setBudget('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed border-institutional-secondary rounded-2xl text-institutional-primary font-black uppercase text-sm hover:bg-institutional-secondary/10 transition-all flex items-center justify-center gap-2 group tracking-widest"
      >
        <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        Registrar Nuevo Proceso Administrativo
      </button>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-institutional-primary animate-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black text-institutional-primary flex items-center gap-2 uppercase tracking-tight">
          <PlusCircle className="text-institutional-secondary w-5 h-5" /> Datos del Nuevo Proceso
        </h2>
        <button onClick={() => setIsOpen(false)} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest">CANCELAR</button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-500 uppercase">Nombre del Proceso</label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-institutional-gray" />
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Descripción del proceso..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-institutional-primary outline-none font-bold"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-500 uppercase">Tipo de Proceso</label>
          <div className="relative">
            <List className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-institutional-gray" />
            <select
              required
              value={processType}
              onChange={(e) => setProcessType(e.target.value as ProcessType)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-institutional-primary outline-none font-bold appearance-none"
            >
              <option value="" disabled>Seleccione el tipo...</option>
              {Object.values(ProcessType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-500 uppercase">Presupuesto Referencial</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-institutional-gray" />
            <input
              required
              type="number"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-institutional-primary outline-none font-bold"
            />
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="bg-institutional-primary hover:bg-institutional-primary/90 text-white font-black py-2.5 px-10 rounded-xl shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest border-b-4 border-institutional-secondary"
          >
            Insertar en Matriz
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProcessForm;
