/**
 * Converts a string into a URL-friendly slug.
 * Example: "Taquería El Califa de León" -> "taqueria-el-califa-de-leon"
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD') // Separate accents from letters
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
}

/**
 * Un negocio registrado o nominado queda en `status: 'pending'` hasta que la
 * redacción lo publica desde el panel. Los listados públicos lo filtran con
 * esto; los documentos antiguos sin campo `status` se consideran publicados.
 */
export function isPublished(data: { status?: string } | undefined | null): boolean {
  return (data?.status ?? "published") !== "pending";
}

/**
 * URL pública de un lugar. Preferimos el nombre convertido en slug
 * ("levadura-de-olla") porque el id de Firestore no le dice nada a nadie ni
 * ayuda en buscadores. La ruta /lugares/[slug] resuelve por slug o por id, así
 * que los enlaces viejos siguen funcionando.
 */
export function rutaLugar(nombre?: string | null, id?: string | null): string {
    const slug = nombre ? slugify(nombre) : "";
    const destino = slug || id || "";
    return destino ? `/lugares/${destino}` : "/lugares";
}

/** Igual que rutaLugar, para el menú digital del lugar. */
export function rutaMenu(nombre?: string | null, id?: string | null): string {
    const slug = nombre ? slugify(nombre) : "";
    const destino = slug || id || "";
    return destino ? `/lugares/menu/${destino}` : "/lugares";
}
