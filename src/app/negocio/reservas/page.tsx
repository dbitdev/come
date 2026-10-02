"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PanelReservas from "@/components/reservas/PanelReservas";

/**
 * Reservaciones para el dueño de un perfil reclamado. Usa el mismo panel que el
 * admin; la API sólo le entrega los restaurantes que son suyos.
 */
function Contenido() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const lugar = useSearchParams().get("lugar") || undefined;

  useEffect(() => {
    if (!loading && !user) {
      const aqui = `/negocio/reservas${lugar ? `?lugar=${encodeURIComponent(lugar)}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(aqui)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, lugar]);

  if (loading || !user) return <p style={{ padding: "4rem 1.5rem", textAlign: "center", color: "var(--foreground-muted)" }}>Cargando…</p>;
  return <PanelReservas lugarInicial={lugar} />;
}

export default function ReservasNegocioPage() {
  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem max(5vw, 1.2rem) 5rem" }}>
        <Link href="/perfil" style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", fontWeight: 700, color: "var(--primary-dark)" }}>
          <ArrowLeft size={16} /> Tu cuenta
        </Link>
        <span style={{ display: "block", marginTop: "1.4rem", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".16em", color: "var(--primary)" }}>TU NEGOCIO</span>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 2.8rem)", letterSpacing: "-.02em", margin: ".3rem 0 1.6rem" }}>Reservaciones</h1>
        <Suspense fallback={null}>
          <Contenido />
        </Suspense>
      </div>
    </main>
  );
}
