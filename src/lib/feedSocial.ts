import { parseSocialUrl } from "./socialMedia";

export type RedSocial = "instagram" | "tiktok" | "facebook";

export type SocialVideoSource = string | {
  url: string;
  videoUrl?: string;
  embedUrl?: string;
  thumbnail?: string;
  title?: string;
  platform?: RedSocial;
};

export interface SocialFeedItem {
  id: string;
  red: RedSocial;
  titulo: string;
  autor: string;
  usuario: string;
  miniatura: string;
  videoUrl?: string;
  embedUrl?: string;
  url: string;
  vistas: string;
  likes?: string;
  comentarios?: string;
  duracion?: string;
  audioTitulo?: string;
}

type SocialAccounts = { instagram?: string; facebook?: string; twitter?: string; tiktok?: string };

const handleFrom = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  try {
    const pathname = new URL(value).pathname.split("/").filter(Boolean);
    return `@${(pathname[0] || fallback).replace(/^@/, "")}`;
  } catch {
    return `@${value.replace(/^@/, "")}`;
  }
};

const accountsFrom = (socials: SocialAccounts = {}) =>
  (["instagram", "tiktok", "facebook"] as RedSocial[])
    .map((red) => {
      const value = socials[red];
      if (!value) return null;
      const base = red === "tiktok" ? "https://tiktok.com/@" : `https://${red}.com/`;
      return {
        red,
        usuario: handleFrom(value, red),
        url: /^https?:\/\//i.test(value) ? value : `${base}${value.replace(/^@/, "")}`,
      };
    })
    .filter(Boolean) as { red: RedSocial; usuario: string; url: string }[];

export function mapSocialVideos({ sources, nombre, imagen, socials }: {
  sources?: SocialVideoSource[];
  nombre: string;
  imagen?: string;
  socials?: SocialAccounts;
}): SocialFeedItem[] {
  if (!Array.isArray(sources)) return [];

  return sources.flatMap((source, index) => {
    const data = typeof source === "string" ? { url: source } : source;
    if (!data?.url) return [];
    const parsed = parseSocialUrl(data.url);
    const directUrl = data.videoUrl || data.url;
    const isDirectVideo = /\.(mp4|m3u8|mov)(?:[?#].*)?$/i.test(directUrl);
    const red = data.platform || (parsed.platform === "unknown" ? (isDirectVideo ? "instagram" : undefined) : parsed.platform);
    const videoUrl = data.videoUrl || (isDirectVideo ? data.url : undefined);
    const embedUrl = videoUrl ? undefined : data.embedUrl || parsed.embedUrl;
    if (!red || (!videoUrl && !embedUrl)) return [];

    const account = accountsFrom(socials).find((item) => item.red === red);
    return [{
      id: `${red}-${index}-${encodeURIComponent(data.url).slice(-20)}`,
      red,
      titulo: data.title || `Video de ${nombre}`,
      autor: nombre,
      usuario: account?.usuario || `@${nombre.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      miniatura: data.thumbnail || imagen || "/og-come.jpg",
      videoUrl,
      embedUrl,
      url: data.url,
      vistas: "Ver video",
    }];
  });
}

export function obtenerFeedLugar(lugar: {
  nombre: string;
  imagen?: string;
  socials?: SocialAccounts;
  socialVideos?: SocialVideoSource[];
}) {
  return {
    items: mapSocialVideos({ sources: lugar.socialVideos, nombre: lugar.nombre, imagen: lugar.imagen, socials: lugar.socials }),
    cuentas: accountsFrom(lugar.socials),
  };
}

export function obtenerFeedChef(chef: {
  name: string;
  image?: string;
  socialVideos?: SocialVideoSource[];
  redes?: Array<{ red: string; usuario: string; url: string }>;
}) {
  const socials = Object.fromEntries((chef.redes || []).map((red) => [red.red, red.url])) as SocialAccounts;
  return {
    items: mapSocialVideos({ sources: chef.socialVideos, nombre: chef.name, imagen: chef.image, socials }),
    cuentas: accountsFrom(socials),
  };
}
