/**
 * Converts a raw Supabase/Postgres error into a safe client-facing message.
 * Logs the original error server-side so it's not lost, while preventing
 * internal DB details (column names, constraints, SQL) from reaching the browser.
 */
export function toActionError(error: unknown): string {
  console.error("[server action error]", error);

  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    // RPC business-logic errors (raise exception)
    if (code === "P0001") {
      const msg =
        (error as { message?: string }).message?.replace(/^ERROR:\s*/i, "") ??
        "Error al procesar la solicitud";
      return msg;
    }
    // FK violation
    if (code === "23503") return "No se puede eliminar: tiene registros relacionados";
    // Unique violation
    if (code === "23505") return "Ya existe un registro con esos datos";
    // Not null / check violation
    if (code === "23502" || code === "23514") return "Datos inválidos";
  }

  return "Ocurrió un error. Intenta de nuevo.";
}
