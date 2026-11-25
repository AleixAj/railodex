# Railodex

App para catalogar colecciones de modelismo ferroviario. Web primero (Next.js), con la app móvil (Expo) más adelante. Datos, login y fotos en Supabase.

## Puesta en marcha

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el proyecto, abre **SQL Editor**, pega el contenido de `supabase/migrations/20261125025818_init_coleccion.sql` y ejecútalo. Crea las tablas, los permisos y el almacén de fotos.
3. En **Project Settings → API Keys** copia la URL del proyecto y la clave *publishable*, y ponlas en `.env.local` (usa `.env.example` como modelo).
4. En **Authentication → URL Configuration** añade `http://localhost:3000/auth/callback` a las *Redirect URLs*.
5. Arranca la web:

   ```bash
   npm install
   npm run dev
   ```

   y abre http://localhost:3000.

## Qué hay

- `src/app/login`: entrar y crear cuenta.
- `src/app/(app)/page.tsx`: Inicio con resumen de la colección.
- `src/app/(app)/coleccion`: colección (cuadrícula, lista y tabla, con filtros) y ficha de cada pieza.
- `src/components/item-wizard`: asistente de alta y edición; los campos cambian según tipo, tracción y digital/analógico.
- `src/lib/catalog.ts`: listas de fabricantes, escalas, rodajes, decoders, etc.
- `supabase/migrations`: esquema de la base de datos con seguridad por usuario (RLS).
- `design/`: maquetas exportadas de Claude Design (referencia visual).
- `docs/`: el prompt usado para el diseño.

Pendiente: composiciones, deseos, mantenimiento con recordatorios, ubicaciones con QR, vista digital, estadísticas, importar/exportar, planes, búsqueda en catálogo, escáner y foto con IA.
