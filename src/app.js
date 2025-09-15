import React, { useState, useEffect, useMemo, useRef, memo } from 'react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    setDoc, 
    Timestamp, 
    orderBy,
    runTransaction,
    increment
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDJTS2-XcoJCIR3OYDTE2-oqsUjorA4P-M",
    authDomain: "jurnal-trading-saya.firebaseapp.com",
    projectId: "jurnal-trading-saya",
    storageBucket: "jurnal-trading-saya.firebasestorage.app",
    messagingSenderId: "55282716936",
    appId: "1:55282716936:web:0d631d8ada6f89c7411cbd",
    measurementId: "G-BZ0D0MZXJV"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// --- Gemini API Helper ---
const callGeminiAPI = async (userQuery, systemInstruction, useGrounding = false, jsonSchema = null) => {
    const apiKey = "AIzaSyCwiCfrPq6J0deEbYewPDw5bJMgdpJxTag";
    const model = 'gemini-2.5-flash-preview-05-20';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
    };

    if (useGrounding) {
        payload.tools = [{ "google_search": {} }];
    }

    if (jsonSchema) {
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        };
    }

    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error('Gemini API Error:', errorBody);
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                if (jsonSchema) {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error("Failed to parse JSON response from AI:", text);
                        throw new Error("AI returned invalid JSON.");
                    }
                }
                return text;
            } else {
                console.error("Unexpected API response structure:", result);
                throw new Error("Invalid response from AI.");
            }

        } catch (error) {
            console.error(`Gemini API attempt ${attempts + 1} failed:`, error);
            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(res => setTimeout(res, (2 ** attempts) * 1000));
            } else {
                throw error;
            }
        }
    }
};

// --- Helper Functions & SVG Icons ---
const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0.00';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// --- SVG Icons (using memo for performance) ---
const CloseIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const TargetIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const MoonIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const SunIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const NoteIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"></path><path d="M16 3l-4 4-4-4"></path></svg>;
const MagicWandIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 4V2m0 18v-2m5-13h2M2 9h2m13 5l1.4-1.4M4.6 19.4L6 18m13.4-13.4L18 6m-12 12l1.4-1.4M9 4v2m6 14v2M4 9h2m13 5l-1.4 1.4M6 6l-1.4-1.4M18 18l-1.4 1.4"></path><path d="M9 15l6-6"></path><path d="M9 9l6 6"></path></svg>;
const ImageIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const UserIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const MoreVerticalIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;
const EditIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const ThumbsUpIcon = ({ className, filled }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 3 3.88Z"></path></svg>;
const ThumbsDownIcon = ({ className, filled }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a2 2 0 0 1-3-3.88Z"></path></svg>;
const MessageSquareIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const SendIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const BullIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2v4"/><path d="m15 6-3.4 3.4"/><path d="M12 12.5V12h.5a2.5 2.5 0 1 0 0-5H12v-.5a2.5 2.5 0 1 0-5 0v.5h.5a2.5 2.5 0 1 0 0 5H7v.5a2.5 2.5 0 1 0 5 0Z"/><path d="M12 16v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2"/><path d="M12 16v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2"/></svg>;
const BearIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22v-4"/><path d="m15 18-3.4-3.4"/><path d="M12 11.5V12h.5a2.5 2.5 0 1 0 0-5H12v-.5a2.5 2.5 0 1 0-5 0v.5h.5a2.5 2.5 0 1 0 0 5H7v.5a2.5 2.5 0 1 0 5 0Z"/><path d="M12 8V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/><path d="M12 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>;
const CheckCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const StarIcon = ({ className, filled }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const DownloadIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const PlusCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const MinusCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ChevronLeftIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>;
const AlertTriangleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const SettingsIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const LogOutIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const DollarSignIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const PercentIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>;
const CalendarIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClipboardCheckIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>;

const BarChartIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;


// --- Interactive Background Component ---
const InteractiveHeroBackground = memo(({ theme }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particlesArray = [];
        let animationFrameId;
        
        const setCanvasSize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.offsetWidth;
                canvas.height = canvas.parentElement.offsetHeight;
            }
        };

        class Particle {
            constructor(x, y, directionX, directionY, size, color) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
            update() {
                if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
                if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }
        }

        function init() {
            particlesArray = [];
            const particleColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
            const numberOfParticles = (canvas.height * canvas.width) / 12000;
            for (let i = 0; i < numberOfParticles; i++) {
                const size = (Math.random() * 2) + 0.5;
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const directionX = (Math.random() * 0.4) - 0.2;
                const directionY = (Math.random() * 0.4) - 0.2;
                particlesArray.push(new Particle(x, y, directionX, directionY, size, particleColor));
            }
        }
        
        function connect() {
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    const distance = ((particlesArray[a].x - particlesArray[b].x) ** 2) + ((particlesArray[a].y - particlesArray[b].y) ** 2);
                    if (distance < (canvas.width / 8) * (canvas.height / 8)) {
                        const opacity = 1 - (distance / 18000);
                        if (opacity > 0) {
                            const rgb = theme === 'dark' ? '255,255,255' : '0,0,0';
                            ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                            ctx.stroke();
                        }
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesArray.forEach(p => p.update());
            connect();
            animationFrameId = requestAnimationFrame(animate);
        }

        function handleResize() {
            cancelAnimationFrame(animationFrameId);
            setCanvasSize();
            init();
            animate();
        }

        setCanvasSize();
        init();
        animate();

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [theme]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full" />;
});


// --- TradingView Widget Component ---
const TradingViewWidget = memo(function TradingViewWidget() {
    const container = useRef(null);
    const theme = localStorage.getItem('themeV12') || 'dark';

    useEffect(() => {
        if (container.current) {
            const script = document.createElement("script");
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
            script.type = "text/javascript";
            script.async = true;
            script.innerHTML = `
            {
                "allow_symbol_change": true,
                "calendar": false,
                "details": false,
                "hide_side_toolbar": false,
                "hide_top_toolbar": false,
                "hide_legend": false,
                "hide_volume": true,
                "hotlist": false,
                "interval": "15",
                "locale": "en",
                "save_image": true,
                "style": "1",
                "symbol": "OANDA:XAUUSD",
                "theme": "${theme}",
                "timezone": "America/New_York",
                "backgroundColor": "${theme === 'dark' ? '#1f2937' : '#FFFFFF'}",
                "gridColor": "${theme === 'dark' ? 'rgba(242, 242, 242, 0.06)' : 'rgba(0, 0, 0, 0.06)'}",
                "watchlist": [],
                "withdateranges": true,
                "compareSymbols": [],
                "studies": [],
                "autosize": true
            }`;
            // Ensure the container is cleared before appending a new script
            container.current.innerHTML = '';
            container.current.appendChild(script);
        }
    }, [theme]); // Re-render widget if theme changes

    return (
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md h-[550px]">
            <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
                <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/symbols/OANDA-XAUUSD/?exchange=OANDA" rel="noopener nofollow" target="_blank"><span className="blue-text">XAUUSD chart by TradingView</span></a></div>
            </div>
        </div>
    );
});

const TickerTapeWidget = memo(function TickerTapeWidget({ theme }) {
    const container = useRef(null);

    useEffect(() => {
        if (container.current) {
            const script = document.createElement("script");
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
            script.type = "text/javascript";
            script.async = true;
            script.innerHTML = `
            {
              "symbols": [
                {"proName": "FOREXCOM:SPXUSD", "title": "S&P 500 Index"},
                {"proName": "FOREXCOM:NSXUSD", "title": "US 100 Cash CFD"},
                {"proName": "BITSTAMP:BTCUSD", "title": "Bitcoin"},
                {"proName": "OANDA:XAUUSD", "title": "Gold"}
              ],
              "showSymbolLogo": true,
              "isTransparent": true,
              "displayMode": "adaptive",
              "colorTheme": "${theme}",
              "locale": "en"
            }`;
            container.current.innerHTML = ''; // Clear previous widget to prevent duplicates
            container.current.appendChild(script);
        }
    }, [theme]);

    return (
        <div className="tradingview-widget-container" ref={container}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
});


// --- Components ---

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{message}</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-semibold">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

// --- Landing Page Component ---
const LandingPage = ({ onEnter, theme, setTheme }) => {
    const AnimatedSection = ({ children }) => {
        const ref = useRef(null);
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                },
                { threshold: 0.1 }
            );

            const currentRef = ref.current;
            if (currentRef) {
                observer.observe(currentRef);
            }

            return () => {
                if (currentRef) {
                    observer.unobserve(currentRef);
                }
            };
        }, []);

        return (
            <div ref={ref} className={`transition-all duration-1000 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {children}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-6 sm:px-8">
                    <div className="flex justify-between items-center py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center space-x-2">
                            <TargetIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                            <span className="text-xl font-bold">Spotter Trade AI</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition">{theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}</button>
                            <button onClick={onEnter} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 px-5 rounded-full transition-colors">
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative text-center py-24 sm:py-32 lg:py-40 px-6 overflow-hidden">
                    {/* Interactive Background */}
                    <InteractiveHeroBackground theme={theme} />
                    
                    <div className="relative z-10">
                        <AnimatedSection>
                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white">
                                The Future of Trading is Here.
                            </h1>
                            <p className="max-w-2xl mx-auto mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                                Elevate your trading with our intelligent journal. Log, analyze, and get personalized AI-driven insights to master the markets.
                            </p>
                            <button onClick={onEnter} className="mt-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                                Get Started Now
                            </button>
                        </AnimatedSection>
                    </div>
                </section>

                {/* Ticker Tape Widget */}
                <div className="py-2 bg-white dark:bg-black border-y border-gray-200 dark:border-gray-800">
                    <TickerTapeWidget theme={theme} />
                </div>

                {/* Feature Showcase 1 */}
                <section className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-6 sm:px-8">
                        <AnimatedSection>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Journal with Intelligence</h2>
                                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                                        Go beyond simple note-taking. Tag your setups, rate your execution, and attach chart screenshots to every trade for a complete visual record of your decisions.
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                                    <div className="flex items-center">
                                        <NoteIcon className="w-10 h-10 text-blue-500" />
                                        <h3 className="ml-4 text-xl font-semibold">Trade Log Entry</h3>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                                        <div className="w-3/4 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                                        <div className="flex space-x-2 mt-2">
                                            <div className="px-3 py-1 bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">Breakout</div>
                                            <div className="px-3 py-1 bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold">5-Star</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* Feature Showcase 2 */}
                <section className="py-20 sm:py-28">
                    <div className="max-w-7xl mx-auto px-6 sm:px-8">
                        <AnimatedSection>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="order-2 md:order-1 text-center md:text-left">
                                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Your Personal AI Trading Coach</h2>
                                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                                        Leverage the power of Gemini AI. Get objective feedback on your trade rationale, identify psychological biases, and receive actionable advice to improve your strategy.
                                    </p>
                                </div>
                                 <div className="order-1 md:order-2 bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-2xl shadow-2xl text-white">
                                    <div className="flex items-center">
                                        <MagicWandIcon className="w-10 h-10" />
                                        <h3 className="ml-4 text-xl font-semibold">AI Coach Feedback</h3>
                                    </div>
                                    <p className="mt-4 italic opacity-80">"Your entry was well-timed with the breakout, but your notes suggest a hint of FOMO. Consider waiting for a re-test on similar future setups to increase probability."</p>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>
                
                {/* Features Grid */}
                <section className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900">
                     <div className="max-w-7xl mx-auto px-6 sm:px-8">
                        <AnimatedSection>
                            <div className="text-center">
                                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">A Full Suite of Professional Tools</h2>
                                <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600 dark:text-gray-400">
                                    Everything you need to analyze, improve, and connect.
                                </p>
                            </div>
                        </AnimatedSection>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatedSection>
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg h-full">
                                    <BarChartIcon className="w-10 h-10 text-green-500" />
                                    <h3 className="mt-4 text-xl font-semibold">Advanced Analytics</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">Track key metrics like win rate, P&L by day, and strategy performance to find your edge.</p>
                                </div>
                            </AnimatedSection>
                             <AnimatedSection>
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg h-full">
                                    <ImageIcon className="w-10 h-10 text-orange-500" />
                                    <h3 className="mt-4 text-xl font-semibold">AI Chart Analyzer</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">Upload any chart screenshot and get an instant, AI-powered technical analysis with potential trade setups.</p>
                                </div>
                            </AnimatedSection>
                             <AnimatedSection>
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg h-full">
                                    <UserIcon className="w-10 h-10 text-purple-500" />
                                    <h3 className="mt-4 text-xl font-semibold">Community Feed</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">Share your insights, discuss strategies, and learn from a community of dedicated traders.</p>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="text-center py-24 sm:py-32 lg:py-40 px-6">
                    <AnimatedSection>
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Stop Guessing. Start Improving.</h2>
                        <p className="max-w-2xl mx-auto mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                            Join today and turn your trading data into your most valuable asset. The journey to consistent profitability starts now.
                        </p>
                        <button onClick={onEnter} className="mt-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                            Sign In & Analyze
                        </button>
                    </AnimatedSection>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto py-12 px-6 sm:px-8 text-center text-gray-500 dark:text-gray-400">
                    <p>&copy; {new Date().getFullYear()} TradeJournal AI. All rights reserved.</p>
                    <p className="text-xs mt-2">This is a tool for educational purposes only and does not constitute financial advice.</p>
                </div>
            </footer>
        </div>
    );
};

const PostItem = ({ post, user, profileData }) => {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(post.title);
    const [editedContent, setEditedContent] = useState(post.content);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    
    // --- State for editing post images ---
    const [editedImageFile, setEditedImageFile] = useState(null);
    const [editedImagePreview, setEditedImagePreview] = useState(post.imageUrl || '');
    const editFileInputRef = useRef(null);
    
    // NOTE: This collection MUST be configured in your Firestore Security Rules
    // to allow public read/write access for all authenticated users.
    // Example Rule: 
    // rules_version = '2';
    // service cloud.firestore {
    //   match /databases/{database}/documents {
    //     // ... other rules for user data
    //     match /community_feed/{postId=**} {
    //       allow read, write: if request.auth != null;
    //     }
    //   }
    // }
    const postRef = doc(db, 'community_feed', post.id);

    const hasLiked = post.likes?.includes(user.uid);
    const hasDisliked = post.dislikes?.includes(user.uid);

    useEffect(() => {
        if (!showComments) return;

        const commentsQuery = query(collection(postRef, 'comments'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setComments(commentsData);
        });
        return () => unsubscribe();
    }, [showComments, post.id]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    // --- Effect to reset edit state when edit mode is toggled ---
    useEffect(() => {
        if (isEditing) {
            setEditedTitle(post.title);
            setEditedContent(post.content);
            setEditedImagePreview(post.imageUrl || '');
            setEditedImageFile(null); // Reset file on new edit session
        }
    }, [isEditing, post]);

    const handleVote = async (voteType) => {
        try {
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) throw "Document does not exist!";
                
                let likes = postDoc.data().likes || [];
                let dislikes = postDoc.data().dislikes || [];

                const wasLiked = likes.includes(user.uid);
                const wasDisliked = dislikes.includes(user.uid);

                if (voteType === 'like') {
                    if (wasLiked) { // un-like
                        likes = likes.filter(uid => uid !== user.uid);
                    } else { // like
                        likes.push(user.uid);
                        if (wasDisliked) { // remove dislike if it exists
                           dislikes = dislikes.filter(uid => uid !== user.uid);
                        }
                    }
                } else if (voteType === 'dislike') {
                     if (wasDisliked) { // un-dislike
                        dislikes = dislikes.filter(uid => uid !== user.uid);
                    } else { // dislike
                        dislikes.push(user.uid);
                        if (wasLiked) { // remove like if it exists
                           likes = likes.filter(uid => uid !== user.uid);
                        }
                    }
                }
                
                transaction.update(postRef, { likes, dislikes });
            });
        } catch (e) {
            console.error("Vote transaction failed: ", e);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const commentsColRef = collection(postRef, 'comments');
        try {
            await addDoc(commentsColRef, {
                text: newComment,
                authorId: user.uid,
                authorDisplayName: profileData.displayName || user.email,
                createdAt: Timestamp.now(),
            });

            await updateDoc(postRef, { commentCount: increment(1) });
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePost = async () => {
        try {
            // If the post has an image, delete it from Storage first
            if (post.imageUrl) {
                const imageRef = ref(storage, post.imageUrl);
                await deleteObject(imageRef);
            }
            // Then delete the post document from Firestore
            await deleteDoc(doc(db, 'community_feed', post.id));
        } catch (error) {
            // It's okay if the image doesn't exist, so we only log other errors
            if (error.code !== 'storage/object-not-found') {
                 console.error("Error deleting post and/or image:", error);
            }
        }
        setShowDeleteConfirm(null);
    };

    const handleUpdatePost = async (e) => {
        e.preventDefault();
        if (!editedTitle.trim() || !editedContent.trim()) return;
        try {
            let finalImageUrl = post.imageUrl;

            if (editedImageFile) { // New image selected
                if (post.imageUrl) {
                    try { await deleteObject(ref(storage, post.imageUrl)); } catch (e) { console.warn("Old image not found, continuing update"); }
                }
                const newImageRef = ref(storage, `community_feed/${post.id}/${Date.now()}_${editedImageFile.name}`);
                await uploadBytes(newImageRef, editedImageFile);
                finalImageUrl = await getDownloadURL(newImageRef);
            } else if (!editedImagePreview && post.imageUrl) { // Image removed
                try { await deleteObject(ref(storage, post.imageUrl)); } catch (e) { console.warn("Image to remove not found"); }
                finalImageUrl = '';
            }
            
            await updateDoc(postRef, { title: editedTitle, content: editedContent, imageUrl: finalImageUrl });
            setIsEditing(false);
            setIsMenuOpen(false);
        } catch (error) {
            console.error("Error updating post:", error);
        }
    };
    
    const handleEditImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditedImageFile(file);
            setEditedImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditRemoveImage = () => {
        setEditedImageFile(null);
        setEditedImagePreview('');
        if (editFileInputRef.current) {
            editFileInputRef.current.value = "";
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await deleteDoc(doc(db, 'community_feed', post.id, 'comments', commentId));
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) throw "Document does not exist!";
                const newCount = (postDoc.data().commentCount || 0) - 1;
                transaction.update(postRef, { commentCount: newCount < 0 ? 0 : newCount });
            });
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
        setShowDeleteConfirm(null);
    };

    const handleUpdateComment = async (e) => {
        e.preventDefault();
        if (!editingComment || !editingComment.text.trim()) return;
        const commentRef = doc(db, 'community_feed', post.id, 'comments', editingComment.id);
        try {
            await updateDoc(commentRef, { text: editingComment.text });
            setEditingComment(null);
        } catch (error) {
            console.error("Error updating comment:", error);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md relative">
             <ConfirmationModal
                isOpen={!!showDeleteConfirm}
                title={showDeleteConfirm?.type === 'post' ? 'Delete Post' : 'Delete Comment'}
                message={`Are you sure you want to permanently delete this ${showDeleteConfirm?.type}? This action cannot be undone.`}
                onConfirm={() => showDeleteConfirm.type === 'post' ? handleDeletePost() : handleDeleteComment(showDeleteConfirm.id)}
                onCancel={() => setShowDeleteConfirm(null)}
            />
            <div className="flex items-start space-x-4">
                 <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center font-bold text-lg text-gray-500 dark:text-gray-300">
                    {post.authorDisplayName ? post.authorDisplayName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                    {isEditing ? (
                         <form onSubmit={handleUpdatePost}>
                            <input 
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                         </form>
                    ) : (
                        <h3 className="text-xl font-bold">{post.title}</h3>
                    )}
                     <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Posted by {post.authorDisplayName || 'Anonymous'}</span>
                        <span>&bull;</span>
                        <span>{new Date(post.createdAt.toDate()).toLocaleString()}</span>
                    </div>
                </div>
                {user.uid === post.authorId && !isEditing && (
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <MoreVerticalIcon className="w-5 h-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                                <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <EditIcon className="w-4 h-4 mr-2" /> Edit Post
                                </button>
                                <button onClick={() => setShowDeleteConfirm({ type: 'post' })} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <TrashIcon className="w-4 h-4 mr-2" /> Delete Post
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isEditing ? (
                <form onSubmit={handleUpdatePost} className="mt-4 space-y-4">
                    <textarea 
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows="5"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Post Image</label>
                        {editedImagePreview && (
                            <div className="mt-2 relative">
                                <img src={editedImagePreview} alt="Post image" className="max-h-48 rounded-md w-auto" />
                                <button type="button" onClick={handleEditRemoveImage} className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"><CloseIcon className="w-4 h-4" /></button>
                            </div>
                        )}
                        <div className="mt-2">
                            <button type="button" onClick={() => editFileInputRef.current.click()} className="flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                                <ImageIcon className="w-5 h-5" />
                                <span>{editedImagePreview ? 'Change Image' : 'Add Image'}</span>
                            </button>
                            <input type="file" ref={editFileInputRef} onChange={handleEditImageSelect} className="hidden" accept="image/*" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                         <button onClick={() => setIsEditing(false)} type="button" className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-semibold py-1 px-3 rounded-md">Cancel</button>
                         <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-3 rounded-md">Save Changes</button>
                    </div>
                </form>
            ) : (
                <p className="mt-4 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
            )}

            {post.imageUrl && !isEditing && (
                <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={post.imageUrl} alt="User upload" className="w-full h-auto max-h-[60vh] object-contain bg-gray-100 dark:bg-gray-900" />
                </div>
            )}

            <div className="mt-4 flex items-center space-x-6 text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleVote('like')} className={`p-1 rounded-full transition ${hasLiked ? 'text-blue-500' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <ThumbsUpIcon className="w-5 h-5" filled={hasLiked} />
                    </button>
                    <span className="text-sm font-semibold">{post.likes?.length || 0}</span>
                </div>
                 <div className="flex items-center space-x-2">
                    <button onClick={() => handleVote('dislike')} className={`p-1 rounded-full transition ${hasDisliked ? 'text-red-500' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <ThumbsDownIcon className="w-5 h-5" filled={hasDisliked} />
                    </button>
                    <span className="text-sm font-semibold">{post.dislikes?.length || 0}</span>
                </div>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 hover:text-blue-500 dark:hover:text-blue-400 transition">
                    <MessageSquareIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{post.commentCount || 0} Comments</span>
                </button>
            </div>
            {showComments && (
                <div className="mt-4">
                    <form onSubmit={handleAddComment} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-gray-100 dark:bg-gray-700 border-transparent rounded-full py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            disabled={isSubmitting}
                        />
                        <button type="submit" className="text-blue-600 hover:text-blue-500 disabled:opacity-50" disabled={isSubmitting || !newComment}>
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </form>
                    <div className="mt-4">
                        {comments.length > 0 
                            ? comments.map(c => (
                                <div key={c.id} className="flex items-start space-x-3 py-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 items-center justify-center font-bold text-sm text-gray-500 dark:text-gray-300">
                                        {c.authorDisplayName ? c.authorDisplayName.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <p className="font-semibold text-sm">{c.authorDisplayName || 'Anonymous'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {c.createdAt ? new Date(c.createdAt.toDate()).toLocaleString() : 'Just now'}
                                            </p>
                                        </div>
                                        {editingComment?.id === c.id ? (
                                            <form onSubmit={handleUpdateComment} className="mt-2 flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={editingComment.text}
                                                    onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                                    className="w-full text-sm bg-gray-100 dark:bg-gray-700 border-transparent rounded-md py-1 px-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex space-x-1">
                                                    <button type="submit" className="text-green-500 hover:text-green-400 text-xs font-semibold">Save</button>
                                                    <button type="button" onClick={() => setEditingComment(null)} className="text-gray-500 hover:text-gray-400 text-xs font-semibold">Cancel</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <p className="text-sm mt-1">{c.text}</p>
                                        )}
                                    </div>
                                    {user.uid === c.authorId && !editingComment && (
                                        <div className="flex items-center space-x-1">
                                            <button onClick={() => setEditingComment({ id: c.id, text: c.text })} className="p-1 rounded-full text-gray-400 hover:text-blue-500">
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setShowDeleteConfirm({ type: 'comment', id: c.id })} className="p-1 rounded-full text-gray-400 hover:text-red-500">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )) 
                            : <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">No comments yet. Be the first!</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const AnalysisDetailModal = ({ item, onClose, onUpdateOutcome }) => {
    if (!item) return null;

    const AnalysisCard = ({ title, value, icon, colorClass }) => (
        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className={`flex items-center text-sm font-bold ${colorClass}`}>
                {icon}
                <h4 className="ml-2 uppercase tracking-wider">{title}</h4>
            </div>
            <p className="mt-2 text-xl font-mono">{value}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white z-10">
                    <CloseIcon className="w-6 h-6"/>
                </button>
                <h2 className="text-2xl font-bold mb-4">Analysis Details</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image Column */}
                    <div>
                         <p className="text-xs text-gray-400 mb-2">{item.timestamp.toDate().toLocaleString()}</p>
                         <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img src={item.imageUrl} alt="Analyzed chart" className="w-full h-auto object-contain bg-gray-100 dark:bg-gray-900"/>
                         </div>
                    </div>
                    {/* Analysis Column */}
                    <div className="space-y-4">
                         <AnalysisCard 
                            title="Sentiment"
                            value={item.analysis.sentiment}
                            icon={item.analysis.sentiment === 'Bullish' ? <BullIcon className="w-6 h-6"/> : <BearIcon className="w-6 h-6"/>}
                            colorClass={item.analysis.sentiment === 'Bullish' ? 'text-green-500' : 'text-red-500'}
                        />
                        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rationale</p>
                            <p className="mt-2 text-sm">{item.analysis.rationale}</p>
                        </div>
                        <AnalysisCard title="Entry Position" value={item.analysis.entry} icon={<CheckCircleIcon className="w-6 h-6"/>} colorClass="text-blue-500" />
                        <AnalysisCard title="Stop Loss" value={item.analysis.stopLoss} icon={<XCircleIcon className="w-6 h-6"/>} colorClass="text-orange-500" />
                        <AnalysisCard title="Take Profit" value={item.analysis.takeProfit} icon={<TargetIcon className="w-6 h-6"/>} colorClass="text-purple-500" />

                        {/* Outcome Section */}
                        <div className="pt-4">
                             <h4 className="font-bold text-lg mb-2">Outcome</h4>
                             <div className="flex-shrink-0 flex gap-2 w-full">
                                {item.outcome === 'pending' ? (
                                    <>
                                        <button onClick={() => { onUpdateOutcome(item.id, 'tp_hit'); onClose(); }} className="w-full font-semibold py-2 px-3 rounded bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80 transition">Hit TP</button>
                                        <button onClick={() => { onUpdateOutcome(item.id, 'sl_hit'); onClose(); }} className="w-full font-semibold py-2 px-3 rounded bg-red-200 text-red-800 hover:bg-red-300 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80 transition">Hit SL</button>
                                        <button onClick={() => { onUpdateOutcome(item.id, 'not_taken'); onClose(); }} className="w-full font-semibold py-2 px-3 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 transition">Not Taken</button>
                                    </>
                                ) : (
                                    <div className={`text-center w-full font-bold py-2 px-3 rounded ${
                                        item.outcome === 'tp_hit' ? 'bg-green-500/20 text-green-500' : 
                                        item.outcome === 'sl_hit' ? 'bg-red-500/20 text-red-500' :
                                        'bg-gray-500/20 text-gray-500'
                                    }`}>
                                        {item.outcome === 'tp_hit' ? 'TP Hit' : item.outcome === 'sl_hit' ? 'SL Hit' : 'Order Not Taken'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChartAnalyzerPage = ({ user }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const [history, setHistory] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    useEffect(() => {
        if (!user) return;
        const historyCollectionPath = `users/${user.uid}/chart_analyses`;
        const q = query(collection(db, historyCollectionPath), orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistory(historyData);
            setIsHistoryLoading(false);
        }, (err) => {
            console.error("Error fetching analysis history:", err);
            setError("Could not load analysis history.");
            setIsHistoryLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
                setError('Image size cannot exceed 4MB.');
                return;
            }
            setError('');
            setAnalysis(null);
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile || !user) return;
        setIsLoading(true);
        setError('');
        setAnalysis(null);

        try {
            // Step 1: Upload image to storage to get a permanent URL
            const storageRef = ref(storage, `chart_analyses/${user.uid}/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(storageRef);
            
            const base64Image = await fileToBase64(imageFile);
            
            const systemInstruction = `You are an expert technical analyst for financial markets. Analyze the provided chart image and return a JSON object with your findings.
- "sentiment" should be either "Bullish" or "Bearish".
- "entry" should suggest a specific price or price range for a potential trade entry.
- "stopLoss" should suggest a specific price for a stop loss order.
- "takeProfit" should suggest a specific price for a take profit order.
Provide a concise rationale for each point. This is for educational purposes ONLY and is NOT financial advice.`;

            const userQuery = "Analyze this financial chart and provide potential trade parameters based on technical patterns.";
            
            const jsonSchema = {
                type: "OBJECT",
                properties: {
                    sentiment: { type: "STRING", description: "Overall market sentiment (Bullish or Bearish)." },
                    entry: { type: "STRING", description: "Suggested entry price or range." },
                    stopLoss: { type: "STRING", description: "Suggested stop loss price." },
                    takeProfit: { type: "STRING", description: "Suggested take profit price." },
                    rationale: { type: "STRING", description: "Brief rationale for the analysis." }
                },
                required: ["sentiment", "entry", "stopLoss", "takeProfit", "rationale"]
            };
            
            // This is a vision call, so we construct the payload with text and image data.
            const payload = {
                contents: [{
                    parts: [
                        { text: userQuery },
                        { inlineData: { mimeType: imageFile.type, data: base64Image } }
                    ]
                }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema,
                },
            };

            const apiKey = "AIzaSyCwiCfrPq6J0deEbYewPDw5bJMgdpJxTag";
            const model = 'gemini-2.5-flash-preview-05-20';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error('Gemini Vision API Error:', errorBody);
                throw new Error(`API error: ${response.statusText}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                console.error("Unexpected Vision API response structure:", result);
                throw new Error("Invalid response from AI.");
            }

            const parsedAnalysis = JSON.parse(text);
            setAnalysis(parsedAnalysis);

            // Step 2: Save the analysis to Firestore
            const historyCollectionPath = `users/${user.uid}/chart_analyses`;
            await addDoc(collection(db, historyCollectionPath), {
                userId: user.uid,
                timestamp: Timestamp.now(),
                imageUrl: imageUrl, // Save the storage URL
                analysis: parsedAnalysis, // Save the parsed JSON analysis
                outcome: 'pending' // Initial outcome
            });

        } catch (err) {
            console.error("Analysis failed:", err);
            setError(`Analysis failed. ${err.message}. Please try a clearer chart image or try again later.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateOutcome = async (id, newOutcome) => {
        if (!user) return;
        const docRef = doc(db, `users/${user.uid}/chart_analyses`, id);
        try {
            await updateDoc(docRef, { outcome: newOutcome });
        } catch (error) {
            console.error("Error updating outcome: ", error);
        }
    };

    const handleDeleteAnalysis = async (itemToDelete) => {
        if (!user || !itemToDelete) return;
        try {
            if (itemToDelete.imageUrl) {
                const imageRef = ref(storage, itemToDelete.imageUrl);
                await deleteObject(imageRef);
            }
            const docRef = doc(db, `users/${user.uid}/chart_analyses`, itemToDelete.id);
            await deleteDoc(docRef);
        } catch (error) {
            if (error.code !== 'storage/object-not-found') {
                console.error("Error deleting analysis:", error);
                setError("Failed to delete the analysis. Please try again.");
            } else {
                 try {
                    const docRef = doc(db, `users/${user.uid}/chart_analyses`, itemToDelete.id);
                    await deleteDoc(docRef);
                 } catch(e) {
                     console.error("Error deleting firestore doc after storage error:", e);
                 }
            }
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const AnalysisCard = ({ title, value, icon, colorClass }) => (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className={`flex items-center text-sm font-bold ${colorClass}`}>
                {icon}
                <h4 className="ml-2 uppercase tracking-wider">{title}</h4>
            </div>
            <p className="mt-2 text-xl font-mono">{value}</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <ConfirmationModal
                isOpen={!!showDeleteConfirm}
                title="Delete Analysis"
                message="Are you sure you want to permanently delete this analysis and its chart image? This action cannot be undone."
                onConfirm={() => handleDeleteAnalysis(showDeleteConfirm)}
                onCancel={() => setShowDeleteConfirm(null)}
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h2 className="text-3xl font-bold mb-2">AI Chart Analyzer</h2>
                <p className="text-gray-500 dark:text-gray-400">Upload a chart image to get an AI-powered technical analysis.</p>
                
                <div 
                    className="mt-6 w-full h-80 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-300"
                    onClick={() => fileInputRef.current.click()}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Chart preview" className="max-w-full max-h-full object-contain rounded-md" />
                    ) : (
                        <div className="text-gray-400 dark:text-gray-500">
                            <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                            <p className="font-semibold">Click to upload or drag & drop</p>
                            <p className="text-xs mt-1">PNG, JPG, WEBP up to 4MB</p>
                        </div>
                    )}
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />

                {imagePreview && (
                    <button 
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="mt-6 w-full max-w-xs flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed mx-auto transform hover:scale-105"
                    >
                        <MagicWandIcon className="w-5 h-5" />
                        <span>{isLoading ? 'Analyzing...' : 'Analyze Chart'}</span>
                    </button>
                )}
            </div>
            
            {error && (
                <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-r-lg" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {isLoading && (
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                    <div className="animate-pulse flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="grid grid-cols-2 gap-4 w-full pt-4">
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                 </div>
            )}

            {analysis && !isLoading && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold mb-6 text-center">Analysis Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnalysisCard 
                            title="Sentiment"
                            value={analysis.sentiment}
                            icon={analysis.sentiment === 'Bullish' ? <BullIcon className="w-6 h-6"/> : <BearIcon className="w-6 h-6"/>}
                            colorClass={analysis.sentiment === 'Bullish' ? 'text-green-500' : 'text-red-500'}
                        />
                        <div className="md:col-span-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rationale</p>
                            <p className="mt-2 text-sm">{analysis.rationale}</p>
                        </div>
                        <AnalysisCard title="Entry Position" value={analysis.entry} icon={<CheckCircleIcon className="w-6 h-6"/>} colorClass="text-blue-500" />
                        <AnalysisCard title="Stop Loss" value={analysis.stopLoss} icon={<XCircleIcon className="w-6 h-6"/>} colorClass="text-orange-500" />
                        <AnalysisCard title="Take Profit" value={analysis.takeProfit} icon={<TargetIcon className="w-6 h-6"/>} colorClass="text-purple-500" />
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Analysis History</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {isHistoryLoading ? (
                        <p className="text-center text-gray-500 py-4">Loading history...</p>
                    ) : history.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No analyses saved yet.</p>
                    ) : (
                        history.map(item => (
                            <div 
                                key={item.id} 
                                className="relative group"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(item);
                                    }}
                                    className="absolute top-2 left-2 z-10 p-1 bg-gray-600 bg-opacity-50 text-white rounded-full hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Analysis"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                                <div 
                                    onClick={() => setSelectedHistory(item)}
                                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <div className="flex items-start gap-4">
                                        <img src={item.imageUrl} alt="Chart thumbnail" className="w-20 h-20 object-cover rounded-md flex-shrink-0 border border-gray-200 dark:border-gray-600" />
                                        <div>
                                            <p className="font-bold">{new Date(item.timestamp.toDate()).toLocaleDateString()}</p>
                                            <div className="flex items-center text-sm mt-1">
                                                <span className={`font-semibold ${item.analysis.sentiment === 'Bullish' ? 'text-green-500' : 'text-red-500'}`}>{item.analysis.sentiment}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 w-32 text-right">
                                    {item.outcome === 'pending' ? (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); handleUpdateOutcome(item.id, 'tp_hit'); }} className="w-full mb-1 text-xs font-semibold py-1 px-3 rounded bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80 transition">Hit TP</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleUpdateOutcome(item.id, 'sl_hit'); }} className="w-full mb-1 text-xs font-semibold py-1 px-3 rounded bg-red-200 text-red-800 hover:bg-red-300 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80 transition">Hit SL</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleUpdateOutcome(item.id, 'not_taken'); }} className="w-full text-xs font-semibold py-1 px-3 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 transition">Not Taken</button>
                                        </>
                                    ) : (
                                        <div className={`text-center font-bold text-sm py-1 px-3 rounded ${
                                            item.outcome === 'tp_hit' ? 'bg-green-500/20 text-green-500' : 
                                            item.outcome === 'sl_hit' ? 'bg-red-500/20 text-red-500' :
                                            'bg-gray-500/20 text-gray-500'
                                        }`}>
                                            {item.outcome === 'tp_hit' ? 'TP Hit' : item.outcome === 'sl_hit' ? 'SL Hit' : 'Not Taken'}
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedHistory && (
                <AnalysisDetailModal 
                    item={selectedHistory} 
                    onClose={() => setSelectedHistory(null)} 
                    onUpdateOutcome={handleUpdateOutcome} 
                />
            )}
        </div>
    );
};

const CommunityPage = ({ user, profileData }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // This query requires a public 'community_feed' collection in Firestore, see rule notes in PostItem.
        const postsQuery = query(collection(db, 'community_feed'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(postsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setNewPostImage(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setNewPostImage(null);
            setImagePreview('');
        }
    };

    const removeImage = () => {
        setNewPostImage(null);
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostTitle.trim() || !newPostContent.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // 1. Create the post document to get an ID
            const newPostRef = await addDoc(collection(db, 'community_feed'), {
                title: newPostTitle,
                content: newPostContent,
                authorId: user.uid,
                authorDisplayName: profileData.displayName || user.email,
                createdAt: Timestamp.now(),
                likes: [],
                dislikes: [],
                commentCount: 0,
                imageUrl: '' // Initialize imageUrl as empty
            });

            // 2. If there's an image, upload it
            let downloadURL = '';
            if (newPostImage) {
                // NOTE: This requires Firebase Storage rules to be configured. Example:
                // service firebase.storage {
                //   match /b/{bucket}/o {
                //     match /community_feed/{postId}/{fileName} {
                //       allow read;
                //       allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024
                //                  && request.resource.contentType.matches('image/.*');
                //     }
                //   }
                // }
                const storageRef = ref(storage, `community_feed/${newPostRef.id}/${newPostImage.name}`);
                await uploadBytes(storageRef, newPostImage);
                downloadURL = await getDownloadURL(storageRef);
                
                // 3. Update the post document with the image URL
                await updateDoc(newPostRef, { imageUrl: downloadURL });
            }

            setNewPostTitle('');
            setNewPostContent('');
            removeImage();
        } catch (error) {
            console.error("Error creating post:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Create a New Post</h2>
                <form onSubmit={handleCreatePost} className="space-y-4">
                    <div>
                        <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                        <input 
                            id="post-title"
                            type="text"
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            placeholder="What's on your mind?"
                            className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                        <textarea
                            id="post-content"
                            rows="5"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Share your thoughts, strategies, or questions with the community..."
                            className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    
                    {/* Image Upload Section */}
                    <div>
                        {imagePreview && (
                            <div className="mt-2 relative">
                                <img src={imagePreview} alt="Image preview" className="max-h-48 rounded-md w-auto" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className="mt-2 flex items-center">
                             <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                <ImageIcon className="w-5 h-5" />
                                <span>{imagePreview ? 'Change Image' : 'Add Image'}</span>
                            </button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <div className="text-right">
                         <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50"
                        >
                            {isSubmitting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Community Feed</h2>
                {isLoading ? (
                    <p className="text-center text-gray-500">Loading posts...</p>
                ) : posts.length > 0 ? (
                    posts.map(post => <PostItem key={post.id} post={post} user={user} profileData={profileData} />)
                ) : (
                    <p className="text-center text-gray-500 py-8">No posts yet. Be the first to start a conversation!</p>
                )}
            </div>
        </div>
    );
};

const AddTransactionForm = ({ onAddTransaction }) => {
    const [type, setType] = useState('Buy');
    const [pnl, setPnl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pnl === '' || isNaN(parseFloat(pnl))) {
            alert("Please enter a valid number for the amount.");
            return;
        }

        let pnlValue = parseFloat(pnl);
        if (type === 'Withdrawal') pnlValue = -Math.abs(pnlValue);
        else if (type === 'Deposit') pnlValue = Math.abs(pnlValue);

        onAddTransaction({ type, pnl: pnlValue });
        setPnl('');
        setType('Buy');
    };

    const isTrade = type === 'Buy' || type === 'Sell';

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option>Buy</option>
                        <option>Sell</option>
                        <option>Deposit</option>
                        <option>Withdrawal</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="pnl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{isTrade ? 'P&L ($)' : 'Amount ($)'}</label>
                    <input type="number" step="any" id="pnl" value={pnl} onChange={(e) => setPnl(e.target.value)} required className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md" />
                </div>
                <div className="md:pt-6">
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Add Transaction
                    </button>
                </div>
            </div>
        </form>
    );
};

const GeminiChatbot = ({ transactions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: "Hello! I'm your AI trading coach. Ask me about your recent performance or how to use the app." }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const formatMessageText = (text) => {
        const bolded = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return bolded.replace(/\n/g, '<br />');
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const userMessage = inputValue.trim();
        if (!userMessage) return;

        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInputValue('');
        setIsLoading(true);

        const systemInstruction = `You are a friendly and helpful AI assistant and trading coach for a sophisticated "Trading Journal" web application. Your dual purpose is to:
        1. Guide users on how to use the app's features.
        2. Analyze the user's provided trading data to offer insights on past performance and answer questions about their trading history.

        **App Feature Knowledge:**
        - **Dashboard Tab**: Main overview page with stats, 'Daily Briefing', 'Consistency Tracker', and 'AI Weekly Review'.
        - **Journal Tab**: Log trades ('Buy'/'Sell') and transactions ('Deposit'/'Withdrawal'). Shows the 'Equity Curve' chart and 'Transaction History'.
        - **Analytics Tab**: Deeper insights with charts like 'Performance by Day' and a 'Profit Calculator'.
        - **Calendar**: On the 'Dashboard', gives a monthly P&L overview.

        **Data Analysis Rules:**
        - You will be provided with a JSON summary of the user's recent trades.
        - You can answer questions like "What was my biggest loss recently?", "Am I trading too often?", "What patterns do you see in my losing trades based on my tags?".
        - Analyze the data provided to identify patterns in P&L, trade types, tags, and ratings.

        **CRITICAL RULES:**
        1.  **NO FINANCIAL ADVICE:** You MUST NOT provide any financial advice, predict market movements, or tell a user whether they should take a specific future trade. Do not give buy or sell signals. Your analysis is strictly historical, based ONLY on the data provided.
        2.  **EDUCATE, DON'T RECOMMEND:** If a user asks for a direct trade recommendation (e.g., "should I buy EUR/USD?"), politely decline and offer to explain the underlying concepts they should consider when making their own decision.
        3.  **STAY ON TOPIC:** For general app questions, answer concisely based on the feature summary. If asked something completely unrelated to trading or the app, politely state your purpose.`;

        // Prepare the data context for the AI
        const recentTrades = transactions.slice(0, 20).map(t => ({
            date: t.date.toDate().toISOString().split('T')[0],
            type: t.type,
            pnl: t.pnl,
            status: t.status,
            tags: t.tags || [],
            rating: t.rating || 0
        }));
        const dataContext = JSON.stringify(recentTrades, null, 2);

        const fullUserQuery = `
Based on my recent trading data below, please answer my question.

My Recent Trading Data (JSON format):
${dataContext}

My Question:
"${userMessage}"
`;
        try {
            const response = await callGeminiAPI(fullUserQuery, systemInstruction);
            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            console.error("Chatbot API error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50 transition-transform hover:scale-110"
                aria-label="Toggle AI Assistant"
            >
                <MessageSquareIcon className="w-8 h-8" />
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700">
                    <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold">AI Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex-shrink-0"></div>}
                                    <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'}`}>
                                        <p className="text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }}></p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-end gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex-shrink-0"></div>
                                    <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                                        <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-300"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask about the app..."
                            className="w-full bg-gray-100 dark:bg-gray-600 border-transparent rounded-full py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            disabled={isLoading}
                        />
                        <button type="submit" className="ml-3 text-blue-600 hover:text-blue-500 disabled:opacity-50" disabled={isLoading || !inputValue}>
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

const TagManagementPage = ({ tags, transactions, onAddTag, onUpdateTag, onDeleteTag }) => {
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#4A5568'); // default gray
    const [editingTag, setEditingTag] = useState(null); // { id, name, color }

    const tagUsage = useMemo(() => {
        const usageMap = {};
        tags.forEach(tag => {
            usageMap[tag.name] = 0;
        });
        transactions.forEach(tx => {
            (tx.tags || []).forEach(tagName => {
                if (usageMap.hasOwnProperty(tagName)) {
                    usageMap[tagName]++;
                }
            });
        });
        return usageMap;
    }, [tags, transactions]);

    const handleAddTag = (e) => {
        e.preventDefault();
        if (newTagName.trim()) {
            onAddTag(newTagName.trim(), newTagColor);
            setNewTagName('');
            setNewTagColor('#4A5568');
        }
    };

    const handleUpdateTag = () => {
        if (editingTag && editingTag.name.trim()) {
            onUpdateTag(editingTag.id, editingTag.name.trim(), editingTag.color);
            setEditingTag(null);
        }
    };

    const colors = [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
        '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
    ];

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Create New Tag</h2>
                <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tag Name</label>
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="e.g., Breakout"
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewTagColor(color)}
                                    className={`w-6 h-6 rounded-full transition-transform hover:scale-125 ${newTagColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-700 ring-blue-500' : ''}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition">Add Tag</button>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Manage Existing Tags</h2>
                <div className="max-h-96 overflow-y-auto pr-2">
                    <div className="space-y-3">
                        {tags.map(tag => (
                            <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                {editingTag?.id === tag.id ? (
                                    <div className="flex-grow flex items-center gap-4">
                                        <input
                                            type="text"
                                            value={editingTag.name}
                                            onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1 px-2"
                                        />
                                        <div className="flex items-center gap-1">
                                            {colors.slice(0, 8).map(color => (
                                                <button
                                                    key={color} type="button" onClick={() => setEditingTag({ ...editingTag, color })}
                                                    className={`w-5 h-5 rounded-full ${editingTag.color === color ? 'ring-2 ring-blue-500' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <button onClick={handleUpdateTag} className="text-sm text-green-500 font-semibold">Save</button>
                                        <button onClick={() => setEditingTag(null)} className="text-sm text-gray-500">Cancel</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <span className="font-semibold px-3 py-1 rounded-full text-sm text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                                        <span className="text-sm text-gray-400 ml-4">{tagUsage[tag.name] || 0} uses</span>
                                    </div>
                                )}
                                {editingTag?.id !== tag.id && (
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => setEditingTag({ ...tag })} className="text-gray-400 hover:text-blue-500">Edit</button>
                                        <button onClick={() => onDeleteTag(tag.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {tags.length === 0 && <p className="text-center text-gray-500 py-4">No tags created yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardCard = ({ title, value, icon, valueColor, subValue }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center transition-colors duration-300">
    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      {subValue && <p className="text-xs text-gray-400 dark:text-gray-500">{subValue}</p>}
    </div>
  </div>
);

const EquityCurveChart = ({ transactions, startingEquity }) => {
    const chartRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);

    const chartData = useMemo(() => {
        if (!transactions) return [];
        const sorted = [...transactions].sort((a, b) => a.date.toDate() - b.date.toDate());
        
        let cumulativeEquity = startingEquity;

        const dataPoints = [{ date: null, equity: startingEquity }];

        sorted.forEach(tx => {
            cumulativeEquity += tx.pnl;
            dataPoints.push({
                date: tx.date.toDate(),
                equity: cumulativeEquity,
            });
        });
        return dataPoints;
    }, [transactions, startingEquity]);

    const { width, height, margin, xScale, yScale, equityPath, gridLines, xTicks } = useMemo(() => {
        const w = chartRef.current ? chartRef.current.offsetWidth : 500;
        const h = chartRef.current ? chartRef.current.offsetHeight : 300;
        const m = { top: 20, right: 20, bottom: 40, left: 60 };
        const innerWidth = w - m.left - m.right;
        const innerHeight = h - m.top - m.bottom;

        const allValues = chartData.map(d => d.equity);
        const yMin = Math.min(...allValues);
        const yMax = Math.max(...allValues);
        
        const xS = (index) => m.left + (index / (chartData.length - 1)) * innerWidth;
        const yS = (value) => m.top + innerHeight - ((value - yMin) / (yMax - yMin || 1)) * innerHeight;

        const ePath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xS(i)} ${yS(d.equity)}`).join(' ');

        const numGridLines = 5;
        const gLines = Array.from({ length: numGridLines }).map((_, i) => {
            const y = yMin + (i / (numGridLines - 1)) * (yMax - yMin);
            return { y: yS(y), label: formatCurrency(y) };
        });
        
        const numXTicks = chartData.length > 1 ? Math.min(chartData.length - 1, 7) : 1;
        const xT = Array.from({ length: numXTicks}).map((_, i) => {
            const index = chartData.length > 1 ? Math.floor(i * (chartData.length - 1) / (numXTicks - 1)) : 0;
            const date = chartData[index+1]?.date;
            return { x: xS(index+1), label: date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric'}) : '' };
        });

        return { width: w, height: h, margin: m, xScale: xS, yScale: yS, equityPath: ePath, gridLines: gLines, xTicks: xT };
    }, [chartData, chartRef.current?.offsetWidth]);


    if (chartData.length < 2) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          Not enough data to display chart for the selected period.
        </div>
      );
    }

    const handleMouseMove = (e) => {
        const svgRect = chartRef.current.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        
        const index = Math.round(((x - margin.left) / (width - margin.left - margin.right)) * (chartData.length - 1));

        if (index >= 0 && index < chartData.length) {
            const d = chartData[index];
            setTooltip({
                x: xScale(index),
                y: e.clientY - svgRect.top,
                data: d,
            });
        }
    };

    return (
        <div className="w-full h-full relative" ref={chartRef}>
            <svg width="100%" height="100%" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
                <g className="grid-lines">
                    {gridLines.map((line, i) => (
                        <g key={i}>
                            <line x1={margin.left} y1={line.y} x2={width - margin.right} y2={line.y} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
                            <text x={margin.left - 10} y={line.y} dy="0.32em" textAnchor="end" className="text-xs fill-current text-gray-500 dark:text-gray-400">{line.label}</text>
                        </g>
                    ))}
                </g>
                 <g className="x-axis-ticks">
                    {xTicks.map((tick, i) => (
                         <text key={i} x={tick.x} y={height - margin.bottom + 15} textAnchor="middle" className="text-xs fill-current text-gray-500 dark:text-gray-400">{tick.label}</text>
                    ))}
                </g>
                <path d={equityPath} fill="none" stroke="#A0AEC0" strokeWidth="2" />
                
                {tooltip && (
                    <g>
                        <line x1={tooltip.x} y1={margin.top} x2={tooltip.x} y2={height - margin.bottom} stroke="currentColor" className="text-gray-400 dark:text-gray-500" strokeWidth="1" strokeDasharray="4,2" />
                    </g>
                )}
            </svg>
            {tooltip && (
                <div className="absolute p-2 text-xs bg-white dark:bg-gray-900 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-none" style={{ left: `${tooltip.x + 10}px`, top: `${tooltip.y + 10}px`, transform: 'translateY(-100%)' }}>
                    <p className="font-bold">{tooltip.data.date ? tooltip.data.date.toLocaleDateString() : 'Start'}</p>
                    <p><span className="font-semibold text-gray-500">Equity:</span> {formatCurrency(tooltip.data.equity)}</p>
                </div>
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex space-x-4 text-xs">
                <div className="flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-[#A0AEC0]"></div><span>Equity</span></div>
            </div>
        </div>
    );
};

const TradeDetailModal = ({ trade, user, allTags, onAddNewTag, onSave, onCancel }) => {
    const [date, setDate] = useState(new Date(trade.date.toDate()).toISOString().split('T')[0]);
    const [type, setType] = useState(trade.type);
    const [pnl, setPnl] = useState(trade.pnl);
    const [notes, setNotes] = useState(trade.notes || '');
    const [tags, setTags] = useState(trade.tags || []);
    const [rating, setRating] = useState(trade.rating || 0);
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(trade.imageUrl || '');
    const [saveError, setSaveError] = useState('');
    const fileInputRef = React.useRef(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [newTagInput, setNewTagInput] = useState('');

    const isTrade = type === 'Buy' || type === 'Sell';

    const handleToggleTag = (tagName) => {
        setTags(prev => 
            prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
        );
    };

    const handleAddNewTag = () => {
        if (newTagInput.trim() && !allTags.find(t => t.name.toLowerCase() === newTagInput.trim().toLowerCase())) {
            // A random color for on-the-fly tags
            const colors = ['#EF4444', '#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            onAddNewTag(newTagInput.trim(), randomColor);
            handleToggleTag(newTagInput.trim()); // Also select it immediately
            setNewTagInput('');
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImageUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleAiAnalysis = async () => {
        if (!notes) {
            setAnalysisError("Please write some notes about your trade before analyzing.");
            return;
        }
        setIsAnalyzing(true);
        setAnalysisError('');
        setAiAnalysis('');

        const systemInstruction = `You are a professional trading coach. Analyze the following trade journal entry. The user will provide the trade type, P&L, and their personal notes. Your task is to:
1.  Provide constructive feedback on their rationale.
2.  Identify potential psychological biases (like FOMO, revenge trading, confirmation bias) based on their notes.
3.  Offer actionable advice for future trades.
4.  Do NOT give financial advice. Focus on the process, psychology, and execution based ONLY on the information provided.
5.  Keep your analysis concise, empathetic, and encouraging. Use markdown for formatting. Start with a brief summary of the trade.`;

        const userQuery = `
            Please analyze my trade:
            - Trade Type: ${type}
            - Profit/Loss: ${formatCurrency(pnl)} (${pnl >= 0 ? 'Win' : 'Loss'})
            - My Tags: ${tags || 'None'}
            - My Rating: ${rating}/5
            - My Notes: "${notes}"
        `;

        try {
            const analysis = await callGeminiAPI(userQuery, systemInstruction);
            setAiAnalysis(analysis);
        } catch (error) {
            console.error("AI Analysis Error:", error);
            setAnalysisError("Sorry, the AI analysis failed. Please try again later.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            setSaveError("Authentication error. Please log out and log in again.");
            return;
        }
        
        setIsUploading(true);
        setSaveError('');

        try {
            let finalImageUrl = imageUrl;

            if (imageFile) {
                if (trade.imageUrl) {
                    try {
                        const oldImageRef = ref(storage, trade.imageUrl);
                        await deleteObject(oldImageRef);
                    } catch (err) {
                        console.warn("Could not delete old image, continuing with upload:", err);
                    }
                }
                
                const newImageRef = ref(storage, `screenshots/${user.uid}/${trade.id}/${imageFile.name}`);
                const snapshot = await uploadBytes(newImageRef, imageFile);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            } 
            else if (!imageUrl && trade.imageUrl) {
                try {
                    const oldImageRef = ref(storage, trade.imageUrl);
                    await deleteObject(oldImageRef);
                    finalImageUrl = '';
                } catch (err) {
                    console.error("Failed to delete image from storage:", err);
                    setSaveError(`Could not remove image. (Code: ${err.code || 'unknown'})`);
                    setIsUploading(false);
                    return;
                }
            }

            let pnlValue = parseFloat(pnl);
            if (isNaN(pnlValue)) throw new Error('P&L must be a number.');
            if (!date) throw new Error('Date cannot be empty.');
            
            if (type === 'Withdrawal') pnlValue = -Math.abs(pnlValue);
            else if (type === 'Deposit') pnlValue = Math.abs(pnlValue);

            const status = isTrade ? (pnlValue >= 0 ? 'Win' : 'Loss') : null;
            
            const updatedTradeData = {
                ...trade,
                date: Timestamp.fromDate(new Date(date)),
                type,
                pnl: pnlValue,
                status,
                notes,
                tags: tags,
                rating,
                imageUrl: finalImageUrl
            };
            
            await onSave(updatedTradeData);
            
            onCancel();

        } catch (error) {
            console.error("Detailed error during save:", error);
            setSaveError(`Save failed. Check console for details. (Code: ${error.code || 'unknown'})`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Transaction Details & Edit</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="edit-date" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Date</label>
                            <input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="edit-type" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Type</label>
                            <select id="edit-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option>Buy</option><option>Sell</option><option>Deposit</option><option>Withdrawal</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-pnl" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">{isTrade ? 'P&L ($)' : 'Amount ($)'}</label>
                            <input id="edit-pnl" type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                    </div>
                    
                    {isTrade && (
                        <>
                            <hr className="border-gray-200 dark:border-gray-700"/>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Chart Screenshot</label>
                                <div className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                                    {imageUrl && !imageFile && <img src={imageUrl} alt="Trade Screenshot" className="max-h-64 mx-auto rounded-md"/>}
                                    {imageFile && <img src={URL.createObjectURL(imageFile)} alt="Preview" className="max-h-64 mx-auto rounded-md"/>}
                                    {!imageUrl && !imageFile && <div className="text-gray-400 flex flex-col items-center justify-center h-48"><ImageIcon className="w-16 h-16 mb-2"/><p>No image uploaded</p></div>}
                                    <div className="flex justify-center items-center space-x-4 mt-4">
                                        <button onClick={() => fileInputRef.current.click()} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-md transition">
                                            {imageUrl || imageFile ? 'Change Image' : 'Select Image'}
                                        </button>
                                        {(imageUrl || imageFile) && (
                                            <button onClick={handleRemoveImage} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => setImageFile(e.target.files[0])} className="hidden"/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Notes & Trade Rationale</label>
                                <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="5" placeholder="Write your analysis, entry reasons, and lessons learned..." className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                            </div>
                            
                            {/* --- GEMINI AI ANALYSIS SECTION --- */}
                            <div className="space-y-2">
                                <button
                                    onClick={handleAiAnalysis}
                                    disabled={isAnalyzing}
                                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-60"
                                >
                                    <MagicWandIcon className="w-5 h-5" />
                                    <span>{isAnalyzing ? 'Analyzing...' : '✨ Get AI Trade Analysis'}</span>
                                </button>
                                {analysisError && <p className="text-red-500 text-sm text-center">{analysisError}</p>}
                                {isAnalyzing && <div className="text-center text-sm text-gray-500 dark:text-gray-400">The AI coach is reviewing your trade...</div>}
                                {aiAnalysis && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 mt-2">
                                        <h4 className="font-bold text-md mb-2 text-gray-800 dark:text-gray-200 flex items-center"><MagicWandIcon className="w-5 h-5 mr-2 text-purple-500"/> AI Coach Feedback</h4>
                                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
                                    </div>
                                )}
                            </div>
                            {/* --- END GEMINI AI ANALYSIS SECTION --- */}

                            <div>
                                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Tags</label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => handleToggleTag(tag.name)}
                                            className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${tags.includes(tag.name) ? 'text-white shadow-md' : 'opacity-70 hover:opacity-100'}`}
                                            style={{ backgroundColor: tags.includes(tag.name) ? tag.color : tag.color+'40', color: tags.includes(tag.name) ? '#fff': '#E2E8F0' }}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                    {allTags.length === 0 && <p className="text-xs text-gray-400">No tags created. Go to the 'Tags' tab to add some.</p>}
                                </div>
                                <div className="flex items-center mt-2">
                                    <input
                                        type="text"
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        placeholder="Or create a new tag..."
                                        className="flex-grow bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button onClick={handleAddNewTag} type="button" className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-semibold py-1 px-3 rounded-r-md">Add</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Execution Rating</label>
                                <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} onClick={() => setRating(star)} className="text-yellow-400 hover:text-yellow-500 transition">
                                            <StarIcon className="w-8 h-8" filled={star <= rating} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {saveError && <p className="text-red-500 text-sm mt-4 text-center bg-red-500/10 p-2 rounded-md">{saveError}</p>}
                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50">
                        {isUploading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center space-x-2 mt-6">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">&laquo;</button>
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{number}</button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">&raquo;</button>
        </div>
    );
};

const DonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="flex items-center justify-center h-full w-full text-gray-500">No data</div>;
    
    const strokeWidth = 10;
    const radius = 45 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {data.map(item => {
                const dashoffset = circumference - (item.value / total) * circumference;
                const segment = (
                    <circle key={item.label} cx="50" cy="50" r={radius} fill="transparent" stroke={item.color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={dashoffset} transform={`rotate(${(offset / total) * 360} 50 50)`} />
                );
                offset += item.value;
                return segment;
            })}
        </svg>
    );
};

const ConsistencyIcon = ({ status }) => {
    const iconProps = { className: "w-3 h-3 absolute top-1 left-1" };
    switch (status) {
        case 'PROFIT_TARGET_HIT':
        case 'DISCIPLINED_WIN':
        case 'DISCIPLINED_LOSS':
            return <CheckCircleIcon {...iconProps} style={{ color: '#48bb78' }} />;
        case 'OVERTRADED_WIN':
        case 'OVERTRADED_LOSS':
            return <AlertTriangleIcon {...iconProps} style={{ color: '#f59e0b' }} />;
        case 'LOSS_LIMIT_HIT':
            return <XCircleIcon {...iconProps} style={{ color: '#ef4444' }} />;
        default:
            return null;
    }
};

const TradingCalendar = ({ transactions, currentDate, setCurrentDate, onDayClick, dailyJournals, consistencyByDay }) => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Weekly'];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const tradesByDay = useMemo(() => {
        const map = {};
        transactions.forEach(tx => {
            if (tx.type === 'Buy' || tx.type === 'Sell') {
                const tradeDate = tx.date.toDate();
                const dateString = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}-${String(tradeDate.getDate()).padStart(2, '0')}`;
                if (!map[dateString]) map[dateString] = { pnl: 0, count: 0 };
                map[dateString].pnl += tx.pnl;
                map[dateString].count++;
            }
        });
        return map;
    }, [transactions]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        const startDate = new Date(year, month, 1);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from the Sunday of the first week
        
        for (let i = 0; i < 42; i++) {
            grid.push(new Date(startDate));
            startDate.setDate(startDate.getDate() + 1);
        }
        return grid;
    }, [year, month]);

    const weeks = useMemo(() => {
        const chunked = [];
        for (let i = 0; i < calendarGrid.length; i += 7) {
            chunked.push(calendarGrid.slice(i, i + 7));
        }
        return chunked;
    }, [calendarGrid]);
    
    const changeMonth = (offset) => setCurrentDate(new Date(year, month + offset, 1));

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-6 h-6"/></button>
                <h2 className="text-xl font-bold">{monthNames[month]} {year}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="w-6 h-6"/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="mt-2 space-y-1">
                {weeks.map((week, weekIndex) => {
                    const weeklyPnl = week.reduce((sum, dayCell) => {
                        const dateString = `${dayCell.getFullYear()}-${String(dayCell.getMonth() + 1).padStart(2, '0')}-${String(dayCell.getDate()).padStart(2, '0')}`;
                        return sum + (tradesByDay[dateString]?.pnl || 0);
                    }, 0);

                    return (
                        <div className="grid grid-cols-7 gap-1" key={weekIndex}>
                            {week.map((dayCell, dayIndex) => {
                                if (dayIndex === 6) { // Saturday slot for weekly P&L
                                    const recapBgColor = weeklyPnl >= 0 ? 'bg-green-500/10 dark:bg-green-900/30' : 'bg-red-500/10 dark:bg-red-900/30';
                                    const recapTextColor = weeklyPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                                    return (
                                        <div key={`weekly-${weekIndex}`} className={`p-1 rounded-lg text-center h-20 flex flex-col justify-center items-center transition-colors ${recapBgColor}`}>
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Weekly P&L</span>
                                            <span className={`mt-1 text-sm font-bold ${recapTextColor}`}>{formatCurrency(weeklyPnl)}</span>
                                        </div>
                                    );
                                }
                                
                                const dayNumber = dayCell.getDate();
                                const isCurrentMonth = dayCell.getMonth() === month;
                                const dateString = `${dayCell.getFullYear()}-${String(dayCell.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                                const dayData = tradesByDay[dateString];
                                const hasJournal = dailyJournals[dateString] && (dailyJournals[dateString].notes || dailyJournals[dateString].rating > 0 || dailyJournals[dateString].bias);
                                const consistencyStatus = consistencyByDay[dateString];
                                const isToday = new Date().toDateString() === dayCell.toDateString();
                                
                                let bgColor = 'hover:bg-gray-100 dark:hover:bg-gray-700/50';
                                if (dayData) bgColor = dayData.pnl >= 0 ? 'bg-green-500/20 hover:bg-green-500/30' : 'bg-red-500/20 hover:bg-red-500/30';
                                
                                const dayTextColor = isCurrentMonth ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500';

                                return (
                                    <div key={dayCell.toISOString()} className={`p-1 rounded-lg text-center h-20 flex flex-col justify-start items-center transition-colors cursor-pointer relative ${bgColor}`} onClick={() => onDayClick(dayCell)}>
                                        <ConsistencyIcon status={consistencyStatus} />
                                        {hasJournal && <NoteIcon className="w-3 h-3 text-blue-500 absolute top-1 right-1" />}
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-blue-600 text-white' : dayTextColor}`}>{dayNumber}</span>
                                        {dayData && (
                                            <div className="text-center mt-1">
                                                <span className={`text-xs font-bold ${dayData.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(dayData.pnl).replace(/\..*/, '')}</span>
                                                <span className="block text-gray-400 text-[10px]">{dayData.count} trade{dayData.count > 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 flex justify-center items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1"><CheckCircleIcon className="w-4 h-4 text-green-500" /><span>Disciplined</span></div>
                <div className="flex items-center space-x-1"><AlertTriangleIcon className="w-4 h-4 text-yellow-500" /><span>Overtraded</span></div>
                <div className="flex items-center space-x-1"><XCircleIcon className="w-4 h-4 text-red-500" /><span>Loss Exceeded</span></div>
            </div>
        </div>
    );
};

const PerformanceByDayChart = ({ dayPerformance }) => {
    const [tooltip, setTooltip] = useState(null); // { day, data, x, y }
    const chartRef = useRef(null);

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const Bar = ({ day, data, maxValue, color, onHover }) => {
        const heightPercentage = maxValue > 0 ? (Math.abs(data.pnl) / maxValue) * 100 : 0;
        const barRef = useRef(null);

        const handleMouseEnter = () => {
            if (barRef.current) {
                const rect = barRef.current.getBoundingClientRect();
                const chartRect = chartRef.current.getBoundingClientRect();
                onHover({
                    day: day,
                    data,
                    x: rect.left - chartRect.left + rect.width / 2,
                    y: rect.top - chartRect.top,
                });
            }
        };

        return (
            <div className="flex flex-col items-center h-full" onMouseEnter={handleMouseEnter} ref={barRef}>
                <div className="w-full h-full flex items-end justify-center">
                    <div className={`w-10 rounded-t-md transition-all duration-300 hover:opacity-80 ${color}`} style={{ height: `${heightPercentage}%` }}></div>
                </div>
                <span className="text-xs mt-1 flex-shrink-0">{day.substring(0, 3)}</span>
            </div>
        );
    };

    const maxDayPnl = Math.max(0.01, ...Object.values(dayPerformance).map(d => Math.abs(d.pnl)));

    return (
        <div className="relative h-full" ref={chartRef} onMouseLeave={handleMouseLeave}>
            <div className="grid grid-cols-7 gap-2 h-full">
                {Object.entries(dayPerformance).map(([day, data]) => (
                    <Bar
                        key={day}
                        day={day}
                        data={data}
                        maxValue={maxDayPnl}
                        color={data.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}
                        onHover={setTooltip}
                    />
                ))}
            </div>

            {tooltip && tooltip.data.count > 0 && (
                <div
                    className="absolute p-3 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 pointer-events-none z-10 w-48 text-xs transition-opacity duration-200"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translate(-50%, -110%)',
                        opacity: 1,
                    }}
                >
                    <h4 className="font-bold text-center mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{tooltip.day}</h4>
                    <div className="space-y-1">
                        <p className="flex justify-between"><span>Net P&L:</span> <span className={`font-bold ${tooltip.data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(tooltip.data.pnl)}</span></p>
                        <p className="flex justify-between"><span>Win Rate:</span> <span className="font-bold">{(tooltip.data.count > 0 ? (tooltip.data.wins / tooltip.data.count) * 100 : 0).toFixed(1)}%</span></p>
                        <hr className="border-gray-200 dark:border-gray-600 my-1"/>
                        <p className="flex justify-between"><span>Wins:</span> <span className="font-semibold text-green-500">{tooltip.data.wins}</span></p>
                        <p className="flex justify-between"><span>Losses:</span> <span className="font-semibold text-red-500">{tooltip.data.losses}</span></p>
                        <hr className="border-gray-200 dark:border-gray-600 my-1"/>
                        <p className="flex justify-between items-center">
                            <span>Avg. Rating:</span>
                            <span className="font-semibold flex items-center">
                                {tooltip.data.ratedTrades > 0 ? (tooltip.data.totalRating / tooltip.data.ratedTrades).toFixed(1) : 'N/A'}
                                {tooltip.data.ratedTrades > 0 && <StarIcon filled={true} className="w-4 h-4 ml-1 text-yellow-400"/>}
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};


const AdvancedAnalyticsDashboard = ({ stats }) => {
    const { tagPerformance, streaks, avgWinLossRatio, ratingPerformance, drawdown, winRate, totalTrades } = stats;

    const winRatePercent = winRate * 100;
    let suggestedRR = 'N/A';
    let suggestionText = 'Record at least 10 trades to receive a suggestion.';

    if (totalTrades >= 10) {
        if (winRatePercent >= 50) {
            suggestedRR = '1 : 2';
            suggestionText = 'With your current win rate, targeting a 1:2 Risk/Reward ratio on trades can be an effective strategy for profitability.';
        } else if (winRatePercent >= 33) {
            suggestedRR = '1 : 3';
            suggestionText = 'To maintain profitability with this win rate, it is advisable to aim for a minimum Risk/Reward ratio of 1:3.';
        } else {
            suggestedRR = '1 : 3+';
            suggestionText = 'Your win rate is below 33%. Focus on improving your strategy or only taking trades with a very high Risk/Reward ratio.';
        }
    }


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-center">Advanced Analytics Dashboard</h2>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-bold text-lg mb-4 text-center">Tag Performance Leaderboard</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Best Strategies */}
                            <div>
                                <h4 className="font-semibold text-green-500 mb-2 text-center">Best Strategies</h4>
                                <ul className="space-y-2 text-sm">
                                    {tagPerformance.top3.length > 0 
                                        ? tagPerformance.top3.map((tag, index) => {
                                            const rankColors = ['text-yellow-400', 'text-gray-400', 'text-orange-400'];
                                            const rankColor = index < 3 ? rankColors[index] : 'text-gray-500';
                                            return (
                                                <li key={tag.name} className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-gray-800 shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-black text-lg w-6 text-center ${rankColor}`}>{index + 1}</span>
                                                        <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded font-semibold">{tag.name}</span>
                                                    </div>
                                                    <span className="font-mono font-semibold text-green-500">{formatCurrency(tag.pnl)}</span>
                                                </li>
                                            );
                                        }) 
                                        : <li className="text-center text-gray-500 p-4">No winning tags yet.</li>}
                                </ul>
                            </div>

                            {/* Biggest Mistakes */}
                            <div>
                                <h4 className="font-semibold text-red-500 mb-2 text-center">Biggest Mistakes</h4>
                                <ul className="space-y-2 text-sm">
                                    {tagPerformance.bottom3.length > 0 
                                        ? tagPerformance.bottom3.map((tag, index) => {
                                            const rankColors = ['text-yellow-400', 'text-gray-400', 'text-orange-400'];
                                            const rankColor = index < 3 ? rankColors[index] : 'text-gray-500';
                                            return (
                                                <li key={tag.name} className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-gray-800 shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-black text-lg w-6 text-center ${rankColor}`}>{index + 1}</span>
                                                        <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-1 rounded font-semibold">{tag.name}</span>
                                                    </div>
                                                    <span className="font-mono font-semibold text-red-500">{formatCurrency(tag.pnl)}</span>
                                                </li>
                                            );
                                        }) 
                                        : <li className="text-center text-gray-500 p-4">No losing tags yet.</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                     <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                         <h3 className="font-bold text-lg mb-4">Execution & Drawdown</h3>
                         <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center"><span>P&L on 5-Star Trades</span><span className={`font-semibold ${ratingPerformance.pnlByRating5 >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(ratingPerformance.pnlByRating5)}</span></div>
                            <div className="flex justify-between items-center"><span>P&L on 1-Star Trades</span><span className={`font-semibold ${ratingPerformance.pnlByRating1 >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(ratingPerformance.pnlByRating1)}</span></div>
                            <hr className="my-2 border-gray-200 dark:border-gray-700"/>
                            <div className="flex justify-between items-center"><span>Maximum Drawdown</span><span className="font-semibold text-red-500">{formatCurrency(drawdown.maxDrawdownValue)}</span></div>
                             <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400"><span></span><span>({drawdown.maxDrawdownPercent.toFixed(2)}%)</span></div>
                            <div className="flex justify-between items-center"><span>Longest Drawdown Period</span><span className="font-semibold">{drawdown.longestDrawdownDuration} trades</span></div>
                         </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-lg mb-4 text-center">Risk/Reward Suggestion</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center items-center">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Overall Win Rate</p>
                            <p className="font-bold text-4xl text-blue-500">{winRatePercent.toFixed(1)}%</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-300">Suggested Minimum R:R</p>
                            <p className="font-bold text-4xl text-blue-700 dark:text-blue-200">{suggestedRR}</p>
                        </div>
                        <div className="md:col-span-2 mt-2">
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">{suggestionText}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const DailyDetailModal = ({ date, transactions, onClose, onTradeClick, dailyJournals, onSaveJournal }) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const [notes, setNotes] = useState(dailyJournals[dateString]?.notes || '');
    const [rating, setRating] = useState(dailyJournals[dateString]?.rating || 0);
    const [biasOutcome, setBiasOutcome] = useState(dailyJournals[dateString]?.biasOutcome || null);
    
    const dailyTransactions = useMemo(() => {
        if (!date) return [];
        return transactions.filter(tx => {
            const txDate = tx.date.toDate();
            return txDate.getFullYear() === date.getFullYear() && txDate.getMonth() === date.getMonth() && txDate.getDate() === date.getDate();
        }).sort((a, b) => a.date.toDate() - b.date.toDate());
    }, [transactions, date]);

    const formattedDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(date);

    const handleSaveJournal = () => {
        const currentJournal = dailyJournals[dateString] || {};
        onSaveJournal(dateString, { ...currentJournal, notes, rating, biasOutcome });
        onClose();
    };
    
    const dailyBias = dailyJournals[dateString]?.bias;
    const dailyReason = dailyJournals[dateString]?.reason;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Details</h2><p className="text-gray-500 dark:text-gray-400">{formattedDate}</p></div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Today's Transaction History</h3>
                        <div className="space-y-2">
                            {dailyTransactions.length > 0 ? (
                                dailyTransactions.map(tx => (
                                    <div key={tx.id} onClick={() => onTradeClick(tx)} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <div><span className={`font-semibold ${tx.type === 'Buy' ? 'text-green-500' : tx.type === 'Sell' ? 'text-red-500' : tx.type === 'Deposit' ? 'text-blue-500' : 'text-orange-500'}`}>{tx.type}</span><span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{tx.date.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                        <div className="flex items-center"><span className={`font-semibold ${tx.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(tx.pnl)}</span>{(tx.notes || (tx.tags && tx.tags.length > 0) || tx.rating > 0) && <NoteIcon className="w-4 h-4 text-blue-500 ml-3"/>}</div>
                                    </div>
                                ))
                            ) : (<p className="text-center text-gray-500 py-4">No transactions on this day.</p>)}
                        </div>
                    </div>
                    <hr className="border-gray-200 dark:border-gray-700"/>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Daily Journal & Bias</h3>
                        {dailyBias && (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Daily Bias: <span className={dailyBias === 'bullish' ? 'text-green-500' : 'text-red-500'}>{dailyBias.charAt(0).toUpperCase() + dailyBias.slice(1)}</span></p>
                                <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Reason: {dailyReason || 'No reason provided.'}</p>
                                <div className="mt-2">
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400 mr-3">Bias Outcome:</span>
                                    <button onClick={() => setBiasOutcome('correct')} className={`px-2 py-1 text-xs rounded ${biasOutcome === 'correct' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Correct</button>
                                    <button onClick={() => setBiasOutcome('incorrect')} className={`ml-2 px-2 py-1 text-xs rounded ${biasOutcome === 'incorrect' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Incorrect</button>
                                </div>
                            </div>
                        )}
                        <div><label htmlFor="daily-notes" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Today's Evaluation Notes</label><textarea id="daily-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="5" placeholder="How was your trading performance today? What went well? What could be improved?" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea></div>
                        <div className="mt-4"><label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Rate Today's Performance</label><div className="flex space-x-1">{[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setRating(star)} className="text-yellow-400 hover:text-yellow-500 transition"><StarIcon className="w-8 h-8" filled={star <= rating} /></button>))}</div></div>
                    </div>
                </div>
                 <div className="mt-8 flex justify-end space-x-4"><button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-md transition">Cancel</button><button onClick={handleSaveJournal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition">Save Journal</button></div>
            </div>
        </div>
    );
};

const TradeCalculator = ({ winRate, avgTradesPerDay }) => {
    const [inputs, setInputs] = useState({ equity: '10000', target: '12000', risk: '1' });
    const [riskUnit, setRiskUnit] = useState('%');
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const handleInputChange = (e) => setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const calculateProjections = () => {
        const equity = parseFloat(inputs.equity);
        const target = parseFloat(inputs.target);
        const riskValue = parseFloat(inputs.risk);

        if (isNaN(equity) || isNaN(target) || isNaN(riskValue) || equity <= 0 || target <= equity || riskValue <= 0) {
            setError('Invalid input. Please ensure all numbers are positive and target > initial equity.');
            return setResults(null);
        }
        if (winRate === 0) {
            setError('Your win rate is 0%. Projections cannot be calculated.');
            return setResults(null);
        }
        setError('');

        const scenarios = [1, 2, 3].map(rr => {
            let currentEquity = equity;
            let tradeCount = 0;
            
            const getExpectedGain = (eq) => {
                const riskAmount = riskUnit === '%' ? eq * (riskValue / 100) : riskValue;
                if (riskAmount > eq) return -Infinity; 
                return (winRate * riskAmount * rr) - ((1 - winRate) * riskAmount);
            };
            
            const initialExpectedGain = getExpectedGain(currentEquity);
            if (initialExpectedGain <= 0) return { rr, trades: Infinity, days: Infinity };

            while (currentEquity < target && tradeCount < 5000) {
                const gain = getExpectedGain(currentEquity);
                if (gain === -Infinity) {
                    tradeCount = Infinity;
                    break;
                }
                currentEquity += gain;
                tradeCount++;
            }
            return { rr, trades: tradeCount >= 5000 ? Infinity : tradeCount, days: avgTradesPerDay > 0 ? Math.ceil(tradeCount / avgTradesPerDay) : Infinity };
        });
        setResults(scenarios);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-center mb-6">Profit Calculator</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Initial Equity ($)</label><input name="equity" type="number" value={inputs.equity} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Target Equity ($)</label><input name="target" type="number" value={inputs.target} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Risk per Trade</label>
                    <div className="flex">
                        <input name="risk" type="number" value={inputs.risk} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"/>
                        <div className="flex">
                            <button onClick={() => setRiskUnit('%')} className={`px-4 py-2 text-sm font-semibold border-t border-b ${riskUnit === '%' ? 'bg-blue-600 text-white z-10' : 'bg-gray-200 dark:bg-gray-600'}`}>%</button>
                            <button onClick={() => setRiskUnit('$')} className={`px-4 py-2 text-sm font-semibold border rounded-r-md ${riskUnit === '$' ? 'bg-blue-600 text-white z-10' : 'bg-gray-200 dark:bg-gray-600'}`}>$</button>
                        </div>
                    </div>
                </div>
                <button onClick={calculateProjections} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition">Calculate Projection</button>
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            {results && (
                <div className="mt-6">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">Based on your historical win rate of <span className="font-bold text-blue-500">{(winRate * 100).toFixed(1)}%</span> and an average of <span className="font-bold text-blue-500">{avgTradesPerDay.toFixed(1)}</span> trades per day:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        {results.map(res => (<div key={res.rr} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"><h4 className="font-bold text-lg">R:R 1:{res.rr}</h4>{res.trades === Infinity ? (<p className="text-red-500 mt-2">Not achievable with this scenario.</p>) : (<><p className="text-3xl font-bold text-blue-500 my-2">{res.trades}</p><p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p><p className="text-xl font-semibold mt-3">{res.days}</p><p className="text-xs text-gray-500 dark:text-gray-400">Estimated Days</p></>)}</div>))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SettingsModal = ({ settings, onSave, onCancel }) => {
    const [currentSettings, setCurrentSettings] = useState(settings);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'dailyProfitTarget' || name === 'dailyLossLimit') {
            setCurrentSettings(prev => ({
                ...prev,
                [name]: { ...prev[name], value: Number(value) }
            }));
        } else {
            setCurrentSettings(prev => ({ ...prev, [name]: Number(value) }));
        }
    };

    const handleUnitChange = (name, unit) => {
        setCurrentSettings(prev => ({
            ...prev,
            [name]: { ...prev[name], unit }
        }));
    };

    const handleSave = () => {
        onSave(currentSettings);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Target Settings</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Starting Equity ($)</label>
                        <input type="number" name="startingEquity" value={currentSettings.startingEquity} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Daily Profit Target</label>
                        <div className="flex">
                            <input type="number" name="dailyProfitTarget" value={currentSettings.dailyProfitTarget.value} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"/>
                            <div className="flex">
                                <button onClick={() => handleUnitChange('dailyProfitTarget', '%')} className={`px-4 py-2 text-sm font-semibold border-t border-b ${currentSettings.dailyProfitTarget.unit === '%' ? 'bg-blue-600 text-white z-10' : 'bg-gray-200 dark:bg-gray-600'}`}>%</button>
                                <button onClick={() => handleUnitChange('dailyProfitTarget', '$')} className={`px-4 py-2 text-sm font-semibold border rounded-r-md ${currentSettings.dailyProfitTarget.unit === '$' ? 'bg-blue-600 text-white z-10' : 'bg-gray-200 dark:bg-gray-600'}`}>$</button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Daily Loss Limit</label>
                         <div className="flex">
                            <input type="number" name="dailyLossLimit" value={currentSettings.dailyLossLimit.value} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"/>
                            <div className="flex">
                                <button onClick={() => handleUnitChange('dailyLossLimit', '%')} className={`px-4 py-2 text-sm font-semibold border-t border-b ${currentSettings.dailyLossLimit.unit === '%' ? 'bg-blue-600 text-white z-10' : 'bg-gray-200 dark:bg-gray-600'}`}>%</button>
                                <button onClick={() => handleUnitChange('dailyLossLimit', '$')} className={`px-4 py-2 text-sm font-semibold border rounded-r-md ${currentSettings.dailyLossLimit.unit === '$' ? 'bg-blue-600 text-white z-10' : 'bg-gray-200 dark:bg-gray-600'}`}>$</button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Max Trades Per Day</label>
                        <input type="number" name="maxTradesPerDay" value={currentSettings.maxTradesPerDay} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition">Save Settings</button>
                </div>
            </div>
        </div>
    );
};

const ConsistencyTracker = ({ dailyStats, settings, onOpenSettings }) => {
    const { pnl, tradeCount, profitTargetHit, lossLimitHit, maxTradesHit } = dailyStats;
    const { dailyProfitTarget, dailyLossLimit, startingEquity } = settings;

    const profitTargetValue = dailyProfitTarget.unit === '%'
        ? (startingEquity * dailyProfitTarget.value) / 100
        : dailyProfitTarget.value;

    const lossLimitValue = dailyLossLimit.unit === '%'
        ? -Math.abs((startingEquity * dailyLossLimit.value) / 100)
        : -Math.abs(dailyLossLimit.value);

    const profitTargetLabel = dailyProfitTarget.unit === '$'
        ? formatCurrency(dailyProfitTarget.value)
        : `${dailyProfitTarget.value}%`;

    const lossLimitLabel = dailyLossLimit.unit === '$'
        ? formatCurrency(dailyLossLimit.value)
        : `${dailyLossLimit.value}%`;

    const profitProgress = profitTargetValue > 0 && pnl > 0 ? Math.min((pnl / profitTargetValue) * 100, 100) : 0;
    const lossProgress = lossLimitValue < 0 && pnl < 0 ? Math.min((pnl / lossLimitValue) * 100, 100) : 0;
    
    const limitReached = profitTargetHit || lossLimitHit || maxTradesHit;
    let alertMessage = '';
    if (profitTargetHit) alertMessage = 'Profit Target Reached!';
    else if (lossLimitHit) alertMessage = 'Loss Limit Reached!';
    else if (maxTradesHit) alertMessage = 'Max Trades Reached!';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md relative">
            <button onClick={onOpenSettings} className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"><SettingsIcon className="w-5 h-5" /></button>
            <h3 className="font-bold text-lg mb-4">Consistency Tracker</h3>
            <div className="space-y-4">
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Today's P&L</p>
                    <p className={`text-3xl font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(pnl)}</p>
                </div>
                
                {limitReached && (
                    <div className="p-3 rounded-md text-center bg-red-500/20 text-red-500 dark:text-red-400 font-bold">
                        <p>STOP TRADING</p>
                        <p className="text-sm font-normal">{alertMessage}</p>
                    </div>
                )}

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">Profit Target ({profitTargetLabel})</span>
                        <span className="font-semibold text-green-500">{profitProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{width: `${profitProgress}%`}}></div></div>
                </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">Loss Limit ({lossLimitLabel})</span>
                        <span className="font-semibold text-red-500">{lossProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className="bg-red-500 h-2.5 rounded-full" style={{width: `${lossProgress}%`}}></div></div>
                </div>
                <div className="text-center pt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Trades Today</p>
                    <p className="text-2xl font-bold">{tradeCount} <span className="text-base font-normal text-gray-400">/ {settings.maxTradesPerDay}</span></p>
                </div>
            </div>
        </div>
    );
};

const DailyBriefingAndBiasSetter = ({ todayBias, onSaveBias }) => {
    const [reason, setReason] = useState(todayBias.reason || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [briefingError, setBriefingError] = useState('');

    useEffect(() => {
        setReason(todayBias.reason || '');
    }, [todayBias]);

    const handleReasonChange = (e) => {
        setReason(e.target.value);
    };
    
    const handleReasonBlur = () => {
         onSaveBias({ ...todayBias, reason });
    };

    const handleGetBriefing = async () => {
        setIsGenerating(true);
        setBriefingError('');

        const systemInstruction = `You are a financial analyst providing a morning briefing for a retail trader.
1.  Analyze the most important global financial news from the last 24 hours that could impact the US stock market today using the provided search tool.
2.  Provide a concise summary of your reasoning, under 150 words.
3.  Based on the news, determine the overall market sentiment.
4.  On the VERY LAST LINE of your response, and ONLY on the last line, write "Bias: bullish" or "Bias: bearish". Do not include any other text on this final line.`;

        const userQuery = "What is the latest financial news and market sentiment for today?";

        try {
            // Call API without JSON schema, but with grounding
            const fullResponse = await callGeminiAPI(userQuery, systemInstruction, true, null);
            
            const lines = fullResponse.trim().split('\n');
            const lastLine = lines.pop().toLowerCase();
            
            let bias = 'bullish'; // Default bias if parsing fails
            if (lastLine.includes('bearish')) {
                bias = 'bearish';
            }
            
            const briefing = lines.join('\n').trim();
            
            setReason(briefing);
            onSaveBias({ bias: bias, reason: briefing });

        } catch (error) {
            console.error("AI Briefing Error:", error);
            setBriefingError("Failed to generate briefing. Please try again later.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-4">Daily Briefing & Bias</h3>
            <div className="space-y-4">
                <div className="space-y-2">
                    <button onClick={handleGetBriefing} disabled={isGenerating} className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-60">
                         <MagicWandIcon className="w-5 h-5" />
                         <span>{isGenerating ? 'Generating...' : '✨ Get Daily Market Briefing'}</span>
                    </button>
                    {briefingError && <p className="text-red-500 text-sm text-center">{briefingError}</p>}
                    {isGenerating && <div className="text-center text-sm text-gray-500 dark:text-gray-400">Fetching latest market news...</div>}
                </div>
                <hr className="border-gray-200 dark:border-gray-700"/>
                <div className="flex justify-around">
                    <button onClick={() => onSaveBias({ ...todayBias, bias: 'bullish' })} className={`p-4 rounded-lg w-full mr-2 transition ${todayBias.bias === 'bullish' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <BullIcon className="w-8 h-8 mx-auto" />
                        <span className="text-sm font-semibold">Bullish</span>
                    </button>
                    <button onClick={() => onSaveBias({ ...todayBias, bias: 'bearish' })} className={`p-4 rounded-lg w-full ml-2 transition ${todayBias.bias === 'bearish' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <BearIcon className="w-8 h-8 mx-auto" />
                        <span className="text-sm font-semibold">Bearish</span>
                    </button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reason for Your Bias</label>
                    <textarea value={reason} onChange={handleReasonChange} onBlur={handleReasonBlur} rows="4" placeholder="Click the button above to generate a briefing or write your own analysis." className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
            </div>
        </div>
    );
};

const MonthlyStatsBreakdown = ({ monthlyStats }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-6">Monthly Stats Breakdown</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-32 h-32 flex-shrink-0">
                    <DonutChart data={[{ label: 'Profit', value: monthlyStats.totalProfit, color: '#48bb78' }, { label: 'Loss', value: Math.abs(monthlyStats.totalLoss), color: '#f56565' }]}/>
                </div>
                <div className="w-full space-y-2 text-sm">
                    <p className="flex justify-between"><span>Profit:</span> <span className="font-semibold text-green-500">{formatCurrency(monthlyStats.totalProfit)}</span></p>
                    <p className="flex justify-between"><span>Loss:</span> <span className="font-semibold text-red-500">{formatCurrency(monthlyStats.totalLoss)}</span></p>
                    <p className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2 mt-2"><span>Net P&L:</span> <span className={monthlyStats.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(monthlyStats.netPnl)}</span></p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div><p className="flex justify-between"><span>Total Trades:</span> <span className="font-semibold">{monthlyStats.total}</span></p></div>
                <div><p className="flex justify-between"><span>Win Rate:</span> <span className="font-semibold">{monthlyStats.winRate.toFixed(1)}%</span></p></div>
                <div><p className="flex justify-between"><span>Wins:</span> <span className="font-semibold text-green-500">{monthlyStats.wins}</span></p></div>
                <div><p className="flex justify-between"><span>Losses:</span> <span className="font-semibold text-red-500">{monthlyStats.losses}</span></p></div>
                <div className="col-span-2"><hr className="my-1 border-gray-200 dark:border-gray-700"/></div>
                <div><p className="flex justify-between"><span>Bias Correct:</span> <span className="font-semibold text-green-500">{monthlyStats.biasCorrect}</span></p></div>
                <div><p className="flex justify-between"><span>Bias Incorrect:</span> <span className="font-semibold text-red-500">{monthlyStats.biasIncorrect}</span></p></div>
                <div className="col-span-2"><hr className="my-1 border-gray-200 dark:border-gray-700"/></div>
                <div><p className="flex justify-between"><span>Disciplined:</span> <span className="font-semibold text-green-500">{monthlyStats.disciplinedDays}</span></p></div>
                <div><p className="flex justify-between"><span>Overtraded:</span> <span className="font-semibold text-yellow-500">{monthlyStats.overtradedDays}</span></p></div>
                <div className="col-span-2"><p className="flex justify-between"><span>Loss Exceeded:</span> <span className="font-semibold text-red-500">{monthlyStats.lossExceededDays}</span></p></div>
            </div>
        </div>
    );
};

const ProfileModal = ({ user, profileData, onSave, onCancel }) => {
    const [displayName, setDisplayName] = useState(profileData.displayName || '');
    const [dob, setDob] = useState(profileData.dob || '');

    const handleSave = () => {
        onSave({ displayName, dob });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Profile</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Display Name</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Email</label>
                        <p className="w-full bg-gray-100 dark:bg-gray-700/50 border rounded-md py-2 px-3 text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Date of Birth</label>
                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition">Save Profile</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Trading Journal Component (Refactored from App) ---
function TradingJournal({ user, handleLogout, theme, setTheme }) {
  const [transactions, setTransactions] = useState([]);
  const [dailyJournals, setDailyJournals] = useState({});
  const [tags, setTags] = useState([]);
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
      startingEquity: 10000,
      dailyProfitTarget: { value: 2, unit: '%' },
      dailyLossLimit: { value: 1, unit: '%' },
      maxTradesPerDay: 5,
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingTrade, setViewingTrade] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const TRADES_PER_PAGE = 10;
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const dateFilterRef = useRef(null);
  const [weeklyReview, setWeeklyReview] = useState('');
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    const tradesCollectionPath = `users/${user.uid}/trades`;
    const journalsCollectionPath = `users/${user.uid}/dailyJournals`;
    const settingsDocPath = `users/${user.uid}/profile/settings`;
    const profileDocPath = `users/${user.uid}/profile/info`;
    const tagsCollectionPath = `users/${user.uid}/tags`;

    const q = query(collection(db, tradesCollectionPath), orderBy("date", "desc"));
    const unsubscribeTrades = onSnapshot(q, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ ...doc.data(), id: doc.id });
      });
      setTransactions(transactionsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching trades:", error);
        setLoading(false);
    });

    const journalsQuery = query(collection(db, journalsCollectionPath));
    const unsubJournals = onSnapshot(journalsQuery, (querySnapshot) => {
        const journalsData = {};
        querySnapshot.forEach((doc) => {
            journalsData[doc.id] = doc.data();
        });
        setDailyJournals(journalsData);
    }, (error) => {
        console.error("Error fetching daily journals:", error);
    });

    const tagsQuery = query(collection(db, tagsCollectionPath), orderBy("name"));
    const unsubTags = onSnapshot(tagsQuery, (querySnapshot) => {
        const tagsData = [];
        querySnapshot.forEach((doc) => {
            tagsData.push({ ...doc.data(), id: doc.id });
        });
        setTags(tagsData);
    }, (error) => {
        console.error("Error fetching tags:", error);
    });

    const unsubSettings = onSnapshot(doc(db, settingsDocPath), (doc) => {
        if (doc.exists()) {
            const loadedSettings = doc.data();
            // Migration for old settings format
            if (typeof loadedSettings.dailyProfitTarget === 'number') {
                loadedSettings.dailyProfitTarget = { value: loadedSettings.dailyProfitTarget, unit: '%' };
            }
            if (typeof loadedSettings.dailyLossLimit === 'number') {
                loadedSettings.dailyLossLimit = { value: loadedSettings.dailyLossLimit, unit: '%' };
            }
            setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
        } else {
            console.log("No settings document found for user. Using defaults.");
        }
    }, (error) => {
        console.error("Error fetching settings:", error);
    });

    const unsubProfile = onSnapshot(doc(db, profileDocPath), (doc) => {
        if (doc.exists()) {
            setProfileData(doc.data());
        }
    }, (error) => {
        console.error("Error fetching profile data:", error);
    });


    return () => {
        unsubscribeTrades();
        unsubJournals();
        unsubSettings();
        unsubProfile();
        unsubTags();
    };
  }, [user]);
  
  useEffect(() => {
    function handleClickOutside(event) {
        if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
            setIsDateFilterOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dateFilterRef]);

  const saveSettings = async (newSettings) => {
      if (!user) {
          console.error("Cannot save settings, no user logged in.");
          return;
      }
      const settingsDocPath = `users/${user.uid}/profile/settings`;
      try {
          await setDoc(doc(db, settingsDocPath), newSettings, { merge: true });
          setSettings(newSettings);
          setIsSettingsModalOpen(false);
      } catch (error) {
          console.error("Error saving settings to Firestore:", error);
      }
  };

  const saveProfile = async (newProfileData) => {
    if (!user) {
        console.error("Cannot save profile, no user logged in.");
        return;
    }
    const profileDocPath = `users/${user.uid}/profile/info`;
    try {
        await setDoc(doc(db, profileDocPath), newProfileData, { merge: true });
        setProfileData(newProfileData);
        setIsProfileModalOpen(false);
    } catch (error) {
        console.error("Error saving profile to Firestore:", error);
    }
  };


  const addTag = async (tagName, tagColor) => {
      if (!user || !tagName) return;
      const tagsCollectionPath = `users/${user.uid}/tags`;
      // Check for duplicates (case-insensitive)
      const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (existingTag) {
          console.error("Tag already exists.");
          // Maybe return an error message to the UI
          return; 
      }
      try {
          await addDoc(collection(db, tagsCollectionPath), {
              name: tagName,
              color: tagColor,
          });
      } catch (error) {
          console.error("Error adding tag: ", error);
      }
  };

  const updateTag = async (tagId, newName, newColor) => {
      if (!user) return;
      const tagDocRef = doc(db, `users/${user.uid}/tags`, tagId);
      try {
          await updateDoc(tagDocRef, { name: newName, color: newColor });
      } catch (error) {
          console.error("Error updating tag: ", error);
      }
  };

  const deleteTag = async (tagId) => {
      if (!user) return;
      // This is a simple delete. A more robust version would check if the tag is in use and maybe offer to remove it from all trades. For now, we'll just delete the definition.
      const tagDocRef = doc(db, `users/${user.uid}/tags`, tagId);
      try {
          await deleteDoc(tagDocRef);
      } catch (error) {
          console.error("Error deleting tag: ", error);
      }
  };

  const addTransaction = async (tx) => {
    const tradesCollectionPath = `users/${user.uid}/trades`;
    const status = (tx.type === 'Buy' || tx.type === 'Sell') ? (tx.pnl >= 0 ? 'Win' : 'Loss') : null;
    const newTx = { 
        ...tx,
        date: Timestamp.fromDate(new Date()), 
        status, 
        notes: '', 
        tags: [], 
        rating: 0,
        imageUrl: ''
    };
    try {
        await addDoc(collection(db, tradesCollectionPath), newTx);
    } catch (error) {
        console.error("Error adding transaction: ", error);
    }
  };

  const deleteTransaction = async (id, imageUrl) => {
    if (!user) return;
    const tradesCollectionPath = `users/${user.uid}/trades`;
    try {
        await deleteDoc(doc(db, tradesCollectionPath, id));
        if (imageUrl) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        }
    } catch (error) {
        if (error.code !== 'storage/object-not-found') {
            console.error("Error deleting transaction or associated image: ", error);
        }
    }
  };
  
  const saveTransactionDetails = async (updatedTx) => {
    if (!user) return;
    const tradesCollectionPath = `users/${user.uid}/trades`;
    const txRef = doc(db, tradesCollectionPath, updatedTx.id);
    const { id, ...dataToSave } = updatedTx;
    try {
        await updateDoc(txRef, dataToSave);
    } catch (error) {
        console.error("Error updating transaction: ", error);
    }
  };

  const saveDailyJournal = async (dateString, journalData) => {
      if (!user) return;
      const journalsCollectionPath = `users/${user.uid}/dailyJournals`;
      const journalRef = doc(db, journalsCollectionPath, dateString);
      try {
           await setDoc(journalRef, journalData, { merge: true });
      } catch (error) {
        console.error("Error saving daily journal: ", error);
      }
  };

  const handleDayClick = (dateObject) => setSelectedCalendarDate(dateObject);
  const handleOpenTradeFromCalendar = (trade) => { setSelectedCalendarDate(null); setViewingTrade(trade); };
  
  const filteredByDateTransactions = useMemo(() => {
    if (!startDate && !endDate) {
        return transactions;
    }
    return transactions.filter(tx => {
        const txDate = tx.date.toDate();
        const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : null;
        const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

        const startDateMatch = !start || txDate >= start;
        const endDateMatch = !end || txDate <= end;

        return startDateMatch && endDateMatch;
    });
  }, [transactions, startDate, endDate]);

  const startingEquityForChart = useMemo(() => {
      if (!startDate) return 0;
      const start = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      
      const priorTransactions = transactions.filter(tx => tx.date.toDate() < start);
      
      return priorTransactions.reduce((sum, tx) => sum + tx.pnl, 0);

  }, [transactions, startDate]);

  const { dashboardStats, advancedStats, weeklyStats, dailyStats, consistencyByDay } = useMemo(() => {
    const sourceData = filteredByDateTransactions;
    
    const tradesOnly = sourceData.filter(tx => tx.type === 'Buy' || tx.type === 'Sell');
    const deposits = sourceData.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.pnl, 0);
    const withdrawals = sourceData.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.pnl, 0);
    
    const totalPnl = sourceData.reduce((sum, tx) => sum + tx.pnl, 0);
    const currentEquity = startingEquityForChart + totalPnl;

    const todayStr = new Date().toDateString();
    const todaysTrades = transactions.filter(tx => (tx.type === 'Buy' || tx.type === 'Sell') && tx.date.toDate().toDateString() === todayStr);
    const todaysPnl = todaysTrades.reduce((sum, tx) => sum + tx.pnl, 0);
    const profitTargetValue = settings.dailyProfitTarget.unit === '%'
        ? (settings.startingEquity * settings.dailyProfitTarget.value) / 100
        : settings.dailyProfitTarget.value;

    const lossLimitValue = settings.dailyLossLimit.unit === '%'
        ? -Math.abs((settings.startingEquity * settings.dailyLossLimit.value) / 100)
        : -Math.abs(settings.dailyLossLimit.value);

    const dailyStats = {
        pnl: todaysPnl,
        tradeCount: todaysTrades.length,
        profitTargetHit: profitTargetValue > 0 && todaysPnl >= profitTargetValue,
        lossLimitHit: todaysPnl <= lossLimitValue,
        maxTradesHit: todaysTrades.length >= settings.maxTradesPerDay,
    };

    const calculateConsistencyForDay = (dailyTrades, settings) => {
        if (dailyTrades.length === 0) return 'NO_TRADES';
        const dailyPnl = dailyTrades.reduce((sum, tx) => sum + tx.pnl, 0);
        const profitTarget = settings.dailyProfitTarget.unit === '%'
            ? (settings.startingEquity * settings.dailyProfitTarget.value) / 100
            : settings.dailyProfitTarget.value;
        const lossLimit = settings.dailyLossLimit.unit === '%'
            ? -Math.abs((settings.startingEquity * settings.dailyLossLimit.value) / 100)
            : -Math.abs(settings.dailyLossLimit.value);

        if (dailyPnl <= lossLimit) return 'LOSS_LIMIT_HIT';
        if (profitTarget > 0 && dailyPnl >= profitTarget) return 'PROFIT_TARGET_HIT';
        if (dailyTrades.length > settings.maxTradesPerDay) {
            return dailyPnl >= 0 ? 'OVERTRADED_WIN' : 'OVERTRADED_LOSS';
        }
        return dailyPnl >= 0 ? 'DISCIPLINED_WIN' : 'DISCIPLINED_LOSS';
    };

    const consistencyByDay = {};
    const tradesByDate = transactions.reduce((acc, tx) => {
        const dateStr = tx.date.toDate().toISOString().split('T')[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(tx);
        return acc;
    }, {});

    for (const dateStr in tradesByDate) {
        const dailyTrades = tradesByDate[dateStr].filter(tx => tx.type === 'Buy' || tx.type === 'Sell');
        consistencyByDay[dateStr] = calculateConsistencyForDay(dailyTrades, settings);
    }
    
    // Weekly Stats Calculation
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const weeklyTrades = transactions.filter(tx => (tx.type === 'Buy' || tx.type === 'Sell') && tx.date.toDate() >= last7Days);
    const weeklyPnl = weeklyTrades.reduce((sum, tx) => sum + tx.pnl, 0);
    const weeklyWins = weeklyTrades.filter(t => t.status === 'Win').length;
    const weeklyLosses = weeklyTrades.filter(t => t.status === 'Loss').length;
    const weeklyTotalTrades = weeklyTrades.length;
    const weeklyWinRate = weeklyTotalTrades > 0 ? (weeklyWins / weeklyTotalTrades) * 100 : 0;
    const bestTrade = weeklyTrades.length > 0 ? Math.max(...weeklyTrades.map(t => t.pnl)) : 0;
    const worstTrade = weeklyTrades.length > 0 ? Math.min(...weeklyTrades.map(t => t.pnl)) : 0;
    const weeklyConsistency = { disciplined: 0, overtraded: 0, lossExceeded: 0 };
    const weeklyDays = new Set(weeklyTrades.map(t => t.date.toDate().toISOString().split('T')[0]));
    weeklyDays.forEach(dateStr => {
        const status = consistencyByDay[dateStr];
        if (status === 'PROFIT_TARGET_HIT' || status === 'DISCIPLINED_WIN' || status === 'DISCIPLINED_LOSS') weeklyConsistency.disciplined++;
        else if (status === 'OVERTRADED_WIN' || status === 'OVERTRADED_LOSS') weeklyConsistency.overtraded++;
        else if (status === 'LOSS_LIMIT_HIT') weeklyConsistency.lossExceeded++;
    });


    const totalPnlFromTrades = tradesOnly.reduce((sum, t) => sum + t.pnl, 0);
    const winningTrades = tradesOnly.filter(t => t.status === 'Win');
    const losingTrades = tradesOnly.filter(t => t.status === 'Loss');
    const winRate = tradesOnly.length > 0 ? winningTrades.length / tradesOnly.length : 0;
    const uniqueTradeDays = new Set(tradesOnly.map(t => t.date.toDate().toLocaleDateString())).size;
    const avgTradesPerDay = uniqueTradeDays > 0 ? tradesOnly.length / uniqueTradeDays : 0;
    const tagMap = {};
    tradesOnly.forEach(trade => (trade.tags || []).forEach(tag => { if (!tagMap[tag]) tagMap[tag] = { pnl: 0, count: 0 }; tagMap[tag].pnl += trade.pnl; tagMap[tag].count++; }));
    const tagPerformanceArray = Object.entries(tagMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.pnl - a.pnl);
    const top3 = tagPerformanceArray.filter(t => t.pnl > 0).slice(0, 3);
    const bottom3 = [...tagPerformanceArray.filter(t => t.pnl < 0)].reverse().slice(0, 3);
    const chronoSortedTradesOnly = [...tradesOnly].sort((a,b) => a.date.toDate() - b.date.toDate());
    let maxWinStreak = 0, currentWinStreak = 0, maxLossStreak = 0, currentLossStreak = 0;
    chronoSortedTradesOnly.forEach(trade => { if (trade.status === 'Win') { currentWinStreak++; currentLossStreak = 0; if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak; } else { currentLossStreak++; currentWinStreak = 0; if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak; } });
    const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / (winningTrades.length || 1);
    const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / (losingTrades.length || 1));
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayPerformance = dayNames.reduce((acc, day) => ({...acc, [day]: {pnl: 0, count: 0, wins: 0, losses: 0, totalRating: 0, ratedTrades: 0 }}), {});
    tradesOnly.forEach(trade => { 
        const day = dayNames[trade.date.toDate().getDay()]; 
        dayPerformance[day].pnl += trade.pnl; 
        dayPerformance[day].count++;
        if (trade.status === 'Win') dayPerformance[day].wins++;
        else if (trade.status === 'Loss') dayPerformance[day].losses++;
        if (trade.rating > 0) {
            dayPerformance[day].totalRating += trade.rating;
            dayPerformance[day].ratedTrades++;
        }
    });
    const pnlByRating1 = tradesOnly.filter(t => t.rating === 1).reduce((sum, t) => sum + t.pnl, 0);
    const pnlByRating5 = tradesOnly.filter(t => t.rating === 5).reduce((sum, t) => sum + t.pnl, 0);
    const chronoSortedTransactions = [...sourceData].sort((a,b) => a.date.toDate() - b.date.toDate());
    let peakEquity = startingEquityForChart, maxDrawdownValue = 0, currentDrawdownDuration = 0, longestDrawdownDuration = 0, inDrawdown = false;
    let cumulativeEquity = startingEquityForChart;
    chronoSortedTransactions.forEach(trade => { 
        cumulativeEquity += trade.pnl; 
        if (cumulativeEquity > peakEquity) { 
            peakEquity = cumulativeEquity; 
            if (inDrawdown) { 
                if (currentDrawdownDuration > longestDrawdownDuration) longestDrawdownDuration = currentDrawdownDuration; 
                currentDrawdownDuration = 0; 
                inDrawdown = false; 
            } 
        } else { 
            const drawdown = peakEquity - cumulativeEquity; 
            if (drawdown > maxDrawdownValue) maxDrawdownValue = drawdown; 
            if (trade.type === 'Buy' || trade.type === 'Sell') { 
                if (!inDrawdown) inDrawdown = true; 
                currentDrawdownDuration++; 
            } 
        } 
    });
    if (inDrawdown && currentDrawdownDuration > longestDrawdownDuration) longestDrawdownDuration = currentDrawdownDuration;
    const maxDrawdownPercent = peakEquity > 0 ? (maxDrawdownValue / peakEquity) * 100 : 0;
    const lossRate = 1 - winRate;
    const expectancyValue = (winRate * avgWin) - (lossRate * avgLoss);
    const breakEvenRRR = winRate > 0 ? (lossRate / winRate) : 0;
    let suggestion = "Not enough data.";
    if (tradesOnly.length >= 10) { if (expectancyValue > 0) suggestion = `Your system is profitable. Aim for trades with an R:R above 1:${(breakEvenRRR + 0.5).toFixed(2)}.`; else suggestion = `Your system is not yet profitable. Focus on increasing Win Rate or aiming for an R:R above 1:${(breakEvenRRR + 0.5).toFixed(2)}.`; }

    return {
        dashboardStats: { totalPnl: totalPnlFromTrades, currentEquity, totalDeposits: deposits, totalWithdrawals: withdrawals, winRate, totalTrades: tradesOnly.length },
        advancedStats: { totalTrades: tradesOnly.length, tagPerformance: { top3, bottom3 }, streaks: { maxWinStreak, maxLossStreak }, dayPerformance, avgWinLossRatio, ratingPerformance: { pnlByRating1, pnlByRating5 }, drawdown: { maxDrawdownValue, maxDrawdownPercent, longestDrawdownDuration }, expectancy: { expectancyValue, breakEvenRRR, suggestion }, winRate, avgTradesPerDay },
        weeklyStats: { pnl: weeklyPnl, wins: weeklyWins, losses: weeklyLosses, totalTrades: weeklyTotalTrades, winRate: weeklyWinRate, bestTrade, worstTrade, consistency: weeklyConsistency },
        dailyStats,
        consistencyByDay
    };
  }, [filteredByDateTransactions, settings, dailyJournals, transactions, startingEquityForChart]);

  const filteredAndSortedTransactions = useMemo(() => {
    return [...transactions] // Use all transactions for the history table, not date-filtered ones
      .filter(tx => {
        const typeMatch = filterType === 'all' || tx.type === filterType;
        const statusMatch = (tx.type !== 'Buy' && tx.type !== 'Sell') || filterStatus === 'all' || tx.status === filterStatus;
        return typeMatch && statusMatch;
      })
      .sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aValue = sortConfig.key === 'date' ? a.date.toDate() : a[sortConfig.key];
        const bValue = sortConfig.key === 'date' ? b.date.toDate() : b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
  }, [transactions, filterStatus, filterType, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / TRADES_PER_PAGE);
  const paginatedTransactions = filteredAndSortedTransactions.slice((currentPage - 1) * TRADES_PER_PAGE, currentPage * TRADES_PER_PAGE);

  const monthlyStats = useMemo(() => {
    const monthTrades = transactions.filter(t => { const d = t.date.toDate(); return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth() && (t.type === 'Buy' || t.type === 'Sell'); });
    const total = monthTrades.length;
    const wins = monthTrades.filter(t => t.status === 'Win').length;
    const losses = monthTrades.filter(t => t.status === 'Loss').length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const totalProfit = monthTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = monthTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0);
    
    let biasCorrect = 0;
    let biasIncorrect = 0;
    let disciplinedDays = 0;
    let overtradedDays = 0;
    let lossExceededDays = 0;

    const monthDays = new Set(monthTrades.map(t => t.date.toDate().toISOString().split('T')[0]));
    
    monthDays.forEach(dateStr => {
        const status = consistencyByDay[dateStr];
        switch(status) {
            case 'PROFIT_TARGET_HIT':
            case 'DISCIPLINED_WIN':
            case 'DISCIPLINED_LOSS':
                disciplinedDays++;
                break;
            case 'OVERTRADED_WIN':
            case 'OVERTRADED_LOSS':
                overtradedDays++;
                break;
            case 'LOSS_LIMIT_HIT':
                lossExceededDays++;
                break;
            default:
                break;
        }
    });

    Object.entries(dailyJournals).forEach(([dateStr, journal]) => {
        const journalDate = new Date(dateStr);
        if(journalDate.getFullYear() === currentDate.getFullYear() && journalDate.getMonth() === currentDate.getMonth()){
            if(journal.biasOutcome === 'correct') biasCorrect++;
            if(journal.biasOutcome === 'incorrect') biasIncorrect++;
        }
    });

    return { total, wins, losses, winRate, totalProfit, totalLoss, netPnl: totalProfit + totalLoss, biasCorrect, biasIncorrect, disciplinedDays, overtradedDays, lossExceededDays };
  }, [transactions, currentDate, dailyJournals, consistencyByDay]);

  const todayString = new Date().toISOString().split('T')[0];
  const todayBias = dailyJournals[todayString] || {};
  
  const handleGenerateWeeklyReview = async () => {
        setIsGeneratingReview(true);
        setReviewError('');
        setWeeklyReview('');

        const systemInstruction = `You are a trading performance coach providing a weekly review. Analyze the user's data and structure your response into exactly FIVE sections using the following markdown titles: **Weekly Snapshot**, **Major Wins**, **Key Lessons**, **Action Plan**, and **Motivational Tip**.
- For **Weekly Snapshot**, briefly state the key metrics like P&L and Win Rate.
- For **Major Wins**, highlight the best trade and disciplined performance.
- For **Key Lessons**, discuss the worst trade and any patterns of overtrading or hitting loss limits.
- For **Action Plan**, provide 1-2 concrete, actionable steps for the next week.
- For **Motivational Tip**, give a short, encouraging closing thought.
Keep each section concise and to the point. Do not add any other sections or introductory text.`;
        
        const userQuery = `Please generate a weekly performance review based on the following data for the last 7 days:
- Total P&L: ${formatCurrency(weeklyStats.pnl)}
- Win Rate: ${weeklyStats.winRate.toFixed(1)}%
- Total Trades: ${weeklyStats.totalTrades} (${weeklyStats.wins} wins, ${weeklyStats.losses} losses)
- Best Trade P&L: ${formatCurrency(weeklyStats.bestTrade)}
- Worst Trade P&L: ${formatCurrency(weeklyStats.worstTrade)}
- Consistency Summary: ${weeklyStats.consistency.disciplined} disciplined days, ${weeklyStats.consistency.overtraded} overtraded days, ${weeklyStats.consistency.lossExceeded} loss-limit days.`;

        try {
            const review = await callGeminiAPI(userQuery, systemInstruction);
            setWeeklyReview(review);
        } catch (error) {
            console.error("AI Weekly Review Error:", error);
            setReviewError("Sorry, the AI review failed. Please try again later.");
        } finally {
            setIsGeneratingReview(false);
        }
    };

  const TabButton = ({ tabName }) => {
    const isActive = activeTab === tabName;
    return (
      <button 
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {tabName}
      </button>
    );
  };
  
  const setDateRange = (days) => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days + 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
  };

  const clearDateFilter = () => {
      setStartDate(null);
      setEndDate(null);
  };
  
  const formatDateForInput = (date) => {
      if (!date) return '';
      return new Date(date).toISOString().split('T')[0];
  }

  const exportToCSV = (data) => {
    if (!data || data.length === 0) {
        console.log("No data to export.");
        return;
    }

    const headers = ['ID', 'Date', 'Type', 'Status', 'P&L', 'Notes', 'Tags', 'Rating'];
    
    const sanitize = (str) => {
        if (str === null || str === undefined) return '';
        const s = String(str);
        if (s.search(/("|,|\n)/g) >= 0) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const rows = data.map(tx => [
        tx.id,
        tx.date.toDate().toISOString(),
        tx.type,
        tx.status || 'N/A',
        tx.pnl,
        sanitize(tx.notes || ''),
        sanitize((tx.tags || []).join('; ')),
        tx.rating || 0
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "trading_journal_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  const WeeklyReviewGenerator = ({ onGenerate, review, isLoading, error, stats }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slideIcons = {
        "Weekly Snapshot": <TargetIcon className="w-5 h-5 mr-2 text-blue-500" />,
        "Major Wins": <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />,
        "Key Lessons": <AlertTriangleIcon className="w-5 h-5 mr-2 text-yellow-500" />,
        "Action Plan": <ClipboardCheckIcon className="w-5 h-5 mr-2 text-indigo-500" />,
        "Motivational Tip": <StarIcon className="w-5 h-5 mr-2 text-amber-500" filled={true} />,
    };

    const parsedReview = useMemo(() => {
        if (!review) return null;
        const sections = review.split(/\*\*(.*?)\*\*/).filter(Boolean);
        const result = [];
        for (let i = 0; i < sections.length; i += 2) {
            const title = sections[i].trim();
            const content = sections[i + 1]?.trim().replace(/^- /gm, '').split('<br />').filter(line => line.trim() !== '');
            if (title && content) {
                result.push({ title, content, icon: slideIcons[title] || null });
            }
        }
        return result.length > 0 ? result : null;
    }, [review]);

    const goToNext = () => {
        if (parsedReview) {
            setCurrentSlide(prev => (prev + 1) % parsedReview.length);
        }
    };

    const goToPrev = () => {
        if (parsedReview) {
            setCurrentSlide(prev => (prev - 1 + parsedReview.length) % parsedReview.length);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-4 text-center">AI Weekly Performance Review</h3>
            <button
                onClick={onGenerate}
                disabled={isLoading || stats.totalTrades < 1}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <MagicWandIcon className="w-5 h-5" />
                <span>{isLoading ? 'Generating...' : '✨ Get My Weekly Review'}</span>
            </button>
            {stats.totalTrades < 1 && !review && <p className="text-xs text-center mt-2 text-gray-400">Trade at least once this week to generate a review.</p>}
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
            {isLoading && <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">Your AI coach is analyzing your week...</div>}
            
            {parsedReview && !isLoading && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="overflow-hidden relative h-48">
                        {parsedReview.map((slide, index) => (
                            <div
                                key={index}
                                className="absolute w-full h-full transition-opacity duration-500 ease-in-out"
                                style={{ opacity: index === currentSlide ? 1 : 0 }}
                            >
                                <h4 className="font-bold text-md text-gray-800 dark:text-gray-200 flex items-center">
                                    {slide.icon}
                                    {slide.title}
                                </h4>
                                <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                                    {slide.content.map((item, itemIndex) => (
                                        <li key={itemIndex}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center mt-4">
                        <button onClick={goToPrev} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="flex space-x-2 mx-4">
                            {parsedReview.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                ></button>
                            ))}
                        </div>
                        <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen font-sans p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsProfileModalOpen(true)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                <UserIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Trading Journal</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{profileData.displayName || user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">{theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}</button>
            <button onClick={handleLogout} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"><LogOutIcon className="w-6 h-6" /></button>
          </div>
        </header>

        <nav className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="-mb-px flex space-x-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                    <TabButton tabName="Dashboard" />
                    <TabButton tabName="Journal" />
                    <TabButton tabName="Analytics" />
                    <TabButton tabName="Chart Analyzer" />
                    <TabButton tabName="Community" />
                </div>
            </div>
        </nav>

        <main>
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main content column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      <DashboardCard title="Current Equity" value={formatCurrency(dashboardStats.currentEquity)} valueColor="text-blue-500" icon={<TargetIcon className="w-6 h-6 text-blue-500" />} />
                      <DashboardCard title="Total P&L (Trades)" value={formatCurrency(dashboardStats.totalPnl)} valueColor={dashboardStats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'} icon={<DollarSignIcon className="w-6 h-6 text-green-500" />} />
                      <DashboardCard title="Win Rate" value={`${(dashboardStats.winRate * 100).toFixed(1)}%`} valueColor="text-indigo-500" icon={<PercentIcon className="w-6 h-6 text-indigo-500" />} subValue={`${dashboardStats.totalTrades} trades`} />
                      <DashboardCard title="Total Deposits" value={formatCurrency(dashboardStats.totalDeposits)} valueColor="text-yellow-500" icon={<PlusCircleIcon className="w-6 h-6 text-yellow-500" />} />
                      <DashboardCard title="Total Withdrawals" value={formatCurrency(dashboardStats.totalWithdrawals)} valueColor="text-orange-500" icon={<MinusCircleIcon className="w-6 h-6 text-orange-500" />} />
                </div>
                
                {/* TradingView Widget */}
                <TradingViewWidget />
                
                {/* Add a Trade Button */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <button onClick={() => setActiveTab('Journal')} className="w-full p-4 flex justify-between items-center text-left text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <div className="flex items-center space-x-3">
                          <PlusCircleIcon className="w-6 h-6" />
                          <h2 className="text-xl font-bold">Add a Trade</h2>
                      </div>
                      <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Trading Calendar */}
                <TradingCalendar transactions={transactions} currentDate={currentDate} setCurrentDate={setCurrentDate} onDayClick={handleDayClick} dailyJournals={dailyJournals} consistencyByDay={consistencyByDay} />
              </div>

              {/* Sidebar column */}
              <div className="lg:col-span-1 space-y-8">
                  <MonthlyStatsBreakdown monthlyStats={monthlyStats} />
                  <ConsistencyTracker dailyStats={dailyStats} settings={settings} onOpenSettings={() => setIsSettingsModalOpen(true)} />
                  <DailyBriefingAndBiasSetter todayBias={todayBias} onSaveBias={(biasData) => saveDailyJournal(todayString, biasData)} />
                  <WeeklyReviewGenerator onGenerate={handleGenerateWeeklyReview} review={weeklyReview} isLoading={isGeneratingReview} error={reviewError} stats={weeklyStats} />
              </div>
            </div>
          )}

          {activeTab === 'Journal' && (
            <div className="space-y-8">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md relative">
                  <div className="absolute top-6 left-6 z-20" ref={dateFilterRef}>
                      <button 
                          onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                          className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-4 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                          <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <span>Pick Date Range</span>
                      </button>
                      {isDateFilterOpen && (
                          <div className="absolute top-full mt-2 bg-white dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-xl">
                              <h3 className="font-bold text-sm mb-3 text-gray-800 dark:text-gray-200">Filter by Date</h3>
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label htmlFor="start-date" className="text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
                                      <input 
                                          type="date" 
                                          id="start-date"
                                          value={formatDateForInput(startDate)}
                                          onChange={(e) => setStartDate(e.target.value)}
                                          className="mt-1 w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                  </div>
                                  <div>
                                      <label htmlFor="end-date" className="text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
                                      <input 
                                          type="date" 
                                          id="end-date"
                                          value={formatDateForInput(endDate)}
                                          onChange={(e) => setEndDate(e.target.value)}
                                          className="mt-1 w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                  </div>
                                  <div className="col-span-2 flex space-x-2">
                                      <button onClick={() => setDateRange(7)} className="w-full text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 py-1.5 px-2 rounded-md transition">7D</button>
                                      <button onClick={() => setDateRange(30)} className="w-full text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 py-1.5 px-2 rounded-md transition">30D</button>
                                      <button onClick={() => setDateRange(90)} className="w-full text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 py-1.5 px-2 rounded-md transition">90D</button>
                                  </div>
                                  <div className="col-span-2">
                                      <button onClick={clearDateFilter} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-4 rounded-md transition text-xs">Clear Filter</button>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <h2 className="text-xl font-bold mb-4 text-center">Equity Curve</h2>
                  <div className="h-96">
                      <EquityCurveChart transactions={filteredByDateTransactions} startingEquity={startingEquityForChart} />
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <div className="p-6 flex justify-between items-center"><h2 className="text-xl font-bold">Add New Transaction</h2><button onClick={() => setIsFormVisible(!isFormVisible)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">{isFormVisible ? <MinusCircleIcon className="w-6 h-6"/> : <PlusCircleIcon className="w-6 h-6"/>}</button></div>
                  {isFormVisible && <div className="border-t border-gray-200 dark:border-gray-700"><AddTransactionForm onAddTransaction={addTransaction} /></div>}
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Transaction History ({filteredAndSortedTransactions.length})</h2>
                      <div className="flex items-center space-x-4">
                          <select onChange={(e) => setFilterStatus(e.target.value)} value={filterStatus} className="bg-gray-50 dark:bg-gray-700 border rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="all">All Statuses</option><option value="Win">Win</option><option value="Loss">Loss</option></select>
                          <select onChange={(e) => setFilterType(e.target.value)} value={filterType} className="bg-gray-50 dark:bg-gray-700 border rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="all">All Types</option><option value="Buy">Buy</option><option value="Sell">Sell</option><option value="Deposit">Deposit</option><option value="Withdrawal">Withdrawal</option></select>
                          <button 
                              onClick={() => exportToCSV(filteredAndSortedTransactions)}
                              className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                              title="Export to CSV"
                          >
                              <DownloadIcon className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead><tr className="border-b border-gray-200 dark:border-gray-700"><th className="p-2 sm:p-3 font-semibold">Details</th><th className="p-2 sm:p-3 font-semibold cursor-pointer" onClick={() => requestSort('date')}>Date ⇅</th><th className="p-2 sm:p-3 font-semibold">Type</th><th className="p-2 sm:p-3 font-semibold">Status</th><th className="p-2 sm:p-3 font-semibold cursor-pointer" onClick={() => requestSort('pnl')}>Amount ⇅</th><th className="p-2 sm:p-3 font-semibold">Actions</th></tr></thead>
                      <tbody>
                      {loading ? ( <tr><td colSpan="6" className="text-center p-8">Loading data...</td></tr> ) : paginatedTransactions.length > 0 ? (
                          paginatedTransactions.map(tx => (
                          <tr key={tx.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setViewingTrade(tx)}>
                              <td className="p-2 sm:p-3 text-center">{ (tx.notes || (tx.tags && tx.tags.length > 0) || tx.rating > 0 || tx.imageUrl) && <NoteIcon className="w-5 h-5 text-blue-500 mx-auto"/> }</td>
                              <td className="p-2 sm:p-3 whitespace-nowrap">{tx.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className={`p-2 sm:p-3 font-semibold ${tx.type === 'Buy' ? 'text-green-500' : tx.type === 'Sell' ? 'text-red-500' : tx.type === 'Deposit' ? 'text-blue-500' : 'text-orange-500'}`}>{tx.type}</td>
                              <td className={`p-2 sm:p-3 font-semibold ${tx.status === 'Win' ? 'text-green-500' : tx.status === 'Loss' ? 'text-red-500' : ''}`}>{tx.status || '-'}</td>
                              <td className={`p-2 sm:p-3 font-semibold whitespace-nowrap ${tx.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(tx.pnl)}</td>
                              <td className="p-2 sm:p-3"><button onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id, tx.imageUrl); }} className="text-gray-500 hover:text-red-500 transition"><TrashIcon className="w-5 h-5" /></button></td>
                          </tr>
                          ))
                      ) : (<tr><td colSpan="6" className="text-center p-8">No matching data found.</td></tr>)}
                      </tbody>
                  </table>
                  </div>
                  {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
              </div>
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <h3 className="font-bold text-lg mb-4 text-center">Trading Day Performance</h3>
                  <div className="h-64">
                    <PerformanceByDayChart dayPerformance={advancedStats.dayPerformance} />
                  </div>
                </div>
                <AdvancedAnalyticsDashboard stats={advancedStats} />
                <TradeCalculator winRate={advancedStats.winRate} avgTradesPerDay={advancedStats.avgTradesPerDay} />
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-1 space-y-6">
                <MonthlyStatsBreakdown monthlyStats={monthlyStats} />
                <TagManagementPage
                  tags={tags}
                  transactions={transactions}
                  onAddTag={addTag}
                  onUpdateTag={updateTag}
                  onDeleteTag={deleteTag}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'Chart Analyzer' && (
            <ChartAnalyzerPage user={user} />
          )}
          
          {activeTab === 'Community' && (
            <CommunityPage user={user} profileData={profileData} />
          )}

        </main>
        
        {viewingTrade && <TradeDetailModal trade={viewingTrade} user={user} allTags={tags} onAddNewTag={addTag} onSave={saveTransactionDetails} onCancel={() => setViewingTrade(null)} />}
        {selectedCalendarDate && <DailyDetailModal date={selectedCalendarDate} transactions={transactions} dailyJournals={dailyJournals} onSaveJournal={saveDailyJournal} onClose={() => setSelectedCalendarDate(null)} onTradeClick={handleOpenTradeFromCalendar} />}
        {isSettingsModalOpen && <SettingsModal settings={settings} onSave={saveSettings} onCancel={() => setIsSettingsModalOpen(false)} />}
        {isProfileModalOpen && <ProfileModal user={user} profileData={profileData} onSave={saveProfile} onCancel={() => setIsProfileModalOpen(false)} />}
        <GeminiChatbot transactions={transactions} />
      </div>
    </div>
  );
}

const ForgotPasswordModal = ({ onCancel }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent!');
        } catch (err) {
            setError('Failed to send password reset email. Please check the address.');
            console.error("Password reset error:", err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        Reset Password
                    </h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                {message ? (
                    <div className="text-center">
                        <p className="text-green-500">{message}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Check spam email if not in main inbox.</p>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email-address-reset" className="sr-only">Email address</label>
                            <input
                                id="email-address-reset"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter your email address"
                            />
                        </div>

                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Send Reset Link
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};


// --- Authentication Page Component ---
function AuthPage({ onShowLanding }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Wrong email or password.');
            } else {
                setError('An error occurred. Please try again.');
                console.error("Authentication error:", err);
            }
        }
    };

    return (
        <>
            <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md relative">
                    <button 
                        onClick={onShowLanding} 
                        className="absolute top-4 left-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        aria-label="Back to homepage"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                            Sign in to your account
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <div className="text-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsForgotPasswordOpen(true)}
                                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {isForgotPasswordOpen && <ForgotPasswordModal onCancel={() => setIsForgotPasswordOpen(false)} />}
        </>
    );
}


// --- Top-Level App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [showLandingPage, setShowLandingPage] = useState(!sessionStorage.getItem('visitedLanding'));
    const [theme, setTheme] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('themeV12') || 'dark' : 'dark');


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('themeV12', theme);
    }, [theme]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const handleEnterApp = () => {
        sessionStorage.setItem('visitedLanding', 'true');
        setShowLandingPage(false);
    };

    const handleShowLanding = () => {
        setShowLandingPage(true);
    };

    if (showLandingPage) {
        return <LandingPage onEnter={handleEnterApp} theme={theme} setTheme={setTheme} />;
    }

    if (loadingAuth) {
        return (
            <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
        );
    }

    return user ? <TradingJournal user={user} handleLogout={handleLogout} theme={theme} setTheme={setTheme} /> : <AuthPage onShowLanding={handleShowLanding} />;
}









