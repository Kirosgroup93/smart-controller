import { NextResponse } from "next/server";
import { exactGet, exactPost } from "@/lib/exact-online/withRefresh";

export async function GET() {
  try {
    // Minimale request: alleen ID en Name, geen filter
    const results = await exactGet("/crm/Accounts", {
      $select: "ID,Name,Code,VATNumber",
      $top: 100,
    });
    return NextResponse.json(results ?? []);
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
    const detail = axiosErr?.response?.data ?? axiosErr?.message ?? "Fout";
    return NextResponse.json({ error: String(typeof detail === "object" ? JSON.stringify(detail) : detail) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, string>;
    const { naam, code, kvk, straat, postbus, postcode, stad, land,
            telefoon, email, iban, bic, valuta, btwNummer,
            crediteurenRekening, betalingsconditie,
            voornaam, achternaam, contactTelefoon, contactEmail, functie } = body;

    if (!naam?.trim()) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });

    // Bouw Account payload
    const payload: Record<string, unknown> = {
      Name: naam.trim(),
      IsSupplier: true,
    };
    if (code?.trim())               payload.Code = code.trim();
    if (btwNummer?.trim())          payload.VATNumber = btwNummer.trim();
    if (kvk?.trim())                payload.ChamberOfCommerce = kvk.trim();
    if (straat?.trim())             payload.AddressLine1 = straat.trim();
    if (postbus?.trim())            payload.Postbox = postbus.trim();
    if (postcode?.trim())           payload.Postcode = postcode.trim();
    if (stad?.trim())               payload.City = stad.trim();
    if (land?.trim())               payload.Country = land.trim();
    if (telefoon?.trim())           payload.Phone = telefoon.trim();
    if (email?.trim())              payload.Email = email.trim();
    if (valuta?.trim())             payload.Currency = valuta.trim();
    if (crediteurenRekening?.trim()) payload.GLAccountPurchase = crediteurenRekening.trim();
    if (betalingsconditie?.trim())  payload.PaymentConditionPurchase = betalingsconditie.trim();

    // Maak account aan in Exact Online
    const account = await exactPost("/crm/Accounts", payload) as Record<string, unknown>;
    const accountId = account?.ID as string | undefined;

    // Bankrekening aanmaken (apart endpoint)
    if (accountId && iban?.trim()) {
      const bankPayload: Record<string, unknown> = {
        Account: accountId,
        BankAccount: iban.trim(),
        Main: true,
      };
      if (bic?.trim()) bankPayload.BICCode = bic.trim();
      try {
        await exactPost("/crm/BankAccounts", bankPayload);
      } catch {
        // Bankrekening mislukt is niet fataal — account is al aangemaakt
      }
    }

    // Contact aanmaken (apart endpoint)
    if (accountId && (voornaam?.trim() || achternaam?.trim())) {
      const contactPayload: Record<string, unknown> = { Account: accountId };
      if (voornaam?.trim())        contactPayload.FirstName = voornaam.trim();
      if (achternaam?.trim())      contactPayload.LastName = achternaam.trim();
      if (contactTelefoon?.trim()) contactPayload.Phone = contactTelefoon.trim();
      if (contactEmail?.trim())    contactPayload.Email = contactEmail.trim();
      if (functie?.trim())         contactPayload.JobTitleDescription = functie.trim();
      try {
        await exactPost("/crm/Contacts", contactPayload);
      } catch {
        // Contact mislukt is niet fataal
      }
    }

    return NextResponse.json(account);
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: unknown }; message?: string };
    const detail = axiosErr?.response?.data ?? axiosErr?.message ?? "Fout";
    return NextResponse.json({ error: String(typeof detail === "object" ? JSON.stringify(detail) : detail) }, { status: 500 });
  }
}
