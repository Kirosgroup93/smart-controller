import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Controleer API key voor de aanvraag
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is niet ingesteld" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Alleen PDF-bestanden zijn toegestaan" }, { status: 400 });
  }

  let base64: string;
  try {
    const buffer = await file.arrayBuffer();
    base64 = Buffer.from(buffer).toString("base64");
  } catch {
    return NextResponse.json({ error: "Bestand kon niet worden gelezen" }, { status: 400 });
  }

  // Maak de Anthropic client binnen de request handler aan
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Extraheer de volgende velden uit deze inkoopfactuur. Retourneer ALLEEN geldige JSON, geen uitleg, geen markdown, geen codeblokken. Gebruik null voor ontbrekende velden. Bedragen zijn getallen (geen valutasymbool).

{"leveranciersnaam":string|null,"factuurnummer":string|null,"factuurdatum":"YYYY-MM-DD"|null,"vervaldatum":"YYYY-MM-DD"|null,"bedrag_excl_btw":number|null,"btw_bedrag":number|null,"totaal_bedrag":number|null,"omschrijving":string|null}`,
            },
          ],
        },
      ],
    });

    if (!message.content.length || message.content[0].type !== "text") {
      return NextResponse.json({ error: "Geen tekst ontvangen van Claude" }, { status: 502 });
    }
    raw = message.content[0].text.trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    console.error("Anthropic API fout:", msg);
    return NextResponse.json({ error: `Claude API fout: ${msg}` }, { status: 502 });
  }

  // Extraheer JSON — ook als Claude per ongeluk backticks of tekst meestuurt
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Geen JSON gevonden in Claude response:", raw.slice(0, 300));
    return NextResponse.json({ error: "Kon geen gegevens extraheren. Probeer een duidelijkere factuur-PDF." }, { status: 422 });
  }

  try {
    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json(extracted);
  } catch (parseErr) {
    console.error("JSON parse fout:", jsonMatch[0].slice(0, 300));
    return NextResponse.json({ error: "Ongeldige JSON ontvangen van Claude" }, { status: 502 });
  }
}
