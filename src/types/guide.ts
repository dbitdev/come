export interface GuideLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  restaurantId?: string;
}

export interface GuideStop {
  id: string;
  title: string;
  content: string;
  image?: string;
  location: GuideLocation;
  order: number;
  linkedContent?: {
    type: 'chef' | 'recipe';
    id: string;
    name: string;
    slug?: string;
  };
}

export interface Guide {
  id?: string;
  slug: string;
  title: string;
  description: string;
  heroImage: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  authorName: string;
  stops: GuideStop[];
  restaurantIds: string[];
  status: 'draft' | 'published';
}
