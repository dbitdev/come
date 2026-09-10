/**
 * Utilidades para las tarjetas de Open Graph.
 *
 * `sharp` es un módulo nativo: si el binario de la plataforma no está, lanza al
 * importarlo. Como Next carga este módulo al renderizar la página, un fallo de
 * carga tumbaba `/lugares/[slug]` y `/chefs/[id]` enteras con un 500 —pasó en
 * producción con el binario de macOS en un contenedor Linux—. Por eso se
 * importa de forma perezosa y todo lo que dependa de él degrada en vez de
 * romperse: sin sharp la tarjeta sale en PNG, más pesada pero servida.
 */

/** El constructor de sharp, que es lo único que se usa aquí. */
type Sharp = (typeof import("sharp"))["default"];

let cargando: Promise<Sharp | null> | null = null;

async function traerSharp(): Promise<Sharp | null> {
  if (!cargando) {
    cargando = import("sharp")
      .then((m) => m.default)
      .catch((error) => {
        console.error("sharp no está disponible; las tarjetas saldrán en PNG:", error);
        return null;
      });
  }
  return cargando;
}

/**
 * Prepara una foto para meterla en una tarjeta.
 *
 * Satori (el motor detrás de ImageResponse) descarga la URL por su cuenta, pero
 * no sabe decodificar AVIF, y varios retratos del directorio están en ese
 * formato: la tarjeta salía con el panel de la foto vacío. Aquí se baja el
 * archivo, se convierte con sharp —que sí lee AVIF, WebP y compañía— y se
 * entrega como data URI ya recortado al tamaño del panel, lo que de paso evita
 * meterle a Satori una imagen de varios MB.
 */
export async function fotoParaTarjeta(
  url: string | undefined | null,
  ancho: number,
  alto: number,
): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;

  const sharp = await traerSharp();
  if (!sharp) return null;

  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!respuesta.ok) return null;

    const original = Buffer.from(await respuesta.arrayBuffer());
    const jpeg = await sharp(original)
      .resize(ancho, alto, { fit: "cover", position: "attention" })
      .jpeg({ quality: 80 })
      .toBuffer();

    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    // Sin foto la tarjeta se pinta sólo con el color de la marca, que es un
    // resultado aceptable; fallar aquí dejaría el enlace sin previsualización.
    return null;
  }
}

/**
 * Devuelve la tarjeta como JPEG. ImageResponse sólo emite PNG y una foto en PNG
 * pesa cerca de 2 MB, que WhatsApp no descarga; si sharp no está, se sirve el
 * PNG tal cual antes que no servir nada.
 */
export async function comoJpeg(tarjeta: Response): Promise<Response> {
  const png = Buffer.from(await tarjeta.arrayBuffer());
  const cache = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

  const sharp = await traerSharp();
  if (!sharp) {
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": cache },
    });
  }

  try {
    const jpeg = await sharp(png).jpeg({ quality: 78, progressive: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": cache },
    });
  } catch {
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": cache },
    });
  }
}
