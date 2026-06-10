import {
  signInWithRedirect,
  signOut,
} from "firebase/auth";

import { auth, provider } from "../firebase";

export const loginWithGoogle = async () => {
  try {
    await signInWithRedirect(
      auth,
      provider
    );
  } catch (error) {
    console.error(error);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
  }
};