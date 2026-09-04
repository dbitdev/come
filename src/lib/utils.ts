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
