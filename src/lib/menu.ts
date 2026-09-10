/**
 * Lectura de una carta a partir del texto plano de un PDF o de una página.
 *
 * Es un parser de reglas, no un modelo: acierta en cartas ordenadas (un
 * platillo por renglón con su precio al final) y falla en las que están
 * maquetadas a varias columnas o son una imagen sin texto. Por eso lo que
 * devuelve son *candidatos*: nada se publica sin que alguien lo revise.
 */

export type PlatilloLeido = {
  name: string;
  description?: string;
  price: number;
  /** Sección de la carta ("Entradas", "Postres"…) cuando se pudo deducir. */
  section?: string;
};

export type LecturaDeCarta = {
  platillos: PlatilloLeido[];
  /** Renglones que parecían platillo pero no se pudieron leer, para revisarlos a mano. */
  descartados: string[];
  /** Cierto cuando el archivo no tenía texto: casi siempre un PDF que es una imagen. */
  sinTexto: boolean;
};

/**
 * Precio al final del renglón. Cubre "$120", "120.00", "$ 1,250" y "120 MXN",
 * con o sin puntos de relleno antes.
 */
const PRECIO_FINAL = /[.\s·…]*\$?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:mxn|pesos|mx)?\s*$/i;

/** Un encabezado de sección no trae precio y es corto. */
const MAX_LARGO_SECCION = 40;

function aNumero(bruto: string): number | null {
  const limpio = bruto.replace(/[,\s]/g, "");
  const valor = Number(limpio);
  if (!Number.isFinite(valor) || valor <= 0) return null;
  // Un platillo de cinco cifras casi siempre es un teléfono o un año colado.
  if (valor > 9999) return null;
  return valor;
}

function pareceSeccion(linea: string): boolean {
  if (linea.length > MAX_LARGO_SECCION) return false;
  const letras = linea.replace(/[^\p{L}]/gu, "");
  if (letras.length < 3) return false;
  // Mayúsculas completas, o pocas palabras sin signos de puntuación de frase.
  const enMayusculas = letras === letras.toUpperCase();
  const pocasPalabras = linea.split(/\s+/).length <= 4 && !/[.,;:]/.test(linea);
  return enMayusculas || pocasPalabras;
}

/** Ruido típico de cartas y de páginas web que no es parte de la comida. */
const RUIDO = /^(men[úu]|carta|men[úu] del d[íi]a|precios?|iva incluido|propina|tel[ée]fono|whatsapp|s[íi]guenos|men[úu] principal|inicio|contacto|reservaciones?|cookies?|newsletter|copyright|©.*)$/i;

export function leerCarta(textoBruto: string): LecturaDeCarta {
  const texto = (textoBruto || "").replace(/\r/g, "");
  if (!texto.trim()) return { platillos: [], descartados: [], sinTexto: true };

  const lineas = texto
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const platillos: PlatilloLeido[] = [];
  const descartados: string[] = [];
  let seccion: string | undefined;

  for (const linea of lineas) {
    if (RUIDO.test(linea)) continue;

    const conPrecio = linea.match(PRECIO_FINAL);
    const tienePrecio = Boolean(conPrecio) && /\d/.test(linea);

    if (!tienePrecio) {
      if (pareceSeccion(linea)) {
        seccion = linea.replace(/[:：]\s*$/, "");
      } else if (platillos.length > 0 && !platillos[platillos.length - 1].description) {
        // Renglón suelto justo después de un platillo: es su descripción.
        const ultimo = platillos[platillos.length - 1];
        if (linea.length <= 200) ultimo.description = linea;
        else descartados.push(linea);
      } else if (linea.length > 3) {
        descartados.push(linea);
      }
      continue;
    }

    const precio = aNumero(conPrecio![1]);
    const nombre = linea.slice(0, conPrecio!.index).replace(/[.\s·…]+$/, "").trim();

    // Un nombre sin letras no es comida: así se cuelan los teléfonos
    // ("55 1234 5678" se leía como el platillo "55 1234" a $5678).
    const tieneLetras = /\p{L}{2,}/u.test(nombre);
    if (!precio || nombre.length < 2 || !tieneLetras) {
      descartados.push(linea);
      continue;
    }

    platillos.push({ name: nombre, price: precio, ...(seccion ? { section: seccion } : {}) });
  }

  return { platillos, descartados, sinTexto: false };
}

/**
 * Texto legible de una página web. No es un navegador: quita guiones, estilos y
 * etiquetas, que es suficiente para cartas publicadas como HTML. Una carta que
 * se dibuja con JavaScript no va a dar nada, igual que un PDF escaneado.
 */
export function textoDeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|br|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, " ")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
