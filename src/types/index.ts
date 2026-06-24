export interface Restaurant {
    id: string;
    restaurantName: string;
    name?: string;
    category: string;
    rating: number;
    image: string;
    lat: number;
    lng: number;
    address: string;
    isMichelin?: boolean;
    michelinStars?: number;
    socials?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
    };
    website?: string;
    phone?: string;
    chef?: string;
    description?: string;
    signatureDishes?: string[];
    awards?: string;
}

export interface NewsArticle {
    id: string;
    title: string;
    date: string;
    excerpt: string;
    image: string;
    videoUrl?: string;
    relatedRestaurantIds?: string[];
}

export interface Chef {
    id: string;
    name: string;
    restaurant: string;
    bio: string;
    image: string;
    specialty: string;
    awards?: string[];
}
