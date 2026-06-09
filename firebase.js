// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, push, query, orderByChild, equalTo, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhuSxkjcsZ3TtNGYCOXOOl7-WWG_EsgPo",
  authDomain: "ililbb-70fb0.firebaseapp.com",
  databaseURL: "https://ililbb-70fb0-default-rtdb.firebaseio.com",
  projectId: "ililbb-70fb0",
  storageBucket: "ililbb-70fb0.firebasestorage.app",
  messagingSenderId: "1059355688483",
  appId: "1:1059355688483:web:a71b5f3bc4fb31ee86fb96",
  measurementId: "G-GVEB9G3V95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// --- Firebase Security Rules (for reference, not directly executable in JS) ---
/*
// database.rules.json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid",
        "coins": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "diamonds": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        }
      }
    },
    "redeemRequests": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$requestId": {
        ".validate": "newData.hasChildren(['uid', 'email', 'coinsUsed', 'amount', 'status', 'createdAt'])",
        "uid": {
          ".validate": "newData.val() == auth.uid"
        },
        "status": {
          ".validate": "newData.val() == 'pending' || newData.val() == 'approved' || newData.val() == 'rejected'"
        }
      }
    },
    "rewardStats": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid",
        "totalAdsWatched": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "totalBoxesOpened": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "totalRedeemed": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        }
      }
    }
  }
}
*/
