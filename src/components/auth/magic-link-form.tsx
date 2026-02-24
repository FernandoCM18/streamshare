"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Icon } from "@iconify/react";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
});

const registerSchema = z.object({
  display_name: z.string().min(1, "Ingresa tu nombre"),
  email: z.string().email("Ingresa un email válido"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function MagicLinkForm({
  isRegister = false,
}: {
  isRegister?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const schema = isRegister ? registerSchema : loginSchema;
  type FormValues = typeof isRegister extends true
    ? RegisterValues
    : LoginValues;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: isRegister
            ? { display_name: (values as RegisterValues).display_name }
            : undefined,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Revisa tu email", {
        description: "Te enviamos un enlace para acceder",
      });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center">
          <Icon
            icon="solar:letter-bold-duotone"
            className="h-6 w-6 text-emerald-400"
          />
        </div>
        <p className="text-sm text-white/70">
          Revisa tu bandeja de entrada y haz clic en el enlace que te enviamos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isRegister && (
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 font-medium">Nombre</label>
          <div className="relative">
            <Icon
              icon="solar:user-linear"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30"
            />
            <input
              {...register("display_name" as keyof FormValues)}
              placeholder="Tu nombre"
              className="w-full bg-[#1a1a2e] border border-[#252540] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
            />
          </div>
          {"display_name" in errors && (
            <p className="text-xs text-red-400">
              {
                (errors as Record<string, { message?: string }>).display_name
                  ?.message
              }
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs text-white/50 font-medium">Email</label>
        <div className="relative">
          <Icon
            icon="solar:letter-linear"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30"
          />
          <input
            {...register("email")}
            type="email"
            placeholder="tu@email.com"
            className="w-full bg-[#1a1a2e] border border-[#252540] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      <button type="submit" disabled={loading} className="btn-cta-gold w-full">
        {loading ? (
          <Icon
            icon="solar:refresh-bold"
            className="h-4 w-4 animate-spin mx-auto"
          />
        ) : isRegister ? (
          "Crear cuenta"
        ) : (
          "Enviar enlace"
        )}
      </button>
    </form>
  );
}
