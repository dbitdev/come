import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/utils";

export interface RedSocial {
  red: "instagram" | "facebook" | "twitter" | "tiktok";
  usuario: string;
  url: string;
}

export interface Chef {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  /** Vacío cuando el documento no trae un retrato utilizable. */
  image: string;
  stars?: number;
  ubicacion?: string;
  restaurant?: string;
  logroClave?: string;
  redes: RedSocial[];
}

/**
 * `redes` llega como cadena con un solo usuario ("@alguien") o como objeto con
 * una clave por red. Sin normalizarlo, recorrer la cadena produce un icono por
 * carácter.
 */
export function normalizarRedes(valor: unknown): RedSocial[] {
  const construirUrl = (red: RedSocial["red"], usuario: string) => {
    if (/^https?:\/\//i.test(usuario)) return usuario;
    const limpio = usuario.replace(/^@/, "").trim();
    const bases: Record<RedSocial["red"], string> = {
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
      twitter: "https://x.com/",
      tiktok: "https://tiktok.com/@",
    };
    return bases[red] + limpio;
  };

  if (typeof valor === "string" && valor.trim()) {
    // En estos documentos la cadena suelta siempre es la cuenta de Instagram.
    return [{ red: "instagram", usuario: valor.trim(), url: construirUrl("instagram", valor) }];
  }

  if (valor && typeof valor === "object") {
    const permitidas: RedSocial["red"][] = ["instagram", "facebook", "twitter", "tiktok"];
    return Object.entries(valor as Record<string, unknown>)
      .filter(([red, usuario]) => permitidas.includes(red as RedSocial["red"]) && typeof usuario === "string" && usuario.trim())
      .map(([red, usuario]) => ({
        red: red as RedSocial["red"],
        usuario: String(usuario).trim(),
        url: construirUrl(red as RedSocial["red"], String(usuario)),
      }));
  }

  return [];
}

function aChef(id: string, d: Record<string, any>): Chef {
  const nombre = d.name || d.nombre || "Chef";
  return {
    id,
    slug: slugify(nombre),
    name: nombre,
    role: d.specialty || d.especialidad || "Cocina mexicana",
    bio: d.bio || d.trajectory || "",
    image: d.image || d.photoUrl || "",
    stars: Number(d.estrellas ?? d.michelinStars) || 0,
    ubicacion: d.ubicacion || d.estado || undefined,
    restaurant: d.restaurant || d.restaurante || undefined,
    logroClave: d.logroClave || d.awards || undefined,
    redes: normalizarRedes(d.redes ?? d.socials),
  };
}

/**
 * Antes esto era una lista fija escrita a mano: nombres que no existen en la
 * base y fotos que devuelven 404. Ahora todo sale de Firestore.
 */
export async function traerChefs(): Promise<Chef[]> {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, "chefs"));
  return snapshot.docs.map((doc) => aChef(doc.id, doc.data()));
}

export async function getChefBySlug(slug: string): Promise<Chef | undefined> {
  const chefs = await traerChefs();
  return chefs.find((c) => c.slug === slug || c.id === slug);
}
