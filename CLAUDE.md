# CLAUDE.md

This file provides guidance to Claude Code when working with StreamShare.

---

## What is StreamShare

StreamShare is a **dark-mode-only PWA** for managing shared streaming service payments.
The owner tracks which people (personas) share each service, how much each owes, and confirms payments through a double-verification system.

**Core flow:**
1. Owner creates a **service** (Netflix, Spotify, etc.) with a monthly cost and billing day
2. Owner adds **personas** (contacts) to the service — they may or may not have a StreamShare account
3. Each month a **billing_cycle** is generated automatically, creating one **payment** per persona
4. Personas pay → owner confirms → cycle closes

---

## Commands

- **Dev server:** `pnpm dev` (http://localhost:3000, Turbopack)
- **Build:** `pnpm build` (uses `--webpack` flag, required by Serwist)
- **Lint:** `pnpm lint` (ESLint + Prettier)
- **Add shadcn component:** `pnpm dlx shadcn add <component>`

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (PostCSS, all tokens in `globals.css`) |
| UI | shadcn/ui (`radix-nova`) + Radix UI + Lucide + @iconify/react (Solar icons) |
| Backend | Supabase (auth, database, RLS) via `@supabase/ssr` |
| Forms | React Hook Form + Zod v4 + @hookform/resolvers |
| Animations | Motion (Framer Motion 12+) |
| Toasts | Sonner |
| PWA | Serwist (disabled in dev, active in prod only) |
| Package manager | pnpm |

**React Compiler** is enabled (`reactCompiler: true`) — do not manually add `useMemo`/`useCallback` unless there's a specific reason.

---

## Project Structure

```
src/
├── app/                    # App Router pages and layouts
│   ├── (auth)/             # Login, register, invite flows
│   ├── (app)/              # Authenticated app shell
│   │   ├── page.tsx        # Home / Dashboard (gauge)
│   │   ├── services/       # Services list + detail
│   │   ├── personas/       # Personas list + detail
│   │   └── settings/       # User settings
│   ├── sw.ts               # Service worker (Serwist)
│   └── manifest.ts         # PWA manifest
├── components/
│   ├── ui/                 # shadcn/ui — DO NOT edit manually
│   └── ...                 # App components
├── lib/
│   ├── supabase/
│   │   ├── server.ts       # Supabase client for RSC (cookie-based)
│   │   └── client.ts       # Supabase client for Client Components
│   └── utils.ts            # cn() helper
├── types/
│   └── database.ts         # Full schema types + composed types + helpers
├── hooks/                  # Custom hooks
└── proxy.ts                # Session refresh (Next.js 16 uses proxy.ts NOT middleware.ts)
```

---

## Database Schema

### Tables
| Table | Purpose |
|---|---|
| `profiles` | Registered users (extends auth.users). Has `email` for auto-linking. |
| `services` | Streaming services (name, color, monthly_cost, billing_day, split_type) |
| `personas` | Contacts sharing services. `profile_id` is null if they have no account. |
| `service_members` | Relation service ↔ persona. `custom_amount` for custom splits. |
| `billing_cycles` | Monthly cycle per service (period_start, period_end, total_amount) |
| `payments` | One payment per persona per cycle. Core of the app. |
| `persona_credits` | Leftover credit when a persona overpays. Applied automatically next cycle. |
| `payment_notes` | Notes on payments. Both owner and registered persona can write. |
| `invitations` | Email invitations with token (7-day expiry) |
| `activity_log` | Immutable event log (insert only, never update/delete) |
| `user_settings` | Per-user config (notify_before_days, auto_generate_cycles, etc.) |

### Views (prefer these for UI queries)
| View | Use for |
|---|---|
| `service_summary` | Services list — includes `pending_amount`, `collected_amount` |
| `dashboard_summary` | Home gauge — `total_month_receivable`, `total_month_collected`, `overdue_count` |
| `persona_debt_summary` | Personas list — `debt_by_month[]`, `total_debt`, `available_credit` |

### RPC Functions (always use these, never mutate directly)
```typescript
// Generate monthly billing cycle (call on service creation + monthly cron)
supabase.rpc('generate_billing_cycle', { p_service_id: string })

// Register payment with auto-reconciliation
supabase.rpc('register_payment', {
  p_payment_id: string,
  p_amount_paid: number,
  p_note?: string,
  p_cycle_ids?: string[]  // optional: manual cycle selection
})
// Returns: { cycles_paid: [{payment_id, amount}], credit_generated: boolean, credit_amount: number }

// Confirm payment — owner only (step 2 of double-verification)
supabase.rpc('confirm_payment', { p_payment_id: string })

// Calculate amount for a member (equal or custom split)
supabase.rpc('calculate_member_amount', { p_service_id: string, p_persona_id: string })
```

---

## Business Logic Rules

These are critical. Always apply them when generating code.

### Payment Status Flow
```
pending → partial → paid → confirmed
                  ↘ overdue (if due_date passes)
```
- `pending`: nothing paid yet
- `partial`: some amount paid, not full
- `paid`: full amount paid, awaiting owner confirmation
- `confirmed`: owner verified receipt
- `overdue`: due_date passed without full payment

### Double-Verification (conditional)
```typescript
// persona.profile_id !== null → requires_confirmation = true
// Flow: persona marks paid → owner confirms

// persona.profile_id === null → requires_confirmation = false  
// Flow: owner marks confirmed directly (no intermediate step)
```

### Credits System
- If Ana pays $300 but only owes $99.67 → $200.33 saved as `persona_credits`
- Credits are **per service** (Netflix credit ≠ Spotify credit)
- Applied automatically FIFO when next cycle is generated
- Owner can cancel a credit (sets status to `cancelled`)

### Payment Reconciliation (register_payment)
- **Auto mode**: pass `p_amount_paid`, system pays oldest overdue cycles first
- **Manual mode**: pass `p_cycle_ids` array, pays those specific cycles in order
- Always check `credit_generated` in response — show toast if true

### Accumulated Debt
- If Ana skips February → in March her `payments.accumulated_debt` = February's amount
- `persona_debt_summary.debt_by_month[]` shows breakdown per month
- `dashboard_summary.total_accumulated_debt` shows global total

### Data Mutations — What NOT to do
```typescript
// ❌ NEVER insert payments directly
supabase.from('payments').insert(...)

// ❌ NEVER insert persona_credits directly
supabase.from('persona_credits').insert(...)

// ❌ NEVER insert activity_log directly
supabase.from('activity_log').insert(...)

// ✅ Always use RPC functions
supabase.rpc('generate_billing_cycle', { p_service_id })
supabase.rpc('register_payment', { p_payment_id, p_amount_paid })
```

---

## Design System

**Dark-mode only.** Never add light mode classes.

### Color Tokens (Tailwind neutral-* palette)

**Backgrounds:**
```
bg-neutral-950   → app background (deepest), modals
bg-neutral-900/30 → card background (default)
bg-neutral-900/50 → card background (hover)
bg-neutral-900/10 → inactive card background
bg-neutral-900    → icon boxes (inactive), elevated inputs
bg-neutral-800/40 → action buttons
bg-neutral-700/60 → action buttons (hover)
bg-black          → icon boxes (active)
```

**Borders:**
```
border-neutral-800    → default card/element border
border-neutral-700    → badge borders (inactive), input borders
border-neutral-600    → hover border (cards, buttons)
border-neutral-800/50 → subtle separators (card dividers)
border-neutral-900    → avatar borders (stacked)
```

**Text:**
```
text-white / text-neutral-100  → primary text (headings)
text-neutral-200               → secondary text (names, labels)
text-neutral-400               → tertiary text (descriptions, button labels)
text-neutral-500               → muted text (subtitles, dates)
text-neutral-600               → very muted text (inactive descriptions)
```

**Status (semantic — always use these):**
```
emerald-400/500 → active, confirmed, paid  (bg-emerald-500/10 border-emerald-500/20 text-emerald-400)
orange-400      → pending, partial         (bg-orange-400/10  border-orange-400/20  text-orange-400)
red-400/500     → overdue                  (bg-red-500/10     border-red-500/20     text-red-400)
violet-400/500  → accent, CTA, primary actions
blue-400        → info, links
neutral-500     → inactive/paused          (bg-neutral-800    border-neutral-700    text-neutral-500)
```

### Custom CSS Classes (defined in globals.css)
```
.vertical-lines          → decorative background pattern
.glass-panel             → frosted glass effect (modals, overlays)
.btn-cta-gold            → primary CTA with gradient + triple shadow
.badge-active            → emerald status badge
.badge-pending           → orange status badge
.badge-overdue           → red status badge
.service-glow-{color}    → card glow matching service color
.gauge-glow              → glow for the semicircular gauge
.center-dial-gradient    → gradient for gauge center
```

### Key Component Patterns

**Service Card (active) with hover glow + inline actions:**
```tsx
<div className="group relative flex flex-col justify-between p-5 rounded-[1.5rem] bg-neutral-900/30 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/50 transition-all cursor-pointer backdrop-blur-sm">
  {/* Hover glow — fades in on hover */}
  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    style={{ backgroundColor: `${service.color}0d` }} />
  {/* Icon box with colored shadow */}
  <div className="w-12 h-12 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300"
    style={{ boxShadow: `0 4px 14px ${service.color}1a` }}>
    <Icon icon={service.icon_url} width={24} style={{ color: service.color }} />
  </div>
  {/* ... middle section with members + status badge ... */}
  {/* Inline action buttons (grid cols-5) */}
  <div className="grid grid-cols-5 gap-2 pt-3 border-t border-neutral-800/50">
    <Button variant="ghost" className="col-span-2 card-action-btn">Editar</Button>
    <Button variant="ghost" className="col-span-2 card-action-btn">Pausar</Button>
    <Button variant="ghost" size="icon" className="col-span-1 card-action-btn">...</Button>
  </div>
</div>
```

**Inactive card modifier:** add `bg-neutral-900/10 border-dashed border-neutral-800 opacity-70 hover:opacity-100 hover:border-neutral-600 hover:bg-neutral-900/30` + `grayscale group-hover:grayscale-0` on icon box, `bg-neutral-900` instead of `bg-black`

**Card action button base style:**
```
h-8 rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border-transparent hover:border-neutral-600 text-[10px] font-medium text-neutral-400 hover:text-white
```

**Status Badge:**
```tsx
{/* Active */}
<span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 flex items-center gap-1.5">
  <Icon icon="solar:check-circle-bold" width={10} /> Al día
</span>
{/* Overdue */}
<span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-medium text-red-400 flex items-center gap-1.5">
  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Vence pronto
</span>
{/* Inactive */}
<span className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-medium text-neutral-500">
  Inactivo
</span>
```

**Stacked member avatars:**
```tsx
<div className="flex -space-x-2">
  <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-900 flex items-center justify-center text-[8px] text-neutral-400">MK</div>
</div>
```

**Primary CTA Button:**
```tsx
<button className="w-full py-4 rounded-2xl font-semibold text-white text-base bg-gradient-to-r from-violet-600 to-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4),0_4px_15px_rgba(139,92,246,0.3),0_1px_3px_rgba(0,0,0,0.5)] active:scale-[0.98] transition-transform">
  Guardar
</button>
```

**Input:**
```tsx
<input className="w-full bg-neutral-900/20 border border-neutral-800 focus:border-neutral-600 rounded-xl px-4 py-3 text-neutral-200 placeholder:text-neutral-600 text-sm focus:outline-none focus:ring-0 transition-all" />
```

**Modal / Dialog:**
```tsx
<AlertDialogContent className="bg-neutral-950 border-neutral-800">
  <AlertDialogTitle className="text-neutral-100">...</AlertDialogTitle>
  <AlertDialogDescription className="text-neutral-400">...</AlertDialogDescription>
  <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white">
    Cancelar
  </AlertDialogCancel>
</AlertDialogContent>
```

**Bottom Dock Nav:**
```tsx
<nav className="fixed bottom-0 inset-x-0 pb-safe">
  <div className="mx-4 mb-4 rounded-2xl bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 px-6 py-3 flex justify-around">
    {/* Home | Servicios | Personas | Config */}
  </div>
</nav>
```

**Page wrapper:**
```tsx
<main className="min-h-screen bg-neutral-950 pb-24 px-4">
```

---

## Coding Conventions

### Path alias
```typescript
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
```

### Supabase clients — always use these, never instantiate directly
```typescript
// Server Components, Server Actions, Route Handlers:
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client Components:
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

### Server Actions pattern
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({ ... })

export async function myAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const input = schema.safeParse(Object.fromEntries(formData))
  if (!input.success) return { success: false, error: input.error.message }

  // mutation...

  revalidatePath('/services')
  return { success: true }
}
```

### Component structure
```typescript
// 'use client' only if needed (interactivity, hooks, browser APIs)
// Props interface always explicit
// No default exports for server actions
// Default exports for components and pages
```

### Formatting
- Double quotes, semicolons, trailing commas
- 2-space indent, 80 char width
- RSC by default — add `'use client'` only when necessary

### Utility functions (from `@/types/database`)
```typescript
formatCurrency(amount, currency?)  // es-MX locale
calcCollectedPercent(summary)       // for gauge percentage
statusColors[status]                // Tailwind class for payment/service status
formatPeriod(periodStart)           // 'Feb 2026'
canUseDoubleVerification(persona)   // boolean
isNoteAuthor(note, userId)          // boolean
```

---

## Important Notes

- **proxy.ts not middleware.ts** — Next.js 16 uses `proxy.ts` for session refresh
- **Serwist disabled in dev** — PWA only active in production builds
- **Build flag** — always `pnpm build` (uses `--webpack`, Serwist incompatible with Turbopack)
- **React Compiler active** — don't add manual memoization
- **Zod v4** — breaking changes from v3, use `z.string().min(1)` not `z.string().nonempty()`
- **Motion not framer-motion** — import from `motion/react`, not `framer-motion`
- **Solar icons** — use `@iconify/react` with `solar:*` icon names

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Screens Reference

| Route | Screen | Key data |
|---|---|---|
| `/` | Dashboard + gauge | `dashboard_summary` view |
| `/services` | Services list | `service_summary` view |
| `/services/[id]` | Service detail + payments | `services` + `payments` + `personas` |
| `/services/new` | Add service form | Insert `services` + `service_members` |
| `/personas` | Personas list | `persona_debt_summary` view |
| `/personas/[id]` | Persona detail + debt history | `persona_debt_summary` + `payments` |
| `/personas/new` | Add persona form | Insert `personas` |
| `/settings` | User settings | `user_settings` |
| `/auth/login` | Login | Supabase auth |
| `/auth/register` | Register + auto-link | Supabase auth + trigger |
| `/invite/[token]` | Accept invitation | `invitations` table |