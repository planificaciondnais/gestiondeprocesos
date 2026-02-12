
import React, { useRef, useState, useEffect } from 'react';
import { HealthProcess } from '../types';
import { calculateDaysBetween, getTodayISO, formatDate } from '../utils/dateUtils';
import { DollarSign, Layers, TrendingUp, Activity, Clock, FileDown, Loader2, Target, BarChart4, AlertTriangle, Zap, Info } from 'lucide-react';

interface DashboardViewProps {
  processes: HealthProcess[];
}

declare var html2pdf: any;

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
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const todayLocal = new Date().toLocaleDateString('es-EC', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const totalBudget = processes.reduce((acc, curr) => acc + curr.budget, 0);
  const certifiedBudget = processes
    .filter(p => !!p.awardedCertDate)
    .reduce((acc, curr) => acc + (curr.finalAwardedAmount || curr.budget), 0);

  const completedCount = processes.filter(p => !!p.awardedCertDate).length;
  const activeCount = processes.length - completedCount;
  const executionRate = totalBudget > 0 ? (certifiedBudget / totalBudget) * 100 : 0;

  const getAvgDaysPerStage = () => {
    const stages = [
      { key: 'planningCertDate', prev: 'memoArrivalDate', label: 'Planificación' },
      { key: 'procurementCertDate', prev: 'planningCertDate', label: 'Compras' },
      { key: 'financialCertDate', prev: 'procurementCertDate', label: 'Financiero' },
      { key: 'delegateCertDate', prev: 'financialCertDate', label: 'Delegado' },
      { key: 'legalCertDate', prev: 'delegateCertDate', label: 'Jurídico' },
      { key: 'awardedCertDate', prev: 'legalCertDate', label: 'Adjudicación' },
    ];

    return stages.map(s => {
      const completedInStage = processes.filter(p => p[s.key as keyof HealthProcess] && p[s.prev as keyof HealthProcess]);
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

  const stageAnalysis = getAvgDaysPerStage();

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    const element = reportRef.current;

    const originalStyles = {
      width: element.style.width,
      padding: element.style.padding,
      margin: element.style.margin,
      borderRadius: element.style.borderRadius,
      boxShadow: element.style.boxShadow,
      background: element.style.background
    };

    const marginSize = 25.4;
    const opt = {
      margin: marginSize,
      filename: `Reporte_Ejecutivo_DNAIS_${getTodayISO()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1024
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      const trigger = element.querySelector('.no-export-trigger');
      if (trigger) trigger.classList.add('no-export');

      element.style.width = "1000px";
      element.style.margin = "0";
      element.style.padding = "10px";
      element.style.borderRadius = "0";
      element.style.boxShadow = "none";
      element.style.background = "#ffffff";

      element.classList.replace('space-y-8', 'space-y-3');
      const gridContainers = element.querySelectorAll('.grid');
      gridContainers.forEach(g => (g as HTMLElement).classList.replace('gap-6', 'gap-3'));

      await html2pdf().set(opt).from(element).save();

    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      Object.assign(element.style, originalStyles);
      element.classList.replace('space-y-3', 'space-y-8');
      const gridContainers = element.querySelectorAll('.grid');
      gridContainers.forEach(g => (g as HTMLElement).classList.replace('gap-3', 'gap-6'));

      const trigger = element.querySelector('.no-export-trigger');
      if (trigger) trigger.classList.remove('no-export');
      setIsGenerating(false);
    }
  };

  return (
    <div ref={reportRef} className="space-y-8 animate-in fade-in duration-500 bg-white p-8 rounded-2xl mx-auto shadow-sm max-w-[1000px]">

      {/* Header Ejecutivo */}
      <div className="border-b-4 border-institutional-primary pb-3 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-institutional-primary rounded-lg flex items-center justify-center p-2">
            <Activity className="text-white w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl font-black text-institutional-primary uppercase tracking-tighter leading-none">Reporte Gerencial de Gestión</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Dirección Nacional de Atención Integral en Salud - DNAIS</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Policía Nacional del Ecuador</p>
          <p className="text-xs font-black text-institutional-secondary">{todayLocal}</p>
        </div>
      </div>

      <div className="flex justify-between items-center no-export-trigger">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-institutional-secondary rounded-full"></div>
          <h2 className="text-xs font-black text-institutional-primary uppercase tracking-widest">Indicadores de Desempeño Administrativo</h2>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-2 bg-institutional-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-institutional-primary/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
          Exportar Reporte A4
        </button>
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
            <h3 className="text-[10px] font-black text-institutional-primary uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-institutional-secondary" /> Monitoreo de Tiempos por Etapa
            </h3>
          </div>

          <div className="space-y-3.5 flex-1">
            {stageAnalysis.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-24 text-[8px] font-black text-institutional-primary uppercase leading-tight">{stage.label}</div>
                <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner flex">
                  <div
                    className={`h-full transition-all duration-1000 ${stage.avg > 15 ? 'bg-red-500' : stage.avg > 7 ? 'bg-institutional-secondary' : 'bg-institutional-primary'}`}
                    style={{ width: `${Math.max(5, Math.min((stage.avg / 30) * 100, 100))}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right">
                  <span className={`text-[11px] font-black ${stage.avg > 15 ? 'text-red-600' : 'text-institutional-primary'}`}>
                    {stage.avg} <span className="text-[7px] uppercase">Días</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <div className="flex justify-center gap-6 mb-3">
              <div className="flex items-center gap-1.5 text-[7px] font-bold text-gray-500 uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-institutional-primary"></div> Meta Opt. (0-7 d)
              </div>
              <div className="flex items-center gap-1.5 text-[7px] font-bold text-gray-500 uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-institutional-secondary"></div> Preventivo (8-15 d)
              </div>
              <div className="flex items-center gap-1.5 text-[7px] font-bold text-gray-500 uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Correctivo (+15 d)
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-2 flex items-start gap-2 border border-gray-100">
              <Info className="w-3 h-3 text-institutional-primary mt-0.5 shrink-0" />
              <p className="text-[7px] font-medium text-gray-400 uppercase leading-tight">
                <span className="font-black text-institutional-primary">Semáforo de Gestión:</span> Mide la agilidad del flujo administrativo. Los tramos en <span className="text-red-500 font-black">Rojo</span> requieren auditoría inmediata para evitar parálisis institucional.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de Objetivos */}
        <div className="space-y-4">
          <div className="bg-institutional-primary p-5 rounded-3xl text-white relative overflow-hidden shadow-xl border-b-4 border-institutional-secondary">
            <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-white opacity-5" />
            <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Estado de Procesos</p>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-[9px] font-bold uppercase">Consolidados</span>
                <span className="text-xl font-black text-institutional-secondary">{completedCount}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-[9px] font-bold uppercase">Activos</span>
                <span className="text-xl font-black">{activeCount}</span>
              </div>
              <div className="pt-2">
                <p className="text-[7px] font-medium text-gray-300 uppercase leading-relaxed italic">
                  * Datos extraídos del sistema de vigilancia institucional.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-[9px] font-black text-amber-800 uppercase">Alerta Institucional</p>
              <p className="text-[7px] font-bold text-amber-700 uppercase mt-0.5 leading-tight">Optimizar tiempos en etapas marcadas en rojo.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[7px] text-gray-400 text-center mt-4 border-t border-gray-100 pt-3 uppercase font-bold tracking-[0.3em]">
        Documento Generado por Sistema de Vigilancia de Salud - DNAIS
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 hover:border-institutional-secondary transition-colors">
    <div className={`${color} p-2 rounded-xl text-white shadow-md shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-3.5 h-3.5" })}
    </div>
    <div className="min-w-0">
      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <div className="text-sm font-black text-institutional-primary truncate leading-none">{value}</div>
    </div>
  </div>
);

export default DashboardView;
