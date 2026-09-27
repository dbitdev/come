export type CatalogMenuItem = {
  name?: string;
  description?: string;
  image?: string;
};

export type CatalogRestaurant = {
  id: string;
  restaurantName?: string;
  name?: string;
  category?: string;
  description?: string;
  address?: string;
  image?: string;
  rating?: number | string;
  isMichelin?: boolean;
  awards?: unknown;
  michelinStars?: number;
  menu?: CatalogMenuItem[];
  tags?: string[];
  chef?: string;
  city?: string;
  ciudad?: string;
  state?: string;
  estado?: string;
  lat?: number;
  lng?: number;
  subdomain?: string;
  signatureDishes?: unknown;
  published?: boolean;
  status?: string;
  [key: string]: unknown;
};

export type CatalogResponse = {
  restaurants: CatalogRestaurant[];
  error?: string;
};
