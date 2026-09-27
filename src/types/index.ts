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
        tiktok?: string;
    };
    socialVideos?: Array<string | {
        url: string;
        videoUrl?: string;
        thumbnail?: string;
        title?: string;
        platform?: "instagram" | "tiktok" | "facebook";
    }>;
    website?: string;
    phone?: string;
    chef?: string;
    description?: string;
    signatureDishes?: string[];
    awards?: string;
    city?: 'CDMX' | 'Puebla' | 'Oaxaca';
    zone?: string;
    cuisine_type?: string[];
    tier?: 'Casual' | 'Street/Fonda' | 'High-Casual' | 'Fine Dining';
    status?: 'active' | 'inactive' | 'pending_review' | 'pending';
    is_active?: boolean;
    is_verified?: boolean;
    is_claimed?: boolean;
    managed_by?: 'admin';
    social_links?: { instagram?: string | null; website?: string | null };
    media?: { cover_image_url?: string | null; highlights?: string[] };
    curator_notes?: string;
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
    display_name?: string;
    full_name?: string;
    role_title?: string;
    region?: 'CDMX' | 'Puebla' | 'Oaxaca';
    base_city?: string;
    specialty_tags?: string[];
    affiliated_restaurants?: string[];
    status?: 'active' | 'inactive' | 'pending_review';
    is_active?: boolean;
    is_verified?: boolean;
    is_claimed?: boolean;
    managed_by?: 'admin';
}
