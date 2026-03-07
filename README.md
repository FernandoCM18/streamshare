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
- Registro de pagos con conciliación automática (incluye pagos parciales).
- Doble verificación para pagos de personas registradas.
- Sistema de créditos por sobrepago, aplicados automáticamente.
- Dashboard con resumen mensual, pendientes y deuda acumulada.
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
    (auth)/
    (dashboard)/
    layout.tsx
    manifest.ts
    sw.ts
  components/
  hooks/
  lib/
    supabase/
  types/
```

## Lógica de negocio (resumen)

- Flujo de estado de pago: `pending -> partial -> paid -> confirmed` (y
  `overdue` según fecha de vencimiento).
- Para registrar pagos y generar ciclos se usan funciones RPC de Supabase.
- El crédito por sobrepago se guarda por servicio y se aplica en ciclos futuros.

## PWA y offline

- Modo instalación en móviles y escritorio (manifest + iconos).
- Cache de assets y llamadas relevantes para mejor rendimiento.
- Fallback offline mediante `public/offline.html`.

## Estado del proyecto

En desarrollo activo. El diseño y la experiencia están optimizados para
dark-mode.
