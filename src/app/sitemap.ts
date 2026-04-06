import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getLatestNews } from '@/lib/wordpress';
import { slugify } from '@/lib/utils';

const BASE_URL = 'https://comeweb.mx';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Routes
  const staticRoutes = [
    '',
    '/lugares',
    '/mapa',
    '/guias/con-estrellas',
    '/guias/chefs',
    '/nosotros',
    '/nomina-lugar',
    '/mexica-gourmet',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Dynamic Restaurant Routes (from Firebase)
  let restaurantRoutes: any[] = [];
  try {
    if (db) {
      const querySnapshot = await getDocs(collection(db, "business_leads"));
      restaurantRoutes = querySnapshot.docs.map((doc) => {
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

  // 3. Dynamic News Routes (from WordPress)
  let newsRoutes: any[] = [];
  try {
    const news = await getLatestNews(100); // Fetch up to 100 latest items
    newsRoutes = news.map((post: any) => ({
      url: `${BASE_URL}/noticias/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.error("Error generating sitemap for news:", error);
  }

  return [...staticRoutes, ...restaurantRoutes, ...newsRoutes];
}
