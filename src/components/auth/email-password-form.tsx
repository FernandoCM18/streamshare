"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const registerSchema = z
  .object({
    display_name: z.string().min(1, "Ingresa tu nombre"),
    email: z.string().email("Ingresa un email válido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirm_password: z.string().min(6, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function EmailPasswordForm({
  isRegister = false,
}: {
  isRegister?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

      if (isRegister) {
        const registerValues = values as RegisterValues;
        const email = registerValues.email.trim().toLowerCase();

        const { data, error } = await supabase.auth.signUp({
          email,
          password: registerValues.password,
          options: {
            data: {
              display_name: registerValues.display_name.trim(),
            },
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.session) {
          toast.success("Cuenta creada");
          router.push("/dashboard");
          router.refresh();
          return;
        }

        toast.success("Revisa tu correo para confirmar tu cuenta");
        return;
      }

      const loginValues = values as LoginValues;
      const { error } = await supabase.auth.signInWithPassword({
        email: loginValues.email.trim().toLowerCase(),
        password: loginValues.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Sesión iniciada");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isRegister && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50">Nombre</label>
          <div className="relative">
            <Icon
              icon="solar:user-linear"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
            />
            <input
              {...register("display_name" as keyof FormValues)}
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-[#252540] bg-[#1a1a2e] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
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
        <label className="text-xs font-medium text-white/50">Email</label>
        <div className="relative">
          <Icon
            icon="solar:letter-linear"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
          />
          <input
            {...register("email")}
            type="email"
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-[#252540] bg-[#1a1a2e] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/50">Contraseña</label>
        <div className="relative">
          <Icon
            icon="solar:lock-password-linear"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
          />
          <input
            {...register("password" as keyof FormValues)}
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-[#252540] bg-[#1a1a2e] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
        {"password" in errors && (
          <p className="text-xs text-red-400">
            {(errors as Record<string, { message?: string }>).password?.message}
          </p>
        )}
      </div>

      {isRegister && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50">
            Confirmar contraseña
          </label>
          <div className="relative">
            <Icon
              icon="solar:shield-keyhole-linear"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
            />
            <input
              {...register("confirm_password" as keyof FormValues)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#252540] bg-[#1a1a2e] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          {"confirm_password" in errors && (
            <p className="text-xs text-red-400">
              {
                (errors as Record<string, { message?: string }>)
                  .confirm_password?.message
              }
            </p>
          )}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-cta-gold w-full">
        {loading ? (
          <Icon
            icon="solar:refresh-bold"
            className="mx-auto h-4 w-4 animate-spin"
          />
        ) : isRegister ? (
          "Crear cuenta"
        ) : (
          "Iniciar sesión"
        )}
      </button>
    </form>
  );
}
