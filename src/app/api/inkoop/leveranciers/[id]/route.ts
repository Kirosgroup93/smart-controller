import { NextResponse } from "next/server";
import { exactGet, exactPost } from "@/lib/exact-online/withRefresh";
import { createClient } from "@/lib/supabase/server";
import { createExactClient } from "@/lib/exact-online/client";
import { createAdminClient } from "@/lib/supabase/server";
import type { ExactConnection } from "@/types/database";

// GET /api/inkoop/leveranciers/[id] — haal volledige leveranciergegevens op
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [accounts, addresses, bankAccounts, contacts] = await Promise.all([
      exactGet("/crm/Accounts", {
        $filter: `ID eq guid'${id}'`,
        $select: "ID,Name,Code,VATNumber,ChamberOfCommerce,Phone,Email,PurchaseCurrency,City,Postcode,Country,AddressLine1",
      }),
      exactGet("/crm/Addresses", {
        $filter: `Account eq guid'${id}'`,
        $select: "ID,AddressLine1,Postcode,City,Country,Type",
      }),
      exactGet("/crm/BankAccounts", {
        $filter: `Account eq guid'${id}'`,
        $select: "ID,BankAccount,BICCode,Main",
      }),
      exactGet("/crm/Contacts", {
        $filter: `Account eq guid'${id}'`,
        $select: "ID,FirstName,LastName,BusinessPhone,BusinessEmail,IsMainContact",
      }),
    ]);

    const account = (accounts ?? [])[0] as Record<string, unknown> | undefined;
    if (!account) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

    const adres = ((addresses ?? []) as Record<string, unknown>[])[0];
    const bank = ((bankAccounts ?? []) as Record<string, unknown>[])[0];
    const contact = ((contacts ?? []) as Record<string, unknown>[])[0];

    return NextResponse.json({ account, adres, bank, contact });
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/inkoop/leveranciers/[id] — update leverancier in Exact Online
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, string>;
    const { naam, code, kvk, straat, postcode, stad, land,
            telefoon, email, valuta, btwNummer,
            iban, bic, voornaam, achternaam, contactTelefoon, contactEmail,
            adresId, bankId, contactId } = body;

    if (!naam?.trim()) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });

    // Haal tokens op voor directe axios call (PUT heeft geen body in exactGet)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: connData } = await supabase
      .from("exact_connections").select("*").eq("user_id", user.id).single();
    if (!connData) return NextResponse.json({ error: "Geen Exact verbinding" }, { status: 404 });

    const conn = connData as ExactConnection;
    const client = createExactClient(conn.access_token, conn.division);

    // PUT Account
    const accountPayload: Record<string, unknown> = { Name: naam.trim() };
    if (code?.trim())      accountPayload.Code = code.trim();
    if (btwNummer?.trim()) accountPayload.VATNumber = btwNummer.trim();
    if (kvk?.trim())       accountPayload.ChamberOfCommerce = kvk.trim();
    if (telefoon?.trim())  accountPayload.Phone = telefoon.trim();
    if (email?.trim())     accountPayload.Email = email.trim();
    if (valuta?.trim())    accountPayload.PurchaseCurrency = valuta.trim();
    if (straat?.trim())    accountPayload.AddressLine1 = straat.trim();
    if (postcode?.trim())  accountPayload.Postcode = postcode.trim();
    if (stad?.trim())      accountPayload.City = stad.trim();
    if (land?.trim())      accountPayload.Country = land.trim();

    await client.put(`/crm/Accounts(guid'${id}')`, accountPayload);

    // PUT of POST adres
    if (straat?.trim() || postcode?.trim() || stad?.trim()) {
      const adresPayload: Record<string, unknown> = {
        Account: id, Type: 1,
        ...(straat?.trim()   && { AddressLine1: straat.trim() }),
        ...(postcode?.trim() && { Postcode: postcode.trim() }),
        ...(stad?.trim()     && { City: stad.trim() }),
        ...(land?.trim()     && { Country: land.trim() }),
      };
      try {
        if (adresId) {
          await client.put(`/crm/Addresses(guid'${adresId}')`, adresPayload);
        } else {
          await exactPost("/crm/Addresses", adresPayload);
        }
      } catch { /* niet fataal */ }
    }

    // PUT of POST bankrekening
    if (iban?.trim()) {
      const bankPayload: Record<string, unknown> = {
        Account: id, BankAccount: iban.trim(), Main: true,
        ...(bic?.trim() && { BICCode: bic.trim() }),
      };
      try {
        if (bankId) {
          await client.put(`/crm/BankAccounts(guid'${bankId}')`, bankPayload);
        } else {
          await exactPost("/crm/BankAccounts", bankPayload);
        }
      } catch { /* niet fataal */ }
    }

    // PUT of POST contact
    if (voornaam?.trim() || achternaam?.trim()) {
      const contactPayload: Record<string, unknown> = {
        Account: id, IsMainContact: true,
        ...(voornaam?.trim()        && { FirstName: voornaam.trim() }),
        ...(achternaam?.trim()      && { LastName: achternaam.trim() }),
        ...(contactTelefoon?.trim() && { BusinessPhone: contactTelefoon.trim() }),
        ...(contactEmail?.trim()    && { BusinessEmail: contactEmail.trim() }),
      };
      try {
        if (contactId) {
          await client.put(`/crm/Contacts(guid'${contactId}')`, contactPayload);
        } else {
          await exactPost("/crm/Contacts", contactPayload);
        }
      } catch { /* niet fataal */ }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: unknown }; message?: string };
    const detail = axiosErr?.response?.data ?? axiosErr?.message ?? "Fout";
    return NextResponse.json({ error: String(typeof detail === "object" ? JSON.stringify(detail) : detail) }, { status: 500 });
  }
}
