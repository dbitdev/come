import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { claimCollection, claimEntityCollection, type ClaimEntityType } from "@/lib/claims";

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

async function authenticatedUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHORIZED");
  return adminAuth.verifyIdToken(token);
}

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser(request);
    const body = await request.json();
    const entityType = body.entityType as ClaimEntityType;
    const entityId = text(body.entityId, 180);
    if (!(["chef", "place"] as string[]).includes(entityType) || !entityId) {
      return Response.json({ error: "Perfil inválido." }, { status: 400 });
    }

    const target = await adminDb.collection(claimEntityCollection(entityType)).doc(entityId).get();
    if (!target.exists) return Response.json({ error: "El perfil ya no existe." }, { status: 404 });
    const targetData = target.data() || {};
    if (targetData.userId && targetData.userId !== user.uid) {
      return Response.json({ error: "Este perfil ya tiene un dueño verificado." }, { status: 409 });
    }
    if (targetData.userId === user.uid) {
      return Response.json({ error: "Este perfil ya está asignado a tu cuenta." }, { status: 409 });
    }

    const duplicate = await adminDb
      .collection(claimCollection)
      .where("userId", "==", user.uid)
      .where("entityType", "==", entityType)
      .where("entityId", "==", entityId)
      .get();
    const active = duplicate.docs.find((doc) => ["pending", "approved"].includes(doc.data().status));
    if (active) {
      return Response.json({ id: active.id, status: active.data().status, duplicate: true });
    }

    const relationship = text(body.relationship, 120);
    const businessEmail = text(body.businessEmail, 180);
    const phone = text(body.phone, 60);
    const website = text(body.website, 300);
    const proofUrl = text(body.proofUrl, 500);
    const notes = text(body.notes, 2000);
    if (!relationship || !businessEmail || (!proofUrl && !website && !notes)) {
      return Response.json(
        { error: "Indica tu relación, correo de trabajo y al menos una evidencia verificable." },
        { status: 400 },
      );
    }

    const entityName = text(
      targetData.name || targetData.nombre || targetData.restaurantName || body.entityName || "Perfil",
      180,
    );
    const created = await adminDb.collection(claimCollection).add({
      userId: user.uid,
      userEmail: user.email || "",
      entityType,
      entityId,
      entityName,
      relationship,
      businessEmail,
      phone,
      website,
      proofUrl,
      notes,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ id: created.id, status: "pending" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    return Response.json({ error: message === "UNAUTHORIZED" ? "Inicia sesión para reclamar un perfil." : "No se pudo enviar la solicitud." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
