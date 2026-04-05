// Firebase Configuration and Initialization
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE PROJECT KEYS
const firebaseConfig = {
    apiKey: "AIzaSyAOS3aA7JuXzBuCCZLIgu8kdbeMdCl_Ink",
    authDomain: "classqurqin.firebaseapp.com",
    databaseURL: "https://classqurqin-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "classqurqin",
    storageBucket: "classqurqin.firebasestorage.app",
    messagingSenderId: "491693742476",
    appId: "1:491693742476:web:d900827db8ffbd1fd95ea9",
    measurementId: "G-Z4HE0XHNER"
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app);

export { auth, database, db };
