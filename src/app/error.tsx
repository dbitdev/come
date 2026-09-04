"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./status.module.css";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Error de página:", error);
  }, [error]);

  return (
    <main className={styles.wrap}>
      <span>ALGO SE QUEMÓ EN LA COCINA</span>
      <h1>No pudimos cargar esta página.</h1>
      <p>Fue un problema de nuestro lado. Vuelve a intentarlo; si sigue igual, regresa al inicio.</p>
      <div className={styles.actions}>
        <button onClick={reset}>Reintentar</button>
        <Link href="/" className={styles.secondary}>Ir al inicio</Link>
      </div>
      {error.digest && <small className={styles.digest}>Referencia: {error.digest}</small>}
    </main>
  );
}
