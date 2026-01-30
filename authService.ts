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
 * Restricts access to @q4inc.com emails
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const email = user.email ?? "";

    // don't logout if user is invalid, that will cause a null state and will close the pop-up for good
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      throw new Error("INVALID_DOMAIN");
    }

    return user;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

/**
 * Logout + local cleanup
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
