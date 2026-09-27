import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { authorizationUrl, createSocialState, isSocialEntityType, isSocialPlatform } from "@/lib/social-server";

const ADMIN_EMAILS = new Set(["dbitdev@gmail.com", "admin@come.mx", "parradabito@gmail.com"]);

export async function POST(request: Request) {
  try {
    const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!bearer) return NextResponse.json({ error: "Inicia sesión para conectar una cuenta." }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(bearer);
    const { platform, entityType, entityId } = await request.json() as Record<string, unknown>;
    if (!isSocialPlatform(platform) || !isSocialEntityType(entityType) || typeof entityId !== "string" || !entityId.trim()) {
      return NextResponse.json({ error: "Solicitud de conexión inválida." }, { status: 400 });
    }
    const collection = entityType === "restaurant" ? "come" : "chefs";
    const entity = await adminDb.collection(collection).doc(entityId).get();
    if (!entity.exists) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
    const isAdmin = Boolean(decoded.email && ADMIN_EMAILS.has(decoded.email));
    if (!isAdmin && entity.data()?.userId !== decoded.uid) return NextResponse.json({ error: "No administras este perfil." }, { status: 403 });

    const state = createSocialState({ platform, entityType, entityId, uid: decoded.uid });
    return NextResponse.json({ url: authorizationUrl(platform, state) });
  } catch (error) {
    console.error("No se pudo iniciar OAuth social", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo iniciar la conexión." }, { status: 500 });
  }
}
