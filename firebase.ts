
// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// @ts-ignore
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// @ts-ignore
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// @ts-ignore
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlqaXLTDP5--0coNsd88ZZYnEvn6F6px4",
  authDomain: "basson-elektries.firebaseapp.com",
  projectId: "basson-elektries",
  storageBucket: "basson-elektries.firebasestorage.app",
  messagingSenderId: "332111731683",
  appId: "1:332111731683:web:f4bb5686089d5c71819ed6",
  measurementId: "G-M1QZZFEZCV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
