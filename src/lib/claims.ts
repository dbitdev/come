export type ClaimEntityType = "chef" | "place";
export type ClaimStatus = "pending" | "approved" | "rejected";

export type ProfileClaim = {
  id: string;
  userId: string;
  userEmail: string;
  entityType: ClaimEntityType;
  entityId: string;
  entityName: string;
  relationship: string;
  businessEmail: string;
  phone: string;
  website: string;
  proofUrl: string;
  notes: string;
  status: ClaimStatus;
  verificationNotes?: string;
  createdAt?: unknown;
};

export const claimCollection = "profile_claims";

export function claimEntityCollection(type: ClaimEntityType) {
  return type === "chef" ? "chefs" : "come";
}
