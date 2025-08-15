// File: firebase.js

// Impor fungsi-fungsi yang Anda butuhkan dari paket 'firebase'
// Pastikan Anda sudah menjalankan 'npm install firebase' atau 'yarn add firebase'
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ===================================================================
// --- MASUKKAN KONFIGURASI FIREBASE ANDA DARI FIREBASE CONSOLE ---
// Anda bisa mendapatkan ini dari Project Settings di website Firebase
// ===================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDJTS2-XcoJCIR3OYDTE2-oqsUjorA4P-M",
    authDomain: "jurnal-trading-saya.firebaseapp.com",
    projectId: "jurnal-trading-saya",
    storageBucket: "jurnal-trading-saya.firebasestorage.app",
    messagingSenderId: "55282716936",
    appId: "1:55282716936:web:0d631d8ada6f89c7411cbd",
    measurementId: "G-BZ0D0MZXJV"
  };
// ===================================================================

// Inisialisasi Firebase HANYA SATU KALI
const app = initializeApp(firebaseConfig);

// Siapkan dan ekspor service yang akan digunakan di seluruh aplikasi
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Ekspor semua yang dibutuhkan agar bisa diimpor di file lain
export { db, auth, storage, Timestamp };