/**
 * Utilidades para parsear, embeber y compartir contenido de redes sociales
 * (TikTok, Instagram Reels, Facebook Video).
 */

export interface ParsedSocialMedia {
  platform: "instagram" | "tiktok" | "facebook" | "unknown";
  id?: string;
  embedUrl?: string;
  originalUrl: string;
}

export function parseSocialUrl(url: string): ParsedSocialMedia {
  if (!url) return { platform: "unknown", originalUrl: url };

  // Instagram: /reel/ID, /p/ID
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([^/?#&]+)/i);
  if (igMatch) {
    const id = igMatch[1];
    return {
      platform: "instagram",
      id,
      embedUrl: `https://www.instagram.com/p/${id}/embed`,
      originalUrl: url,
    };
  }

  // TikTok: /video/ID or @user/video/ID
  const ttMatch = url.match(/tiktok\.com\/(?:@[^/?#&]+\/video\/|v\/)?(\d+)/i);
  if (ttMatch) {
    const id = ttMatch[1];
    return {
      platform: "tiktok",
      id,
      embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
      originalUrl: url,
    };
  }

  // Facebook Video / Watch
  const fbMatch = url.match(/facebook\.com\/(?:[^/?#&]+\/videos\/|watch\/\?v=|reel\/)(\d+)/i);
  if (fbMatch) {
    const id = fbMatch[1];
    return {
      platform: "facebook",
      id,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`,
      originalUrl: url,
    };
  }

  if (/fb\.watch\//i.test(url)) {
    return {
      platform: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`,
      originalUrl: url,
    };
  }

  if (url.includes("instagram.com")) return { platform: "instagram", originalUrl: url };
  if (url.includes("tiktok.com")) return { platform: "tiktok", originalUrl: url };
  if (url.includes("facebook.com")) return { platform: "facebook", originalUrl: url };

  return { platform: "unknown", originalUrl: url };
}

/**
 * Genera enlaces de compartir directo en redes sociales
 */
export function generateShareLinks(titulo: string, url: string) {
  const encTitle = encodeURIComponent(titulo);
  const encUrl = encodeURIComponent(url);

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encTitle}%20${encUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    telegram: `https://t.me/share/url?url=${encUrl}&text=${encTitle}`,
  };
}

/**
 * Genera Schema.org VideoObject para optimización SEO y rastreo social
 */
export function generateVideoJsonLd(video: {
  id: string;
  titulo: string;
  miniatura: string;
  autor: string;
  videoUrl?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.titulo,
    description: `${video.titulo} - Presentado por ${video.autor} en Come.`,
    thumbnailUrl: [video.miniatura],
    uploadDate: new Date().toISOString(),
    contentUrl: video.videoUrl || video.url,
    embedUrl: video.url,
    publisher: {
      "@type": "Organization",
      name: "Come",
      logo: {
        "@type": "ImageObject",
        url: "https://comeapp.com.mx/og-come.jpg",
      },
    },
  };
}
