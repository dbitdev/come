export interface Restaurant {
    id: string;
    name: string;
    category: string;
    rating: number;
    image: string;
    lat: number;
    lng: number;
    address: string;
    isMichelin?: boolean;
    michelinStars?: number; // New: specific star count
    socials?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
    };
    website?: string;
    phone?: string;
    chef?: string; // New: chef name
    description?: string; // New: longer description
    signatureDishes?: string[]; // New: list of top dishes
}

export interface NewsArticle {
    id: string;
    title: string;
    date: string;
    excerpt: string;
    image: string;
    videoUrl?: string; // New: Support for video content
    relatedRestaurantIds?: string[]; // To link a restaurant directly in the article
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

export const chefsData: Chef[] = [
    {
        id: "c1",
        name: "Enrique Olvera",
        restaurant: "Pujol",
        specialty: "Alta Cocina Mexicana",
        bio: "Considerado el embajador global de la cocina mexicana moderna, Olvera ha redefinido los ingredientes locales a través de técnicas contemporáneas.",
        image: "https://images.unsplash.com/photo-1583394293214-28dea15ee54d?auto=format&fit=crop&w=800&q=80",
        awards: ["The World's 50 Best", "2 Estrellas Michelin"]
    },
    {
        id: "c2",
        name: "Elena Reygadas",
        restaurant: "Rosetta",
        specialty: "Italiano-Mexicano & Panadería",
        bio: "Elegida como la mejor chef del mundo en 2023, Elena destaca por su enfoque en la temporalidad de los ingredientes y la elegancia de lo simple.",
        image: "https://images.unsplash.com/photo-1577219491135-ce39a73e498e?auto=format&fit=crop&w=800&q=80",
        awards: ["World's Best Female Chef 2023", "Estrella Michelin"]
    },
    {
        id: "c3",
        name: "Jorge Vallejo",
        restaurant: "Quintonil",
        specialty: "Gastronomía Sustentable",
        bio: "Su cocina en Quintonil es una oda a los vegetales y a la biodiversidad mexicana, logrando un equilibrio perfecto entre sabor y conciencia ambiental.",
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
        awards: ["The World's 50 Best", "2 Estrellas Michelin"]
    },
    {
        id: "c4",
        name: "Gabriela Cámara",
        restaurant: "Contramar",
        specialty: "Pescados y Mariscos",
        bio: "Reconocida por su compromiso social y por crear el lugar de pescados más icónico de la CDMX, Gabriela es figura clave de la gastronomía nacional.",
        image: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=800&q=80",
        awards: ["Time 100", "James Beard Nominee"]
    }
];

// Helper to generate 100 restaurants
const generateRestaurants = (): Restaurant[] => {
    const categories = ["Contemporánea", "Tradicional", "Mariscos", "Alta Cocina", "Autor", "Antojitos", "Fusión"];
    const michelinIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"]; // 15 Michelin stars for realism

    // Base coordinates around CDMX (19.4326, -99.1332)
    const baseLat = 19.4326;
    const baseLng = -99.1332;

    const michelinBaseNames = ["Pujol", "Quintonil", "Rosetta", "Sud 777", "Maximo Bistrot", "Emergente", "Loretta", "Biko", "Dulce Patria", "Nicos", "Lorea", "Carmela y Sal", "Merotoro", "Huset", "Lardo"];

    return Array.from({ length: 100 }).map((_, i) => {
        const id = (i + 1).toString();
        const isMichelin = michelinIds.includes(id);
        const category = isMichelin ? "Alta Cocina Michelin" : categories[i % categories.length];
        const rating = isMichelin ? (4.8 + (i % 2) * 0.1) : (4.0 + (i % 10) * 0.1);

        // Slight random offset for map spreading (roughly 10-15 km radius)
        const lat = baseLat + ((i % 20) - 10) * 0.005;
        const lng = baseLng + ((i % 20) - 10) * 0.005;

        let name = `Restaurante ${id}`;
        if (isMichelin) {
            name = michelinBaseNames[i % michelinBaseNames.length] || name;
        } else {
            const prefixes = ["La Casa de", "El Rincón del", "Fonda", "Cantina", "Bistrot", "Taller", "Cocina de"];
            const suffixes = ["Abuela", "Sabor", "Fuego", "Mar", "Tierra", "Sol", "Maíz", "Agave"];
            name = `${prefixes[i % prefixes.length]} ${suffixes[i % suffixes.length]} ${id}`;
        }

        const restaurant: Restaurant = {
            id,
            name,
            category,
            rating: Number(rating.toFixed(1)),
            image: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?auto=format&fit=crop&w=800&q=60`,
            lat,
            lng,
            address: `Av. Gastronomía #${i * 10}, ${i % 2 === 0 ? "CDMX" : "Monterrey"}`,
            isMichelin,
            michelinStars: isMichelin ? (i % 2) + 1 : 0,
            socials: {
                instagram: `https://instagram.com/restaurante${id}`,
                facebook: `https://facebook.com/restaurante${id}`,
                twitter: `https://twitter.com/restaurante${id}`
            },
            website: `https://restaurante${id}.mx`,
            phone: `+52 55 ${1000 + i}-${2000 + i}`,
            chef: "Chef Residente",
            description: "Una experiencia gastronómica única en el corazón de México.",
            signatureDishes: ["Platillo de la Casa", "Especialidad de Temporada"]
        };

        // Hardcode PUJOL (ID 1)
        if (id === "1") {
            restaurant.name = "Pujol";
            restaurant.chef = "Enrique Olvera";
            restaurant.category = "Alta Cocina Mexicana";
            restaurant.address = "Tennyson 133, Polanco, CDMX, 11550";
            restaurant.lat = 19.4342;
            restaurant.lng = -99.1917;
            restaurant.isMichelin = true;
            restaurant.michelinStars = 2;
            restaurant.rating = 4.9;
            restaurant.website = "https://www.pujol.com.mx/";
            restaurant.phone = "+52 55 5545 4111";
            restaurant.socials = {
                instagram: "https://www.instagram.com/pujolrestaurant/",
                facebook: "https://www.facebook.com/pujolrestaurant/",
                twitter: "https://twitter.com/pujolrestaurant"
            };
            restaurant.description = "Desde su apertura en 2000, Pujol ha trabajado para transformar la cocina mexicana contemporánea. El restaurante, liderado por el chef Enrique Olvera, se basa en ingredientes locales y técnicas ancestrales para crear una experiencia sensorial profunda y arraigada en la historia de México.";
            restaurant.signatureDishes = [
                "Mole Madre, Mole Nuevo (envejecido por más de 1,500 días)",
                "Elote con mayonesa de hormiga chicatana",
                "Taco de barbacoa de cordero",
                "Ceviche de caracol de mar"
            ];
            restaurant.image = "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80"; // Premium image
        }

        return restaurant;
    });
};

export const restaurantsData = generateRestaurants();

// Fix up the images to guarantee they work on unsplash for specific top ones
const safeImages = [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80", // Pujol style
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581488109695-1ed571217e4f?auto=format&fit=crop&w=1200&q=80",
];

restaurantsData.forEach((r, idx) => {
    // Only update if not Pujol (which we already set)
    if (r.id !== "1") {
        r.image = safeImages[idx % safeImages.length];
    }
});

// Filtered news articles strictly related to Mexica Gourmet
export const newsArticlesData: NewsArticle[] = [
    {
        id: "n1",
        title: "El Desperdicio de Alimentos en México — Un Problema Urgente",
        date: "24 Septiembre 2025",
        excerpt: "Mexica Gourmet analiza la crisis de sustentabilidad en la industria restaurantera. ¿Cómo pueden los grandes chefs liderar el cambio hacia un consumo más responsable?",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
        relatedRestaurantIds: ["1", "2", "3"] // High-end restaurants linked to sustainability
    },
    {
        id: "n2",
        title: "Mexica anuncia nuevas series: 'Cocinando Nuestra Identidad' y 'Héroes del Campo'",
        date: "12 Octubre 2025",
        excerpt: "Dos nuevas producciones originales de Mexica Gourmet exploran el origen de los ingredientes y la evolución de la alta cocina mexicana contemporánea.",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
        relatedRestaurantIds: ["1", "4", "7"]
    },
    {
        id: "n3",
        title: "Día Nacional del Maíz: Tesoro de la Cocina Mexicana",
        date: "29 Septiembre 2025",
        excerpt: "En el marco de Mexica Gourmet, celebramos el ingrediente que es base de nuestra historia. Una mirada a su uso en los menús de degustación más exclusivos.",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80",
        relatedRestaurantIds: ["1"] // Pujol is the main advocate
    },
    {
        id: "n4",
        title: "Guardianas del Sabor: El Legado de la Mujer Indígena en la Gastronomía",
        date: "05 Septiembre 2025",
        excerpt: "Honramos a las productoras que son el alma de nuestra cocina. Una colaboración especial explorando las técnicas ancestrales que siguen vivas hoy.",
        image: "https://images.unsplash.com/photo-1488459711621-27032f2935d7?auto=format&fit=crop&w=800&q=80",
        relatedRestaurantIds: ["3", "12"]
    }
];
