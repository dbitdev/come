/**
 * Genera, en el navegador, la versión de 1200x630 de una foto para compartir.
 *
 * Se hace aquí y no en el servidor a propósito. El intento de recortar al vuelo
 * con sharp tumbó producción: es un módulo nativo, el lockfile sólo llevaba el
 * binario de macOS y en el contenedor Linux fallaba al importarse, llevándose la
 * página entera. El navegador ya tiene el archivo en la mano y sabe redimensionar
 * sin ayuda de nadie, así que la foto pequeña queda lista antes de subirse y el
 * servidor no tiene que procesar nada al compartir un enlace.
 */

const ANCHO = 1200;
const ALTO = 630;

export async function generarImagenDeTarjeta(archivo: File): Promise<Blob | null> {
  if (!archivo.type.startsWith("image/")) return null;

  try {
    const mapa = await crearMapaDeBits(archivo);
    if (!mapa) return null;

    const lienzo = document.createElement("canvas");
    lienzo.width = ANCHO;
    lienzo.height = ALTO;
    const pincel = lienzo.getContext("2d");
    if (!pincel) return null;

    // Recorte tipo "cover": llena el marco sin deformar, centrado.
    const escala = Math.max(ANCHO / mapa.width, ALTO / mapa.height);
    const ancho = mapa.width * escala;
    const alto = mapa.height * escala;
    pincel.drawImage(mapa, (ANCHO - ancho) / 2, (ALTO - alto) / 2, ancho, alto);

    return await new Promise((resolver) =>
      lienzo.toBlob((blob) => resolver(blob), "image/jpeg", 0.82),
    );
  } catch {
    // Sin la versión pequeña, la ficha se comparte con la tarjeta de marca.
    return null;
  }
}

/**
 * createImageBitmap decodifica AVIF y WebP además de los formatos de siempre;
 * varias fotos del directorio son AVIF. El <img> queda de reserva por si el
 * navegador no lo trae.
 */
async function crearMapaDeBits(archivo: File): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(archivo);
    } catch {
      /* sigue con el <img> */
    }
  }
  return await new Promise((resolver) => {
    const imagen = new Image();
    const url = URL.createObjectURL(archivo);
    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolver(imagen);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      resolver(null);
    };
    imagen.src = url;
  });
}
