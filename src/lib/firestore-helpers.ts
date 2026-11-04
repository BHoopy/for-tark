import { tournamentBody } from "@/types/types";

export function firestoreTimestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    return new Date(timestamp);
  }
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

export function processFirestoreDocs(docs: any) {
  if (!docs || docs.empty) return [];
  const data: tournamentBody[] = [];
  if (Array.isArray(docs)) {
    docs.forEach((doc: any) => {
      const docData = doc as any;
      data.push({
        id: docData.id,
        ...docData,
        createdAt: firestoreTimestampToDate(docData.createdAt || docData.created_at),
      } as tournamentBody);
    });
    return data;
  }
  if (docs.forEach) {
    docs.forEach((doc: any) => {
      const docData = doc.data ? (doc.data() as tournamentBody) : (doc as tournamentBody);
      data.push({
        id: doc.id || docData.id,
        ...docData,
        createdAt: firestoreTimestampToDate((docData as any).createdAt || (docData as any).created_at),
      } as tournamentBody);
    });
  }
  return data;
}
