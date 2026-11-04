
import { Timestamp, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import { tournamentBody } from "@/types/types";

export function firestoreTimestampToDate(timestamp: Timestamp | Date): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date();
}

export function processFirestoreDocs(
  docs: QuerySnapshot<DocumentData, DocumentData>,
) {
  if (docs.empty) return [];
  const data: tournamentBody[] = [];
  docs.forEach((doc) => {
    const docData = doc.data() as tournamentBody;
    data.push({
      id: doc.id,
      ...docData,
      createdAt: firestoreTimestampToDate(docData.createdAt as any),
    });
  });
  return data;
}
