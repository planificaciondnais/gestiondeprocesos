
import React, { useState } from 'react';
import { HealthProcess } from '../types';
import { calculateDaysBetween, formatDate, getTodayISO, formatCurrency } from '../utils/dateUtils';
import { Trash2, AlertCircle, Download, FileSpreadsheet, DollarSign, Edit2, X } from 'lucide-react';
import ProcessForm from './ProcessForm';

interface MatrixViewProps {
  processes: HealthProcess[];
  onUpdate: (id: string, stage: keyof HealthProcess, value: any) => void;
  onEdit: (id: string, data: Partial<HealthProcess>) => void;
  onDelete: (id: string) => void;
}

const MatrixView: React.FC<MatrixViewProps> = ({ processes, onUpdate, onEdit, onDelete }) => {
  const [editingProcess, setEditingProcess] = useState<HealthProcess | null>(null);

  const getCellStyles = (isCertified: boolean) => {
    return isCertified
      ? "bg-institutional-primary text-white font-bold"
      : "bg-gray-400 text-gray-100 font-bold placeholder:text-gray-200";
  };
  // ... (calculateStepDays and renderDaysBadge remain the same)
  const calculateStepDays = (p: HealthProcess, stage: 'market' | 'procStart' | 'plan' | 'proc' | 'fin' | 'deleg' | 'legal' | 'award') => {
    let start = '';
    let end = '';
    let isPrevCompleted = false;

    switch (stage) {
      case 'market':
        return '---';
      case 'procStart':
        start = p.marketStudyReportDate || '';
        end = p.processStartDate || getTodayISO();
        isPrevCompleted = !!p.marketStudyReportDate;
        break;
      case 'plan':
        start = p.processStartDate || '';
        end = p.planningCertDate || getTodayISO();
        isPrevCompleted = !!p.processStartDate;
        break;
      case 'proc':
        start = p.planningCertDate || '';
        end = p.procurementCertDate || getTodayISO();
        isPrevCompleted = !!p.planningCertDate;
        break;
      case 'fin':
        start = p.procurementCertDate || '';
        end = p.financialCertDate || getTodayISO();
        isPrevCompleted = !!p.procurementCertDate;
        break;
      case 'deleg':
        start = p.financialCertDate || '';
        end = p.delegateCertDate || getTodayISO();
        isPrevCompleted = !!p.financialCertDate;
        break;
      case 'legal':
        start = p.delegateCertDate || '';
        end = p.legalCertDate || getTodayISO();
        isPrevCompleted = !!p.delegateCertDate;
        break;
      case 'award':
        start = p.legalCertDate || '';
        end = p.awardedCertDate || getTodayISO();
        isPrevCompleted = !!p.legalCertDate;
        break;
    }

    if (!isPrevCompleted || !start) return '---';
    return calculateDaysBetween(start, end);
  };

  const renderDaysBadge = (days: string | number, isCertified: boolean) => {
    if (days === '---') return <span className="text-gray-400 italic text-[10px]">---</span>;

    return (
      <div className={`inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border transition-all duration-300 min-w-[56px] ${isCertified
        ? "bg-institutional-primary border-institutional-primary text-white shadow-md shadow-institutional-primary/20"
        : "bg-gray-300 border-gray-400 text-gray-600"
        }`}>
        <span className="text-base font-black leading-none">{days}</span>
        <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5 opacity-80">
          {days === 1 ? 'Día' : 'Días'}
        </span>
      </div>
    );
  };

  const handleExport = (format: 'csv' | 'excel') => {
    // ... (export logic remains the same)
    if (processes.length === 0) return;

    const headers = [
      'Nombre del Proceso',
      'Tipo de Proceso',
      'Presupuesto Referencial',
      'Monto Final Adjudicado',
      'Informe Estudio Mercado',
      'Inicio de Proceso',
      'Dias Inicio Proceso',
      'Cert. Planificacion',
      'Dias Planificacion',
      'Cert. Compras Publicas',
      'Dias Compras',
      'Cert. Financiero',
      'Dias Financiero',
      'Cert. Delegado',
      'Dias Delegado',
      'Cert. Juridico',
      'Dias Juridico',
      'Cert. Adjudicada',
      'Dias Adjudicada',
      'Total Dias'
    ];

    const dataRows = processes.map(p => {
      const dProcStart = calculateStepDays(p, 'procStart');
      const dPlan = calculateStepDays(p, 'plan');
      const dProc = calculateStepDays(p, 'proc');
      const dFin = calculateStepDays(p, 'fin');
      const dDeleg = calculateStepDays(p, 'deleg');
      const dLegal = calculateStepDays(p, 'legal');
      const dAward = calculateStepDays(p, 'award');
      const totalStart = p.marketStudyReportDate || p.createdAt?.split('T')[0] || '';
      const totalDays = totalStart ? calculateDaysBetween(totalStart, p.awardedCertDate || getTodayISO()) : '---';

      return [
        p.name,
        p.processType || '---',
        formatCurrency(p.budget),
        p.finalAwardedAmount ? formatCurrency(p.finalAwardedAmount) : '---',
        p.marketStudyReportDate || 'Pendiente',
        p.processStartDate || 'Pendiente',
        dProcStart,
        p.planningCertDate || 'Pendiente',
        dPlan,
        p.procurementCertDate || 'Pendiente',
        dProc,
        p.financialCertDate || 'Pendiente',
        dFin,
        p.delegateCertDate || 'Pendiente',
        dDeleg,
        p.legalCertDate || 'Pendiente',
        dLegal,
        p.awardedCertDate || 'Pendiente',
        dAward,
        totalDays
      ];
    });

    if (format === 'csv') {
      const content = [headers, ...dataRows]
        .map(row => row.join(','))
        .join('\n');
      const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Seguimiento_DNAIS_${getTodayISO()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const tableHeaders = headers.map(h => `<th style="background-color: #00205B; color: #FFFFFF; border: 1px solid #9DA3A7; padding: 8px; text-transform: uppercase; font-size: 10pt;">${h}</th>`).join('');

      const tableRows = dataRows.map(row => {
        const cells = row.map((cell, idx) => {
          let style = 'border: 1px solid #9DA3A7; padding: 8px; font-size: 9pt; text-align: center;';
          const isCertCol = [4, 6, 8, 10, 12, 14, 16, 18].includes(idx);
          if (isCertCol) {
            if (cell === 'Pendiente') {
              style += 'background-color: #9CA3AF; color: #F3F4F6;';
            } else {
              style += 'background-color: #00205B; color: #FFFFFF; font-weight: bold;';
            }
          }
          if (idx === 0) style += 'text-align: left; font-weight: bold;';
          return `<td style="${style}">${cell}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('');

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Matriz DNAIS</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
          <table border="1">
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Seguimiento_DNAIS_${getTodayISO()}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Modal de Edición */}
      {editingProcess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setEditingProcess(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="p-2">
              <ProcessForm
                initialData={editingProcess}
                onEdit={(id, data) => {
                  onEdit(id, data);
                  setEditingProcess(null);
                }}
                onCancel={() => setEditingProcess(null)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-3 bg-white border-b border-gray-100 flex justify-end gap-3">
        <button
          onClick={() => handleExport('csv')}
          disabled={processes.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 rounded-lg hover:bg-institutional-gray hover:text-white transition-all disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </button>
        <button
          onClick={() => handleExport('excel')}
          disabled={processes.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-institutional-secondary/10 text-institutional-primary rounded-lg hover:bg-institutional-secondary hover:text-white transition-all disabled:opacity-50 border border-institutional-secondary/20"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[2400px]">
          <thead>
            <tr className="bg-[#f8f9fa] text-institutional-primary text-[11px] uppercase tracking-wider border-b-2 border-institutional-gray">
              <th className="p-4 border-r border-gray-200 font-black" rowSpan={2}>Detalle del Proceso</th>
              <th className="p-4 border-r border-gray-200 font-black" rowSpan={2}>Tipo</th>
              <th className="p-2 text-center border-r border-gray-200 bg-amber-50" rowSpan={2}>Informe Est. Mercado</th>
              <th className="p-2 text-center border-r border-gray-200 bg-emerald-50" colSpan={2}>Inicio de Proceso</th>
              <th className="p-2 text-center border-r border-gray-200 bg-institutional-primary/5" colSpan={2}>I. Planificación</th>
              <th className="p-2 text-center border-r border-gray-200 bg-institutional-gray/5" colSpan={2}>II. Compras Públicas</th>
              <th className="p-2 text-center border-r border-gray-200 bg-institutional-secondary/5" colSpan={2}>III. Financiero</th>
              <th className="p-2 text-center border-r border-gray-200 bg-institutional-primary/5" colSpan={2}>IV. Delegado</th>
              <th className="p-2 text-center border-r border-gray-200 bg-institutional-gray/5" colSpan={2}>V. Jurídico</th>
              <th className="p-2 text-center border-r border-gray-200 bg-institutional-secondary/5" colSpan={3}>VI. Adjudicada</th>
              <th className="p-4 text-center" rowSpan={2}>Acciones</th>
            </tr>
            <tr className="bg-white text-[10px] text-gray-500 uppercase border-b border-gray-200">
              <th className="p-3 border-r border-gray-200 text-center">Fecha</th>
              <th className="p-3 border-r border-gray-200 text-center">Días</th>
              <th className="p-3 border-r border-gray-200 text-center">Certificación</th>
              <th className="p-3 border-r border-gray-200 text-center">Días</th>
              <th className="p-3 border-r border-gray-200 text-center">Certificación</th>
              <th className="p-3 border-r border-gray-200 text-center">Días</th>
              <th className="p-3 border-r border-gray-200 text-center">Certificación</th>
              <th className="p-3 border-r border-gray-200 text-center">Días</th>
              <th className="p-3 border-r border-gray-200 text-center">Certificación</th>
              <th className="p-3 border-r border-gray-200 text-center">Días</th>
              <th className="p-3 border-r border-gray-200 text-center">Certificación</th>
              <th className="p-3 border-r border-gray-200 text-center">Días</th>
              <th className="p-3 border-r border-gray-200 text-center">Certificación</th>
              <th className="p-3 border-r border-gray-200 text-center">Días</th>
              <th className="p-3 border-r border-gray-200 text-center">Monto Final</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {processes.map((p) => (
              <tr key={p.id} className="hover:bg-institutional-secondary/5 transition-colors border-b border-gray-100 group">
                {/* Info General */}
                <td className="p-4 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-institutional-secondary/5 z-10 min-w-[300px]">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-800 uppercase text-xs break-words">{p.name}</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-institutional-primary font-black bg-institutional-gray/20 px-2 py-0.5 rounded">
                        {formatCurrency(p.budget)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Tipo de Proceso */}
                <td className="p-4 border-r border-gray-200 text-center">
                  <span className="text-[10px] font-bold text-gray-600 uppercase bg-gray-100 px-2 py-1 rounded-lg">
                    {p.processType || '---'}
                  </span>
                </td>

                {/* Informe Estudio de Mercado - Fecha */}
                <td className="p-2 border-r border-gray-200 text-center w-36">
                  <input
                    type="date"
                    value={p.marketStudyReportDate || ''}
                    onChange={(e) => onUpdate(p.id, 'marketStudyReportDate', e.target.value)}
                    className={`w-full text-[10px] p-2 rounded border-none outline-none text-center transition-all ${getCellStyles(!!p.marketStudyReportDate)}`}
                  />
                </td>


                {/* Inicio de Proceso - Fecha */}
                <td className="p-2 border-r border-gray-200 text-center w-36">
                  <input
                    type="date"
                    disabled={!p.marketStudyReportDate}
                    value={p.processStartDate || ''}
                    onChange={(e) => onUpdate(p.id, 'processStartDate', e.target.value)}
                    className={`w-full text-[10px] p-2 rounded border-none outline-none text-center transition-all ${!p.marketStudyReportDate ? 'bg-gray-300 cursor-not-allowed opacity-50' : getCellStyles(!!p.processStartDate)}`}
                  />
                </td>
                {/* Inicio de Proceso - Días */}
                <td className="p-2 border-r border-gray-200 text-center bg-gray-50/50 w-24">
                  {renderDaysBadge(calculateStepDays(p, 'procStart'), !!p.processStartDate)}
                </td>

                {/* Etapa 1: Planificación */}
                <td className="p-2 border-r border-gray-200 text-center w-36">
                  <input
                    type="date"
                    disabled={!p.processStartDate}
                    value={p.planningCertDate || ''}
                    onChange={(e) => onUpdate(p.id, 'planningCertDate', e.target.value)}
                    className={`w-full text-[10px] p-2 rounded border-none outline-none text-center transition-all ${!p.processStartDate ? 'bg-gray-300 cursor-not-allowed opacity-50' : getCellStyles(!!p.planningCertDate)}`}
                  />
                </td>
                <td className="p-2 border-r border-gray-200 text-center bg-gray-50/50 w-24">
                  {renderDaysBadge(calculateStepDays(p, 'plan'), !!p.planningCertDate)}
                </td>

                {/* Etapa 2: Compras Públicas */}
                <td className="p-2 border-r border-gray-200 text-center w-36">
                  <input
                    type="date"
                    disabled={!p.planningCertDate}
                    value={p.procurementCertDate || ''}
                    onChange={(e) => onUpdate(p.id, 'procurementCertDate', e.target.value)}
                    className={`w-full text-[10px] p-2 rounded border-none outline-none text-center transition-all ${!p.planningCertDate ? 'bg-gray-300 cursor-not-allowed opacity-50' : getCellStyles(!!p.procurementCertDate)}`}
                  />
                </td>
                <td className="p-2 border-r border-gray-200 text-center bg-gray-50/50 w-24">
                  {renderDaysBadge(calculateStepDays(p, 'proc'), !!p.procurementCertDate)}
                </td>

                {/* Etapa 3: Financiero */}
                <td className="p-2 border-r border-gray-200 text-center w-36">
                  <input
                    type="date"
                    disabled={!p.procurementCertDate}
                    value={p.financialCertDate || ''}
                    onChange={(e) => onUpdate(p.id, 'financialCertDate', e.target.value)}
                    className={`w-full text-[10px] p-2 rounded border-none outline-none text-center transition-all ${!p.procurementCertDate ? 'bg-gray-300 cursor-not-allowed opacity-50' : getCellStyles(!!p.financialCertDate)}`}
                  />
                </td>
                <td className="p-2 border-r border-gray-200 text-center bg-gray-50/50 w-24">
                  {renderDaysBadge(calculateStepDays(p, 'fin'), !!p.financialCertDate)}
                </td>

                {/* Etapa 4: Delegado */}
                <td className="p-2 border-r border-gray-200 text-center w-36">
                  <input
                    type="date"
                    disabled={!p.financialCertDate}
                    value={p.delegateCertDate || ''}
                    onChange={(e) => onUpdate(p.id, 'delegateCertDate', e.target.value)}
                    className={`w-full text-[10px] p-2 rounded border-none outline-none text-center transition-all ${!p.financialCertDate ? 'bg-gray-300 cursor-not-allowed opacity-50' : getCellStyles(!!p.delegateCertDate)}`}
                  />
                </td>
                <td className="p-2 border-r border-gray-200 text-center bg-gray-50/50 w-24">
                  {renderDaysBadge(calculateStepDays(p, 'deleg'), !!p.delegateCertDate)}
                </td>

                {/* Etapa 5: Jurídico */}
                <td className="p-2 border-r border-gray-200 text-center w-36">
                  <input
                    type="date"
                    disabled={!p.delegateCertDate}
                    value={p.legalCertDate || ''}
                    onChange={(e) => onUpdate(p.id, 'legalCertDate', e.target.value)}
                    className={`w-full text-[10px] p-2 rounded border-none outline-none text-center transition-all ${!p.delegateCertDate ? 'bg-gray-300 cursor-not-allowed opacity-50' : getCellStyles(!!p.legalCertDate)}`}
                  />
                </td>
                <td className="p-2 border-r border-gray-200 text-center bg-gray-50/50 w-24">
                  {renderDaysBadge(calculateStepDays(p, 'legal'), !!p.legalCertDate)}
                </td>

                {/* Etapa 6: Adjudicada */}
                <td className="p-2 border-r border-gray-200 text-center w-36">
                  <input
                    type="date"
                    disabled={!p.legalCertDate}
                    value={p.awardedCertDate || ''}
                    onChange={(e) => onUpdate(p.id, 'awardedCertDate', e.target.value)}
                    className={`w-full text-[10px] p-2 rounded border-none outline-none text-center transition-all ${!p.legalCertDate ? 'bg-gray-300 cursor-not-allowed opacity-50' : getCellStyles(!!p.awardedCertDate)}`}
                  />
                </td>
                <td className="p-2 border-r border-gray-200 text-center bg-gray-50/50 w-24">
                  {renderDaysBadge(calculateStepDays(p, 'award'), !!p.awardedCertDate)}
                </td>

                {/* Monto Final Adjudicado */}
                <td className="p-2 border-r border-gray-200 text-center w-40">
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-institutional-gray" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      disabled={!p.awardedCertDate}
                      value={p.finalAwardedAmount || ''}
                      onChange={(e) => onUpdate(p.id, 'finalAwardedAmount', parseFloat(e.target.value))}
                      className={`w-full text-sm pl-6 pr-2 py-2 rounded border-none outline-none text-center transition-all font-black ${!p.awardedCertDate ? 'bg-gray-300 cursor-not-allowed opacity-50' : 'bg-institutional-secondary/10 text-institutional-primary focus:ring-1 focus:ring-institutional-secondary'}`}
                    />
                  </div>
                </td>

                {/* Acciones */}
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingProcess(p)}
                      className="p-2 text-gray-400 hover:text-institutional-primary transition-colors"
                      title="Editar detalle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar proceso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {processes.length === 0 && (
          <div className="p-20 text-center text-gray-400 flex flex-col items-center gap-2">
            <AlertCircle className="w-10 h-10 opacity-20" />
            <p className="font-bold text-sm">No hay procesos registrados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatrixView;
