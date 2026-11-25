# Railodex

Web app for cataloguing model railway collections: locomotives, coaches and wagons in full detail. The web comes first (Next.js); the mobile app (Expo) comes later, sharing the same database. Data, login and photos live in Supabase.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, run these files in order (it creates the tables, permissions and photo storage):
   - `supabase/migrations/20261125025818_init_coleccion.sql`
   - `supabase/migrations/20261125110913_composiciones_y_deseos.sql`
3. In **Project Settings → API Keys**, copy the project URL and the *publishable* key into `.env.local` (use `.env.example` as the template).
4. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` to *Redirect URLs*.
5. Start it up:

   ```bash
   npm install
   npm run dev
   ```

   and open http://localhost:3000.

## Screens

| Screen | What it does |
| --- | --- |
| Inicio | Summary: pieces, value, breakdown by scale/type/epoch, latest additions, history, pre-orders |
| Colección | Grid, list and table, with search, filters and sorting |
| Ficha | Photos, wheel arrangement drawing, decoder and functions, history, documents, "add to composition" |
| Añadir / Editar | Step-by-step wizard whose fields change with the type, traction and digital/analogue choice; barcode scanner |
| Composiciones | Build trains, reorder them, totals and warnings when things don't match |
| Deseos y preventas | Wish list with priority, pre-orders with deposit and date, "Ya la tengo" moves it into the collection |
| Mantenimiento | All the history together, spending, and locos without a service in a year |
| Ubicaciones | Tree of shelves and display cases, printable QR labels |
| Digital | DCC addresses (duplicates in red), decoders, locos ready to digitise |
| Estadísticas | Value vs. invested, spending per year, by maker and by railway |
| Importar / exportar | Import CSV with preview, export to CSV, JSON backup, printable insurance report |
| Ajustes | Name, theme, password, plans and the 100-piece limit on the free plan |

## Structure

```
src/
  app/
    login/              sign in and sign up
    auth/callback/      landing page for the confirmation email
    (app)/              everything behind login, one folder per screen
  components/
    item-wizard/        add/edit wizard: steps, fields, preview, photo upload
    shell/              sidebar and top bar
    ui.tsx              small shared pieces (buttons, badges, cards)
  lib/
    catalog.ts          every list of options (makers, scales, wheel arrangements...)
    supabase/           Supabase clients for browser, server and proxy
    csv.ts, import-row.ts, locations.ts, plan.ts ...
supabase/migrations/    database schema with per-user security (RLS)
design/                 Claude Design mockups (visual reference)
docs/                   the prompt used for the design
```

## Still to do

- Catalog search ("Roco 73845" fills everything in): needs a catalogue database.
- Photo recognition with AI: needs an AI API (e.g. Google Gemini, free tier).
- Paid plans: the screen exists, but there's no payment yet.
- Mobile app with Expo.
- Putting it online (e.g. Vercel or Cloudflare Pages).
