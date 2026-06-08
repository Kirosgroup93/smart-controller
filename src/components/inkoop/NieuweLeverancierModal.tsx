"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, UserPlus, Pencil, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

interface LeverancierData {
  ID?: string;
  naam?: string;
  code?: string;
  kvk?: string;
  straat?: string;
  postcode?: string;
  stad?: string;
  land?: string;
  telefoon?: string;
  email?: string;
  iban?: string;
  bic?: string;
  valuta?: string;
  btwNummer?: string;
  voornaam?: string;
  achternaam?: string;
  contactTelefoon?: string;
  contactEmail?: string;
  functie?: string;
  // IDs voor PUT
  adresId?: string;
  bankId?: string;
  contactId?: string;
}

interface Props {
  open: boolean;
  mode?: "create" | "edit";
  initialData?: LeverancierData;
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

export default function NieuweLeverancierModal({
  open, mode = "create", initialData, onClose, onAangemaakt,
}: Props) {
  const [secties, setSecties] = useState<Record<string, boolean>>({
    leverancier: true, bank: true, bedrijf: false, contact: false,
  });

  const [naam, setNaam] = useState("");
  const [code, setCode] = useState("");
  const [kvk, setKvk] = useState("");
  const [straat, setStraat] = useState("");
  const [postcode, setPostcode] = useState("");
  const [stad, setStad] = useState("");
  const [land, setLand] = useState("NL");
  const [telefoon, setTelefoon] = useState("");
  const [email, setEmail] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [valuta, setValuta] = useState("EUR");
  const [btwNummer, setBtwNummer] = useState("");
  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [contactTelefoon, setContactTelefoon] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [veldFouten, setVeldFouten] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(false);
  const naamRef = useRef<HTMLInputElement>(null);

  const isEdit = mode === "edit";

  function isGeldigEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }
  function isGeldigTelefoon(v: string) {
    return /^[+]?[\d\s\-().]{7,20}$/.test(v.trim());
  }

  function valideer(): boolean {
    const fouten: Record<string, string> = {};
    if (email.trim() && !isGeldigEmail(email)) fouten.email = "Ongeldig e-mailadres";
    if (telefoon.trim() && !isGeldigTelefoon(telefoon)) fouten.telefoon = "Ongeldig telefoonnummer";
    if (contactEmail.trim() && !isGeldigEmail(contactEmail)) fouten.contactEmail = "Ongeldig e-mailadres";
    if (contactTelefoon.trim() && !isGeldigTelefoon(contactTelefoon)) fouten.contactTelefoon = "Ongeldig telefoonnummer";
    setVeldFouten(fouten);
    return Object.keys(fouten).length === 0;
  }

  // Prefill bij edit-modus
  useEffect(() => {
    if (!open) return;
    setSuccess(false);
    setError(null);
    setVeldFouten({});

    if (isEdit && initialData?.ID) {
      // Laad volledige gegevens van Exact
      setLoadingData(true);
      fetch(`/api/inkoop/leveranciers/${initialData.ID}`)
        .then((r) => r.json())
        .then((d) => {
          const a = d.account ?? {};
          const adres = d.adres ?? {};
          const bank = d.bank ?? {};
          const contact = d.contact ?? {};
          setNaam(a.Name ?? "");
          setCode(a.Code?.trim() ?? "");
          setKvk(a.ChamberOfCommerce ?? "");
          setTelefoon(a.Phone ?? "");
          setEmail(a.Email ?? "");
          setValuta(a.PurchaseCurrency ?? "EUR");
          setBtwNummer(a.VATNumber ?? "");
          setStraat(adres.AddressLine1 ?? a.AddressLine1 ?? "");
          setPostcode(adres.Postcode ?? a.Postcode ?? "");
          setStad(adres.City ?? a.City ?? "");
          setLand(adres.Country ?? a.Country ?? "NL");
          setIban(bank.BankAccount ?? "");
          setBic(bank.BICCode ?? "");
          setVoornaam(contact.FirstName ?? "");
          setAchternaam(contact.LastName ?? "");
          setContactTelefoon(contact.BusinessPhone ?? "");
          setContactEmail(contact.BusinessEmail ?? "");
          // Sla sub-IDs op voor PUT
          if (adres.ID) initialData.adresId = adres.ID;
          if (bank.ID) initialData.bankId = bank.ID;
          if (contact.ID) initialData.contactId = contact.ID;
        })
        .catch(() => setError("Kon gegevens niet ophalen"))
        .finally(() => setLoadingData(false));
    } else {
      setNaam(""); setCode(""); setKvk(""); setStraat(""); setPostcode("");
      setStad(""); setLand("NL"); setTelefoon(""); setEmail("");
      setIban(""); setBic(""); setValuta("EUR"); setBtwNummer("");
      setVoornaam(""); setAchternaam(""); setContactTelefoon(""); setContactEmail("");
      setSecties({ leverancier: true, bank: true, bedrijf: false, contact: false });
      setTimeout(() => naamRef.current?.focus(), 80);
    }
  }, [open, isEdit, initialData?.ID]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  function toggleSectie(s: string) {
    setSecties((p) => ({ ...p, [s]: !p[s] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!naam.trim()) { setError("Leveranciersnaam is verplicht"); return; }
    if (!valideer()) return;
    setSaving(true); setError(null);

    const payload = {
      naam, code, kvk, straat, postcode, stad, land,
      telefoon, email, iban, bic, valuta, btwNummer,
      voornaam, achternaam, contactTelefoon, contactEmail,
      adresId: initialData?.adresId,
      bankId: initialData?.bankId,
      contactId: initialData?.contactId,
    };

    try {
      let res: Response;
      if (isEdit && initialData?.ID) {
        res = await fetch(`/api/inkoop/leveranciers/${initialData.ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/inkoop/leveranciers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fout");

      // Toon success-scherm
      setSuccess(true);

      // Stuur resultaat terug
      onAangemaakt({
        ID: isEdit ? initialData!.ID! : (data.ID ?? ""),
        Name: naam,
        Code: code,
        VATNumber: btwNummer || undefined,
      });

      // Sluit na 2 seconden
      setTimeout(() => { setSuccess(false); onClose(); }, 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const inpFout = "w-full px-3 py-2 text-sm border border-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50";
  const row = "grid grid-cols-3 items-start gap-4";
  const labelCol = "text-sm text-gray-700 pt-2";

  function SectieHeader({ id, titel }: { id: string; titel: string }) {
    return (
      <button type="button" onClick={() => toggleSectie(id)}
        className="flex items-center justify-between w-full py-2 border-b border-gray-200 mb-3">
        <span className="text-sm font-semibold text-blue-600">{titel}</span>
        {secties[id] ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
    );
  }

  function VeldInput({ id, value, onChange, onBlurCheck, placeholder, type = "text" }: {
    id: string; value: string; onChange: (v: string) => void;
    onBlurCheck?: () => void; placeholder?: string; type?: string;
  }) {
    return (
      <div>
        <input
          type={type}
          className={veldFouten[id] ? inpFout : inp}
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); setVeldFouten((p) => ({ ...p, [id]: "" })); }}
          onBlur={onBlurCheck}
        />
        {veldFouten[id] && <p className="text-[11px] text-red-600 mt-0.5">{veldFouten[id]}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            {isEdit
              ? <Pencil className="w-5 h-5 text-blue-600" />
              : <UserPlus className="w-5 h-5 text-blue-600" />}
            <h2 className="text-base font-semibold text-gray-800">
              {isEdit ? "Leverancier bewerken" : "Voeg nieuwe leverancier toe"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success scherm */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {isEdit ? "Wijzigingen opgeslagen!" : "Leverancier aangemaakt!"}
            </p>
            <p className="text-sm text-gray-500 text-center">
              <span className="font-medium text-gray-700">{naam}</span> is succesvol {isEdit ? "bijgewerkt" : "aangemaakt"} in Exact Online.
            </p>
          </div>
        ) : loadingData ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">Gegevens ophalen…</span>
          </div>
        ) : (
          <>
            {/* Scrollbare body */}
            <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Zoek / Identificatie */}
              <div>
                <SectieHeader id="leverancier" titel="Zoek een leverancier" />
                {secties.leverancier && (
                  <div className="space-y-3">
                    <div className={row}>
                      <span className={labelCol}>Bedrijfsnaam <span className="text-red-500">*</span></span>
                      <div className="col-span-2">
                        <input ref={naamRef} className={inp} value={naam}
                          onChange={(e) => setNaam(e.target.value)} placeholder="Bedrijfsnaam *" required />
                      </div>
                    </div>
                    <div className={row}>
                      <span className={labelCol}>Code</span>
                      <div className="col-span-2">
                        <input className={inp} value={code} onChange={(e) => setCode(e.target.value)} placeholder="LEV001" />
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

              {/* Leveranciersgegevens */}
              <div>
                <SectieHeader id="leverancierGegevens" titel="Leveranciersgegevens" />
                <div className="space-y-3">
                  <div className={row}>
                    <span className={labelCol}>Straat en huisnummer</span>
                    <div className="col-span-2">
                      <input className={inp} value={straat} onChange={(e) => setStraat(e.target.value)} placeholder="Keizersgracht 1" />
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
                      <VeldInput id="telefoon" value={telefoon} onChange={setTelefoon}
                        placeholder="+31 20 000 0000"
                        onBlurCheck={() => { if (telefoon.trim() && !isGeldigTelefoon(telefoon)) setVeldFouten((p) => ({ ...p, telefoon: "Ongeldig telefoonnummer" })); }} />
                    </div>
                  </div>
                  <div className={row}>
                    <span className={labelCol}>E-mailadres</span>
                    <div className="col-span-2">
                      <VeldInput id="email" value={email} onChange={setEmail}
                        placeholder="info@bedrijf.nl"
                        onBlurCheck={() => { if (email.trim() && !isGeldigEmail(email)) setVeldFouten((p) => ({ ...p, email: "Ongeldig e-mailadres" })); }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bankgegevens */}
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

              {/* Contact */}
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
                        <VeldInput id="contactTelefoon" value={contactTelefoon} onChange={setContactTelefoon}
                          onBlurCheck={() => { if (contactTelefoon.trim() && !isGeldigTelefoon(contactTelefoon)) setVeldFouten((p) => ({ ...p, contactTelefoon: "Ongeldig telefoonnummer" })); }} />
                      </div>
                    </div>
                    <div className={row}>
                      <span className={labelCol}>E-mailadres</span>
                      <div className="col-span-2">
                        <VeldInput id="contactEmail" value={contactEmail} onChange={setContactEmail}
                          onBlurCheck={() => { if (contactEmail.trim() && !isGeldigEmail(contactEmail)) setVeldFouten((p) => ({ ...p, contactEmail: "Ongeldig e-mailadres" })); }} />
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
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : isEdit ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isEdit ? "Wijzigingen opslaan" : "Aanmaken in Exact Online"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
