import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured");
  }

  webpush.setVapidDetails(
    "mailto:" + (process.env.VAPID_MAILTO ?? "admin@streamshare.app"),
    publicKey,
    privateKey,
  );

  return webpush;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { profileId, title, body, url, tag } = await request.json();

  if (!profileId || !title || !body) {
    return NextResponse.json(
      { error: "Faltan campos: profileId, title, body" },
      { status: 400 },
    );
  }

  let wp: typeof webpush;
  try {
    wp = getWebPush();
  } catch {
    return NextResponse.json(
      { error: "Push notifications not configured (missing VAPID keys)" },
      { status: 503 },
    );
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("profile_id", profileId);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json(
      { error: "El usuario no tiene notificaciones push activas" },
      { status: 404 },
    );
  }

  const payload = JSON.stringify({ title, body, url, tag });
  const results: { endpoint: string; success: boolean; error?: string }[] = [];

  for (const sub of subscriptions) {
    try {
      await wp.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
      results.push({ endpoint: sub.endpoint, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      results.push({ endpoint: sub.endpoint, success: false, error: message });

      if (
        err instanceof webpush.WebPushError &&
        err.statusCode === 410
      ) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }

  return NextResponse.json({ results });
}
