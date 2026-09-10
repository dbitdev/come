import { getChefBySlug } from "@/lib/chefs";
import { TAMANO, tarjeta } from "@/lib/tarjetaOg";

/** Tarjeta para compartir el perfil de un chef. Ver src/lib/tarjetaOg.tsx. */
export const alt = "Chef en Come";
export const size = TAMANO;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chef = await getChefBySlug(decodeURIComponent(id)).catch(() => undefined);
  const estrellas = chef?.stars ?? 0;

  return tarjeta({
    etiqueta: chef?.role || "Conoce a quienes cocinan",
    titulo: chef?.name || "Chefs de México",
    detalle: chef?.restaurant || undefined,
    distintivo: estrellas > 0
      ? `${estrellas} ${estrellas > 1 ? "ESTRELLAS MICHELIN" : "ESTRELLA MICHELIN"}`
      : undefined,
  });
}
