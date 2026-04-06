import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/perfil/', '/login/', '/register/'],
    },
    sitemap: 'https://comeweb.mx/sitemap.xml',
  };
}
