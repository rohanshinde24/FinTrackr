export interface ReportingMonth {
  month: string;
  start: string;
  end: string;
}

export const currentUtcMonth = (): string => new Date().toISOString().slice(0, 7);

export const reportingMonth = (month = currentUtcMonth()): ReportingMonth => {
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
  return {
    month,
    start: `${month}-01`,
    end: nextMonth,
  };
};

export const reportingMonthsEnding = (month: string, count: number): ReportingMonth[] => {
  const [year, monthNumber] = month.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const offset = count - index - 1;
    const value = new Date(Date.UTC(year, monthNumber - offset - 1, 1))
      .toISOString()
      .slice(0, 7);
    return reportingMonth(value);
  });
};
