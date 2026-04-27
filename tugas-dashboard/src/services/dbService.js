// src/services/dbService.js
import { db } from "../firebaseConfig";
import { ref, onValue, push, set, remove } from "firebase/database";

export const databaseService = {
  // Listen data secara realtime
  subscribeToData: (path, callback) => {
    const dbRef = ref(db, path);
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      const formattedData = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      callback(formattedData);
    });
  },

  // Tambah data (Log atau Matrix)
  addData: async (path, payload) => {
    const dbRef = ref(db, path);
    const newDataRef = push(dbRef);
    return set(newDataRef, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  },

  // Hapus data spesifik
  deleteData: async (path, id) => {
    return remove(ref(db, `${path}/${id}`));
  },
};
