
export enum CertificationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export enum ProcessType {
  INFIMA_CUANTIA = 'Ínfima Cuantía',
  CATALOGO_ELECTRONICO = 'Catálogo Electrónico',
  SUBASTA_INVERSA = 'Subasta Inversa',
  CONTRATACION_DIRECTA = 'Contratación Directa',
  LICITACION = 'Licitación',
  MENOR_CUANTIA = 'Menor Cuantía',
  REGIMEN_ESPECIAL = 'Régimen Especial'
}

export interface CertificationStep {
  arrivalDate: string; // Fecha en que llega el memorando o termina el paso anterior
  completionDate?: string; // Fecha de certificación
  daysElapsed: number;
}

export interface HealthProcess {
  id: string;
  name: string;
  processType: ProcessType;
  budget: number;
  finalAwardedAmount?: number;
  memoArrivalDate?: string;
  marketStudyReportDate?: string;
  processStartDate?: string;
  planningCertDate?: string;
  delegateCertDate?: string;
  legalCertDate?: string;
  procurementCertDate?: string;
  awardedCertDate?: string;
  financialCertDate?: string;
  createdAt: string;
}

export interface ProcessMetrics {
  totalProcesses: number;
  totalBudget: number;
  averageDays: number;
}
