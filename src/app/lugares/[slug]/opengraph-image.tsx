import { ImageResponse } from "next/og";
import sharp from "sharp";
import { fotoParaTarjeta } from "@/lib/tarjetaOg";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isPublished, slugify } from "@/lib/utils";

/**
 * Tarjeta para compartir un lugar.
 *
 * Antes se mandaba la foto del restaurante tal cual como og:image, y las que
 * sube la redacción pesan varios MB (la de Batards, 5.7 MB). WhatsApp no
 * descarga eso: por eso la previsualización salía con un cuadro de reserva en
 * vez de la foto. Aquí se rearma a 1200×630, que es la proporción que esperan
 * las redes.
 *
 * ImageResponse sólo emite PNG, y una foto en PNG pesa casi 2 MB —sigue siendo
 * demasiado para WhatsApp—, así que al final se recomprime a JPEG.
 */

export const alt = "Restaurante en Come";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const runtime = "nodejs";

type Lugar = { nombre: string; categoria: string; imagen?: string; estado?: string; estrellas: number };

async function traerLugar(slug: string): Promise<Lugar | null> {
  if (!db) return null;
  try {
    const snapshot = await getDocs(collection(db, "come"));
    for (const documento of snapshot.docs) {
      const d = documento.data();
      if (!isPublished(d)) continue;
      const nombre = d.restaurantName || d.name || "";
      if (slugify(nombre) !== slug && documento.id !== slug) continue;
      return {
        nombre,
        categoria: d.category || "Cocina mexicana",
        imagen: d.image || d.menu?.[0]?.image,
        estado: d.estado,
        estrellas: Number(d.michelinStars) || 0,
      };
    }
  } catch {
    /* Sin datos se pinta la tarjeta genérica de la marca. */
  }
  return null;
}

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lugar = await traerLugar(decodeURIComponent(slug));

  // Satori no decodifica AVIF, y varios retratos lo son.
  const foto = await fotoParaTarjeta(lugar?.imagen, 504, 630);

  const verde = "#064d31";
  const crema = "#fffdf0";

  // Panel de color a la izquierda y foto a la derecha, en vez de texto encima
  // de la imagen: así el nombre se lee siempre, sin depender de si la foto es
  // clara u oscura ni de que traiga letras impresas.
  const tarjeta = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: verde }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: foto ? "58%" : "100%",
            height: "100%",
            padding: 60,
          }}
        >
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: crema, letterSpacing: -3 }}>come</div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, letterSpacing: 3, color: "#9fe3ad" }}>
              {(lugar?.categoria || "GUÍA GASTRONÓMICA").toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: (lugar?.nombre?.length ?? 0) > 22 ? 52 : 68,
                fontWeight: 800,
                color: crema,
                lineHeight: 1.05,
                marginTop: 12,
              }}
            >
              {lugar?.nombre || "La guía gastronómica de México"}
            </div>
            {lugar?.estado ? (
              <div style={{ display: "flex", fontSize: 24, color: "#dff0e2", marginTop: 16 }}>{lugar.estado}</div>
            ) : null}
            {lugar && lugar.estrellas > 0 ? (
              <div style={{ display: "flex", marginTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    background: "#f5c518",
                    color: "#1b1200",
                    fontSize: 18,
                    fontWeight: 800,
                    padding: "8px 16px",
                    borderRadius: 100,
                  }}
                >
                  {lugar.estrellas} {lugar.estrellas > 1 ? "ESTRELLAS MICHELIN" : "ESTRELLA MICHELIN"}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {foto ? (
          <div style={{ display: "flex", width: "42%", height: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt="" width={504} height={630} style={{ objectFit: "cover" }} />
          </div>
        ) : null}
      </div>
    ),
    size,
  );

  const jpeg = await sharp(Buffer.from(await tarjeta.arrayBuffer()))
    .jpeg({ quality: 78, progressive: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": contentType,
      // Las redes vuelven a pedir la tarjeta cada vez que alguien comparte.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
