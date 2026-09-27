import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isSocialEntityType, isSocialPlatform, recordSyncError, syncConnection, type SocialEntityType, type SocialPlatform } from "@/lib/social-server";

const ADMIN_EMAILS = new Set(["dbitdev@gmail.com", "admin@come.mx", "parradabito@gmail.com"]);

async function maySync(request: Request, entityType: SocialEntityType, entityId: string) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret && cronSecret === process.env.SOCIAL_SYNC_CRON_SECRET) return true;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return false;
  const decoded = await adminAuth.verifyIdToken(bearer);
  if (decoded.email && ADMIN_EMAILS.has(decoded.email)) return true;
  const collection = entityType === "restaurant" ? "come" : "chefs";
  const entity = await adminDb.collection(collection).doc(entityId).get();
  return entity.data()?.userId === decoded.uid;
}

export async function POST(request: Request) {
  let input: { entityType?: unknown; entityId?: unknown; platform?: unknown } = {};
  try {
    input = await request.json();
    const { entityType, entityId, platform } = input;
    if (!isSocialEntityType(entityType) || !isSocialPlatform(platform) || typeof entityId !== "string" || !entityId.trim()) {
      return NextResponse.json({ error: "Solicitud de sincronización inválida." }, { status: 400 });
    }
    if (!(await maySync(request, entityType, entityId))) return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
    const videos = await syncConnection(entityType, entityId, platform);
    return NextResponse.json({ ok: true, count: videos.length });
  } catch (error) {
    console.error("Sincronización social falló", error);
    const message = isSocialEntityType(input.entityType) && isSocialPlatform(input.platform) && typeof input.entityId === "string"
      ? await recordSyncError(input.entityType, input.entityId, input.platform, error)
      : error instanceof Error ? error.message : "No se pudo sincronizar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!process.env.SOCIAL_SYNC_CRON_SECRET || request.headers.get("x-cron-secret") !== process.env.SOCIAL_SYNC_CRON_SECRET) {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }
  const snapshot = await adminDb.collection("social_connections").get();
  const results = await Promise.allSettled(snapshot.docs.map(async (document) => {
    const data = document.data() as { entityType: SocialEntityType; entityId: string; platform: SocialPlatform };
    if (!isSocialEntityType(data.entityType) || !isSocialPlatform(data.platform) || !data.entityId) throw new Error(`Conexión inválida: ${document.id}`);
    try {
      return await syncConnection(data.entityType, data.entityId, data.platform);
    } catch (error) {
      await recordSyncError(data.entityType, data.entityId, data.platform, error);
      throw error;
    }
  }));
  return NextResponse.json({
    ok: true,
    total: results.length,
    synced: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  });
}
