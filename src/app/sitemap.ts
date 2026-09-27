import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getLatestNews } from '@/lib/wordpress';
import { traerChefs } from '@/lib/chefs';
import { slugify, isCanonicalPublicPlace } from "@/lib/utils";
import { SEO_CIUDADES, SEO_COCINAS } from "@/lib/seoCatalog";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://comeapp.com.mx';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Routes
  // Sólo rutas que existen: /guias/con-estrellas y /guias/chefs caían en el
  // [slug] de guías y devolvían "Guía no encontrada" (soft 404 en el sitemap).
  const staticRoutes = [
    '',
    '/restaurantes',
    '/cocina-tradicional',
    '/lugares',
    '/mapa',
    '/chefs',
    '/guias',
    '/guias/recetas',
    '/noticias',
    '/ordenar',
    '/nosotros',
    '/nomina-lugar',
    '/nomina-chef',
    '/registra-negocio',
    '/empleos',
    '/mexica-gourmet',
    '/terminos',
    '/privacidad',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));
  const collectionRoutes: MetadataRoute.Sitemap = [
    ...SEO_CIUDADES.map(({ slug }) => `/restaurantes/ciudad/${slug}`),
    ...SEO_COCINAS.map(({ slug }) => `/restaurantes/cocina/${slug}`),
  ].map((route) => ({ url: `${BASE_URL}${route}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 }));

  // 2. Dynamic Restaurant Routes (from Firebase)
  let restaurantRoutes: MetadataRoute.Sitemap = [];
  try {
    if (db) {
      const querySnapshot = await getDocs(collection(db, "come"));
      restaurantRoutes = querySnapshot.docs.filter((doc) => isCanonicalPublicPlace(doc.id, doc.data())).map((doc) => {
        const data = doc.data();
        const name = data.restaurantName || data.name || 'sin-nombre';
        return {
          url: `${BASE_URL}/lugares/${slugify(name)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        };
      });
    }
  } catch (error) {
    console.error("Error generating sitemap for restaurants:", error);
  }

  // 2b. Perfiles de chef. Quedaban fuera del índice: once páginas con contenido
  // propio que ningún buscador estaba viendo.
  let chefRoutes: MetadataRoute.Sitemap = [];
  try {
    chefRoutes = (await traerChefs()).map((chef) => ({
      url: `${BASE_URL}/chefs/${chef.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error generating sitemap for chefs:", error);
  }

  // 3. Dynamic News Routes (from WordPress)
  let newsRoutes: MetadataRoute.Sitemap = [];
  try {
    const news = await getLatestNews(100); // Fetch up to 100 latest items
    newsRoutes = news.map((post: { slug: string; date: string }) => ({
      url: `${BASE_URL}/noticias/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.error("Error generating sitemap for news:", error);
  }

  return [...staticRoutes, ...collectionRoutes, ...restaurantRoutes, ...chefRoutes, ...newsRoutes];
}
