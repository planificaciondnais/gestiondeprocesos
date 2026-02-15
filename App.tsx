
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Table as TableIcon, Search, BarChart3, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { HealthProcess } from './types';
import ProcessForm from './components/ProcessForm';
import MatrixView from './components/MatrixView';
import DashboardView from './components/DashboardView';
import dnaisLogo from './dnais.png';

// REEMPLAZAR CON TU URL DE DESPLIEGUE DE GOOGLE APPS SCRIPT
const SHEETS_API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL || '';

const App: React.FC = () => {
  const [processes, setProcesses] = useState<HealthProcess[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'dashboard'>('matrix');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'syncing'>('disconnected');
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      const sanitizeDate = (dateStr: any) => {
        if (!dateStr) return '';
        if (typeof dateStr === 'string') {
          return dateStr.split('T')[0]; // Toma '2026-02-08' de '2026-02-08T05...'
        }
        return dateStr;
      };

      // Intentar cargar de Google Sheets si hay URL
      if (SHEETS_API_URL) {
        try {
          setSyncStatus('syncing');
          const response = await fetch(SHEETS_API_URL);
          const data = await response.json();
          // Asegurar que los tipos de datos sean correctos
          const formatted = data.map((p: any) => ({
            ...p,
            budget: Number(p.budget || 0),
            finalAwardedAmount: p.finalAwardedAmount ? Number(p.finalAwardedAmount) : undefined,
            memoArrivalDate: sanitizeDate(p.memoArrivalDate),
            marketStudyReportDate: sanitizeDate(p.marketStudyReportDate),
            processStartDate: sanitizeDate(p.processStartDate),
            planningCertDate: sanitizeDate(p.planningCertDate),
            delegateCertDate: sanitizeDate(p.delegateCertDate),
            legalCertDate: sanitizeDate(p.legalCertDate),
            procurementCertDate: sanitizeDate(p.procurementCertDate),
            awardedCertDate: sanitizeDate(p.awardedCertDate),
            financialCertDate: sanitizeDate(p.financialCertDate),
            createdAt: sanitizeDate(p.createdAt)
          }));
          setProcesses(formatted);
          setSyncStatus('connected');
          localStorage.setItem('dnais_processes', JSON.stringify(formatted));
        } catch (error) {
          console.error("Error cargando de Google Sheets:", error);
          setSyncStatus('disconnected');
          loadLocalBackup();
        }
      } else {
        loadLocalBackup();
      }
      setIsLoading(false);
    };

    const loadLocalBackup = () => {
      const saved = localStorage.getItem('dnais_processes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const sanitizeDate = (dateStr: any) => {
            if (!dateStr) return '';
            if (typeof dateStr === 'string') return dateStr.split('T')[0];
            return dateStr;
          };

          const clean = parsed.map((p: any) => ({
            ...p,
            memoArrivalDate: sanitizeDate(p.memoArrivalDate),
            marketStudyReportDate: sanitizeDate(p.marketStudyReportDate),
            processStartDate: sanitizeDate(p.processStartDate),
            planningCertDate: sanitizeDate(p.planningCertDate),
            delegateCertDate: sanitizeDate(p.delegateCertDate),
            legalCertDate: sanitizeDate(p.legalCertDate),
            procurementCertDate: sanitizeDate(p.procurementCertDate),
            awardedCertDate: sanitizeDate(p.awardedCertDate),
            financialCertDate: sanitizeDate(p.financialCertDate),
            createdAt: sanitizeDate(p.createdAt)
          }));
          setProcesses(clean);
        } catch (e) {
          console.error("Error parsing local backup", e);
        }
      }
    };

    loadData();
  }, []);

  // Sincronizar acción con backend
  const syncWithBackend = async (action: string, payload: any, stage?: string) => {
    if (!SHEETS_API_URL) return;

    try {
      setSyncStatus('syncing');
      await fetch(SHEETS_API_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requiere no-cors o redirección compleja
        headers: { 'Content-Type': 'text/plain' }, // Cambiado a text/plain para evitar preflight CORS
        body: JSON.stringify({ action, payload, stage })
      });
      setSyncStatus('connected');
    } catch (error) {
      console.error("Error sincronizando:", error);
      setSyncStatus('disconnected');
    }
  };

  const addProcess = (data: Omit<HealthProcess, 'id' | 'createdAt'>) => {
    const newProcess: HealthProcess = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newProcess, ...processes];
    setProcesses(updated);
    localStorage.setItem('dnais_processes', JSON.stringify(updated));
    syncWithBackend('add', newProcess);
  };

  const updateProcessCertification = (id: string, stage: keyof HealthProcess, value: string | number) => {
    const updated = processes.map(p =>
      p.id === id ? { ...p, [stage]: value } : p
    );
    setProcesses(updated);
    localStorage.setItem('dnais_processes', JSON.stringify(updated));
    syncWithBackend('update', { id, value }, stage);
  };

  const deleteProcess = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este proceso?')) {
      const updated = processes.filter(p => p.id !== id);
      setProcesses(updated);
      localStorage.setItem('dnais_processes', JSON.stringify(updated));
      syncWithBackend('delete', { id });
    }
  };

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header Superior Estilo Institucional */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 relative flex-shrink-0">
              <div className="w-full h-full flex items-center justify-center">
                <img src={dnaisLogo} alt="DNAIS Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">DIRECCIÓN NACIONAL DE ATENCIÓN INTEGRAL EN SALUD</p>
              <div className="flex items-center gap-2">
                <p className="text-[9px] text-institutional-primary font-black uppercase tracking-tight">Policía Nacional del Ecuador</p>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${syncStatus === 'connected' ? 'bg-green-100 text-green-700' :
                  syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {syncStatus === 'connected' ? <Cloud className="w-2 h-2" /> :
                    syncStatus === 'syncing' ? <Loader2 className="w-2 h-2 animate-spin" /> : <CloudOff className="w-2 h-2" />}
                  {syncStatus === 'connected' ? 'Google Sheets' :
                    syncStatus === 'syncing' ? 'Sincronizando' : 'Local'}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'matrix' ? 'bg-institutional-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <TableIcon className="w-4 h-4" /> Matriz
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-institutional-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>
          </nav>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar procesos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-institutional-secondary outline-none transition-all shadow-inner"
            />
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-institutional-primary">
            <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-20" />
            <p className="text-sm font-black uppercase tracking-widest animate-pulse">Cargando base de datos...</p>
          </div>
        ) : activeTab === 'matrix' ? (
          <div className="space-y-6">
            <ProcessForm onAdd={addProcess} />
            {!SHEETS_API_URL && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-start gap-3">
                <CloudOff className="text-amber-600 w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-800 uppercase tracking-tight">Modo Offline Activo</p>
                  <p className="text-[10px] text-amber-700 font-medium">Los datos se guardan solo en este navegador. Configura la URL de Google Sheets en el código para activar el backend centralizado.</p>
                </div>
              </div>
            )}
            <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                <h2 className="text-sm font-black text-institutional-primary uppercase flex items-center gap-2 tracking-tight">
                  <LayoutGrid className="w-4 h-4 text-institutional-secondary" /> Matriz de Seguimiento Administrativo
                </h2>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vigilancia Institucional</span>
              </div>
              <MatrixView
                processes={filteredProcesses}
                onUpdate={updateProcessCertification}
                onDelete={deleteProcess}
              />
            </div>
          </div>
        ) : (
          <DashboardView processes={processes} />
        )}
      </main>
    </div>
  );
};

export default App;
