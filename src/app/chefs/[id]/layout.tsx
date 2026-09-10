import type { Metadata } from "next";
import { getChefBySlug } from "@/lib/chefs";

/**
 * El perfil del chef es un componente de cliente, así que no puede exportar
 * generateMetadata. Sin esta capa, los once perfiles heredaban el mismo título
 * del listado ("Chefs de México | Come"): títulos duplicados para los buscadores
 * y, al compartir el enlace de un chef, la ficha genérica del directorio.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const chef = await getChefBySlug(decodeURIComponent(id)).catch(() => undefined);

    // Si la consulta a Firestore falla o tarda, esta rama es la que se sirve al
    // rastreador. Sin imagen aquí, el enlace se comparte pelón; con la estática
    // de la marca al menos siempre hay algo.
  if (!chef) {
    return {
      title: "Chef no encontrado | Come",
      openGraph: {
        title: "Chefs de México | Come",
        siteName: "Come",
        locale: "es_MX",
        images: [{ url: "/og-come.jpg", width: 1200, height: 630, alt: "Come" }],
      },
      twitter: { card: "summary_large_image", images: ["/og-come.jpg"] },
    };
  }

  const title = `${chef.name} · ${chef.role} | Come`;
  const donde = [chef.restaurant, chef.ubicacion].filter(Boolean).join(", ");
  const description =
    chef.bio?.slice(0, 160) ||
    `${chef.name}, ${chef.role.toLowerCase()}${donde ? ` en ${donde}` : ""}. Trayectoria y reconocimientos, en Come.`;
  const canonica = `/chefs/${chef.slug}`;
  // Igual que en los lugares: el recorte del retrato, o la imagen fija.
  const imagenCompartir = chef.imagenTarjeta || "/og-come.jpg";

  return {
    title,
    description,
    alternates: { canonical: canonica },
    openGraph: {
      title,
      description,
      url: canonica,
      siteName: "Come",
      locale: "es_MX",
      type: "profile",
      images: [{ url: imagenCompartir, width: 1200, height: 630, alt: chef.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imagenCompartir],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
