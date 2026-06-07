export interface ExactConnection {
  id: string;
  division: number;
  expiresAt: Date;
}

export interface FinancialKPIs {
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  cashPosition: number;
}

export interface DashboardData {
  kpis: FinancialKPIs;
  revenueByMonth: { month: string; revenue: number; expenses: number }[];
  topDebtors: { name: string; amount: number; daysOverdue: number }[];
  topCreditors: { name: string; amount: number; dueDate: string }[];
}
