
export const calculateDaysBetween = (start: string, end: string | Date): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = typeof end === 'string' ? new Date(end) : end;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '---';
  return new Date(dateString).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};
