# Smart Controller

Financieel dashboard gekoppeld aan Exact Online via Supabase.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** (auth, database, RLS)
- **Exact Online** (OAuth2 + REST API)
- **Tailwind CSS**, **Recharts**

## Installatie

### 1. Node.js installeren

Download via [nodejs.org](https://nodejs.org) (LTS-versie aanbevolen).

### 2. Dependencies installeren

```bash
npm install
```

### 3. Supabase instellen

1. Maak een project aan op [supabase.com](https://supabase.com)
2. Voer `supabase-schema.sql` uit in de SQL Editor
3. Kopieer je Project URL en Anon Key

### 4. Exact Online instellen

1. Registreer een app op [apps.exactonline.com](https://apps.exactonline.com)
2. Stel de redirect URI in op `http://localhost:3000/api/exact-online/callback`
3. Kopieer je Client ID en Client Secret

### 5. Environment variabelen

Vul `.env.local` in met jouw waarden:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

EXACT_CLIENT_ID=jouw_client_id
EXACT_CLIENT_SECRET=jouw_client_secret
EXACT_REDIRECT_URI=http://localhost:3000/api/exact-online/callback
EXACT_BASE_URL=https://start.exactonline.nl/api/v1

NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
```

### 6. Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Functionaliteiten

- Inloggen via Supabase Auth
- OAuth2 koppeling met Exact Online
- KPI-kaarten: vorderingen, schulden, nettopositie
- Facturentabellen met vervalstatus
- Cashflow grafiek per maand
- Automatisch token vernieuwen
- Financiële snapshots opslaan in Supabase

## Projectstructuur

```
src/
├── app/
│   ├── api/
│   │   ├── exact-online/callback/   # OAuth2 callback
│   │   ├── exact-online/token/      # Token connect/refresh
│   │   └── supabase/financial-data/ # Financiële data API
│   ├── dashboard/                   # Beveiligd dashboard
│   └── login/                       # Inlogpagina
├── components/
│   ├── charts/FinancialChart.tsx
│   └── ui/KPICards, InvoiceTable, ExactConnectButton
├── lib/
│   ├── exact-online/client.ts       # OAuth + API client
│   ├── exact-online/queries.ts      # Exact Online queries
│   └── supabase/client.ts + server.ts
└── types/
    ├── database.ts                  # Supabase typed client
    └── exact.ts                     # Exact Online types
```
