import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// WHY: Hardcoded rather than using env vars because Vite bakes VITE_* vars at build time,
// and Railway's build environment wasn't picking them up. Firebase API keys are safe to
// expose in client code — security is enforced by Firestore rules, not the API key.
const firebaseConfig = {
  apiKey: 'AIzaSyBG6Bj6rx-yMcChrSTnyAqjodnjUae5ppU',
  authDomain: 'era-foundation-9a5aa.firebaseapp.com',
  projectId: 'era-foundation-9a5aa',
  storageBucket: 'era-foundation-9a5aa.firebasestorage.app',
  messagingSenderId: '534306569645',
  appId: '1:534306569645:web:604f9765316d9ea82eb524',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
