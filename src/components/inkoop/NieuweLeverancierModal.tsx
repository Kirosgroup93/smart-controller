"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAangemaakt: (lev: { ID: string; Name: string; Code: string; VATNumber?: string }) => void;
}

const LANDEN = [
  { code: "NL", label: "NL - Netherlands (the)" },
  { code: "BE", label: "BE - Belgium" },
  { code: "DE", label: "DE - Germany" },
  { code: "FR", label: "FR - France" },
  { code: "GB", label: "GB - United Kingdom" },
  { code: "US", label: "US - United States" },
  { code: "LU", label: "LU - Luxembourg" },
  { code: "CH", label: "CH - Switzerland" },
  { code: "AT", label: "AT - Austria" },
  { code: "ES", label: "ES - Spain" },
  { code: "IT", label: "IT - Italy" },
  { code: "PL", label: "PL - Poland" },
  { code: "DK", label: "DK - Denmark" },
  { code: "SE", label: "SE - Sweden" },
  { code: "NO", label: "NO - Norway" },
];

const VALUTA_OPTIES = ["EUR", "USD", "GBP", "CHF", "DKK", "SEK", "NOK"];

interface Sectie {
  titel: string;
  open: boolean;
}

export default function NieuweLeverancierModal({ open, onClose, onAangemaakt }: Props) {
  // Secties expand/collapse
  const [secties, setSecties] = useState<Record<string, boolean>>({
    leverancier: true,
    bank: true,
    bedrijf: false,
    contact: false,
  });

  // Leveranciersgegevens
  const [naam, setNaam] = useState("");
  const [code, setCode] = useState("");
  const [kvk, setKvk] = useState("");
  const [straat, setStraat] = useState("");
  const [postbus, setPostbus] = useState("");
  const [postcode, setPostcode] = useState("");
  const [stad, setStad] = useState("");
  const [land, setLand] = useState("NL");
  const [telefoon, setTelefoon] = useState("");
  const [email, setEmail] = useState("");

  // Bankgegevens
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [valuta, setValuta] = useState("EUR");
  const [btwNummer, setBtwNummer] = useState("");

  // Bedrijfsinstellingen
  const [crediteurenRekening, setCrediteurenRekening] = useState("");
  const [betalingsconditie, setBetalingsconditie] = useState("");

  // Contactgegevens
  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [contactTelefoon, setContactTelefoon] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [functie, setFunctie] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [veldFouten, setVeldFouten] = useState<Record<string, string>>({});
  const naamRef = useRef<HTMLInputElement>(null);

  function isGeldigEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }
  function isGeldigTelefoon(v: string) {
    // Staat toe: +31 20 123 4567 / 020-1234567 / +3120123456 etc.
    return /^[+]?[\d\s\-().]{7,20}$/.test(v.trim());
  }

  function valideer(): boolean {
    const fouten: Record<string, string> = {};
    if (email.trim() && !isGeldigEmail(email))
      fouten.email = "Ongeldig e-mailadres";
    if (telefoon.trim() && !isGeldigTelefoon(telefoon))
      fouten.telefoon = "Ongeldig telefoonnummer";
    if (contactEmail.trim() && !isGeldigEmail(contactEmail))
      fouten.contactEmail = "Ongeldig e-mailadres";
    if (contactTelefoon.trim() && !isGeldigTelefoon(contactTelefoon))
      fouten.contactTelefoon = "Ongeldig telefoonnummer";
    setVeldFouten(fouten);
    return Object.keys(fouten).length === 0;
  }

  useEffect(() => {
    if (open) {
      // Reset alle velden
      setNaam(""); setCode(""); setKvk(""); setStraat(""); setPostbus("");
      setPostcode(""); setStad(""); setLand("NL"); setTelefoon(""); setEmail("");
      setIban(""); setBic(""); setValuta("EUR"); setBtwNummer("");
      setCrediteurenRekening(""); setBetalingsconditie("");
      setVoornaam(""); setAchternaam(""); setContactTelefoon(""); setContactEmail(""); setFunctie("");
      setError(null);
      setSecties({ leverancier: true, bank: true, bedrijf: false, contact: false });
      setTimeout(() => naamRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  function toggleSectie(s: string) {
    setSecties((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!naam.trim()) { setError("Leveranciersnaam is verplicht"); return; }
    if (!valideer()) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/inkoop/leveranciers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam, code, kvk, straat, postbus, postcode, stad, land,
          telefoon, email, iban, bic, valuta, btwNummer,
          crediteurenRekening, betalingsconditie,
          voornaam, achternaam, contactTelefoon, contactEmail, functie,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fout bij aanmaken");
      onAangemaakt({
        ID: data.ID ?? "",
        Name: naam,
        Code: code,
        VATNumber: btwNummer || undefined,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:bg-gray-50";
  const inpFout = "w-full px-3 py-2 text-sm border border-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50";
  const lbl = "block text-sm text-gray-700 mb-1";
  const row = "grid grid-cols-3 items-start gap-4";
  const labelCol = "text-sm text-gray-700 pt-2";

  function SectieHeader({ id, titel }: { id: string; titel: string }) {
    return (
      <button
        type="button"
        onClick={() => toggleSectie(id)}
        className="flex items-center justify-between w-full py-2 border-b border-gray-200 mb-3 group"
      >
        <span className="text-sm font-semibold text-blue-600">{titel}</span>
        {secties[id]
          ? <ChevronUp className="w-4 h-4 text-blue-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">Voeg nieuwe leverancier toe</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Zoek een leverancier ── */}
          <div>
            <SectieHeader id="leverancier" titel="Zoek een leverancier" />
            {secties.leverancier && (
              <div className="space-y-3">
                <div className={row}>
                  <span className={labelCol}>Bedrijf</span>
                  <div className="col-span-2">
                    <input ref={naamRef} className={inp} value={naam}
                      onChange={(e) => setNaam(e.target.value)}
                      placeholder="Bedrijfsnaam *" />
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>Land</span>
                  <div className="col-span-2">
                    <select className={inp} value={land} onChange={(e) => setLand(e.target.value)}>
                      {LANDEN.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>KVK nummer</span>
                  <div className="col-span-2">
                    <input className={inp} value={kvk} onChange={(e) => setKvk(e.target.value)} placeholder="12345678" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Leveranciersgegevens ── */}
          <div>
            <SectieHeader id="leverancierGegevens" titel="Leveranciersgegevens" />
            <div className="space-y-3">
              <div className={row}>
                <span className={labelCol}>Leveranciersnaam <span className="text-red-500">*</span></span>
                <div className="col-span-2">
                  <input className={`${inp} ${!naam ? "border-red-400 bg-red-50" : ""}`}
                    value={naam} onChange={(e) => setNaam(e.target.value)} required />
                </div>
              </div>
              <div className={row}>
                <span className={labelCol}>Code</span>
                <div className="col-span-2">
                  <input className={inp} value={code} onChange={(e) => setCode(e.target.value)} placeholder="LEV001" />
                </div>
              </div>
              <div className={row}>
                <span className={labelCol}>Straat en huisnummer</span>
                <div className="col-span-2">
                  <input className={inp} value={straat} onChange={(e) => setStraat(e.target.value)} placeholder="Keizersgracht 1" />
                </div>
              </div>
              <div className={row}>
                <span className={labelCol}>Postbus</span>
                <div className="col-span-2">
                  <input className={inp} value={postbus} onChange={(e) => setPostbus(e.target.value)} placeholder="Postbus 123" />
                </div>
              </div>
              <div className={row}>
                <span className={labelCol}>Postcode</span>
                <div className="col-span-2">
                  <input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="1234 AB" />
                </div>
              </div>
              <div className={row}>
                <span className={labelCol}>Stad</span>
                <div className="col-span-2">
                  <input className={inp} value={stad} onChange={(e) => setStad(e.target.value)} placeholder="Amsterdam" />
                </div>
              </div>
              <div className={row}>
                <span className={labelCol}>Telefoonnummer</span>
                <div className="col-span-2">
                  <input
                    className={veldFouten.telefoon ? inpFout : inp}
                    value={telefoon}
                    placeholder="+31 20 000 0000"
                    onChange={(e) => { setTelefoon(e.target.value); setVeldFouten((p) => ({ ...p, telefoon: "" })); }}
                    onBlur={() => { if (telefoon.trim() && !isGeldigTelefoon(telefoon)) setVeldFouten((p) => ({ ...p, telefoon: "Ongeldig telefoonnummer" })); }}
                  />
                  {veldFouten.telefoon && <p className="text-[11px] text-red-600 mt-0.5">{veldFouten.telefoon}</p>}
                </div>
              </div>
              <div className={row}>
                <span className={labelCol}>E-mailadres</span>
                <div className="col-span-2">
                  <input
                    className={veldFouten.email ? inpFout : inp}
                    value={email}
                    placeholder="info@bedrijf.nl"
                    onChange={(e) => { setEmail(e.target.value); setVeldFouten((p) => ({ ...p, email: "" })); }}
                    onBlur={() => { if (email.trim() && !isGeldigEmail(email)) setVeldFouten((p) => ({ ...p, email: "Ongeldig e-mailadres" })); }}
                  />
                  {veldFouten.email && <p className="text-[11px] text-red-600 mt-0.5">{veldFouten.email}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bankgegevens ── */}
          <div>
            <SectieHeader id="bank" titel="Bankgegevens" />
            {secties.bank && (
              <div className="space-y-3">
                <div className={row}>
                  <span className={labelCol}>IBAN nummer</span>
                  <div className="col-span-2">
                    <input className={inp} value={iban} onChange={(e) => setIban(e.target.value)} placeholder="NL00 BANK 0000 0000 00" />
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>BIC code</span>
                  <div className="col-span-2">
                    <input className={inp} value={bic} onChange={(e) => setBic(e.target.value)} placeholder="ABNANL2A" />
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>Valuta</span>
                  <div className="col-span-2">
                    <select className={inp} value={valuta} onChange={(e) => setValuta(e.target.value)}>
                      {VALUTA_OPTIES.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>Btw nummer</span>
                  <div className="col-span-2">
                    <input className={inp} value={btwNummer} onChange={(e) => setBtwNummer(e.target.value)} placeholder="NL000000000B01" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Bedrijfsinstellingen ── */}
          <div>
            <SectieHeader id="bedrijf" titel="Bedrijfsinstellingen" />
            {secties.bedrijf && (
              <div className="space-y-3">
                <div className={row}>
                  <span className={labelCol}>Crediteurenrekening</span>
                  <div className="col-span-2">
                    <input className={inp} value={crediteurenRekening} onChange={(e) => setCrediteurenRekening(e.target.value)} placeholder="1600" />
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>Betalingsconditie</span>
                  <div className="col-span-2">
                    <input className={inp} value={betalingsconditie} onChange={(e) => setBetalingsconditie(e.target.value)} placeholder="30 dagen netto" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Contactgegevens ── */}
          <div>
            <SectieHeader id="contact" titel="Contact gegevens" />
            {secties.contact && (
              <div className="space-y-3">
                <div className={row}>
                  <span className={labelCol}>Voornaam</span>
                  <div className="col-span-2">
                    <input className={inp} value={voornaam} onChange={(e) => setVoornaam(e.target.value)} />
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>Achternaam</span>
                  <div className="col-span-2">
                    <input className={inp} value={achternaam} onChange={(e) => setAchternaam(e.target.value)} />
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>Telefoonnummer</span>
                  <div className="col-span-2">
                    <input
                      className={veldFouten.contactTelefoon ? inpFout : inp}
                      value={contactTelefoon}
                      onChange={(e) => { setContactTelefoon(e.target.value); setVeldFouten((p) => ({ ...p, contactTelefoon: "" })); }}
                      onBlur={() => { if (contactTelefoon.trim() && !isGeldigTelefoon(contactTelefoon)) setVeldFouten((p) => ({ ...p, contactTelefoon: "Ongeldig telefoonnummer" })); }}
                    />
                    {veldFouten.contactTelefoon && <p className="text-[11px] text-red-600 mt-0.5">{veldFouten.contactTelefoon}</p>}
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>E-mailadres</span>
                  <div className="col-span-2">
                    <input
                      className={veldFouten.contactEmail ? inpFout : inp}
                      value={contactEmail}
                      onChange={(e) => { setContactEmail(e.target.value); setVeldFouten((p) => ({ ...p, contactEmail: "" })); }}
                      onBlur={() => { if (contactEmail.trim() && !isGeldigEmail(contactEmail)) setVeldFouten((p) => ({ ...p, contactEmail: "Ongeldig e-mailadres" })); }}
                    />
                    {veldFouten.contactEmail && <p className="text-[11px] text-red-600 mt-0.5">{veldFouten.contactEmail}</p>}
                  </div>
                </div>
                <div className={row}>
                  <span className={labelCol}>Functienaam</span>
                  <div className="col-span-2">
                    <input className={inp} value={functie} onChange={(e) => setFunctie(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            Annuleren
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Aanmaken in Exact Online
          </button>
        </div>
      </div>
    </div>
  );
}
