import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-neutral-950 flex flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold text-neutral-100">404</h1>
        <p className="text-lg text-neutral-400">
          Esta pagina no existe o fue movida.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="px-6 py-3 rounded-2xl font-semibold text-white text-sm bg-gradient-to-r from-violet-600 to-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4),0_4px_15px_rgba(139,92,246,0.3),0_1px_3px_rgba(0,0,0,0.5)] active:scale-[0.98] transition-transform"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
