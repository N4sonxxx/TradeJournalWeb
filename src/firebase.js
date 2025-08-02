// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJTS2-XcoJCIR3OYDTE2-oqsUjorA4P-M",
  authDomain: "jurnal-trading-saya.firebaseapp.com",
  projectId: "jurnal-trading-saya",
  storageBucket: "jurnal-trading-saya.firebasestorage.app",
  messagingSenderId: "55282716936",
  appId: "1:55282716936:web:0d631d8ada6f89c7411cbd",
  measurementId: "G-BZ0D0MZXJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);