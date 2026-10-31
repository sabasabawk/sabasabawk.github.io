/* =====================================================
   FIREBASE INITIALIZATION & MODULE EXPORTS
===================================================== */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

import {
  initializeFirestore,
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBy7eWmqoTqnNNGfV2YD9h2rabkCg_-QfU",
  authDomain: "sabasaba-gospel-ministry-414e2.firebaseapp.com",
  projectId: "sabasaba-gospel-ministry-414e2",
  storageBucket: "sabasaba-gospel-ministry-414e2.appspot.com",
  messagingSenderId: "821278457946",
  appId: "1:821278457946:web:3593bd1743970f44c05863"
};


/* =====================================================
   INITIALIZE FIREBASE SERVICES

   Firestore is started with automatic connection
   detection. On networks or phones where the normal
   connection is blocked or stalls (the page then stays
   on "Loading..." forever), Firestore switches itself to
   a more compatible connection method.
===================================================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true
  }
);

const storage = getStorage(app);


/* =====================================================
   EXPORTS
===================================================== */

export {
  app,
  auth,
  db,
  storage,

  /* STORAGE */
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,

  /* FIRESTORE */
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  limit,
  startAfter,

  /* AUTHENTICATION */
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
