import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isPublished, slugify } from "@/lib/utils";
import { TAMANO, tarjeta } from "@/lib/tarjetaOg";

/** Tarjeta para compartir un lugar. Ver src/lib/tarjetaOg.tsx. */
export const alt = "Restaurante en Come";
export const size = TAMANO;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clave = decodeURIComponent(slug);

  let nombre = "";
  let categoria = "";
  let estado = "";
  let estrellas = 0;

  try {
    if (db) {
      const snapshot = await getDocs(collection(db, "come"));
      for (const documento of snapshot.docs) {
        const d = documento.data();
        if (!isPublished(d)) continue;
        const suNombre = d.restaurantName || d.name || "";
        if (slugify(suNombre) !== clave && documento.id !== clave) continue;
        nombre = suNombre;
        categoria = d.category || "";
        estado = d.estado || "";
        estrellas = Number(d.michelinStars) || 0;
        break;
      }
    }
  } catch {
    /* Sin datos sale la tarjeta genérica de la marca, que es mejor que nada. */
  }

  return tarjeta({
    etiqueta: categoria || "Guía gastronómica",
    titulo: nombre || "La guía gastronómica de México",
    detalle: estado || undefined,
    distintivo: estrellas > 0
      ? `${estrellas} ${estrellas > 1 ? "ESTRELLAS MICHELIN" : "ESTRELLA MICHELIN"}`
      : undefined,
  });
}
