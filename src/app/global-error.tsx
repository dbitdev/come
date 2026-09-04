"use client";

// Último recinto: se muestra si falla el propio layout raíz, por eso lleva
// su propio <html> y estilos en línea (aquí no hay CSS de la app cargado).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#faf7ef", color: "#10261c" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeContent: "center", textAlign: "center", padding: "2rem", gap: "1rem" }}>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Come no está disponible en este momento.</h1>
          <p style={{ color: "#5d6c64", margin: 0 }}>Estamos trabajando en ello. Intenta recargar en un momento.</p>
          <button onClick={reset} style={{ justifySelf: "center", padding: ".8rem 1.6rem", border: 0, borderRadius: 4, background: "#064d31", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Reintentar
          </button>
          {error.digest && <small style={{ color: "#8b968f" }}>Referencia: {error.digest}</small>}
        </main>
      </body>
    </html>
  );
}
