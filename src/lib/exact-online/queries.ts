import axios from "axios";
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
  Status?: number;
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
      $filter: "Status ne 100",
      $select: "InvoiceID,InvoiceNumber,AccountName,AmountDC,DueDate,YourRef,Status",
      $orderby: "DueDate asc",
      $top: 100,
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
      $filter: "Status ne 100",
      $select: "InvoiceID,InvoiceNumber,AccountName,AmountDC,DueDate,YourRef,Status",
      $orderby: "DueDate asc",
      $top: 100,
    },
  });
  return response.data.d.results;
}

export async function getCurrentDivision(accessToken: string): Promise<number> {
  // /current/Me is een divisionless endpoint — geen divisienummer in de URL
  const response = await axios.get(
    "https://start.exactonline.nl/api/v1/current/Me",
    {
      params: { $select: "CurrentDivision" },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );
  return response.data.d.results[0].CurrentDivision;
}
