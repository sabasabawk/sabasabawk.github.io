// Firebase Configuration
// Initialize Firebase with your config values
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get reference to storage service
const storage = firebase.storage();
const auth = firebase.auth();

// Enable anonymous authentication
auth.onAuthStateChanged(user => {
  if (!user) {
    auth.signInAnonymously().catch(error => {
      console.error("Authentication error:", error);
    });
  }
});
