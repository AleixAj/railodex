# Railodex

Web app for cataloguing model railway collections: locomotives, coaches and wagons in full detail. The web comes first (Next.js); the mobile app (Expo) comes later, sharing the same database. Data, login and photos live in Supabase.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, run these files in order (it creates the tables, permissions and photo storage):
   - `supabase/migrations/20261125025818_init_coleccion.sql`
   - `supabase/migrations/20261125110913_composiciones_y_deseos.sql`
3. In **Project Settings → API Keys**, copy the project URL and the _publishable_ key into `.env.local` (use `.env.example` as the template).
4. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` to _Redirect URLs_.
5. Start it up:

   ```bash
   npm install
   npm run dev
   ```

   and open http://localhost:3000.

## Screens

| Screen              | What it does                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| Inicio              | Summary: pieces, value, breakdown by scale/type/epoch, latest additions, history, pre-orders                 |
| Colección           | Grid, list and table, with search, filters and sorting                                                       |
| Ficha               | Photos, wheel arrangement drawing, decoder and functions, history, documents, "add to composition"           |
| Añadir / Editar     | Step-by-step wizard whose fields change with the type, traction and digital/analogue choice; barcode scanner |
| Composiciones       | Build trains, reorder them, totals and warnings when things don't match                                      |
| Deseos y preventas  | Wish list with priority, pre-orders with deposit and date, "Ya la tengo" moves it into the collection        |
| Mantenimiento       | All the history together, spending, and locos without a service in a year                                    |
| Ubicaciones         | Tree of shelves and display cases, printable QR labels                                                       |
| Digital             | DCC addresses (duplicates in red), decoders, locos ready to digitise                                         |
| Estadísticas        | Value vs. invested, spending per year, by maker and by railway                                               |
| Importar / exportar | Import CSV with preview, export to CSV, JSON backup, printable insurance report                              |
| Ajustes             | Name, theme, password, plans and the 100-piece limit on the free plan                                        |

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

## Example collection (development only)

To see the app with a realistic collection:

1. `python scripts/demo-photos.py` downloads real, freely licensed photos of each train and accessory from Wikimedia Commons and crops them around the train. Extra gallery photos are saved as `<slug>-2.jpg`. They go to `public/demo/`, which isn't committed.
2. Open `/demo` (or Ajustes → Colección de ejemplo) and press **Cargar colección de ejemplo**. It also adds a few wishes and pre-orders from `wishes.json` , example trains from `compositions.json` and a maintenance history from `events.json` (real models; deposits and dates are made up). **Quitar la colección de ejemplo** clears it again, for example after changing the photos.

The page doesn't exist in production. Each photo's author and licence are in `src/app/(app)/demo/pieces.json` and get copied into the piece's notes (the CC licences ask for credit). Catalogue numbers, running numbers, lengths and epochs come from the makers' or dealers' product pages; prices, dates and locations are made up. Model details nobody could confirm (length, interface) are left empty rather than guessed.

## Scripts

| Command          | What it does                                    |
| ---------------- | ----------------------------------------------- |
| `npm run dev`    | Local server at http://localhost:3000           |
| `npm run build`  | Production build                                |
| `npm run check`  | Types, lint and formatting, run before a commit |
| `npm run format` | Formats every file with Prettier                |

## Going online

Set `NEXT_PUBLIC_SITE_URL` to the public address (e.g. `https://railodex.app`) so confirmation emails and QR labels point there, and add `<that address>/auth/callback` to Supabase's _Redirect URLs_.

## Performance notes

- Photos are served from `/foto/...` with a fixed URL, so the browser caches them for good. Each photo is stored twice: up to 1600px for the ficha and an 800px thumbnail for lists.
- Photos come embedded in the same query as the pieces (`item_photos(path, position)`), so a page is one round of queries to Supabase.
- The session check is shared between layout and page (`cache()` in `requireUser`).

## Known limits

- Supabase returns at most 1,000 rows per query by default. Fine with the 100-piece free plan; the collection will need pagination before Pro goes unlimited.
- The camera barcode scanner works on Chrome for Android and on Macs; elsewhere the code is typed in.

## Still to do

- Catalog search ("Roco 73845" fills everything in): needs a catalogue database.
- Photo recognition with AI: needs an AI API (e.g. Google Gemini, free tier).
- Paid plans: the screen exists, but there's no payment yet.
- Mobile app with Expo.
- Putting it online (e.g. Vercel or Cloudflare Pages).
