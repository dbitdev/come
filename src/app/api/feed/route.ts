import { NextResponse } from "next/server";
import { obtenerFeedLugar, obtenerFeedChef, SocialFeedItem } from "@/lib/feedSocial";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get("nombre") || searchParams.get("name") || "";
  const tipo = searchParams.get("tipo") || "lugar"; // 'lugar' | 'chef'
  const plataforma = searchParams.get("plataforma") || "todos"; // 'instagram' | 'tiktok' | 'facebook' | 'todos'

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  // Si existe un token de Meta Graph API y se pide feed general de Instagram
  if (accessToken && (plataforma === "instagram" || plataforma === "todos") && !nombre) {
    try {
      const url = businessAccountId
        ? `https://graph.facebook.com/v20.0/${businessAccountId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${accessToken}`
        : `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${accessToken}`;

      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache 1 hora
      });

      if (response.ok) {
        const data = await response.json();
        const rawPosts = data.data || [];
        
        // Mapear al formato unificado de Come para reproducción interna
        const formattedItems: SocialFeedItem[] = rawPosts.map((p: any) => ({
          id: p.id,
          red: "instagram",
          titulo: p.caption ? (p.caption.length > 90 ? p.caption.slice(0, 90) + "..." : p.caption) : "Publicación de Instagram",
          autor: "Come",
          usuario: "@comeapp.mx",
          miniatura: p.thumbnail_url || p.media_url,
          videoUrl: p.media_type === "VIDEO" ? p.media_url : undefined,
          url: p.permalink,
          vistas: "Instagram",
        }));

        return NextResponse.json({
          items: formattedItems,
          source: "meta_graph_api",
        });
      }
    } catch (err: any) {
      console.warn("Meta Graph API fetch error, falling back to local catalog:", err?.message);
    }
  }

  // Si se solicita por lugar o chef (o fallback si no hay token de Meta)
  if (tipo === "chef") {
    const feed = obtenerFeedChef({
      name: nombre || "Chef Come",
    });
    return NextResponse.json({
      items: feed.items,
      cuentas: feed.cuentas,
      source: "catalog",
    });
  }

  const feed = obtenerFeedLugar({
    nombre: nombre || "Restaurante",
  });

  return NextResponse.json({
    items: feed.items,
    cuentas: feed.cuentas,
    source: "catalog",
  });
}
