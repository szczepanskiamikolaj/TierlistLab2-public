"use client"

import { GoogleAuthProvider, signInWithPopup, signOut, User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../firebaseConfig';

const auth = firebaseAuth

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken(true); 
    sessionStorage.setItem('authToken', token);
  } else {
    sessionStorage.removeItem('authToken'); 
  }
});

export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
  sessionStorage.removeItem('authToken');
};
