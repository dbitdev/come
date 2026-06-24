export interface Chef {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  stars?: number;
  socials?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  accolades?: string[];
  // Manual interconnection for key chefs
  featuredRestaurantSlugs?: string[];
}

export const CHEFS: Chef[] = [
  {
    id: 'alfonso-cadena',
    slug: 'alfonso-cadena',
    name: 'Alfonso Cadena',
    role: 'Chef Propietario',
    bio: 'Visionario y audaz, Alfonso Cadena es conocido por su enfoque crudo y directo a la gastronomía. Fundador de Hueso en Guadalajara y Carbón en la Ciudad de México, su estilo se caracteriza por la simplicidad técnica y la intensidad del sabor.',
    image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80',
    stars: 1,
    accolades: ['Mejor Chef Revelación 2018', 'Premios Gourmet'],
    socials: { instagram: 'ponchocadena' },
    featuredRestaurantSlugs: ['hueso-roma', 'carbon-mexico']
  },
  {
    id: 'elena-reygadas',
    slug: 'elena-reygadas',
    name: 'Elena Reygadas',
    role: 'Chef Ejecutiva',
    bio: 'Elena Reygadas es una de las chefs más influyentes del mundo. Su restaurante Rosetta en la CDMX es un templo del ingrediente mexicano con influencias italianas. Su enfoque en la panadería artesanal ha revolucionado la escena local.',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977730f8a?auto=format&fit=crop&w=800&q=80',
    stars: 1,
    accolades: ['The World\'s Best Female Chef 2023', 'Top 50 Restaurants'],
    socials: { instagram: 'elena_reygadas' },
    featuredRestaurantSlugs: ['rosetta-roma']
  },
  {
    id: 'enrique-olvera',
    slug: 'enrique-olvera',
    name: 'Enrique Olvera',
    role: 'Chef Fundador',
    bio: 'Enrique Olvera es el máximo exponente de la alta cocina mexicana contemporánea. A través de Pujol, ha elevado los ingredientes humildes a la categoría de arte. Su influencia se extiende globalmente con proyectos en NY y LA.',
    image: 'https://images.unsplash.com/photo-1595273670150-db0a3d39074f?auto=format&fit=crop&w=800&q=80',
    stars: 2,
    accolades: ['Estrella Michelin', 'Top 10 World\'s 50 Best'],
    socials: { instagram: 'enriqueolvera' },
    featuredRestaurantSlugs: ['pujol-polanco']
  },
  {
    id: 'jonatan-gomez-luna',
    slug: 'jonatan-gomez-luna',
    name: 'Jonatán Gómez Luna',
    role: 'Chef Ejecutivo',
    bio: 'Jonatán Gómez Luna es el líder creativo detrás de Le Chique, donde la vanguardia y el producto local se fusionan en una experiencia sensorial sin igual. Su cocina es técnica, lúdica y profundamente mexicana.',
    image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80',
    stars: 1,
    accolades: ['Estrella Michelin', 'Mejor Menú Degustación'],
    socials: { instagram: 'jonatan_gomezluna' },
    featuredRestaurantSlugs: ['le-chique']
  }
];

export function getChefBySlug(slug: string): Chef | undefined {
  return CHEFS.find(c => c.slug === slug || c.id === slug);
}
