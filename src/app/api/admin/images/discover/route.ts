import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin-server";
import { adminDb } from "@/lib/firebase-admin";
import { discoverOfficialImages } from "@/lib/image-importer";

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin(request);
    const input = await request.json() as { entityType?: string; entityId?: string; website?: string };
    if (!['restaurant', 'chef'].includes(input.entityType || '') || !input.entityId) return NextResponse.json({ error: "Ficha inválida." }, { status: 400 });
    const collection = input.entityType === "restaurant" ? "come" : "chefs";
    const snapshot = await adminDb.collection(collection).doc(input.entityId).get();
    if (!snapshot.exists) return NextResponse.json({ error: "La ficha no existe." }, { status: 404 });
    const website = input.website?.trim() || snapshot.data()?.website;
    if (!website) return NextResponse.json({ error: "Agrega primero el sitio web oficial de la ficha." }, { status: 400 });
    const candidates = await discoverOfficialImages(website);
    return NextResponse.json({ website, candidates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo analizar el sitio.";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: status < 500 ? "Sin autorización." : message }, { status });
  }
}
