import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

/**Get all checklists for a user*/
export const getUserChecklists = async (user: User) => {
  const ref = collection(db, "users", user.uid, "checklists");
  const snapshot = await getDocs(ref);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/*Save all user checklists (sync local -> Firestore)*/
export const saveUserChecklists = async (
  userId: string,
  checklists: any[]
) => {
  for (const checklist of checklists) {
    const ref = doc(db, "users", userId, "checklists", checklist.id);
    await setDoc(ref, checklist, { merge: true });
  }
};

/*Update a single checklist*/
export const updateChecklist = async (
  user: User,
  checklistId: string,
  data: {
    title?: string;
    tasks?: any[];
    updatedAt?: number;
  }
) => {
  if (!checklistId) return;

  const safeData = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.tasks !== undefined && { tasks: data.tasks }),
    ...(data.updatedAt !== undefined && { updatedAt: data.updatedAt })
  };

  const ref = doc(db, "users", user.uid, "checklists", checklistId);
  await updateDoc(ref, safeData);
};


/*Delete a checklist*/
export const deleteChecklist = async (
  userId: string,
  checklistId: string
) => {
  const ref = doc(db, "users", userId, "checklists", checklistId);
  await deleteDoc(ref);
};
