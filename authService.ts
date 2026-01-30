import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
  User
} from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();
const ALLOWED_DOMAIN = "q4inc.com";

export const loginWithGoogle = async (): Promise<User> => {
  await setPersistence(auth, browserLocalPersistence);

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const email = user.email;

  if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await signOut(auth);

    // clean state
    auth.currentUser && await auth.currentUser.reload();

    throw new Error("INVALID_DOMAIN");
  }

  return user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

