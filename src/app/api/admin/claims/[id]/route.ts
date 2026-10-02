import { FieldValue } from "firebase-admin/firestore";
import { requirePlatformAdmin } from "@/lib/admin-server";
import { adminDb } from "@/lib/firebase-admin";
import { claimCollection, claimEntityCollection, type ProfileClaim } from "@/lib/claims";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requirePlatformAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const decision = body.decision === "approved" ? "approved" : body.decision === "rejected" ? "rejected" : null;
    const verificationNotes = typeof body.verificationNotes === "string" ? body.verificationNotes.trim().slice(0, 2000) : "";
    if (!decision || !verificationNotes) {
      return Response.json({ error: "La decisión y las notas de verificación son obligatorias." }, { status: 400 });
    }

    const claimRef = adminDb.collection(claimCollection).doc(id);
    await adminDb.runTransaction(async (transaction) => {
      const claimSnap = await transaction.get(claimRef);
      if (!claimSnap.exists) throw new Error("NOT_FOUND");
      const claim = claimSnap.data() as ProfileClaim;
      if (claim.status !== "pending") throw new Error("ALREADY_REVIEWED");

      if (decision === "approved") {
        const targetRef = adminDb.collection(claimEntityCollection(claim.entityType)).doc(claim.entityId);
        const targetSnap = await transaction.get(targetRef);
        if (!targetSnap.exists) throw new Error("TARGET_NOT_FOUND");
        const owner = targetSnap.data()?.userId;
        if (owner && owner !== claim.userId) throw new Error("ALREADY_OWNED");
        transaction.update(targetRef, {
          userId: claim.userId,
          is_claimed: true,
          claimedAt: FieldValue.serverTimestamp(),
          claimedThrough: id,
          lastUpdated: FieldValue.serverTimestamp(),
        });
      }

      transaction.update(claimRef, {
        status: decision,
        verificationNotes,
        reviewedBy: admin.email || admin.uid,
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return Response.json({ ok: true, status: decision });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code.includes("NOT_FOUND") ? 404 : code.includes("OWNED") || code.includes("REVIEWED") ? 409 : 500;
    return Response.json({ error: code }, { status });
  }
}
