const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");

// Set global options for all functions
setGlobalOptions({ region: "us-central1" });

initializeApp();

/**
 * deleteRequestWithRefund
 *
 * Securely deletes a boost request and refunds the user's balance.
 * Runs with Admin SDK — bypasses client security rules intentionally.
 *
 * Auth required: caller must be the request owner OR an admin.
 */
exports.deleteRequestWithRefund = onCall({ cors: true }, async (request) => {
  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to delete a request."
    );
  }

  const callerUid = request.auth.uid;
  const { requestId } = request.data;

  console.log(`Attempting to delete request ${requestId} by user ${callerUid}`);

  if (!requestId || typeof requestId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "A valid requestId string is required."
    );
  }

  const db = getFirestore();
  const requestRef = db.collection("requests").doc(requestId);

  // ── 2. Run inside a transaction for atomicity ──────────────────────────────
  try {
    return await db.runTransaction(async (tx) => {
      const requestSnap = await tx.get(requestRef);

      // ── 2a. Validate the request document exists ─────────────────────────
      if (!requestSnap.exists) {
        throw new HttpsError("not-found", "Request not found.");
      }

      const requestData = requestSnap.data();

      // ── 2b. Check caller is admin or the request owner ───────────────────
      const userRef = db.collection("users").doc(callerUid);
      const userSnap = await tx.get(userRef);

      if (!userSnap.exists) {
        throw new HttpsError("not-found", "Caller user record not found.");
      }

      const isAdmin = userSnap.data().role === "Admin";
      const isOwner = requestData.userId === callerUid;

      if (!isAdmin && !isOwner) {
        throw new HttpsError(
          "permission-denied",
          "You do not have permission to delete this request."
        );
      }

      // ── 2c. Only Pending or Rejected requests may be deleted ─────────────
      const deletableStatuses = ["Pending", "Rejected"];
      if (!deletableStatuses.includes(requestData.status)) {
        throw new HttpsError(
          "failed-precondition",
          `Cannot delete a request with status "${requestData.status}". ` +
            "Only Pending or Rejected requests can be deleted."
        );
      }

      // ── 2d. Determine refund amount ───────────────────────────────────────
      const refundAmount =
        requestData.status === "Pending" ? requestData.amountNpr ?? 0 : 0;

      // ── 2e. Apply writes ──────────────────────────────────────────────────
      tx.delete(requestRef);

      if (refundAmount > 0) {
        const ownerRef = db.collection("users").doc(requestData.userId);
        tx.update(ownerRef, {
          balance: FieldValue.increment(refundAmount),
        });
      }

      // ── 2f. Write audit log ───────────────────────────────────────────────
      const auditRef = db.collection("auditLogs").doc();
      tx.set(auditRef, {
        action: "deleteRequestWithRefund",
        performedBy: callerUid,
        targetRequestId: requestId,
        targetUserId: requestData.userId,
        refundAmount,
        previousStatus: requestData.status,
        timestamp: FieldValue.serverTimestamp(),
      });

      console.log(`Successfully deleted request ${requestId} and refunded ${refundAmount}`);
      return { success: true };
    });
  } catch (err) {
    if (err instanceof HttpsError) throw err;

    console.error("deleteRequestWithRefund transaction failed:", err);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred. Please try again."
    );
  }
});
