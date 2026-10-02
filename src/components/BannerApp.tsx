"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/legal";

const CLAVE = "come:bannerApp";
const SILENCIO_DIAS = 30;

/**
 * Recomienda descargar la app en el teléfono. En Safari de iPhone no aparece:
 * ahí ya sale el banner nativo de Apple (meta apple-itunes-app del layout).
 * Si se cierra, se calla 30 días; nunca en escritorio ni en el admin.
 */
export default function BannerApp() {
  const pathname = usePathname();
  const [tienda, setTienda] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPod/.test(ua);
    const android = /Android/.test(ua) && /Mobile/.test(ua);
    // Safari "puro" en iOS: muestra el banner nativo, no duplicarlo.
    const safariIOS = ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line/.test(ua);
    if ((!ios && !android) || safariIOS) return;
    try {
      const hasta = Number(localStorage.getItem(CLAVE) || 0);
      if (hasta > Date.now()) return;
    } catch {
      /* sin storage: se muestra */
    }
    setTienda(ios ? "ios" : "android");
  }, []);

  if (!tienda || pathname?.startsWith("/admin") || pathname?.startsWith("/negocio")) return null;

  const cerrar = () => {
    setTienda(null);
    try {
      localStorage.setItem(CLAVE, String(Date.now() + SILENCIO_DIAS * 86_400_000));
    } catch {
      /* sin storage */
    }
  };

  return (
    <div role="complementary" aria-label="Descarga la app de Come" style={barra}>
      <button type="button" onClick={cerrar} aria-label="Cerrar" style={cerrarBtn}><X size={18} /></button>
      <img src="/brand/come-icono-verde-1024.png" alt="" width={44} height={44} style={icono} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: "block", fontSize: ".95rem" }}>Come es mejor en la app</b>
        <span style={{ fontSize: ".8rem", color: "var(--foreground-muted)" }}>Reserva, guarda lugares y ve el feed.</span>
      </div>
      <a href={tienda === "ios" ? APP_STORE_URL : GOOGLE_PLAY_URL} style={abrir} onClick={cerrar}>
        Descargar
      </a>
    </div>
  );
}

const barra: React.CSSProperties = {
  position: "fixed", left: 12, right: 12, bottom: "calc(12px + env(safe-area-inset-bottom))", zIndex: 900,
  display: "flex", alignItems: "center", gap: ".7rem", padding: ".7rem .8rem", borderRadius: 14,
  background: "#fff", color: "var(--foreground)", boxShadow: "0 12px 40px rgba(6,26,18,.25)",
  border: "1px solid var(--border-light)", fontFamily: "var(--font-modern)",
};
const cerrarBtn: React.CSSProperties = { display: "grid", placeItems: "center", width: 28, height: 28, border: 0, background: "transparent", color: "var(--foreground-muted)", cursor: "pointer", padding: 0 };
const icono: React.CSSProperties = { borderRadius: 10, flexShrink: 0 };
const abrir: React.CSSProperties = { flexShrink: 0, padding: ".6rem .95rem", borderRadius: 999, background: "var(--primary-dark)", color: "#fff", fontWeight: 800, fontSize: ".85rem", textDecoration: "none" };
