// frontend/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCd-0cvZChj8vuFv1mbO1RVHF2I753jK8E",
  authDomain: "library-management-syste-ce2e0.firebaseapp.com",
  projectId: "library-management-syste-ce2e0",
  storageBucket: "library-management-syste-ce2e0.appspot.com",
  messagingSenderId: "460414151130",
  appId: "1:460414151130:web:8f6363ec874e82f8b9b8e3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
