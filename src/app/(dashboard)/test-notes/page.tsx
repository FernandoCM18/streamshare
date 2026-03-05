import { createClient } from "@/lib/supabase/server";
import { getRequiredUser } from "@/lib/auth/user";

export default async function TestNotesPage() {
  const user = await getRequiredUser();
  const supabase = await createClient();

  // 1. Check if payment_notes table exists and has rows
  const { data: allNotes, error: notesError } = await supabase
    .from("payment_notes")
    .select("*")
    .limit(20);

  // 2. Get some payments to check IDs
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("id, status, member_id, service_id")
    .eq("owner_id", user.id)
    .in("status", ["pending", "partial", "paid", "overdue", "confirmed"])
    .limit(5);

  // 3. Try inserting a test note on the first payment
  let insertResult = null;
  let insertError = null;
  if (payments && payments.length > 0) {
    const testPaymentId = payments[0].id;
    const { data: inserted, error: insErr } = await supabase
      .from("payment_notes")
      .insert({
        payment_id: testPaymentId,
        author_id: user.id,
        owner_id: user.id,
        content: "Nota de prueba diagnóstico",
      })
      .select();
    insertResult = inserted;
    insertError = insErr;
  }

  // 4. Re-check notes after insert
  const { data: notesAfter, error: notesAfterError } = await supabase
    .from("payment_notes")
    .select("*")
    .limit(20);

  // 5. Test the query that getCachedPayments uses (with payment_notes join)
  let joinResult = null;
  let joinError = null;
  if (payments && payments.length > 0) {
    const { data: joined, error: jErr } = await supabase
      .from("payments")
      .select(
        "id, status, payment_notes(id, content, author_id, is_edited, created_at)",
      )
      .eq("id", payments[0].id)
      .single();
    joinResult = joined;
    joinError = jErr;
  }

  return (
    <main className="min-h-screen bg-neutral-950 pb-24 px-4 pt-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-white">
          Diagnóstico payment_notes
        </h1>
        <p className="text-xs text-neutral-500">User: {user.id}</p>

        <Section title="1. Todas las notas existentes">
          {notesError ? (
            <Error msg={notesError.message} />
          ) : (
            <Json data={allNotes} />
          )}
        </Section>

        <Section title="2. Payments del owner (primeros 5)">
          {paymentsError ? (
            <Error msg={paymentsError.message} />
          ) : (
            <Json data={payments} />
          )}
        </Section>

        <Section title="3. Insert test note">
          {insertError ? (
            <Error msg={insertError.message} />
          ) : (
            <Json data={insertResult} />
          )}
        </Section>

        <Section title="4. Notas después del insert">
          {notesAfterError ? (
            <Error msg={notesAfterError.message} />
          ) : (
            <Json data={notesAfter} />
          )}
        </Section>

        <Section title="5. Join payments → payment_notes">
          {joinError ? (
            <Error msg={joinError.message} />
          ) : (
            <Json data={joinResult} />
          )}
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-200 mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Json({ data }: { data: unknown }) {
  return (
    <pre className="text-[11px] text-neutral-400 overflow-x-auto whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Error({ msg }: { msg: string }) {
  return (
    <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
      ERROR: {msg}
    </p>
  );
}
