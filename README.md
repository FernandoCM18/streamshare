# StreamShare

StreamShare is a dark-mode-only Progressive Web App (PWA) for managing shared streaming service payments. The owner tracks which contacts share each service, how much each owes, and verifies payments through a double-confirmation system.

---

## What it does

1. Owner creates a **service** (Netflix, Spotify, etc.) with a monthly cost and billing day
2. Owner adds **personas** (contacts) to the service — they may or may not have a StreamShare account
3. Each month a **billing cycle** is generated automatically, creating one payment per persona
4. Personas pay → owner confirms → cycle closes

### Payment flow

```
pending → partial → paid → confirmed
                  ↘ overdue (if due_date passes)
```

### Double-verification

- Persona **with** a StreamShare account: persona marks as paid → owner confirms
- Persona **without** an account: owner marks confirmed directly

### Credits system

If a persona overpays, the surplus is saved as a credit (per service) and applied automatically to the next billing cycle.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui + Radix UI + Lucide + @iconify/react (Solar icons) |
| Backend | Supabase (auth, database, RLS) |
| Forms | React Hook Form + Zod v4 |
| Animations | Motion (Framer Motion 12+) |
| Toasts | Sonner |
| PWA | Serwist (active in production only) |
| Package manager | pnpm |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, register
│   ├── (dashboard)/        # Authenticated app shell
│   │   ├── dashboard/      # Home / gauge
│   │   ├── servicios/      # Services list
│   │   ├── personas/       # Personas list
│   │   ├── mis-pagos/      # My payments
│   │   └── configuracion/  # Settings
│   ├── sw.ts               # Service worker (Serwist)
│   └── manifest.ts         # PWA manifest
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # App components
├── lib/
│   ├── supabase/
│   │   ├── server.ts       # Supabase client for RSC
│   │   └── client.ts       # Supabase client for Client Components
│   └── utils.ts            # cn() helper
├── types/
│   └── database.ts         # Full schema types + helpers
├── hooks/                  # Custom hooks
└── proxy.ts                # Session refresh (Next.js 16)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Supabase project

### Environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install dependencies

```bash
pnpm install
```

### Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
pnpm build
```

> **Note:** Always use `pnpm build` — it includes the `--webpack` flag required by Serwist. Do not use `next build` directly.

### Lint

```bash
pnpm lint
```

---

## Database Overview

### Main tables

| Table | Purpose |
|---|---|
| `profiles` | Registered users (extends auth.users) |
| `services` | Streaming services (name, color, cost, billing day) |
| `personas` | Contacts sharing services |
| `service_members` | Relation service ↔ persona |
| `billing_cycles` | Monthly cycle per service |
| `payments` | One payment per persona per cycle |
| `persona_credits` | Surplus credits from overpayments |
| `payment_notes` | Notes on payments |
| `invitations` | Email invitations (7-day expiry) |
| `activity_log` | Immutable event log |
| `user_settings` | Per-user configuration |

### Views

| View | Use for |
|---|---|
| `service_summary` | Services list (pending/collected amounts) |
| `dashboard_summary` | Home gauge (monthly totals, overdue count) |
| `persona_debt_summary` | Personas list (debt per month, total debt, credits) |

### RPC functions (always use these for mutations)

```typescript
// Generate monthly billing cycle
supabase.rpc('generate_billing_cycle', { p_service_id: string })

// Register a payment with auto-reconciliation
supabase.rpc('register_payment', {
  p_payment_id: string,
  p_amount_paid: number,
  p_note?: string,
  p_cycle_ids?: string[]
})

// Confirm a payment (owner only)
supabase.rpc('confirm_payment', { p_payment_id: string })

// Calculate member amount (equal or custom split)
supabase.rpc('calculate_member_amount', { p_service_id: string, p_persona_id: string })
```

> Never insert into `payments`, `persona_credits`, or `activity_log` directly — always use the RPC functions above.

---

## Adding shadcn components

```bash
pnpm dlx shadcn add <component>
```

---

## Notes

- **Dark mode only** — no light mode support
- **proxy.ts** — Next.js 16 uses `proxy.ts` for session refresh, not `middleware.ts`
- **React Compiler** is enabled — do not add `useMemo`/`useCallback` manually
- **Serwist** is disabled in development; the PWA is only active in production builds
- **Zod v4** — use `z.string().min(1)`, not `z.string().nonempty()`
- **Motion** — import from `motion/react`, not `framer-motion`
- **Solar icons** — use `@iconify/react` with `solar:*` icon names
