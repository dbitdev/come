#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const ALLOWED_CITIES = new Set(["CDMX", "Puebla", "Oaxaca"]);
const ALLOWED_TIERS = new Set(["Casual", "Street/Fonda", "High-Casual", "Fine Dining"]);
// Conserva exactamente los IDs del catálogo, incluido el único slug con acento.
const ID_PATTERN = /^[\p{Ll}\p{N}]+(?:-[\p{Ll}\p{N}]+)*$/u;
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error("Uso: node src/scripts/seed-come-catalog.mjs <catalogo.json>");
}

const parsed = JSON.parse(await readFile(sourcePath, "utf8"));
const restaurants = parsed.restaurants;
if (!Array.isArray(restaurants) || restaurants.length === 0) {
  throw new Error("El archivo no contiene un arreglo restaurants.");
}

const seen = new Set();
for (const restaurant of restaurants) {
  const required = ["id", "name", "city", "zone", "address", "tier", "curator_notes"];
  for (const field of required) {
    if (typeof restaurant[field] !== "string" || !restaurant[field].trim()) {
      throw new Error(`${restaurant.id || "(sin id)"}: falta ${field}`);
    }
  }
  if (!ID_PATTERN.test(restaurant.id)) throw new Error(`${restaurant.id}: id inválido`);
  if (seen.has(restaurant.id)) throw new Error(`${restaurant.id}: id duplicado`);
  if (!ALLOWED_CITIES.has(restaurant.city)) throw new Error(`${restaurant.id}: ciudad inválida`);
  if (!ALLOWED_TIERS.has(restaurant.tier)) throw new Error(`${restaurant.id}: tier inválido`);
  if (!Array.isArray(restaurant.cuisine_type) || restaurant.cuisine_type.length === 0) {
    throw new Error(`${restaurant.id}: cuisine_type vacío`);
  }
  for (const key of ["instagram", "website"]) {
    const value = restaurant.social_links?.[key];
    if (value !== null && value !== undefined) new URL(value);
  }
  seen.add(restaurant.id);
}

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "mxicapp";
const databaseId = process.env.FIRESTORE_DATABASE_ID || "(default)";
const app = getApps()[0] || initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app, databaseId);

let written = 0;
for (let offset = 0; offset < restaurants.length; offset += 400) {
  const batch = db.batch();
  for (const source of restaurants.slice(offset, offset + 400)) {
    const ref = db.collection("come").doc(source.id);
    const snapshot = await ref.get();
    const instagram = source.social_links?.instagram?.replace(/\?.*$/, "").replace(/\/+$/, "") || null;
    const cuisine = source.cuisine_type.map((value) => value.trim());
    const highlights = Array.isArray(source.media?.highlights) ? source.media.highlights : [];
    const searchableText = [source.name, source.city, source.zone, source.address, ...cuisine, ...highlights, source.curator_notes]
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    batch.set(ref, {
      id: source.id,
      name: source.name.trim(),
      restaurantName: source.name.trim(),
      city: source.city,
      zone: source.zone.trim(),
      address: source.address.trim(),
      cuisine_type: cuisine,
      category: cuisine.join(" · "),
      tier: source.tier,
      status: "active",
      is_active: true,
      is_verified: true,
      is_claimed: false,
      managed_by: "admin",
      access_level: "RESTRICTED_ADMIN_ONLY",
      created_by: "admin",
      social_links: { instagram, website: source.social_links?.website || null },
      socials: instagram ? { instagram } : {},
      website: source.social_links?.website || null,
      media: {
        cover_image_url: source.media?.cover_image_url || instagram,
        highlights,
      },
      image: source.media?.cover_image_url || instagram || "/hero_food_top.png",
      signatureDishes: highlights,
      curator_notes: source.curator_notes.trim(),
      description: source.curator_notes.trim(),
      search: {
        city: source.city,
        zone: source.zone.trim(),
        cuisine_type: cuisine,
        highlights,
        searchable_text: searchableText,
      },
      updated_at: FieldValue.serverTimestamp(),
      ...(snapshot.exists ? {} : { created_at: FieldValue.serverTimestamp() }),
    }, { merge: true });
    written += 1;
  }
  await batch.commit();
}

console.log(JSON.stringify({ collection: "come", databaseId, projectId, written }));
