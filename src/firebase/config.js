import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Firebase 프로젝트 설정을 여기에 입력하세요
  apiKey: "AIzaSyDFChdTyML2Ok6mcY4ZVuygfJBUbel8LDw",
  authDomain: "tools-34fdb.firebaseapp.com",
  projectId: "tools-34fdb",
  storageBucket: "tools-34fdb.firebasestorage.app",
  messagingSenderId: "951891467864",
  appId: "1:951891467864:web:919b5f621ff7c97d2ef42d",
  measurementId: "G-1DVY3DYPCC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 