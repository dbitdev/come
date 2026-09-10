import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { leerCarta, textoDeHtml } from "@/lib/menu";

/**
 * Lee la carta de un PDF o de una página y devuelve *candidatos*. No guarda
 * nada: la escritura la hace el cliente contra Firestore, donde las reglas ya
 * deciden quién puede tocar cada lugar (la redacción o el dueño del negocio).
 *
 * Este endpoint descarga una dirección que manda el cliente, así que es un
 * cañón apuntando a la red interna si no se acota: abajo se bloquean los
 * destinos privados, se limita el tamaño y se pone un plazo.
 */

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;
const PLAZO_MS = 15000;

/** Rangos que nunca deben alcanzarse desde aquí: la red de la propia máquina. */
function esDireccionInterna(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fe80") || v6.startsWith("fc") || v6.startsWith("fd")) return true;
    // IPv4 embebida en IPv6 (::ffff:169.254.169.254).
    const embebida = v6.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (embebida) return esDireccionInterna(embebida[1]);
    return false;
  }
  const [a, b] = ip.split(".").map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  // 169.254.x.x incluye el servidor de metadatos de la nube.
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

async function validarDestino(bruto: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    throw new Error("La dirección no es válida.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Sólo se aceptan direcciones http o https.");
  }
  const anfitrion = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(anfitrion)) {
    if (esDireccionInterna(anfitrion)) throw new Error("Esa dirección no es pública.");
    return url;
  }
  const resueltas = await lookup(anfitrion, { all: true }).catch(() => []);
  if (resueltas.length === 0) throw new Error("No se pudo resolver el dominio.");
  if (resueltas.some((r) => esDireccionInterna(r.address))) {
    throw new Error("Esa dirección no es pública.");
  }
  return url;
}

/** Descarga con plazo y tope de tamaño, para que un archivo enorme no tumbe el servidor. */
async function descargar(url: URL) {
  const corte = AbortSignal.timeout(PLAZO_MS);
  const respuesta = await fetch(url, {
    signal: corte,
    redirect: "error", // Un redirect podría llevar a una dirección interna ya validada la primera.
    headers: { "User-Agent": "ComeBot/1.0 (+https://comeapp.com.mx)" },
  });
  if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}.`);

  const declarado = Number(respuesta.headers.get("content-length") || 0);
  if (declarado > MAX_BYTES) throw new Error("El archivo pesa más de 12 MB.");

  const datos = new Uint8Array(await respuesta.arrayBuffer());
  if (datos.byteLength > MAX_BYTES) throw new Error("El archivo pesa más de 12 MB.");

  return { datos, tipo: respuesta.headers.get("content-type") || "" };
}

export async function POST(peticion: Request) {
  try {
    const cuerpo = await peticion.json().catch(() => ({}));
    const url = await validarDestino(String(cuerpo?.url || ""));
    const { datos, tipo } = await descargar(url);

    const esPdf = tipo.includes("pdf") || url.pathname.toLowerCase().endsWith(".pdf");

    let texto: string;
    if (esPdf) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const documento = await getDocumentProxy(datos);
      const { text } = await extractText(documento, { mergePages: true });
      texto = Array.isArray(text) ? text.join("\n") : text;
    } else {
      texto = textoDeHtml(new TextDecoder().decode(datos));
    }

    const lectura = leerCarta(texto);

    return NextResponse.json({
      ...lectura,
      // Un PDF hecho de imágenes no da texto; conviene decirlo con todas sus letras.
      aviso: lectura.sinTexto
        ? "El archivo no tiene texto que leer. Suele pasar con cartas escaneadas o diseñadas como imagen: habrá que capturarla a mano."
        : lectura.platillos.length === 0
          ? "Se leyó el archivo pero no se reconoció ningún platillo con precio. Revisa que la carta tenga un platillo por renglón."
          : null,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo leer la carta.";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
