import { ImageResponse } from "next/og";

/**
 * Tarjeta para compartir un enlace de Come.
 *
 * Deliberadamente sin foto y sin dependencias nativas.
 *
 * El primer intento metía la foto del lugar y recomprimía con `sharp`. Eso
 * tumbó producción: sharp es un módulo nativo, el lockfile sólo llevaba el
 * binario de macOS, en el contenedor Linux fallaba al importarse y —al ser una
 * importación estática que Next carga para renderizar la página— se llevaba
 * `/lugares/[slug]` y `/chefs/[id]` enteras con un 500.
 *
 * Con color plano y tipografía, el PNG que emite ImageResponse pesa unas
 * decenas de KB, que es justo lo que WhatsApp necesita, y no hay nada que
 * pueda fallar al arrancar. Se pierde la foto del platillo; se gana que
 * compartir un enlace no pueda volver a tirar una página.
 */

export const TAMANO = { width: 1200, height: 630 };

const VERDE = "#064d31";
const CREMA = "#fffdf0";
const VERDE_CLARO = "#9fe3ad";

export function tarjeta({
  etiqueta,
  titulo,
  detalle,
  distintivo,
}: {
  etiqueta: string;
  titulo: string;
  detalle?: string;
  distintivo?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: VERDE,
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: CREMA, letterSpacing: -3 }}>come</div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 3, color: VERDE_CLARO }}>
            {etiqueta.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: titulo.length > 26 ? 62 : 82,
              fontWeight: 800,
              color: CREMA,
              lineHeight: 1.05,
              marginTop: 16,
            }}
          >
            {titulo}
          </div>
          {detalle ? (
            <div style={{ display: "flex", fontSize: 28, color: "#dff0e2", marginTop: 18 }}>{detalle}</div>
          ) : null}
          {distintivo ? (
            <div style={{ display: "flex", marginTop: 24 }}>
              <div
                style={{
                  display: "flex",
                  background: "#f5c518",
                  color: "#1b1200",
                  fontSize: 20,
                  fontWeight: 800,
                  padding: "10px 20px",
                  borderRadius: 100,
                }}
              >
                {distintivo}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    ),
    TAMANO,
  );
}
