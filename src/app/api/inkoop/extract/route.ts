import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
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
            text: `Extraheer de volgende velden uit deze inkoopfactuur en retourneer uitsluitend geldige JSON zonder uitleg of markdown. Gebruik null voor ontbrekende velden.

Formaat:
{
  "leveranciersnaam": string | null,
  "factuurnummer": string | null,
  "factuurdatum": "YYYY-MM-DD" | null,
  "vervaldatum": "YYYY-MM-DD" | null,
  "bedrag_excl_btw": number | null,
  "btw_bedrag": number | null,
  "totaal_bedrag": number | null,
  "omschrijving": string | null
}`,
          },
        ],
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Kon geen gegevens extraheren uit de PDF" }, { status: 422 });
  }

  const extracted = JSON.parse(jsonMatch[0]);
  return NextResponse.json(extracted);
}
