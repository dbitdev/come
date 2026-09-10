import sharp from "sharp";

/**
 * Prepara una foto para meterla en una tarjeta de Open Graph.
 *
 * Satori (el motor detrás de ImageResponse) descarga la URL por su cuenta, pero
 * no sabe decodificar AVIF, y varios retratos del directorio están en ese
 * formato: la tarjeta salía con el panel de la foto vacío. Aquí se baja el
 * archivo, se convierte con sharp —que sí lee AVIF, WebP y compañía— y se
 * entrega como data URI ya recortado al tamaño del panel, que de paso evita
 * meterle a Satori una imagen de varios MB.
 */
export async function fotoParaTarjeta(
  url: string | undefined | null,
  ancho: number,
  alto: number,
): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
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
