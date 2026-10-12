import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function useProfilePhoto(user) {
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setPhoto("");
      return;
    }
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => setPhoto(snap.exists() ? snap.data().photoURL || "" : ""),
      () => setPhoto("")
    );
    return () => unsub();
  }, [user?.uid]);

  return photo;
}