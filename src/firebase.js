// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyDJTS2-XcoJCIR3OYDTE2-oqsUjorA4P-M",
  authDomain: "jurnal-trading-saya.firebaseapp.com",
  projectId: "jurnal-trading-saya",
  storageBucket: "jurnal-trading-saya.firebasestorage.app",
  messagingSenderId: "55282716936",
  appId: "1:55282716936:web:0d631d8ada6f89c7411cbd",
  measurementId: "G-BZ0D0MZXJV"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan yang akan digunakan
export const db = getFirestore(app);
export const storage = getStorage(app);
