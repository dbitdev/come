
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, addDoc, serverTimestamp, query as fsQuery, where, getDocs as fsGetDocs } from "firebase/firestore";
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

console.log("Connecting to project:", env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, "hueyi");

// ═══════════════════════════════════════════════════
// RESTAURANTES → collection: "come"
// ═══════════════════════════════════════════════════

const restaurants = [
    // Estrellas Michelin
    {
        restaurantName: "Pujol",
        category: "Mexicana Contemporánea",
        address: "Tennyson 133, Polanco, Miguel Hidalgo, CDMX",
        estado: "CDMX",
        lat: 19.4312,
        lng: -99.2001,
        chef: "Enrique Olvera",
        description: "Cocina de alta calidad, excepcional o extraordinaria. 2 Estrellas Michelin + Estrella Verde. Un referente global de la cocina mexicana.",
        signatureDishes: ["Mole Madre, Mole Nuevo", "Taco Omakase de temporada"],
        rating: 4.9,
        isMichelin: true,
        michelinStars: 2,
        awards: "2 Estrellas + Estrella Verde",
        rangoPrecios: "$$$$",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        subdomain: "pujol"
    },
    {
        restaurantName: "Quintonil",
        category: "Mexicana Moderna",
        address: "Newton 55, Polanco, Miguel Hidalgo, CDMX",
        estado: "CDMX",
        lat: 19.4318,
        lng: -99.1852,
        chef: "Jorge Vallejo",
        description: "Cocina de alta calidad, excepcional o extraordinaria. 2 Estrellas Michelin. Una experiencia moderna que celebra los ingredientes mexicanos.",
        signatureDishes: ["Tartar de aguacate con escamoles", "Nieve de nopal"],
        rating: 4.9,
        isMichelin: true,
        michelinStars: 2,
        awards: "2 Estrellas",
        rangoPrecios: "$$$$",
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
        subdomain: "quintonil"
    },
    {
        restaurantName: "Taquería El Califa de León",
        category: "Taquería Tradicional",
        address: "Av. Ribera de San Cosme 56, San Rafael, CDMX",
        estado: "CDMX",
        lat: 19.4449,
        lng: -99.1627,
        chef: "Arturo Rivera Martínez",
        description: "Taquería Tradicional con 1 Estrella Michelin. La primera taquería en el mundo en obtener una estrella.",
        signatureDishes: ["Taco Gaonera", "Taco de Bistec"],
        rating: 4.7,
        isMichelin: true,
        michelinStars: 1,
        awards: "1 Estrella",
        rangoPrecios: "$",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
        subdomain: "el-califa-de-leon"
    },
    {
        restaurantName: "Levadura de Olla",
        category: "Oaxaqueña Tradicional",
        address: "C. de Manuel García Vigil 304, Centro, Oaxaca",
        estado: "Oaxaca",
        lat: 17.0658,
        lng: -96.7214,
        chef: "Thalía Barrios",
        description: "Cocina Oaxaqueña Tradicional destacada con 1 Estrella Michelin. Un homenaje a las raíces culinarias de Oaxaca.",
        signatureDishes: ["Ensalada de tomates nativos", "Mole de mesa"],
        rating: 4.8,
        isMichelin: true,
        michelinStars: 1,
        awards: "1 Estrella",
        rangoPrecios: "$$",
        image: "https://images.unsplash.com/photo-1581488109695-1ed571217e4f?auto=format&fit=crop&w=1200&q=80",
        subdomain: "levadura-de-olla"
    },
    {
        restaurantName: "Animalón",
        category: "Baja Med",
        address: "Carretera Tecate-Ensenada Km. 83, Baja California",
        estado: "Baja California",
        lat: 32.0833,
        lng: -116.5917,
        chef: "Javier Plascencia / Oscar Torres",
        description: "Experiencia gastronómica bajo un encino de 200 años. Cocina Baja Med con 1 Estrella Michelin.",
        signatureDishes: ["Menú bajo el encino de 200 años"],
        rating: 4.8,
        isMichelin: true,
        michelinStars: 1,
        awards: "1 Estrella",
        rangoPrecios: "$$$",
        image: "https://images.unsplash.com/photo-1550966841-36f9adac97ce?auto=format&fit=crop&w=1200&q=80",
        subdomain: "animalon"
    },
    {
        restaurantName: "Le Chique",
        category: "Vanguardia Mexicana",
        address: "Azul Beach Resort, Puerto Morelos, Quintana Roo",
        estado: "Quintana Roo",
        lat: 20.8496,
        lng: -86.8456,
        chef: "Jonatán Gómez Luna",
        description: "Vanguardia Mexicana en el Caribe. 1 Estrella Michelin. Un viaje culinario por México en cada menú degustación.",
        signatureDishes: ["Viaje culinario por México (Menú degustación)"],
        rating: 4.9,
        isMichelin: true,
        michelinStars: 1,
        awards: "1 Estrella",
        rangoPrecios: "$$$$",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        subdomain: "le-chique"
    },
    // Bib Gourmand
    {
        restaurantName: "Contramar",
        category: "Pescados y Mariscos",
        address: "Calle de Durango 200, Roma Norte, CDMX",
        estado: "CDMX",
        lat: 19.4201,
        lng: -99.1633,
        chef: "Gabriela Cámara",
        description: "Bib Gourmand: Mejor relación calidad-precio. Pescados y Mariscos excepcionales en el corazón de la Roma.",
        signatureDishes: ["Tostadas de atún", "Pescado a la talla"],
        rating: 4.7,
        isMichelin: false,
        michelinStars: 0,
        awards: "Bib Gourmand",
        rangoPrecios: "$$",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80",
        subdomain: "contramar"
    },
    {
        restaurantName: "Alfonsina",
        category: "Oaxaqueña de Mercado",
        address: "Calle Garcia Vigil 5, San Juan Bautista la Raya, Oaxaca",
        estado: "Oaxaca",
        lat: 17.0094,
        lng: -96.7225,
        chef: "Jorge León",
        description: "Bib Gourmand: Cocina excepcional por menos de $900 MXN. Sabores auténticos oaxaqueños de mercado.",
        signatureDishes: ["Tlayudas gourmet", "Mole negro"],
        rating: 4.8,
        isMichelin: false,
        michelinStars: 0,
        awards: "Bib Gourmand",
        rangoPrecios: "$$",
        image: "https://images.unsplash.com/photo-1541544741938-0af808871bdc?auto=format&fit=crop&w=1200&q=80",
        subdomain: "alfonsina"
    }
];

// ═══════════════════════════════════════════════════
// CHEFS → collection: "chefs"
// Directorio completo de chefs mexicanos destacados
// ═══════════════════════════════════════════════════

const chefs = [
    {
        chefId: "chef_001",
        name: "Enrique Olvera",
        restaurant: "Pujol",
        specialty: "Mexicana Contemporánea",
        bio: "Pionero de la gastronomía mexicana moderna a nivel global. Transformó la cocina de calle en una experiencia de alta gama.",
        logroClave: "Creador del Mole Madre, un plato con más de 3,000 días de recalentado.",
        image: "https://images.unsplash.com/photo-1583394293214-28dea15ee54d?auto=format&fit=crop&w=800",
        awards: ["The World's 50 Best", "2 Estrellas Michelin", "Estrella Verde Michelin"],
        estrellas: 2,
        estado: "CDMX",
        ubicacion: "CDMX, México",
        redes: "@enriqueolvera"
    },
    {
        chefId: "chef_002",
        name: "Jorge Vallejo",
        restaurant: "Quintonil",
        specialty: "Mexicana Moderna",
        bio: "Enfocado en la biodiversidad de México, utiliza productos de la chinampa y pequeños productores locales.",
        logroClave: "Consolidó a Quintonil en el top 10 de The World's 50 Best Restaurants.",
        image: "https://images.unsplash.com/photo-1577219491135-ce39a73e498e?auto=format&fit=crop&w=800",
        awards: ["2 Estrellas Michelin", "The World's 50 Best"],
        estrellas: 2,
        estado: "CDMX",
        ubicacion: "CDMX, México",
        redes: "@jorgevallejo"
    },
    {
        chefId: "chef_003",
        name: "Elena Reygadas",
        restaurant: "Rosetta",
        specialty: "Italiano-Mexicano & Panadería",
        bio: "Elegida mejor chef femenina del mundo en 2023. Su cocina destaca por la armonía entre el ingrediente mexicano y la técnica italiana.",
        logroClave: "Logró la Estrella Verde por su compromiso con la agricultura ética.",
        image: "https://images.unsplash.com/photo-1577219491135-ce39a73e498e?auto=format&fit=crop&w=800",
        awards: ["World's Best Female Chef 2023", "1 Estrella Michelin", "Estrella Verde"],
        estrellas: 1,
        estado: "CDMX",
        ubicacion: "CDMX, México",
        redes: "@elena_reygadas"
    },
    {
        chefId: "chef_004",
        name: "Karime López",
        restaurant: "Gucci Osteria",
        specialty: "Cosmopolita / Arte y Gastronomía",
        bio: "La primera mujer mexicana en obtener una estrella Michelin. Su estilo es cosmopolita, fusionando arte y gastronomía.",
        logroClave: "Directora creativa de la colaboración entre Gucci y Massimo Bottura.",
        image: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=800",
        awards: ["1 Estrella Michelin"],
        estrellas: 1,
        estado: "Internacional",
        ubicacion: "Florencia, Italia",
        redes: "@karimelopez"
    },
    {
        chefId: "chef_005",
        name: "Santiago Lastra",
        restaurant: "KOL",
        specialty: "Mexicana con ingredientes británicos",
        bio: "Recrea el alma de México en Londres usando únicamente ingredientes del Reino Unido.",
        logroClave: "Sustituye el limón con espino amarillo y el chocolate con granos locales.",
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800",
        awards: ["1 Estrella Michelin"],
        estrellas: 1,
        estado: "Internacional",
        ubicacion: "Londres, Inglaterra",
        redes: "@santiagolastra"
    },
    {
        chefId: "chef_006",
        name: "Thalía Barrios",
        restaurant: "Levadura de Olla",
        specialty: "Oaxaqueña Tradicional",
        bio: "Originaria de San Mateo Yucutindoo, es la guardiana de las recetas tradicionales de la sierra oaxaqueña.",
        logroClave: "Especialista en el rescate de variedades de tomates nativos casi extintos.",
        image: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=800",
        awards: ["1 Estrella Michelin"],
        estrellas: 1,
        estado: "Oaxaca",
        ubicacion: "Oaxaca, México",
        redes: "@thalia_barrios_garcia"
    },
    {
        chefId: "chef_007",
        name: "Carlos Gaytán",
        restaurant: "HA' / Tzuco",
        specialty: "Mexicana-Francesa",
        bio: "El primer chef mexicano en la historia en recibir una estrella Michelin.",
        logroClave: "Fusiona la cocina de su natal Guerrero con la técnica francesa más rigurosa.",
        image: "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=800",
        awards: ["1 Estrella Michelin (histórica)"],
        estrellas: 1,
        estado: "Internacional",
        ubicacion: "Riviera Maya / Chicago",
        redes: "@chef_carlosgaytan"
    },
    {
        chefId: "chef_008",
        name: "Paco Méndez",
        restaurant: "COME",
        specialty: "Mexicana de Vanguardia",
        bio: "Embajador de la cocina mexicana en Europa, colaborador cercano de los hermanos Adrià.",
        logroClave: "Redefinió la cocina mexicana de vanguardia en España.",
        image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800",
        awards: ["1 Estrella Michelin"],
        estrellas: 1,
        estado: "Internacional",
        ubicacion: "Barcelona, España",
        redes: "@pacomendez"
    },
    {
        chefId: "mencion_001",
        name: "Gabriela Cámara",
        restaurant: "Contramar",
        specialty: "Pescados y Mariscos",
        bio: "Figura clave en la escena de mariscos en México. Sus restaurantes son puntos de encuentro cultural.",
        logroClave: "Su 'Pescado a la Talla' es un plato de culto internacional.",
        image: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=800",
        awards: ["Bib Gourmand"],
        estrellas: 0,
        tipo: "Recomendación / Bib Gourmand",
        estado: "CDMX",
        ubicacion: "CDMX, México",
        redes: "@gabrielacamara"
    },
    {
        chefId: "mencion_002",
        name: "Doña Esthela",
        restaurant: "La Cocina de Doña Esthela",
        specialty: "Cocina Tradicional",
        bio: "Cocinera tradicional que puso al Valle de Guadalupe en el mapa mundial de los desayunos.",
        logroClave: "Ganadora del premio al 'Mejor Desayuno del Mundo'.",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800",
        awards: ["Recomendación Michelin", "Mejor Desayuno del Mundo"],
        estrellas: 0,
        tipo: "Recomendación Michelin",
        estado: "Baja California",
        ubicacion: "Ensenada, Baja California",
        redes: "@lacocinadedonaesthela"
    }
];

// ═══════════════════════════════════════════════════
// NEWS / ARTICLES
// ═══════════════════════════════════════════════════

const newsArticles = [
    {
        title: "Guía Michelin México 2025-2026: Todos los Galardonados",
        date: "15 Marzo 2025",
        excerpt: "La guía Michelin anuncia su selección para México con 2 nuevos restaurantes de dos estrellas: Pujol y Quintonil lideran la lista junto a una histórica taquería.",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200"
    },
    {
        title: "El Desperdicio de Alimentos en México — Un Problema Urgente",
        date: "24 Septiembre 2025",
        excerpt: "Mexica Gourmet analiza la crisis de sustentabilidad en la industria restaurantera. ¿Cómo pueden los grandes chefs liderar el cambio hacia un consumo más responsable?",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200",
        videoUrl: "https://www.youtube.com/embed/5Wv_8mD02z0"
    },
    {
        title: "Giuseppe Lacorazza: Young Chef Award 2025",
        date: "18 Octubre 2025",
        excerpt: "A sus 27 años, el chef de Fugaz recibe el reconocimiento como el chef joven más prometedor de México según la guía Michelin.",
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200"
    },
    {
        title: "Día Nacional del Maíz: Tesoro de la Cocina Mexicana",
        date: "29 Septiembre 2025",
        excerpt: "Celebramos el ingrediente que es base de nuestra historia. Una mirada a su uso en los menús de degustación más exclusivos.",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200"
    }
];

// ═══════════════════════════════════════════════════
// PREMIOS ESPECIALES 2025
// ═══════════════════════════════════════════════════

const premiosEspeciales = [
    {
        premio: "Young Chef Award",
        ganador: "Giuseppe Lacorazza",
        restaurante: "Fugaz",
        ciudad: "CDMX",
        year: 2025
    },
    {
        premio: "Exceptional Cocktails",
        ganador: "Gabriela Campos",
        restaurante: "Atarraya",
        ciudad: "Oaxaca",
        year: 2025
    }
];

// ═══════════════════════════════════════════════════
// SYNC FUNCTION
// ═══════════════════════════════════════════════════

async function upsertDoc(collectionName: string, identifierField: string, identifierValue: string, data: any) {
    const q = fsQuery(collection(db, collectionName), where(identifierField, "==", identifierValue));
    const snapshot = await fsGetDocs(q);
    if (!snapshot.empty) {
        console.log(`  ⏭ Already exists: ${identifierValue}`);
        return false;
    }
    await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
    });
    console.log(`  ✅ Added: ${identifierValue}`);
    return true;
}

async function sync() {
    console.log("═══════════════════════════════════════════════════");
    console.log("  Come App — Seeding database 'hueyi'");
    console.log("  Project:", env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log("═══════════════════════════════════════════════════\n");

    let added = 0;
    let skipped = 0;

    // 1. Restaurants → "come" collection
    console.log("🍽  Syncing Restaurants (come collection)...");
    for (const r of restaurants) {
        try {
            const wasAdded = await upsertDoc("come", "restaurantName", r.restaurantName, r);
            wasAdded ? added++ : skipped++;
        } catch (e) {
            console.error(`  ❌ Error adding ${r.restaurantName}:`, e);
        }
    }

    // 2. Chefs → "chefs" collection
    console.log("\n👨‍🍳 Syncing Chefs (10 chefs)...");
    for (const chef of chefs) {
        try {
            const wasAdded = await upsertDoc("chefs", "name", chef.name, chef);
            wasAdded ? added++ : skipped++;
        } catch (e) {
            console.error(`  ❌ Error adding ${chef.name}:`, e);
        }
    }

    // 3. News → "news" collection
    console.log("\n📰 Syncing News...");
    for (const article of newsArticles) {
        try {
            const wasAdded = await upsertDoc("news", "title", article.title, article);
            wasAdded ? added++ : skipped++;
        } catch (e) {
            console.error(`  ❌ Error adding ${article.title}:`, e);
        }
    }

    // 4. Premios Especiales → "premios_especiales" collection
    console.log("\n🏆 Syncing Premios Especiales...");
    for (const premio of premiosEspeciales) {
        try {
            const wasAdded = await upsertDoc("premios_especiales", "ganador", premio.ganador, premio);
            wasAdded ? added++ : skipped++;
        } catch (e) {
            console.error(`  ❌ Error adding ${premio.ganador}:`, e);
        }
    }

    console.log("\n═══════════════════════════════════════════════════");
    console.log(`  ✅ Added: ${added} | ⏭ Skipped: ${skipped}`);
    console.log("  Sync completed successfully.");
    console.log("═══════════════════════════════════════════════════");

    process.exit(0);
}

sync();
