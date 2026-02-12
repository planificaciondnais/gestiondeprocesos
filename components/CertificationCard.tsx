
import React from 'react';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { formatDate, calculateDaysBetween, getTodayISO } from '../utils/dateUtils';

interface CertificationCardProps {
  label: string;
  startDate: string;
  completionDate?: string;
  onUpdate: (date: string) => void;
  isPreviousStepCompleted: boolean;
}

const CertificationCard: React.FC<CertificationCardProps> = ({
  label,
  startDate,
  completionDate,
  onUpdate,
  isPreviousStepCompleted
}) => {
  const isCertified = !!completionDate;
  const days = isCertified 
    ? calculateDaysBetween(startDate, completionDate!)
    : isPreviousStepCompleted ? calculateDaysBetween(startDate, getTodayISO()) : 0;

  const bgColor = isCertified ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
  const textColor = isCertified ? 'text-blue-700' : 'text-gray-500';
  const iconColor = isCertified ? 'text-blue-500' : 'text-gray-400';
  const badgeColor = isCertified ? 'bg-blue-600' : 'bg-gray-400';

  if (!isPreviousStepCompleted && !isCertified) {
    return (
      <div className="flex-1 p-4 border rounded-xl bg-gray-100 opacity-50 cursor-not-allowed">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</h4>
        <p className="text-sm text-gray-400 italic">Esperando etapa anterior...</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 border rounded-xl transition-all duration-300 ${bgColor} shadow-sm`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{label}</h4>
        {isCertified ? (
          <CheckCircle className="w-5 h-5 text-blue-600" />
        ) : (
          <Clock className="w-5 h-5 text-gray-400 animate-pulse" />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-medium">Inicia</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-sm font-semibold">{formatDate(startDate)}</span>
          </div>
        </div>

        {isCertified ? (
          <div>
            <span className="block text-[10px] text-gray-400 uppercase font-medium">Certificado</span>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-blue-500" />
              <span className="text-sm font-semibold">{formatDate(completionDate!)}</span>
            </div>
          </div>
        ) : (
          <div className="pt-1">
            <input 
              type="date" 
              className="w-full text-sm p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => onUpdate(e.target.value)}
            />
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-bold">Días transcurridos</span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${badgeColor}`}>
              {days} {days === 1 ? 'día' : 'días'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificationCard;
