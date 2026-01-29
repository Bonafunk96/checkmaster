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

// Domain allowed
const ALLOWED_DOMAIN = "q4inc.com";

/**
 * Login with Google
 * Adding restriction to only access with @q4inc.com emails
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {

    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const email = user.email;

    if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      // If the domain is not valid, log out
      await signOut(auth);
      throw new Error("INVALID_DOMAIN");
    }

    return user;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

/**
 * Logout + local clean up
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);

    localStorage.removeItem("multi_checklist_app_data");
    localStorage.removeItem("active_checklist_id");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};
