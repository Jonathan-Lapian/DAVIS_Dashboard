// src/hooks/useFirebaseData.js
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { ref, onValue, update, push, set } from "firebase/database";

export const useFirebaseData = (path) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(db, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      setData(snapshot.val() || {});
      setLoading(false);
    });
    return () => unsubscribe();
  }, [path]);

  const updateData = (updates) => update(ref(db, path), updates);

  return { data, setData, updateData, loading };
};
