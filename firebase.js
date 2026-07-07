import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
apiKey: "AIzaSyBy7eWmqoTqnNNGfV2YD9h2rabkCg_-QfU",
authDomain: "sabasaba-gospel-ministry-414e2.firebaseapp.com",
projectId: "sabasaba-gospel-ministry-414e2",
storageBucket: "sabasaba-gospel-ministry-414e2.firebasestorage.app",
messagingSenderId: "821278457946",
appId: "1:821278457946:web:3593bd1743970f44c05863"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export {
auth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
};