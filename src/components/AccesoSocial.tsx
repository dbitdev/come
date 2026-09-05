"use client";

import { useEffect, useState } from "react";
import { FaApple, FaGoogle } from "react-icons/fa";
import {
  GoogleAuthProvider,
  OAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type AuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "./AccesoSocial.module.css";

// Navegadores que bloquean ventanas emergentes, webviews de apps y Safari con
// prevención de rastreo: en todos ellos el popup falla y hay que redirigir.
const MOTIVOS_PARA_REDIRIGIR = [
  "popup-blocked",
  "operation-not-supported-in-this-environment",
  "web-storage-unsupported",
];

/** Traduce los códigos de Firebase, que por sí solos no le dicen nada a nadie. */
function traducir(error: unknown): string | null {
  const codigo = (error as { code?: string })?.code ?? "";
  // Cerrar la ventana emergente es una decisión del usuario, no un error.
  if (codigo.includes("popup-closed-by-user") || codigo.includes("cancelled-popup-request")) return null;
  if (codigo.includes("account-exists-with-different-credential"))
    return "Ya existe una cuenta con ese correo, creada con otro método. Entra con el que usaste la primera vez.";
  if (codigo.includes("operation-not-allowed"))
    return "Este método de acceso todavía no está habilitado. Actívalo en Firebase Authentication.";
  if (codigo.includes("unauthorized-domain"))
    return "Este dominio no está autorizado en Firebase Authentication. Agrégalo en Authentication → Settings → Authorized domains.";
  // Con el código a la vista, un fallo raro se puede diagnosticar sin adivinar.
  return `No pudimos completar el acceso${codigo ? ` (${codigo})` : ""}. Inténtalo de nuevo.`;
}

export default function AccesoSocial({
  modo,
  onListo,
  onError,
  deshabilitado,
}: {
  modo: "entrar" | "registrar";
  onListo: () => void;
  onError: (mensaje: string) => void;
  deshabilitado?: boolean;
}) {
  const [trabajando, setTrabajando] = useState<null | "google" | "apple">(null);

  // Al volver de un acceso por redirección la sesión ya viene resuelta aquí.
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then((resultado) => {
        if (resultado?.user) onListo();
      })
      .catch((error) => {
        const mensaje = traducir(error);
        if (mensaje) onError(mensaje);
      });
    // Se ejecuta una sola vez al montar: las funciones del padre cambian en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceder(cual: "google" | "apple", proveedor: AuthProvider) {
    if (!auth) return onError("La autenticación no está disponible en este momento.");
    setTrabajando(cual);
    onError("");
    try {
      await signInWithPopup(auth, proveedor);
      onListo();
    } catch (error) {
      const codigo = (error as { code?: string })?.code ?? "";
      // El popup no siempre está disponible; la redirección sí, así que se
      // reintenta por ahí en vez de dejar al usuario con un error.
      if (MOTIVOS_PARA_REDIRIGIR.some((motivo) => codigo.includes(motivo))) {
        try {
          await signInWithRedirect(auth, proveedor);
          return;
        } catch (errorRedireccion) {
          const mensaje = traducir(errorRedireccion);
          if (mensaje) onError(mensaje);
          setTrabajando(null);
          return;
        }
      }
      const mensaje = traducir(error);
      if (mensaje) onError(mensaje);
    } finally {
      setTrabajando(null);
    }
  }

  const verbo = modo === "entrar" ? "Continuar" : "Registrarme";
  const ocupado = trabajando !== null || deshabilitado;

  return (
    <div className={styles.grupo}>
      <button
        type="button"
        className={styles.boton}
        disabled={ocupado}
        onClick={() => acceder("google", new GoogleAuthProvider())}
      >
        <FaGoogle className={styles.iconoGoogle} />
        {trabajando === "google" ? "Conectando…" : `${verbo} con Google`}
      </button>

      <button
        type="button"
        className={`${styles.boton} ${styles.apple}`}
        disabled={ocupado}
        onClick={() => {
          // Apple pide explícitamente los alcances; sin ellos no manda el correo.
          const proveedor = new OAuthProvider("apple.com");
          proveedor.addScope("email");
          proveedor.addScope("name");
          acceder("apple", proveedor);
        }}
      >
        <FaApple className={styles.iconoApple} />
        {trabajando === "apple" ? "Conectando…" : `${verbo} con Apple`}
      </button>
    </div>
  );
}
