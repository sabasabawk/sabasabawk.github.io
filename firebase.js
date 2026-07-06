import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
apiKey: "AIzaSyCP8y49mI24mkdgpRbhCIm0NzjtUjFGoO8",
authDomain: "sabasaba-gospel-ministry.firebaseapp.com",
projectId: "sabasaba-gospel-ministry",
storageBucket: "sabasaba-gospel-ministry.firebasestorage.app",
messagingSenderId: "459706490163",
appId: "1:459706490163:web:fa8e1dc6d55c54ed997246"
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