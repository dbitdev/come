import { ImageResponse } from "next/og";
import sharp from "sharp";
import { fotoParaTarjeta } from "@/lib/tarjetaOg";
import { getChefBySlug } from "@/lib/chefs";

/**
 * Tarjeta para compartir el perfil de un chef. Mismo criterio que la de los
 * lugares: el texto va sobre color plano y la foto en su propio panel, para que
 * el nombre se lea sin importar cómo sea el retrato. Se recomprime a JPEG
 * porque ImageResponse sólo emite PNG y una foto en PNG pesa de más.
 */

export const alt = "Chef en Come";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const runtime = "nodejs";

export default async function Imagen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chef = await getChefBySlug(decodeURIComponent(id));

  // Satori no decodifica AVIF, y varios retratos lo son.
  const foto = await fotoParaTarjeta(chef?.image, 504, 630);

  const verde = "#064d31";
  const crema = "#fffdf0";
  const nombre = chef?.name || "Chefs de México";

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
              {(chef?.role || "CONOCE A QUIENES COCINAN").toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: nombre.length > 22 ? 52 : 68,
                fontWeight: 800,
                color: crema,
                lineHeight: 1.05,
                marginTop: 12,
              }}
            >
              {nombre}
            </div>
            {chef?.restaurant ? (
              <div style={{ display: "flex", fontSize: 24, color: "#dff0e2", marginTop: 16 }}>{chef.restaurant}</div>
            ) : null}
            {chef && (chef.stars ?? 0) > 0 ? (
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
                  {chef.stars} {(chef.stars ?? 0) > 1 ? "ESTRELLAS MICHELIN" : "ESTRELLA MICHELIN"}
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
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
