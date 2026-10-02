"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { PRIVACIDAD_VERSION, TERMINOS_VERSION, aceptacionVigente } from "@/lib/legal";

/** Guarda la constancia de aceptación en users/{uid}. */
export async function registrarAceptacion(uid: string) {
  if (!db) return;
  await setDoc(
    doc(db, "users", uid),
    {
      aceptacionLegal: {
        terminos: TERMINOS_VERSION,
        privacidad: PRIVACIDAD_VERSION,
        fechaMs: Date.now(),
        fecha: serverTimestamp(),
        origen: "web",
      },
    },
    { merge: true },
  );
}

/**
 * Puerta de aceptación: a quien tiene sesión y no ha aceptado las versiones
 * vigentes de los términos y del aviso (cuentas anteriores, acceso con Google o
 * Apple, o un cambio de versión) le pide aceptarlas antes de seguir.
 */
export default function AceptacionLegal() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [pendiente, setPendiente] = useState(false);
  const [marcado, setMarcado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !user || !db) {
      setPendiente(false);
      return;
    }
    // En vivo: al registrarse, la aceptación se escribe justo después de crear la
    // cuenta; con una lectura única el aviso aparecería a quien ya aceptó.
    return onSnapshot(
      doc(db, "users", user.uid),
      (ficha) => setPendiente(!aceptacionVigente(ficha.data()?.aceptacionLegal)),
      () => setPendiente(false),
    );
  }, [user, loading]);

  // Que puedan leer los documentos antes de aceptarlos.
  if (!pendiente || !user || pathname === "/terminos" || pathname === "/privacidad") return null;

  const aceptar = async () => {
    setGuardando(true);
    setError("");
    try {
      await registrarAceptacion(user.uid);
      setPendiente(false);
    } catch {
      setError("No pudimos guardar tu aceptación. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={fondo} role="dialog" aria-modal="true" aria-labelledby="aceptacion-titulo">
      <div style={caja}>
        <span style={ceja}>ANTES DE SEGUIR</span>
        <h2 id="aceptacion-titulo" style={titulo}>Términos y aviso de privacidad</h2>
        <p style={texto}>
          Actualizamos nuestros documentos legales, entre otras cosas para incluir las reservaciones. Para seguir usando
          tu cuenta necesitamos que los leas y los aceptes.
        </p>
        <label style={casilla}>
          <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--primary-dark)" }} />
          <span>
            He leído y acepto los{" "}
            <Link href="/terminos" target="_blank" style={enlace}>Términos y condiciones</Link> y el{" "}
            <Link href="/privacidad" target="_blank" style={enlace}>Aviso de privacidad</Link>.
          </span>
        </label>
        {error && <p style={{ ...texto, color: "#9b2c1f", fontWeight: 600 }}>{error}</p>}
        <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
          <button type="button" onClick={aceptar} disabled={!marcado || guardando} style={{ ...boton, opacity: !marcado || guardando ? 0.45 : 1 }}>
            {guardando ? "Guardando…" : "Aceptar y continuar"}
          </button>
          <button type="button" onClick={() => auth && signOut(auth)} style={botonSecundario}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

const fondo: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 2000, background: "rgba(6,26,18,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" };
const caja: React.CSSProperties = { width: "min(520px,100%)", background: "var(--background)", color: "var(--foreground)", borderRadius: 14, padding: "1.6rem", display: "flex", flexDirection: "column", gap: ".9rem", boxShadow: "0 30px 80px rgba(0,0,0,.35)", fontFamily: "var(--font-modern)" };
const ceja: React.CSSProperties = { fontSize: ".7rem", fontWeight: 800, letterSpacing: ".16em", color: "var(--primary)" };
const titulo: React.CSSProperties = { fontFamily: "var(--font-serif)", fontSize: "1.6rem", lineHeight: 1.15, margin: 0 };
const texto: React.CSSProperties = { margin: 0, lineHeight: 1.55, color: "var(--foreground-muted)", fontSize: ".95rem" };
const casilla: React.CSSProperties = { display: "flex", gap: ".6rem", alignItems: "flex-start", fontSize: ".95rem", lineHeight: 1.5, cursor: "pointer" };
const enlace: React.CSSProperties = { color: "var(--primary-dark)", fontWeight: 700, textDecoration: "underline" };
const boton: React.CSSProperties = { flex: 1, padding: ".85rem 1.1rem", borderRadius: 8, border: 0, background: "var(--primary-dark)", color: "#fff", fontFamily: "var(--font-modern)", fontWeight: 800, fontSize: ".95rem", cursor: "pointer" };
const botonSecundario: React.CSSProperties = { padding: ".85rem 1.1rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "#fff", color: "var(--primary-dark)", fontFamily: "var(--font-modern)", fontWeight: 700, fontSize: ".95rem", cursor: "pointer" };
