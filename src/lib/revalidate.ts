import { revalidatePath } from "next/cache";

/**
 * Granular revalidation helpers.
 *
 * Instead of `revalidatePath("/", "layout")` which nukes ALL cached routes,
 * these only invalidate the routes that actually show the affected data.
 *
 * Route data dependencies:
 *   /dashboard     → payments, services, profile (gauge + service cards)
 *   /servicios     → services, service_members, payments, members
 *   /personas      → members, service_members, payments, services
 *   /mis-pagos     → my_payments, payment_notes
 *   /configuracion → profile, user_settings
 */

/** Payment changed (register, confirm, void, edit amount, reject claim) */
export function revalidatePayments() {
  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  revalidatePath("/mis-pagos");
}

/** Payment notes only (add, edit, delete note) */
export function revalidateNotes() {
  revalidatePath("/dashboard");
  revalidatePath("/mis-pagos");
}

/** Service changed (create, update, delete, toggle status) */
export function revalidateServices() {
  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  revalidatePath("/personas");
}

/** Service member changed (add, remove, update amount) */
export function revalidateServiceMembers() {
  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  revalidatePath("/personas");
}

/** Persona changed (create, update, delete) */
export function revalidatePersonas() {
  revalidatePath("/personas");
  revalidatePath("/servicios");
  revalidatePath("/dashboard");
}

/** Profile or settings changed */
export function revalidateSettings() {
  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
}

/** My payment claimed (guest marking as paid) */
export function revalidateMyPayments() {
  revalidatePath("/mis-pagos");
  revalidatePath("/dashboard");
}
