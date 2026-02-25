"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TestPage() {
  const [pushLoading, setPushLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pushResult, setPushResult] = useState<string>("");
  const [emailResult, setEmailResult] = useState<string>("");

  async function testPush() {
    setPushLoading(true);
    setPushResult("");
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Prueba StreamShare",
          body: "Si ves esto, las push notifications funcionan!",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPushResult(`Enviado a ${data.sent} dispositivo(s)`);
        toast.success("Push enviado");
      } else {
        setPushResult(`Error: ${data.error}`);
        toast.error(data.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setPushResult(`Error: ${msg}`);
      toast.error(msg);
    } finally {
      setPushLoading(false);
    }
  }

  async function testEmail() {
    setEmailLoading(true);
    setEmailResult("");
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_reminder",
          data: {
            email: "delivered@resend.dev",
            personaName: "Test User",
            serviceName: "Netflix",
            amount: "99.67",
            dueDate: "2026-03-01",
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailResult("Email enviado a delivered@resend.dev");
        toast.success("Email enviado");
      } else {
        setEmailResult(`Error: ${data.error}`);
        toast.error(data.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setEmailResult(`Error: ${msg}`);
      toast.error(msg);
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 pb-24 px-4 pt-12">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Pruebas</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Página temporal para probar push y email
          </p>
        </div>

        {/* Push Test */}
        <div className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Icon
                icon="solar:bell-bing-bold"
                width={20}
                className="text-violet-400"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">
                Push Notification
              </p>
              <p className="text-[11px] text-neutral-500">
                Envía una notificación push a tu dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={testPush}
            disabled={pushLoading}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm",
              "bg-violet-600 hover:bg-violet-500 text-white",
              "transition-all active:scale-[0.97]",
              "disabled:opacity-60",
            )}
          >
            {pushLoading ? (
              <Icon
                icon="solar:refresh-bold"
                width={16}
                className="animate-spin inline"
              />
            ) : (
              "Enviar Push de Prueba"
            )}
          </button>
          {pushResult && (
            <p
              className={cn(
                "text-xs px-3 py-2 rounded-lg",
                pushResult.startsWith("Error")
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400",
              )}
            >
              {pushResult}
            </p>
          )}
        </div>

        {/* Email Test */}
        <div className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Icon
                icon="solar:letter-bold"
                width={20}
                className="text-blue-400"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">
                Email (Resend)
              </p>
              <p className="text-[11px] text-neutral-500">
                Envía un email de prueba a delivered@resend.dev
              </p>
            </div>
          </div>
          <button
            onClick={testEmail}
            disabled={emailLoading}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm",
              "bg-blue-600 hover:bg-blue-500 text-white",
              "transition-all active:scale-[0.97]",
              "disabled:opacity-60",
            )}
          >
            {emailLoading ? (
              <Icon
                icon="solar:refresh-bold"
                width={16}
                className="animate-spin inline"
              />
            ) : (
              "Enviar Email de Prueba"
            )}
          </button>
          {emailResult && (
            <p
              className={cn(
                "text-xs px-3 py-2 rounded-lg",
                emailResult.startsWith("Error")
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400",
              )}
            >
              {emailResult}
            </p>
          )}
        </div>

        <p className="text-[10px] text-neutral-600 text-center">
          Elimina esta página después de probar (/test)
        </p>
      </div>
    </main>
  );
}
