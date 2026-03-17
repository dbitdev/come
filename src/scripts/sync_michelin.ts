
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env: any = {};
envFile.split('\n').forEach(line => {
    const [key, ...REST] = line.split('=');
    const value = REST.join('=');
    if (key && value) env[key.trim()] = value.trim();
});

const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, "come");

const michelinLocales = [
    {
        name: "Pujol",
        distincion: "2 Estrellas + Estrella Verde",
        chef: "Enrique Olvera",
        category: "Mexicana Contemporánea",
        address: "Tennyson 133, Polanco, Miguel Hidalgo, CDMX",
        lat: 19.4312,
        lng: -99.2001,
        signatureDishes: ["Mole Madre, Mole Nuevo", "Taco Omakase de temporada"],
        rating: 4.9,
        isMichelin: true,
        michelinStars: 2,
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        description: "Cocina de alta calidad, excepcional o extraordinaria. 2 Estrellas + Estrella Verde."
    },
    {
        name: "Quintonil",
        distincion: "2 Estrellas",
        chef: "Jorge Vallejo",
        category: "Mexicana Moderna",
        address: "Newton 55, Polanco, Miguel Hidalgo, CDMX",
        lat: 19.4318,
        lng: -99.1852,
        signatureDishes: ["Tartar de aguacate con escamoles", "Nieve de nopal"],
        rating: 4.9,
        isMichelin: true,
        michelinStars: 2,
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
        description: "Cocina de alta calidad, excepcional o extraordinaria."
    },
    {
        name: "Taquería El Califa de León",
        distincion: "1 Estrella",
        chef: "Arturo Rivera Martínez",
        category: "Taquería Tradicional",
        address: "Av. Ribera de San Cosme 56, San Rafael, CDMX",
        lat: 19.4449,
        lng: -99.1627,
        signatureDishes: ["Taco Gaonera", "Taco de Bistec"],
        rating: 4.7,
        isMichelin: true,
        michelinStars: 1,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
        description: "Taquería Tradicional con 1 Estrella Michelin."
    },
    {
        name: "Levadura de Olla",
        distincion: "1 Estrella",
        chef: "Thalía Barrios",
        category: "Oaxaqueña Tradicional",
        address: "C. de Manuel García Vigil 304, Centro, Oaxaca",
        lat: 17.0658,
        lng: -96.7214,
        signatureDishes: ["Ensalada de tomates nativos", "Mole de mesa"],
        rating: 4.8,
        isMichelin: true,
        michelinStars: 1,
        image: "https://images.unsplash.com/photo-1581488109695-1ed571217e4f?auto=format&fit=crop&w=1200&q=80",
        description: "Cocina Oaxaqueña Tradicional destacada con 1 Estrella."
    },
    {
        name: "Animalón",
        distincion: "1 Estrella",
        chef: "Javier Plascencia / Oscar Torres",
        category: "Baja Med",
        address: "Carretera Tecate-Ensenada Km. 83, Baja California",
        lat: 32.0833,
        lng: -116.5917,
        signatureDishes: ["Menú bajo el encino de 200 años"],
        rating: 4.8,
        isMichelin: true,
        michelinStars: 1,
        image: "https://images.unsplash.com/photo-1550966841-36f9adac97ce?auto=format&fit=crop&w=1200&q=80",
        description: "Experiencia gastronómica bajo un encino centenario."
    },
    {
        name: "Le Chique",
        distincion: "1 Estrella",
        chef: "Jonatán Gómez Luna",
        category: "Vanguardia Mexicana",
        address: "Azul Beach Resort, Puerto Morelos, Quintana Roo",
        lat: 20.8496,
        lng: -86.8456,
        signatureDishes: ["Viaje culinario por México (Menú degustación)"],
        rating: 4.9,
        isMichelin: true,
        michelinStars: 1,
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        description: "Vanguardia Mexicana en el Caribe."
    },
    {
        name: "Contramar",
        distincion: "Bib Gourmand",
        chef: "Gabriela Cámara",
        category: "Pescados y Mariscos",
        address: "Calle de Durango 200, Roma Norte, CDMX",
        lat: 19.4201,
        lng: -99.1633,
        signatureDishes: ["Tostadas de atún", "Pescado a la talla"],
        rating: 4.7,
        isMichelin: false,
        michelinStars: 0,
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80",
        description: "Bib Gourmand: Mejor relación calidad-precio."
    },
    {
        name: "Alfonsina",
        distincion: "Bib Gourmand",
        chef: "Jorge León",
        category: "Oaxaqueña de Mercado",
        address: "Calle Garcia Vigil 5, San Juan Bautista la Raya, Oaxaca",
        lat: 17.0094,
        lng: -96.7225,
        signatureDishes: ["Tlayudas gourmet", "Mole negro"],
        rating: 4.8,
        isMichelin: false,
        michelinStars: 0,
        image: "https://images.unsplash.com/photo-1541544741938-0af808871bdc?auto=format&fit=crop&w=1200&q=80",
        description: "Bib Gourmand: Cocina excepcional por menos de $900 MXN."
    }
];

import { query as fsQuery, where, getDocs as fsGetDocs, setDoc, doc as fsDoc } from "firebase/firestore";

const newsArticles = [
    {
        title: "El Desperdicio de Alimentos en México — Un Problema Urgente",
        date: "24 Septiembre 2025",
        excerpt: "Mexica Gourmet analiza la crisis de sustentabilidad en la industria restaurantera. ¿Cómo pueden los grandes chefs liderar el cambio hacia un consumo más responsable?",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200",
        videoUrl: "https://www.youtube.com/embed/5Wv_8mD02z0"
    },
    {
        title: "Mexica Gourmet presenta: 'Cocinando Nuestra Identidad'",
        date: "12 Octubre 2025",
        excerpt: "Una nueva serie que explora el origen de los ingredientes y la evolución de la alta cocina mexicana contemporánea.",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
        title: "Día Nacional del Maíz: Tesoro de la Cocina Mexicana",
        date: "29 Septiembre 2025",
        excerpt: "Celebramos el ingrediente que es base de nuestra historia. Una mirada a su uso en los menús de degustación más exclusivos.",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200"
    }
];

const chefs = [
    {
        name: "Enrique Olvera",
        restaurant: "Pujol",
        specialty: "Alta Cocina Mexicana",
        bio: "Considerado el embajador global de la cocina mexicana moderna.",
        image: "https://images.unsplash.com/photo-1583394293214-28dea15ee54d?auto=format&fit=crop&w=800",
        awards: ["The World's 50 Best", "2 Estrellas Michelin"]
    },
    {
        name: "Elena Reygadas",
        restaurant: "Rosetta",
        specialty: "Italiano-Mexicano & Panadería",
        bio: "Elegida como la mejor chef del mundo en 2023.",
        image: "https://images.unsplash.com/photo-1577219491135-ce39a73e498e?auto=format&fit=crop&w=800",
        awards: ["World's Best Female Chef 2023", "Estrella Michelin"]
    }
];

async function sync() {
    console.log("Starting full sync with named database 'come'...");
    
    // Sync Restaurants
    for (const locale of michelinLocales) {
        try {
            const q = fsQuery(collection(db, "business_leads"), where("restaurantName", "==", locale.name));
            const snapshot = await fsGetDocs(q);
            const data: any = {
                restaurantName: locale.name,
                category: locale.category,
                address: locale.address,
                lat: locale.lat,
                lng: locale.lng,
                chef: locale.chef,
                description: locale.description,
                signatureDishes: locale.signatureDishes,
                rating: locale.rating,
                isMichelin: locale.isMichelin,
                michelinStars: locale.michelinStars,
                awards: locale.distincion,
                image: locale.image,
                lastUpdated: serverTimestamp(),
                subdomain: locale.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + ".comeapp.com.mx"
            };
            if (!snapshot.empty) {
                console.log(`Skipping existing restaurant: ${locale.name}`);
            } else {
                await addDoc(collection(db, "business_leads"), { ...data, createdAt: serverTimestamp() });
                console.log(`Added restaurant: ${locale.name}`);
            }
        } catch (e) { console.error(e); }
    }

    // Sync News
    for (const article of newsArticles) {
        try {
            const q = fsQuery(collection(db, "news"), where("title", "==", article.title));
            const snapshot = await fsGetDocs(q);
            const data = { ...article, lastUpdated: serverTimestamp() };
            if (!snapshot.empty) {
                console.log(`Skipping existing news: ${article.title}`);
            } else {
                await addDoc(collection(db, "news"), { ...data, createdAt: serverTimestamp() });
                console.log(`Added news: ${article.title}`);
            }
        } catch (e) { console.error(e); }
    }

    // Sync Chefs
    for (const chef of chefs) {
        try {
            const q = fsQuery(collection(db, "chefs"), where("name", "==", chef.name));
            const snapshot = await fsGetDocs(q);
            const data = { ...chef, lastUpdated: serverTimestamp() };
            if (!snapshot.empty) {
                console.log(`Skipping existing chef: ${chef.name}`);
            } else {
                await addDoc(collection(db, "chefs"), { ...data, createdAt: serverTimestamp() });
                console.log(`Added chef: ${chef.name}`);
            }
        } catch (e) { console.error(e); }
    }

    console.log("Full sync completed.");
    process.exit(0);
}

sync();
