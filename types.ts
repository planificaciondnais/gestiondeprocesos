
export enum CertificationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface CertificationStep {
  arrivalDate: string; // Fecha en que llega el memorando o termina el paso anterior
  completionDate?: string; // Fecha de certificación
  daysElapsed: number;
}

export interface HealthProcess {
  id: string;
  name: string;
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
