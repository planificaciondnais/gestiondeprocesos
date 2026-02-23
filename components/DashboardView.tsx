
import React, { useRef, useState, useEffect } from 'react';
import { HealthProcess, ProcessType } from '../types';
import { calculateDaysBetween, getTodayISO, formatDate } from '../utils/dateUtils';
import { DollarSign, Layers, TrendingUp, Activity, Clock, FileDown, Loader2, Target, BarChart4, AlertTriangle, Zap, Info, Search, Filter, RotateCcw } from 'lucide-react';

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
  const [selectedProcessType, setSelectedProcessType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const processTypeValues = Object.values(ProcessType);

  const displayedProcesses = processes.filter(p => {
    if (selectedProcessType && p.processType !== selectedProcessType) return false;
    if (selectedStatus === 'active' && !!p.awardedCertDate) return false;
    if (selectedStatus === 'awarded' && !p.awardedCertDate) return false;
    if (selectedProcessId && p.id !== selectedProcessId) return false;
    return true;
  });

  // Processes available for the individual selector (filtered by type and status first)
  const filteredForSelector = processes.filter(p => {
    if (selectedProcessType && p.processType !== selectedProcessType) return false;
    if (selectedStatus === 'active' && !!p.awardedCertDate) return false;
    if (selectedStatus === 'awarded' && !p.awardedCertDate) return false;
    return true;
  });

  const todayLocal = new Date().toLocaleDateString('es-EC', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const totalBudget = displayedProcesses.reduce((acc, curr) => acc + curr.budget, 0);
  const certifiedBudget = displayedProcesses
    .filter(p => !!p.awardedCertDate)
    .reduce((acc, curr) => acc + (curr.finalAwardedAmount || curr.budget), 0);

  const formatToK = (val: number) => {
    return new Intl.NumberFormat('es-EC', {
      maximumFractionDigits: 1
    }).format(val / 1000) + 'k';
  };

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

  const getCategoryDistribution = () => {
    const distribution = processTypeValues.map(type => {
      const typeProcesses = displayedProcesses.filter(p => p.processType === type);
      const categoryBudget = typeProcesses.reduce((acc, curr) => acc + curr.budget, 0);
      return {
        label: type,
        budget: categoryBudget,
        count: typeProcesses.length,
        percentage: totalBudget > 0 ? (categoryBudget / totalBudget) * 100 : 0
      };
    });
    return distribution.filter(d => d.count > 0).sort((a, b) => b.budget - a.budget);
  };

  const categoryDistribution = getCategoryDistribution();



  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-white p-8 rounded-2xl mx-auto shadow-sm w-full max-w-[1920px]">

      {/* Header Ejecutivo */}
      <div className="border-b-4 border-institutional-primary pb-3 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-institutional-primary rounded-lg flex items-center justify-center p-2">
            <Activity className="text-white w-full h-full" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-institutional-primary uppercase tracking-tighter leading-none">Reporte Gerencial de Gestión</h1>
            <p className="text-sm text-institutional-gray font-bold uppercase tracking-widest mt-2">Dirección Nacional de Atención Integral en Salud - DNAIS</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-institutional-gray font-black uppercase tracking-widest">Policía Nacional del Ecuador</p>
          <p className="text-sm font-black text-institutional-secondary">{todayLocal}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-export-trigger">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-institutional-secondary rounded-full"></div>
          <h2 className="text-sm font-black text-institutional-primary uppercase tracking-widest">Indicadores de Desempeño Administrativo</h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setSelectedProcessId('');
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-institutional-secondary outline-none appearance-none cursor-pointer font-medium"
            >
              <option value="">Todos los Estados</option>
              <option value="active">🟡 Activo</option>
              <option value="awarded">🟢 Adjudicado</option>
            </select>
          </div>
          <div className="relative flex-1 md:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <select
              value={selectedProcessType}
              onChange={(e) => {
                setSelectedProcessType(e.target.value);
                setSelectedProcessId('');
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-institutional-secondary outline-none appearance-none cursor-pointer font-medium"
            >
              <option value="">Todos los Tipos</option>
              {processTypeValues.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <select
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:ring-2 focus:ring-institutional-secondary outline-none appearance-none cursor-pointer font-medium"
            >
              <option value="">Vista General (Promedios)</option>
              {filteredForSelector.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name.length > 40 ? p.name.substring(0, 40) + '...' : p.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
          </div>

          {(selectedStatus || selectedProcessType || selectedProcessId) && (
            <button
              onClick={() => {
                setSelectedStatus('');
                setSelectedProcessType('');
                setSelectedProcessId('');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-institutional-secondary/20 rounded-xl text-xs font-black text-institutional-secondary uppercase hover:bg-institutional-secondary hover:text-white transition-all shadow-sm animate-in zoom-in duration-200"
              title="Limpiar todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>


      {/* Command Center Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Columna 1: KPIs Apilados + Distribución (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <KpiCard icon={<DollarSign />} label="Presupuesto" value={<AnimatedNumber value={totalBudget} isCurrency />} color="bg-institutional-primary" />
          <KpiCard icon={<Target />} label="Ejecución" value={<AnimatedNumber value={certifiedBudget} isCurrency />} color="bg-institutional-secondary" />
          <KpiCard icon={<Zap />} label="Eficiencia" value={<AnimatedNumber value={executionRate} suffix="%" />} color="bg-institutional-primary/90" />
          <KpiCard icon={<Layers />} label="En Trámite" value={<AnimatedNumber value={activeCount} />} color="bg-institutional-gray" />

          {/* New Visual: Distribución por Categoría */}
          <div className="mt-4 bg-gray-50/50 p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart4 className="w-5 h-5 text-institutional-secondary" />
              <h3 className="text-xs font-black text-institutional-primary uppercase tracking-widest">Distribución por Categoría</h3>
            </div>
            <div className="space-y-4">
              {categoryDistribution.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                    <span className="text-institutional-primary truncate max-w-[150px]" title={cat.label}>{cat.label}</span>
                    <span className="text-institutional-secondary">{formatToK(cat.budget)} <span className="text-[10px] text-institutional-gray">({cat.count})</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-gray-50">
                    <div
                      className="h-full bg-institutional-primary rounded-full transition-all duration-1000"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto bg-institutional-primary/5 p-4 rounded-2xl border border-institutional-primary/10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-institutional-primary uppercase">Procesos Consolidados</span>
              <span className="text-base font-black text-institutional-primary">{completedCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-institutional-secondary h-full transition-all duration-1000"
                style={{ width: `${(completedCount / (processes.length || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Columna 2: Semáforo de Tiempos (Span 6) */}
        <div className="lg:col-span-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-institutional-primary uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-institutional-secondary" /> Semáforo de Tiempos por Etapa
            </h3>
            <span className="text-xs font-bold text-institutional-gray uppercase">Promedio de Días</span>
          </div>

          <div className="space-y-5 flex-1 justify-center flex flex-col">
            {stageAnalysis.map((stage, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-end px-1">
                  <span className="text-xs font-black text-institutional-primary uppercase tracking-wide">{stage.label}</span>
                  <span className={`text-xs font-black ${stage.avg > 15 ? 'text-red-600' : 'text-institutional-primary'}`}>
                    {stage.avg} DÍAS
                  </span>
                </div>
                <div className="relative h-3 bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner">
                  <div
                    className={`h-full transition-all duration-1000 ${stage.avg > 15 ? 'bg-red-500' : stage.avg > 7 ? 'bg-institutional-secondary' : 'bg-institutional-primary'}`}
                    style={{ width: `${Math.max(5, Math.min((stage.avg / 30) * 100, 100))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="flex justify-center gap-6 mb-4">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-institutional-primary"></div> Óptimo (0-7 d)
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-institutional-secondary"></div> Preventivo (8-15 d)
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Crítico (+15 d)
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-4 flex items-start gap-3 border border-gray-100">
              <Info className="w-4 h-4 text-institutional-primary mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-institutional-gray uppercase leading-tight">
                Análisis automático de eficiencia operativa basado en la diferencia temporal entre hitos de certificación.
              </p>
            </div>
          </div>
        </div>

        {/* Columna 3: Top Críticos + Alertas (Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-institutional-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart4 className="w-5 h-5 text-red-500" />
              Top 5 Críticos
            </h3>
            <div className="space-y-3">
              {top5Processes.map((p, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between p-2.5 hover:bg-red-50 rounded-xl transition-all border-b border-gray-50 last:border-0 cursor-pointer"
                  onClick={() => setSelectedProcessId(p.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-red-200 transition-colors">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-700 truncate">{p.name}</p>
                      <p className="text-[10px] text-institutional-gray uppercase font-bold">Activo hace {p.daysActive} días</p>
                    </div>
                  </div>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {top5Processes.length === 0 && (
                <p className="text-[10px] text-institutional-gray text-center italic py-4">No se detectan procesos críticos.</p>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-500 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-black text-amber-900 uppercase">Alertas de Gestión</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-white/50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-800 uppercase leading-tight">Cuellos de Botella</p>
                <p className="text-[10px] font-bold text-amber-600 uppercase mt-1 leading-tight">Optimizar etapas marcadas en rojo para evitar parálisis institucional.</p>
              </div>
              <div className="p-3 bg-white/50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-800 uppercase leading-tight">Ejecución Presupuestaria</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${executionRate}%` }}></div>
                  </div>
                  <span className="text-[9px] font-black text-amber-700">{Math.round(executionRate)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-institutional-primary p-5 rounded-3xl text-white relative overflow-hidden shadow-xl">
            <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-70">Resumen Ejecutivo</p>
            <div className="flex justify-between items-end border-b border-white/10 pb-2 mb-2">
              <span className="text-[10px] font-bold uppercase">Tasa Eficiencia</span>
              <span className="text-lg font-black">{Math.round(executionRate)}%</span>
            </div>
            <p className="text-[9px] text-white/60 uppercase font-medium leading-tight">
              Basado en {processes.length} procesos registrados a la fecha.
            </p>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-institutional-gray text-center mt-4 border-t border-gray-100 pt-3 uppercase font-bold tracking-[0.3em]">
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
      <p className="text-xs font-black text-institutional-gray uppercase tracking-widest leading-none mb-1">{label}</p>
      <div className="text-base font-black text-institutional-primary truncate leading-none">{value}</div>
    </div>
  </div>
);

export default DashboardView;
