import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
}
 from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBy7eWmqoTqnNNGfV2YD9h2rabkCg_-QfU",
  authDomain: "sabasaba-gospel-ministry-414e2.firebaseapp.com",
  projectId: "sabasaba-gospel-ministry-414e2",
  storageBucket: "sabasaba-gospel-ministry-414e2.appspot.com",
  messagingSenderId: "821278457946",
  appId: "1:821278457946:web:3593bd1743970f44c05863"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
