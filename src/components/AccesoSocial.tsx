"use client";

import { useState } from "react";
import { FaApple, FaGoogle } from "react-icons/fa";
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, type AuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "./AccesoSocial.module.css";

/** Traduce los códigos de Firebase, que por sí solos no le dicen nada a nadie. */
function traducir(error: unknown): string | null {
  const codigo = (error as { code?: string })?.code ?? "";
  // Cerrar la ventana emergente es una decisión del usuario, no un error.
  if (codigo.includes("popup-closed-by-user") || codigo.includes("cancelled-popup-request")) return null;
  if (codigo.includes("popup-blocked"))
    return "El navegador bloqueó la ventana de acceso. Permite las ventanas emergentes para este sitio.";
  if (codigo.includes("account-exists-with-different-credential"))
    return "Ya existe una cuenta con ese correo, creada con otro método. Entra con el que usaste la primera vez.";
  if (codigo.includes("operation-not-allowed"))
    return "Este método de acceso todavía no está habilitado. Actívalo en Firebase Authentication.";
  if (codigo.includes("unauthorized-domain"))
    return "Este dominio no está autorizado en Firebase Authentication.";
  return "No pudimos completar el acceso. Inténtalo de nuevo.";
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

  async function acceder(cual: "google" | "apple", proveedor: AuthProvider) {
    if (!auth) return onError("La autenticación no está disponible en este momento.");
    setTrabajando(cual);
    onError("");
    try {
      await signInWithPopup(auth, proveedor);
      onListo();
    } catch (error) {
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
