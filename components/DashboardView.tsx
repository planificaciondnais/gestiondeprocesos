
import React, { useRef, useState, useEffect } from 'react';
import { HealthProcess } from '../types';
import { calculateDaysBetween, getTodayISO, formatDate } from '../utils/dateUtils';
import { DollarSign, Layers, TrendingUp, Activity, Clock, FileDown, Loader2, Target, BarChart4, AlertTriangle, Zap, Info, Search, Filter } from 'lucide-react';

interface DashboardViewProps {
  processes: HealthProcess[];
}



const AnimatedNumber = ({ value, isCurrency = false, suffix = "" }: { value: number, isCurrency?: boolean, suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      const current = easeOutQuad(progress) * (value) + 0;
      setDisplayValue(current);
      if (progress < 1) window.requestAnimationFrame(step);
      else setDisplayValue(value);
    };
    window.requestAnimationFrame(step);
  }, [value]);

  const formatted = isCurrency
    ? new Intl.NumberFormat('es-EC', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(displayValue)
    : Math.floor(displayValue).toLocaleString('es-EC');

  return <>{formatted}{suffix}</>;
};

const DashboardView: React.FC<DashboardViewProps> = ({ processes }) => {
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');

  const displayedProcesses = selectedProcessId
    ? processes.filter(p => p.id === selectedProcessId)
    : processes;

  const todayLocal = new Date().toLocaleDateString('es-EC', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const totalBudget = displayedProcesses.reduce((acc, curr) => acc + curr.budget, 0);
  const certifiedBudget = displayedProcesses
    .filter(p => !!p.awardedCertDate)
    .reduce((acc, curr) => acc + (curr.finalAwardedAmount || curr.budget), 0);

  const completedCount = displayedProcesses.filter(p => !!p.awardedCertDate).length;
  const activeCount = displayedProcesses.length - completedCount;
  const executionRate = totalBudget > 0 ? (certifiedBudget / totalBudget) * 100 : 0;

  const getAvgDaysPerStage = () => {
    const stages = [
      { key: 'processStartDate', prev: 'marketStudyReportDate', label: 'Inicio Proceso' },
      { key: 'planningCertDate', prev: 'processStartDate', label: 'Planificación' },
      { key: 'procurementCertDate', prev: 'planningCertDate', label: 'Compras' },
      { key: 'financialCertDate', prev: 'procurementCertDate', label: 'Financiero' },
      { key: 'delegateCertDate', prev: 'financialCertDate', label: 'Delegado' },
      { key: 'legalCertDate', prev: 'delegateCertDate', label: 'Jurídico' },
      { key: 'awardedCertDate', prev: 'legalCertDate', label: 'Adjudicación' },
    ];

    return stages.map(s => {
      const completedInStage = displayedProcesses.filter(p => p[s.key as keyof HealthProcess] && p[s.prev as keyof HealthProcess]);
      const totalDays = completedInStage.reduce((acc, p) => {
        return acc + calculateDaysBetween(p[s.prev as keyof HealthProcess] as string, p[s.key as keyof HealthProcess] as string);
      }, 0);
      return {
        label: s.label,
        avg: completedInStage.length > 0 ? Math.round(totalDays / completedInStage.length) : 0,
        count: completedInStage.length
      };
    });
  };

  const getTop5Critical = () => {
    return displayedProcesses
      .filter(p => !p.awardedCertDate) // Solo activos
      .map(p => {
        const start = p.createdAt ? new Date(p.createdAt) : new Date();
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...p, daysActive: days };
      })
      .sort((a, b) => b.daysActive - a.daysActive)
      .slice(0, 5);
  };

  const top5Processes = getTop5Critical();


  const stageAnalysis = getAvgDaysPerStage();



  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-white p-8 rounded-2xl mx-auto shadow-sm w-full max-w-[1920px]">

      {/* Header Ejecutivo */}
      <div className="border-b-4 border-institutional-primary pb-3 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-institutional-primary rounded-lg flex items-center justify-center p-2">
            <Activity className="text-white w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl font-black text-institutional-primary uppercase tracking-tighter leading-none">Reporte Gerencial de Gestión</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Dirección Nacional de Atención Integral en Salud - DNAIS</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Policía Nacional del Ecuador</p>
          <p className="text-xs font-black text-institutional-secondary">{todayLocal}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-export-trigger">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-institutional-secondary rounded-full"></div>
          <h2 className="text-xs font-black text-institutional-primary uppercase tracking-widest">Indicadores de Desempeño Administrativo</h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <select
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:ring-2 focus:ring-institutional-secondary outline-none appearance-none cursor-pointer font-medium"
            >
              <option value="">Vista General (Promedios)</option>
              {processes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name.length > 40 ? p.name.substring(0, 40) + '...' : p.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
          </div>

        </div>
      </div>


      {/* KPI Cards Principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={<DollarSign />} label="Presupuesto" value={<AnimatedNumber value={totalBudget} isCurrency />} color="bg-institutional-primary" />
        <KpiCard icon={<Target />} label="Ejecución" value={<AnimatedNumber value={certifiedBudget} isCurrency />} color="bg-institutional-secondary" />
        <KpiCard icon={<Zap />} label="Eficiencia" value={<AnimatedNumber value={executionRate} suffix="%" />} color="bg-institutional-primary/90" />
        <KpiCard icon={<Layers />} label="En Trámite" value={<AnimatedNumber value={activeCount} />} color="bg-institutional-gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Análisis de Cuellos de Botella */}
        <div className="lg:col-span-2 bg-gray-50/50 p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black text-institutional-primary uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-institutional-secondary" /> Monitoreo de Tiempos por Etapa
            </h3>
          </div>

          <div className="space-y-3.5 flex-1">
            {stageAnalysis.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-24 text-[11px] font-black text-institutional-primary uppercase leading-tight">{stage.label}</div>
                <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner flex">
                  <div
                    className={`h-full transition-all duration-1000 ${stage.avg > 15 ? 'bg-red-500' : stage.avg > 7 ? 'bg-institutional-secondary' : 'bg-institutional-primary'}`}
                    style={{ width: `${Math.max(5, Math.min((stage.avg / 30) * 100, 100))}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right">
                  <span className={`text-[11px] font-black ${stage.avg > 15 ? 'text-red-600' : 'text-institutional-primary'}`}>
                    {stage.avg} <span className="text-[10px] uppercase">Días</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <div className="flex justify-center gap-6 mb-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-institutional-primary"></div> Meta Opt. (0-7 d)
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-institutional-secondary"></div> Preventivo (8-15 d)
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Correctivo (+15 d)
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-2 flex items-start gap-2 border border-gray-100">
              <Info className="w-3 h-3 text-institutional-primary mt-0.5 shrink-0" />
              <p className="text-[10px] font-medium text-gray-400 uppercase leading-tight">
                <span className="font-black text-institutional-primary">Semáforo de Gestión:</span> Mide la agilidad del flujo administrativo. Los tramos en <span className="text-red-500 font-black">Rojo</span> requieren auditoría inmediata para evitar parálisis institucional.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de Objetivos */}
        <div className="space-y-4">
          <div className="bg-institutional-primary p-5 rounded-3xl text-white relative overflow-hidden shadow-xl border-b-4 border-institutional-secondary">
            <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-white opacity-5" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Estado de Procesos</p>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase">Consolidados</span>
                <span className="text-xl font-black text-institutional-secondary">{completedCount}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase">Activos</span>
                <span className="text-xl font-black">{activeCount}</span>
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-medium text-gray-300 uppercase leading-relaxed italic">
                  * Datos extraídos del sistema de vigilancia institucional.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-800 uppercase">Alerta Institucional</p>
              <p className="text-[10px] font-bold text-amber-700 uppercase mt-0.5 leading-tight">Optimizar tiempos en etapas marcadas en rojo.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-institutional-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Top 5 Críticos
            </h3>
            <div className="space-y-3">
              {top5Processes.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0 cursor-pointer" onClick={() => setSelectedProcessId(p.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-700 truncate">{p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name}</p>
                      <p className="text-[9px] text-gray-400 uppercase">Activo hace:</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-red-500">{p.daysActive} d</span>
                  </div>
                </div>
              ))}
              {top5Processes.length === 0 && (
                <p className="text-[10px] text-gray-400 text-center italic py-2">No hay procesos críticos.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-gray-400 text-center mt-4 border-t border-gray-100 pt-3 uppercase font-bold tracking-[0.3em]">
        Documento Generado por Sistema de Vigilancia de Salud - DNAIS
      </div>
    </div >
  );
};

const KpiCard = ({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 hover:border-institutional-secondary transition-colors">
    <div className={`${color} p-2 rounded-xl text-white shadow-md shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-3.5 h-3.5" })}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <div className="text-sm font-black text-institutional-primary truncate leading-none">{value}</div>
    </div>
  </div>
);

export default DashboardView;
