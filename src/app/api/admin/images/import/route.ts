import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { requirePlatformAdmin } from "@/lib/admin-server";
import { adminApp, adminDb } from "@/lib/firebase-admin";
import { downloadImage } from "@/lib/image-importer";

export async function POST(request: Request) {
  try {
    const admin = await requirePlatformAdmin(request);
    const input = await request.json() as { entityType?: string; entityId?: string; imageUrl?: string; sourcePage?: string; sourceType?: string };
    if (!['restaurant', 'chef'].includes(input.entityType || '') || !input.entityId || !input.imageUrl || !input.sourcePage) {
      return NextResponse.json({ error: "Importación inválida." }, { status: 400 });
    }
    const collection = input.entityType === "restaurant" ? "come" : "chefs";
    const ref = adminDb.collection(collection).doc(input.entityId);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "La ficha no existe." }, { status: 404 });
    const image = await downloadImage(input.imageUrl);
    const bucket = getStorage(adminApp).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const path = `profile-imports/${input.entityType}/${input.entityId}/${image.hash}.${image.extension}`;
    const file = bucket.file(path);
    await file.save(image.bytes, {
      resumable: false,
      contentType: image.contentType,
      metadata: { cacheControl: "public,max-age=31536000,immutable", metadata: { firebaseStorageDownloadTokens: image.token } },
    });
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(path)}?alt=media&token=${image.token}`;
    await ref.update({
      image: publicUrl,
      imageSource: { page: input.sourcePage, originalUrl: input.imageUrl, type: input.sourceType || "website", importedAt: FieldValue.serverTimestamp(), importedBy: admin.email || admin.uid, sha256: image.hash },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, image: publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo importar la imagen.";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: status < 500 ? "Sin autorización." : message }, { status });
  }
}
