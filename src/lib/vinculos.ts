/**
 * Vínculo entre lugares y chefs.
 *
 * Antes vivía en dos campos de texto libre (`come.chef` y `chefs.restaurant`),
 * y eso no soporta lo más normal del mundo: un restaurante con dos chefs.
 * Con "Julio Castillo, Hugo Jimenez" metido en un solo campo, la consulta del
 * perfil (`where('chef','==',nombre)`) no encontraba a ninguno de los dos, y el
 * enlace del lugar apuntaba a `/chefs/julio-castillo-hugo-jimenez`, que no
 * existe.
 *
 * Ahora la relación vive en el lugar, en arreglos de ids:
 *
 *   come/{id}.chefIds         chefs que están hoy
 *   come/{id}.chefIdsPrevios  chefs que estuvieron
 *   come/{id}.chefsNombres    nombres tal cual, incluidos los que no tienen ficha
 *   come/{id}.chef            se conserva: texto derivado, para el código viejo
 *
 * El sentido inverso (chef → sus lugares) se resuelve con `array-contains`, así
 * que no hay dos copias de la misma verdad que se puedan desincronizar.
 */

/**
 * Separadores que la redacción ha usado de facto en el campo libre: coma,
 * diagonal, ampersand y la "y" suelta. La "y" sólo cuenta rodeada de espacios,
 * para no partir nombres que la llevan dentro.
 */
const SEPARADORES = /\s*(?:,|\/|&|\sy\s|\se\s)\s*/gi;

export function separarNombres(texto?: string | null): string[] {
  if (!texto) return [];
  return texto
    .split(SEPARADORES)
    .map((parte) => parte.trim())
    .filter(Boolean);
}

/** Sin acentos, sin mayúsculas y sin espacios de más: para comparar, no para mostrar. */
export function normalizar(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type ChefConocido = { id: string; name: string };
export type LugarConocido = { id: string; nombre: string; chef?: string | null };

export type Emparejamiento = {
  /** Chefs con ficha propia, en el orden en que venían escritos. */
  vinculados: { id: string; nombre: string }[];
  /** Nombres mencionados que todavía no tienen ficha de chef. */
  sinFicha: string[];
};

/**
 * Empareja los nombres escritos en un lugar con las fichas de chef existentes.
 *
 * El emparejamiento es por nombre completo normalizado, nunca aproximado: un
 * enlace equivocado entre un chef y un restaurante es peor que no tener enlace,
 * porque queda publicado como un hecho.
 */
export function emparejarChefs(nombres: string[], chefs: ChefConocido[]): Emparejamiento {
  const porNombre = new Map<string, ChefConocido>();
  for (const chef of chefs) {
    const clave = normalizar(chef.name);
    // Si dos fichas comparten nombre no adivinamos: se descarta el emparejamiento
    // automático y el nombre queda como texto.
    if (porNombre.has(clave)) porNombre.set(clave, { id: "", name: chef.name });
    else porNombre.set(clave, chef);
  }

  const vinculados: { id: string; nombre: string }[] = [];
  const sinFicha: string[] = [];

  for (const nombre of nombres) {
    const coincidencia = porNombre.get(normalizar(nombre));
    if (coincidencia && coincidencia.id) vinculados.push({ id: coincidencia.id, nombre: coincidencia.name });
    else sinFicha.push(nombre);
  }

  return { vinculados, sinFicha };
}

/**
 * Lugares cuyo campo de chefs menciona a esta persona. Es lo que permite que al
 * dar de alta un chef se enganche solo con los restaurantes que ya existían.
 */
export function lugaresQueMencionan(nombreChef: string, lugares: LugarConocido[]): LugarConocido[] {
  const objetivo = normalizar(nombreChef);
  if (!objetivo) return [];
  return lugares.filter((lugar) =>
    separarNombres(lugar.chef).some((nombre) => normalizar(nombre) === objetivo),
  );
}

/** Texto que se guarda en `chef` para que el código que aún lo lee siga funcionando. */
export function textoDeChefs(nombres: string[]): string {
  return nombres.join(", ");
}
