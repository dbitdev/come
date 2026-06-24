
import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { db, auth } = require('../lib/firebase');
const { collection, addDoc, getDocs, query, where } = require('firebase/firestore');
const { signInWithEmailAndPassword } = require('firebase/auth');

const chefsData = {
  "directorio_chefs": [
    {
      "id": "chef_001",
      "nombre": "Enrique Olvera",
      "restaurante_principal": "Pujol",
      "estrellas": 2,
      "ubicacion": "CDMX, México",
      "biografia_corta": "Pionero de la gastronomía mexicana moderna a nivel global. Transformó la cocina de calle en una experiencia de alta gama.",
      "logro_clave": "Creador del Mole Madre, un plato con más de 3,000 días de recalentado.",
      "redes": "@enriqueolvera"
    },
    {
      "id": "chef_002",
      "nombre": "Jorge Vallejo",
      "restaurante_principal": "Quintonil",
      "estrellas": 2,
      "ubicacion": "CDMX, México",
      "biografia_corta": "Enfocado en la biodiversidad de México, utiliza productos de la chinampa y pequeños productores locales.",
      "logro_clave": "Consolidó a Quintonil en el top 10 de The World's 50 Best Restaurants.",
      "redes": "@jorgevallejo"
    },
    {
      "id": "chef_003",
      "nombre": "Elena Reygadas",
      "restaurante_principal": "Rosetta",
      "estrellas": 1,
      "ubicacion": "CDMX, México",
      "biografia_corta": "Elegida mejor chef femenina del mundo en 2023. Su cocina destaca por la armonía entre el ingrediente mexicano y la técnica italiana.",
      "logro_clave": "Logró la Estrella Verde por su compromiso con la agricultura ética.",
      "redes": "@elena_reygadas"
    },
    {
      "id": "chef_004",
      "nombre": "Karime López",
      "restaurante_principal": "Gucci Osteria",
      "estrellas": 1,
      "ubicacion": "Florencia, Italia",
      "biografia_corta": "La primera mujer mexicana en obtener una estrella Michelin. Su estilo es cosmopolita, fusionando arte y gastronomía.",
      "logro_clave": "Directora creativa de la colaboración entre Gucci y Massimo Bottura.",
      "redes": "@karimelopez"
    },
    {
      "id": "chef_005",
      "nombre": "Santiago Lastra",
      "restaurante_principal": "KOL",
      "estrellas": 1,
      "ubicacion": "Londres, Inglaterra",
      "biografia_corta": "Recrea el alma de México en Londres usando únicamente ingredientes del Reino Unido.",
      "logro_clave": "Sustituye el limón con espino amarillo y el chocolate con granos locales.",
      "redes": "@santiagolastra"
    },
    {
      "id": "chef_006",
      "nombre": "Thalía Barrios",
      "restaurante_principal": "Levadura de Olla",
      "estrellas": 1,
      "ubicacion": "Oaxaca, México",
      "biografia_corta": "Originaria de San Mateo Yucutindoo, es la guardiana de las recetas tradicionales de la sierra oaxaqueña.",
      "logro_clave": "Especialista en el rescate de variedades de tomates nativos casi extintos.",
      "redes": "@thalia_barrios_garcia"
    },
    {
      "id": "chef_007",
      "nombre": "Carlos Gaytán",
      "restaurante_principal": "HA' / Tzuco",
      "estrellas": 1,
      "ubicacion": "Riviera Maya / Chicago",
      "biografia_corta": "El primer chef mexicano en la historia en recibir una estrella Michelin.",
      "logro_clave": "Fusiona la cocina de su natal Guerrero con la técnica francesa más rigurosa.",
      "redes": "@chef_carlosgaytan"
    },
    {
      "id": "chef_008",
      "nombre": "Paco Méndez",
      "restaurante_principal": "COME",
      "estrellas": 1,
      "ubicacion": "Barcelona, España",
      "biografia_corta": "Embajador de la cocina mexicana en Europa, colaborador cercano de los hermanos Adrià.",
      "logro_clave": "Redefinió la cocina mexicana de vanguardia en España.",
      "redes": "@pacomendez"
    },
    {
      "id": "mencion_001",
      "nombre": "Gabriela Cámara",
      "restaurante_principal": "Contramar",
      "tipo": "Recomendación / Bib Gourmand",
      "ubicacion": "CDMX, México",
      "biografia_corta": "Figura clave en la escena de mariscos en México. Sus restaurantes son puntos de encuentro cultural.",
      "logro_clave": "Su 'Pescado a la Talla' es un plato de culto internacional.",
      "redes": "@gabrielacamara"
    },
    {
      "id": "mencion_002",
      "nombre": "Doña Esthela",
      "restaurante_principal": "La Cocina de Doña Esthela",
      "tipo": "Recomendación Michelin",
      "ubicacion": "Ensenada, Baja California",
      "biografia_corta": "Cocinera tradicional que puso al Valle de Guadalupe en el mapa mundial de los desayunos.",
      "logro_clave": "Ganadora del premio al 'Mejor Desayuno del Mundo'.",
      "redes": "@lacocinadedonaesthela"
    }
  ]
};

async function syncChefs() {
  if (!db || !auth) {
    console.error("Firebase or Auth not initialized");
    return;
  }

  try {
    console.log("🔐 Authenticating...");
    await signInWithEmailAndPassword(auth, "parradabito@gmail.com", "S0yDb1t#");
    console.log("✅ Authenticated as super admin");
  } catch (authError) {
    console.error("❌ Authentication failed:", authError);
    return;
  }

  const chefsCollection = collection(db, "chefs");

  for (const chef of chefsData.directorio_chefs) {
    try {
      // Check if already exists
      const q = query(chefsCollection, where("nombre", "==", chef.nombre));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(chefsCollection, {
          ...chef,
          createdAt: new Date().toISOString()
        });
        console.log(`✅ Chef added: ${chef.nombre}`);
      } else {
        console.log(`⏭️ Chef already exists: ${chef.nombre}`);
      }
    } catch (error) {
      console.error(`❌ Error adding chef ${chef.nombre}:`, error);
    }
  }
}

syncChefs().then(() => {
    console.log("🏁 Sync finished");
    process.exit(0);
}).catch(err => {
    console.error("💥 Fatal error:", err);
    process.exit(1);
});
