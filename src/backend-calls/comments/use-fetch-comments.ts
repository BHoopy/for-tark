
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { Comment } from "@/types/types";
import { firestoreTimestampToDate } from "@/lib/firestore-helpers";

export function useFetchComments(tournamentId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const db = getFirestore(app);

  useEffect(() => {
    if (!tournamentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const commentsColRef = collection(
      db,
      "tournaments",
      tournamentId,
      "comments",
    );
    const q = query(commentsColRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const commentsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: firestoreTimestampToDate(
              data.createdAt as any,
            ).toISOString(),
          } as Comment;
        });
        setComments(commentsData);
        setIsLoading(false);
        setIsError(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setIsError(true);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [db, tournamentId]);

  return { data: comments, isLoading, isError };
}
