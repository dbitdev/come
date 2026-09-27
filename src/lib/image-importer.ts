import "server-only";

import { lookup } from "node:dns/promises";
import { createHash, randomUUID } from "node:crypto";

const MAX_HTML_BYTES = 2_000_000;
const MAX_IMAGE_BYTES = 12_000_000;
const USER_AGENT = "ComeImageImporter/1.0 (+https://comeapp.com.mx)";

export type ImageCandidate = {
  url: string;
  source: "og:image" | "twitter:image" | "json-ld" | "link:image_src";
  alt?: string;
};

function privateIp(address: string) {
  if (address === "::1" || address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true;
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168);
}

async function assertPublicUrl(raw: string) {
  const url = new URL(raw);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error("La URL no es pública o válida.");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => privateIp(address))) throw new Error("La URL apunta a una red privada.");
  return url;
}

async function safeFetch(raw: string, init: RequestInit = {}, redirects = 0): Promise<Response> {
  const url = await assertPublicUrl(raw);
  const response = await fetch(url, {
    ...init,
    redirect: "manual",
    headers: { "user-agent": USER_AGENT, accept: "text/html,image/*;q=.9,*/*;q=.1", ...init.headers },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirects >= 4) throw new Error("Demasiadas redirecciones.");
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirección inválida.");
    return safeFetch(new URL(location, url).toString(), init, redirects + 1);
  }
  return response;
}

function decodeHtml(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function attr(tag: string, name: string) {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
}

async function robotsAllows(page: URL) {
  try {
    const response = await safeFetch(new URL("/robots.txt", page.origin).toString(), { headers: { accept: "text/plain" } });
    if (!response.ok) return true;
    const text = (await response.text()).slice(0, 500_000);
    let relevant = false;
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.replace(/#.*/, "").trim();
      const [key, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      if (key?.trim().toLowerCase() === "user-agent") relevant = value === "*" || value.toLowerCase().includes("comeimageimporter");
      if (relevant && key?.trim().toLowerCase() === "disallow" && value && page.pathname.startsWith(value)) return false;
    }
    return true;
  } catch {
    return true;
  }
}

function extractJsonLdImages(html: string): string[] {
  const urls: string[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const visit = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) return value.forEach(visit);
        const record = value as Record<string, unknown>;
        const image = record.image;
        if (typeof image === "string") urls.push(image);
        else if (Array.isArray(image)) image.filter((item): item is string => typeof item === "string").forEach(item => urls.push(item));
        else if (image && typeof image === "object" && typeof (image as Record<string, unknown>).url === "string") urls.push((image as { url: string }).url);
        Object.values(record).forEach(visit);
      };
      visit(JSON.parse(match[1]));
    } catch { /* JSON-LD ajeno mal formado: se ignora. */ }
  }
  return urls;
}

export async function discoverOfficialImages(website: string): Promise<ImageCandidate[]> {
  const page = await assertPublicUrl(website);
  if (!(await robotsAllows(page))) throw new Error("El sitio no permite explorar esta página según robots.txt.");
  const response = await safeFetch(page.toString());
  if (!response.ok) throw new Error(`El sitio oficial respondió ${response.status}.`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) throw new Error("La dirección no contiene una página HTML.");
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > MAX_HTML_BYTES) throw new Error("La página es demasiado grande para analizarla.");
  const html = (await response.text()).slice(0, MAX_HTML_BYTES);
  const candidates: ImageCandidate[] = [];
  const add = (raw: string | undefined, source: ImageCandidate["source"], alt?: string) => {
    if (!raw) return;
    try {
      const url = new URL(decodeHtml(raw.trim()), page).toString();
      if (!candidates.some(item => item.url === url)) candidates.push({ url, source, alt });
    } catch { /* URL relativa o corrupta no publicable. */ }
  };
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const property = (attr(tag, "property") || attr(tag, "name") || "").toLowerCase();
    const content = attr(tag, "content");
    if (["og:image", "og:image:url", "og:image:secure_url"].includes(property)) add(content, "og:image");
    if (["twitter:image", "twitter:image:src"].includes(property)) add(content, "twitter:image");
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if ((attr(tag, "rel") || "").toLowerCase().split(/\s+/).includes("image_src")) add(attr(tag, "href"), "link:image_src");
  }
  extractJsonLdImages(html).forEach(url => add(url, "json-ld"));

  const checked: ImageCandidate[] = [];
  for (const candidate of candidates.slice(0, 12)) {
    try {
      const image = await safeFetch(candidate.url, { method: "HEAD", headers: { accept: "image/*" } });
      const type = image.headers.get("content-type") || "";
      const size = Number(image.headers.get("content-length") || 0);
      if (image.ok && type.startsWith("image/") && (!size || size <= MAX_IMAGE_BYTES)) checked.push(candidate);
    } catch { /* Un candidato roto no invalida los demás. */ }
  }
  return checked;
}

export async function downloadImage(raw: string) {
  const response = await safeFetch(raw, { headers: { accept: "image/*" } });
  if (!response.ok) throw new Error(`La imagen respondió ${response.status}.`);
  const contentType = (response.headers.get("content-type") || "").split(";")[0];
  if (!contentType.startsWith("image/") || contentType === "image/svg+xml") throw new Error("El recurso no es una imagen raster válida.");
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > MAX_IMAGE_BYTES) throw new Error("La imagen supera 12 MB.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("La imagen supera 12 MB.");
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as Record<string, string>)[contentType];
  if (!extension) throw new Error("Formato de imagen no compatible.");
  return { bytes, contentType, extension, hash: createHash("sha256").update(bytes).digest("hex"), token: randomUUID() };
}
