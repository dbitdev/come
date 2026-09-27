#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Uso: node src/scripts/seed-come-chefs.mjs <catalogo.json>");

const parsed = JSON.parse(await readFile(sourcePath, "utf8"));
const chefs = parsed.chefs;
if (!Array.isArray(chefs) || chefs.length === 0) throw new Error("El archivo no contiene un arreglo chefs.");

const allowedRegions = new Set(["CDMX", "Puebla", "Oaxaca"]);
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const seen = new Set();
for (const chef of chefs) {
  if (!idPattern.test(chef.id || "")) throw new Error(`${chef.id || "(sin id)"}: id inválido`);
  if (seen.has(chef.id)) throw new Error(`${chef.id}: id duplicado`);
  if (!chef.display_name?.trim() || !chef.full_name?.trim() || !chef.bio?.trim()) {
    throw new Error(`${chef.id}: nombre o bio faltante`);
  }
  if (!allowedRegions.has(chef.region)) throw new Error(`${chef.id}: región inválida`);
  if (!Array.isArray(chef.specialty_tags) || chef.specialty_tags.length === 0) {
    throw new Error(`${chef.id}: specialty_tags vacío`);
  }
  if (!Array.isArray(chef.affiliated_restaurants)) throw new Error(`${chef.id}: affiliated_restaurants inválido`);
  seen.add(chef.id);
}

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "mxicapp";
const databaseId = process.env.FIRESTORE_DATABASE_ID || "(default)";
const app = getApps()[0] || initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app, databaseId);

const restaurantIds = [...new Set(chefs.flatMap((chef) => chef.affiliated_restaurants))];
const restaurantSnapshots = await db.getAll(...restaurantIds.map((id) => db.collection("come").doc(id)));
const existingRestaurants = new Set(restaurantSnapshots.filter((snapshot) => snapshot.exists).map((snapshot) => snapshot.id));
const unresolved = restaurantIds.filter((id) => !existingRestaurants.has(id));

let written = 0;
for (let offset = 0; offset < chefs.length; offset += 300) {
  const batch = db.batch();
  for (const source of chefs.slice(offset, offset + 300)) {
    const ref = db.collection("chefs").doc(source.id);
    const snapshot = await ref.get();
    const affiliations = source.affiliated_restaurants.filter((id) => existingRestaurants.has(id));
    const unresolvedAffiliations = source.affiliated_restaurants.filter((id) => !existingRestaurants.has(id));
    const instagram = source.social_links?.instagram?.replace(/\?.*$/, "").replace(/\/+$/, "") || null;
    const specialtyTags = source.specialty_tags.map((value) => value.trim());
    const searchableText = [source.display_name, source.full_name, source.role_title, source.region, source.base_city, source.bio, ...specialtyTags]
      .filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    batch.set(ref, {
      id: source.id,
      name: source.display_name.trim(),
      display_name: source.display_name.trim(),
      full_name: source.full_name.trim(),
      role_title: source.role_title || "Chef",
      region: source.region,
      base_city: source.base_city || source.region,
      bio: source.bio.trim(),
      specialty: specialtyTags.join(" · "),
      specialty_tags: specialtyTags,
      affiliated_restaurants: affiliations,
      unresolved_affiliated_restaurants: unresolvedAffiliations,
      restaurantIds: affiliations,
      restaurant: affiliations[0] || "",
      social_links: { instagram, website: source.social_links?.website || null },
      socials: instagram ? { instagram } : {},
      status: "active",
      is_active: true,
      is_verified: true,
      is_claimed: false,
      managed_by: "admin",
      access_level: "RESTRICTED_ADMIN_ONLY",
      created_by: "admin",
      search: { specialty_tags: specialtyTags, region: source.region, bio: source.bio.trim(), searchable_text: searchableText },
      updated_at: FieldValue.serverTimestamp(),
      ...(snapshot.exists ? {} : { created_at: FieldValue.serverTimestamp() }),
    }, { merge: true });

    for (const restaurantId of affiliations) {
      batch.set(db.collection("come").doc(restaurantId), {
        chefIds: FieldValue.arrayUnion(source.id),
        chefsNombres: FieldValue.arrayUnion(source.display_name.trim()),
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    written += 1;
  }
  await batch.commit();
}

console.log(JSON.stringify({ collection: "chefs", databaseId, projectId, written, unresolved }));
