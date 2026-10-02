import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/perfil/', '/login/', '/register/', '/api/', '/negocio/', '/gestiona-negocio/', '/reclamar/', '/guias/crear/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comeapp.com.mx'}/sitemap.xml`,
  };
}
