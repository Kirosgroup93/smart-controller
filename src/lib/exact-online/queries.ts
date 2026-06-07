import { createExactClient } from "./client";

export interface BalanceSheetEntry {
  GLAccountCode: string;
  GLAccountDescription: string;
  Amount: number;
  BalanceType: string;
}

export interface ProfitLossEntry {
  GLAccountCode: string;
  GLAccountDescription: string;
  Amount: number;
  ReportingPeriod: number;
  ReportingYear: number;
}

export interface OutstandingInvoice {
  InvoiceID: string;
  InvoiceNumber: number;
  AccountName: string;
  AmountDC: number;
  DueDate: string;
  YourRef: string;
}

export async function getBalanceSheet(
  accessToken: string,
  division: number,
  year: number
): Promise<BalanceSheetEntry[]> {
  const client = createExactClient(accessToken, division);
  const response = await client.get("/financial/BalanceSheets", {
    params: {
      $filter: `ReportingYear eq ${year}`,
      $select: "GLAccountCode,GLAccountDescription,Amount,BalanceType",
    },
  });
  return response.data.d.results;
}

export async function getProfitLoss(
  accessToken: string,
  division: number,
  year: number,
  period?: number
): Promise<ProfitLossEntry[]> {
  const client = createExactClient(accessToken, division);
  const filter = period
    ? `ReportingYear eq ${year} and ReportingPeriod eq ${period}`
    : `ReportingYear eq ${year}`;

  const response = await client.get("/financial/TransactionLines", {
    params: {
      $filter: filter,
      $select: "GLAccountCode,GLAccountDescription,Amount,ReportingPeriod,ReportingYear",
      $top: 1000,
    },
  });
  return response.data.d.results;
}

export async function getOutstandingReceivables(
  accessToken: string,
  division: number
): Promise<OutstandingInvoice[]> {
  const client = createExactClient(accessToken, division);
  const response = await client.get("/salesinvoice/SalesInvoices", {
    params: {
      $filter: "Status eq 20",
      $select: "InvoiceID,InvoiceNumber,AccountName,AmountDC,DueDate,YourRef",
      $orderby: "DueDate asc",
    },
  });
  return response.data.d.results;
}

export async function getOutstandingPayables(
  accessToken: string,
  division: number
): Promise<OutstandingInvoice[]> {
  const client = createExactClient(accessToken, division);
  const response = await client.get("/purchaseorder/PurchaseInvoices", {
    params: {
      $filter: "Status eq 20",
      $select: "InvoiceID,InvoiceNumber,AccountName,AmountDC,DueDate,YourRef",
      $orderby: "DueDate asc",
    },
  });
  return response.data.d.results;
}

export async function getCurrentDivision(accessToken: string): Promise<number> {
  const client = createExactClient(accessToken, 0);
  const response = await client.get("/current/Me", {
    params: { $select: "CurrentDivision" },
  });
  return response.data.d.results[0].CurrentDivision;
}
