"use client";

import { useEffect, useState } from "react";

/**
 * Retrato de chef con reserva. Varias fichas traen una URL que ya no existe y el
 * navegador dejaba el icono de imagen rota. La reserva es una inicial sobre el
 * verde de la marca, no una foto de archivo: poner el retrato de un desconocido
 * bajo el nombre de un chef real sería engañoso.
 */
export default function RetratoChef({
  src,
  nombre,
  className,
}: {
  src?: string;
  nombre: string;
  className?: string;
}) {
  const [falló, setFalló] = useState(!src);

  useEffect(() => setFalló(!src), [src]);

  if (falló) {
    return (
      <div className={className} data-reserva="true" aria-label={nombre} role="img"
        style={{
          display: "grid",
          placeItems: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(160deg,#0a603c,#064d31)",
          color: "#fffdf0",
          fontFamily: "var(--font-modern)",
          fontSize: "3.2rem",
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        {nombre.trim().charAt(0).toUpperCase()}
      </div>
    );
  }

  return <img src={src} alt={nombre} className={className} onError={() => setFalló(true)} />;
}
