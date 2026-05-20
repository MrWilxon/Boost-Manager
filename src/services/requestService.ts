import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

// Initialise once (reuse your existing Firebase app instance if you have one)
const functions = getFunctions(app, "us-central1"); // Using default region us-central1 unless specified otherwise
const _deleteRequestWithRefund = httpsCallable(functions, "deleteRequestWithRefund");

/**
 * deleteRequest
 *
 * Calls the secure Cloud Function that deletes a boost request and
 * refunds the user's balance atomically.
 *
 * @param {string} requestId  - Firestore document ID of the request
 * @returns {Promise<void>}
 */
export async function deleteRequest(requestId: string) {
  if (!requestId) throw new Error("requestId is required.");

  const result = await _deleteRequestWithRefund({ requestId });

  if (!(result.data as any)?.success) {
    throw new Error("Deletion failed. Please try again.");
  }
}
