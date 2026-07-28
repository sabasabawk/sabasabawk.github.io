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
  getFirestore,
  collection,
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
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {

  apiKey:
    "AIzaSyBy7eWmqoTqnNNGfV2YD9h2rabkCg_-QfU",

  authDomain:
    "sabasaba-gospel-ministry-414e2.firebaseapp.com",

  projectId:
    "sabasaba-gospel-ministry-414e2",

  storageBucket:
    "sabasaba-gospel-ministry-414e2.appspot.com",

  messagingSenderId:
    "821278457946",

  appId:
    "1:821278457946:web:3593bd1743970f44c05863"

};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app =
  initializeApp(firebaseConfig);


const auth =
  getAuth(app);


const db =
  getFirestore(app);


const storage =
  getStorage(app);


/* =====================================================
   EXPORT FIREBASE SERVICES AND FUNCTIONS
===================================================== */

export {

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


  /* AUTHENTICATION */

  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged

};