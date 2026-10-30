import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './app.js';
import { toAppError } from '../errors.js';

export function watchAuth(callback) {
  return onAuthStateChanged(auth, (user) => callback(user ? { uid: user.uid, email: user.email } : null));
}

export async function signUp(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    throw toAppError(e);
  }
}

export async function signIn(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    throw toAppError(e);
  }
}

export function logOut() {
  return signOut(auth);
}
