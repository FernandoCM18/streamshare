# StreamShare

StreamShare es una PWA dark-mode-first para gestionar pagos compartidos de
servicios de streaming (Netflix, Spotify, Crunchyroll, etc.). Permite al dueño
de la cuenta controlar cuánto debe cada persona, registrar pagos y confirmar
movimientos con un flujo de doble verificación.

## Demo visual (capturas pendientes)

> Esta sección está lista para que agregues tus imágenes después.

### Login
![Pantalla de login](./public/readme/login.png)

### Dashboard
![Pantalla de dashboard](./public/readme/dashboard.png)

### Servicios
![Pantalla de servicios](./public/readme/services.png)

### Personas
![Pantalla de personas](./public/readme/personas.png)

## Funcionalidades principales

- Gestión de servicios con costo mensual, color, icono y día de cobro.
- Gestión de personas (con o sin cuenta registrada en StreamShare).
- Generación automática de ciclos mensuales de facturación.
- Registro de pagos con conciliación automática (incluye pagos parciales y deuda acumulada).
- Doble verificación para pagos de personas registradas (miembro reclama → dueño confirma).
- Sistema de créditos por sobrepago, aplicados automáticamente por servicio en FIFO.
- Dashboard con resumen mensual, gauge de cobro, deudores pendientes y deuda acumulada.
- Vista "Mis Pagos" para miembros con cuenta — ven sus pagos sin acceso al dashboard del dueño.
- Notas de pagos — dueño y miembro registrado pueden agregar notas por pago.
- Drawer de recordatorio con link de pago para enviar al miembro.
- Command palette para búsqueda rápida de servicios y personas.
- Soporte PWA con modo offline y service worker en producción.

## Stack tecnológico

- `Next.js 16` (App Router) + `React 19` + `TypeScript (strict)`
- `Tailwind CSS v4` + `shadcn/ui` + `Radix UI`
- `Supabase` (`@supabase/ssr` + `@supabase/supabase-js`)
- `React Hook Form` + `Zod v4`
- `Motion` para animaciones
- `Serwist` para capacidades PWA
- `pnpm` como package manager

## Rutas principales

- `/login` - Inicio de sesión
- `/register` - Registro
- `/dashboard` - Panel principal
- `/servicios` - Gestión de servicios
- `/personas` - Gestión de personas
- `/mis-pagos` - Historial/estado de pagos
- `/configuracion` - Ajustes del usuario

## Requisitos

- Node.js `>= 20`
- `pnpm` instalado globalmente
- Proyecto de Supabase con credenciales activas

## Variables de entorno

Crea un archivo `.env.local` en la raíz:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## Instalación y ejecución local

```bash
pnpm install
pnpm dev
```

La app quedará disponible en:

- [http://localhost:3000](http://localhost:3000)

## Scripts disponibles

- `pnpm dev` - Inicia entorno de desarrollo
- `pnpm build` - Compila para producción (`next build --webpack`)
- `pnpm start` - Inicia la build de producción
- `pnpm lint` - Ejecuta ESLint
- `pnpm lint:fix` - Corrige issues automáticos de lint
- `pnpm format` - Formatea archivos con Prettier

## Estructura del proyecto

```text
src/
  app/
    (auth)/           # Login, register, OAuth callback
    (dashboard)/      # Shell autenticado con bottom dock
      dashboard/      # Gauge + deudores pendientes
      servicios/      # Lista y detalle de servicios
      personas/       # Lista y detalle de personas/miembros
      mis-pagos/      # Vista guest de pagos propios
      configuracion/  # Ajustes de usuario
    globals.css       # Todos los tokens CSS y clases custom
    manifest.ts       # PWA manifest
    sw.ts             # Service worker (Serwist)
  components/
    dashboard/        # Gauge, cards, dock, remind drawer, command palette
    servicios/        # Cards, crear/editar/detalle
    personas/         # Cards, crear/editar/detalle con historial
    mis-pagos/        # Cards + detalle guest
    configuracion/    # Perfil, notificaciones, preferencias
    shared/           # StatusBadge, FilterBar, ConfirmDialog reutilizables
    ui/               # shadcn/ui — no editar manualmente
  hooks/
    use-sw-update.ts  # Detección de actualizaciones del SW
    use-media-query.ts
  lib/
    supabase/         # server.ts, client.ts, auth-action.ts
    auth/user.ts      # getCurrentUser(), getRequiredUser()
    queries.ts        # React.cache() queries centralizadas
    revalidate.ts     # Helpers de revalidación granular por sección
    compute-dashboard.ts   # Cálculos del gauge desde payments
    payment-utils.ts       # paymentObligation(), paymentRemaining(), sortPaymentsForHistory()
    build-persona-cards.ts # Transforma datos raw → PersonaCardData[]
    status-config.ts       # Configs centralizadas de status (label, colores, iconos)
    utils.ts               # cn(), formatCurrency(), formatDate(), etc.
  types/
    database.ts       # Tipos completos del schema + tipos compuestos
  proxy.ts            # Session refresh (Next.js 16 usa proxy.ts, no middleware.ts)
```

## Lógica de negocio (resumen)

**Flujo de estado de pago:**
```
pending → partial → paid → confirmed
                  ↘ overdue (si vence sin pago completo)
```

**Doble verificación (condicional):**
- Miembro con cuenta StreamShare → flujo: miembro reclama → dueño confirma
- Miembro sin cuenta → dueño registra y confirma directamente

**Mutaciones — siempre via RPC, nunca directamente:**
- `generate_billing_cycle` — genera ciclo mensual por servicio
- `register_payment` — registra pago con conciliación automática (auto o manual por ciclos)
- `claim_payment` — miembro reclama pago (paso 1 doble verificación)
- `confirm_payment` / `reject_payment_claim` / `void_payment` — acciones del dueño
- `edit_payment_amount` — editar monto post-registro

**Créditos por sobrepago:**
- Se guardan en `member_credits` por servicio (Netflix ≠ Spotify)
- Se aplican automáticamente en FIFO al generar el siguiente ciclo
- El dueño puede cancelar un crédito manualmente

**Deuda acumulada:**
- Si un miembro no paga un ciclo, el monto se acumula como `accumulated_debt` en el siguiente
- `member_debt_summary.debt_by_month[]` muestra el desglose por mes

## PWA y offline

- Modo instalación en móviles y escritorio (manifest + iconos).
- Cache de assets y llamadas relevantes para mejor rendimiento.
- Fallback offline mediante `public/offline.html`.

## Arquitectura

**Patrón RSC + Client Component:**
- `page.tsx` — Server Component que fetcha datos desde Supabase
- `*-client.tsx` — Client Component que recibe datos como props y maneja filtros/estado
- Queries centralizadas en `lib/queries.ts` con `React.cache()` para deduplicar por request
- Revalidación granular via helpers en `lib/revalidate.ts`

**Optimizaciones de rendimiento aplicadas:**
- `GaugeCard` separado como async Server Component dentro de `<Suspense>` en el layout
- Dynamic imports para todos los modales pesados (`next/dynamic({ ssr: false })`)
- `getCachedPaymentsLite` para el dashboard (sin join de notas, payload reducido)
- `canvas-confetti` con dynamic `import()` en callback (no en top-level)
- `useTransition` en server actions de edición en lugar de `useState(loading)`
- `app-shell.tsx` usa animación CSS pura en lugar de Motion para el fade inicial

## Estado del proyecto

En desarrollo activo. Conectado a Supabase con datos reales. Diseño y experiencia
optimizados para dark-mode y uso móvil (PWA instalable).
