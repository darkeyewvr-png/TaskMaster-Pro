
// @ts-ignore
import { doc, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase";

export async function getNextInvoiceNumber() {
  const counterRef = doc(db, "counters", "invoiceCounter");

  const newNumber = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);

    const current = snap.exists() ? snap.data().current : 0;
    const next = current + 1;

    transaction.set(counterRef, { current: next });

    return next;
  });

  return `INV-${String(newNumber).padStart(4, "0")}`;
}
