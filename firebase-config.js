// Firebase Configuration and Initialization
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE PROJECT KEYS
const firebaseConfig = {
    apiKey: "AIzaSyCGEHnD4MXQjWZTz5csZ8hAC72UvR1FX-U",
    authDomain: "estebain-1906b.firebaseapp.com",
    databaseURL: "https://estebain-1906b-default-rtdb.firebaseio.com",
    projectId: "estebain-1906b",
    storageBucket: "estebain-1906b.firebasestorage.app",
    messagingSenderId: "32544885408",
    appId: "1:32544885408:web:ad7160dca975a11d6157c5",
    measurementId: "G-ZT4EFCQPZ7"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app);

export { auth, database, db };
