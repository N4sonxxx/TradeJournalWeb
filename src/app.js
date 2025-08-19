import React, { useState, useEffect, useMemo, useRef } from 'react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
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
    orderBy 
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// --- Firebase Configuration ---
// NOTE: It's best practice to store these in environment variables
const firebaseConfig = {
    apiKey: "AIzaSyDJTS2-XcoJCIR3OYDTE2-oqsUjorA4P-M",
    authDomain: "jurnal-trading-saya.firebaseapp.com",
    projectId: "jurnal-trading-saya",
    // --- [FIXED] Corrected the storageBucket URL ---
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

// --- Helper Functions & Icons ---
const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
const CalendarIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const DollarSignIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SunIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const TargetIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const NoteIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path></svg>;
const StarIcon = ({ className, filled }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const CloseIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ChevronDownIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>;
const PlusCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const MinusCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ImageIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const ChevronLeftIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>;
const SettingsIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CheckCircleIcon = ({ className, style }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const AlertTriangleIcon = ({ className, style }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const XCircleIcon = ({ className, style }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const ClipboardCheckIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m9 14 2 2 4-4"></path></svg>;
const PercentIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>;
const BullIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8h2a2 2 0 0 1 2 2v2M8 8H6a2 2 0 0 0-2 2v2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><path d="M12 12c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z"/></svg>;
const BearIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 16h2a2 2 0 0 0 2-2v-2M8 16H6a2 2 0 0 1-2-2v-2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><path d="M12 12c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z"/></svg>;
const LogOutIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

// --- Components ---

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

const EquityCurveChart = ({ transactions }) => {
    const chartRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries && entries.length > 0) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });

        if (chartRef.current) {
            resizeObserver.observe(chartRef.current);
        }

        return () => {
            if (chartRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                resizeObserver.unobserve(chartRef.current);
            }
        };
    }, []);

    const equityData = useMemo(() => {
        if (!transactions || transactions.length === 0) return { points: '', labels: [] };

        const sortedTransactions = [...transactions].sort((a, b) => a.date.toDate() - b.date.toDate());
        
        let runningEquity = 0;
        
        const equityValues = [];
        sortedTransactions.forEach(tx => {
            runningEquity += tx.pnl;
            equityValues.push({ equity: runningEquity, date: tx.date.toDate() });
        });

        if (equityValues.length < 2) return { points: '', labels: [] };

        const { width, height } = dimensions;
        const margin = { top: 5, right: 5, bottom: 20, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (innerWidth <= 0 || innerHeight <= 0) return { points: '', labels: [] };
        
        const equities = equityValues.map(d => d.equity);
        const maxEquity = Math.max(...equities, 0);
        const minEquity = Math.min(...equities, 0);
        const range = maxEquity - minEquity;

        const xScale = (index) => (index / (equityValues.length - 1)) * innerWidth;
        const yScale = (value) => innerHeight - ((value - minEquity) / (range || 1)) * innerHeight;

        const points = equityValues.map((d, index) => `${xScale(index)},${yScale(d.equity)}`).join(' ');
        
        const labels = [
            { y: yScale(maxEquity), value: maxEquity },
            { y: yScale(minEquity), value: minEquity }
        ];

        return { points, labels, margin, innerWidth, innerHeight };

    }, [transactions, dimensions]);
    
    if (transactions.length < 2) {
      return (
        <div ref={chartRef} className="w-full h-full flex items-center justify-center text-gray-500">
          Requires at least 2 transactions to display the chart.
        </div>
      );
    }
    
    const themeColor = document.documentElement.classList.contains('dark') ? "#4a5568" : "#cbd5e1";
    const textColor = document.documentElement.classList.contains('dark') ? "#a0aec0" : "#4a5568";
    
    return (
      <div ref={chartRef} className="w-full h-full">
        <svg width="100%" height="100%">
          <g transform={`translate(${equityData.margin?.left || 0}, ${equityData.margin?.top || 0})`}>
            {equityData.labels.map(label => (
                <g key={label.value}>
                    <line x1="0" y1={label.y} x2={equityData.innerWidth} y2={label.y} stroke={themeColor} strokeDasharray="2,2" />
                    <text x={-10} y={label.y} dy="0.32em" textAnchor="end" fill={textColor} className="text-xs">{formatCurrency(label.value)}</text>
                </g>
            ))}
            <polyline fill="none" stroke="#4299e1" strokeWidth="2" points={equityData.points} />
          </g>
        </svg>
      </div>
    );
};

const AddTransactionForm = ({ onAddTransaction, disabled }) => {
  const [type, setType] = useState('Buy');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    let pnlValue = parseFloat(amount);
    if (!amount || isNaN(pnlValue)) {
      setError('Amount must be a number.');
      return;
    }
    
    let finalPayload = { type, pnl: pnlValue };
    if (type === 'Withdrawal') {
        finalPayload.pnl = -Math.abs(pnlValue);
    } else if (type === 'Deposit') {
        finalPayload.pnl = Math.abs(pnlValue);
    }

    setError('');
    onAddTransaction(finalPayload);
    setAmount('');
  };

  const isTrade = type === 'Buy' || type === 'Sell';

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300 ${disabled ? 'opacity-50' : ''}`}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Transaction Type</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} disabled={disabled} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed">
            <option>Buy</option>
            <option>Sell</option>
            <option>Deposit</option>
            <option>Withdrawal</option>
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{isTrade ? 'Profit / Loss ($)' : 'Amount ($)'}</label>
          <input id="amount" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={disabled} placeholder={isTrade ? "e.g. 150 or -75" : "e.g. 1000"} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed" />
        </div>
        <button type="submit" disabled={disabled} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
          Save Transaction
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

// --- [UPDATED] TradeDetailModal with Remove Image Feature ---
const TradeDetailModal = ({ trade, user, onSave, onCancel }) => {
    const [date, setDate] = useState(new Date(trade.date.toDate()).toISOString().split('T')[0]);
    const [type, setType] = useState(trade.type);
    const [pnl, setPnl] = useState(trade.pnl);
    const [notes, setNotes] = useState(trade.notes || '');
    const [tags, setTags] = useState(trade.tags ? trade.tags.join(', ') : '');
    const [rating, setRating] = useState(trade.rating || 0);
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(trade.imageUrl || '');
    const [saveError, setSaveError] = useState('');
    const fileInputRef = React.useRef(null);

    const isTrade = type === 'Buy' || type === 'Sell';

    // New function to handle the user's intent to remove an image
    const handleRemoveImage = () => {
        setImageFile(null);
        setImageUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the file input visually
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

            // Case 1: A new file is staged for upload. This handles both adding a new image and replacing an old one.
            if (imageFile) {
                // If an old image existed, delete it from Storage first.
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
            // Case 2: No new file is staged, AND the imageUrl is now empty, but the original trade had an imageUrl. This means "Remove" was clicked.
            else if (!imageUrl && trade.imageUrl) {
                try {
                    const oldImageRef = ref(storage, trade.imageUrl);
                    await deleteObject(oldImageRef);
                    finalImageUrl = ''; // Confirm the URL is empty for Firestore.
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

            const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            const status = isTrade ? (pnlValue >= 0 ? 'Win' : 'Loss') : null;
            
            const updatedTradeData = {
                ...trade,
                date: Timestamp.fromDate(new Date(date)),
                type,
                pnl: pnlValue,
                status,
                notes,
                tags: tagsArray,
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
                            <div>
                                <label htmlFor="tags" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Tags (comma separated)</label>
                                <input id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. breakout, fomo, discipline" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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
    const Bar = ({ label, value, maxValue, color }) => {
        const heightPercentage = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
        return (
            <div className="flex flex-col items-center"><div className="w-full h-32 flex items-end justify-center"><div className={`w-10 rounded-t-md transition-all duration-500 ${color}`} style={{ height: `${heightPercentage}%` }}></div></div><span className="text-xs mt-1">{label}</span></div>
        );
    };

    const maxDayPnl = Math.max(0.01, ...Object.values(dayPerformance).map(d => Math.abs(d.pnl)));

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-4 text-center">Performance by Day</h3>
            <div className="grid grid-cols-7 gap-2">
                {Object.entries(dayPerformance).map(([day, data]) => (<Bar key={day} label={day.substring(0,3)} value={data.pnl} maxValue={maxDayPnl} color={data.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}/>))}
            </div>
        </div>
    );
};


const AdvancedAnalyticsDashboard = ({ stats }) => {
    const { tagPerformance, streaks, avgWinLossRatio, ratingPerformance, drawdown, expectancy } = stats;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-center">Advanced Analytics Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-lg mb-4">Tag Performance Analysis</h3>
                    <div>
                        <h4 className="font-semibold text-green-500 mb-2">Best Strategies (Top 3)</h4>
                        <ul className="space-y-2 text-sm">
                            {tagPerformance.top3.length > 0 ? tagPerformance.top3.map(tag => (<li key={tag.name} className="flex justify-between"><span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">{tag.name}</span><span className="font-mono">{formatCurrency(tag.pnl)}</span></li>)) : <li>No data</li>}
                        </ul>
                    </div>
                    <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                    <div>
                        <h4 className="font-semibold text-red-500 mb-2">Biggest Mistakes (Top 3)</h4>
                        <ul className="space-y-2 text-sm">
                                {tagPerformance.bottom3.length > 0 ? tagPerformance.bottom3.map(tag => (<li key={tag.name} className="flex justify-between"><span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">{tag.name}</span><span className="font-mono">{formatCurrency(tag.pnl)}</span></li>)) : <li>No data</li>}
                        </ul>
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                     <h3 className="font-bold text-lg mb-4">Risk & Psychology Analysis</h3>
                     <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center"><span>Max Win Streak</span><span className="font-bold text-2xl text-green-500">{streaks.maxWinStreak}</span></div>
                        <div className="flex justify-between items-center"><span>Max Loss Streak</span><span className="font-bold text-2xl text-red-500">{streaks.maxLossStreak}</span></div>
                        <hr className="my-2 border-gray-200 dark:border-gray-700"/>
                        <div className="flex justify-between items-center"><span>Average Win/Loss Ratio</span><span className={`font-bold text-2xl ${avgWinLossRatio >= 1.5 ? 'text-green-500' : 'text-yellow-500'}`}>{avgWinLossRatio.toFixed(2)} : 1</span></div>
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
                <div className="lg:col-span-2 xl:col-span-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-lg mb-4">Expectancy & R:R Suggestion</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div><p className="text-sm text-gray-500 dark:text-gray-400">Expectancy per Trade</p><p className={`font-bold text-2xl ${expectancy.expectancyValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(expectancy.expectancyValue)}</p></div>
                        <div><p className="text-sm text-gray-500 dark:text-gray-400">Breakeven R:R (Min.)</p><p className="font-bold text-2xl">1 : {expectancy.breakEvenRRR.toFixed(2)}</p></div>
                        <div className="md:col-span-3 xl:col-span-1 bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg"><p className="text-sm font-bold text-blue-800 dark:text-blue-300">Suggestion</p><p className="text-xs mt-1 text-blue-700 dark:text-blue-400">{expectancy.suggestion}</p></div>
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
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const handleInputChange = (e) => setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const calculateProjections = () => {
        const equity = parseFloat(inputs.equity), target = parseFloat(inputs.target), riskPercent = parseFloat(inputs.risk);
        if (isNaN(equity) || isNaN(target) || isNaN(riskPercent) || equity <= 0 || target <= equity || riskPercent <= 0) {
            setError('Invalid input. Please ensure all numbers are positive and target > initial equity.');
            return setResults(null);
        }
        if (winRate === 0) {
            setError('Your win rate is 0%. Projections cannot be calculated.');
            return setResults(null);
        }
        setError('');

        const scenarios = [1, 2, 3].map(rr => {
            let currentEquity = equity, tradeCount = 0;
            const expectedGainPerTrade = (winRate * (currentEquity * (riskPercent / 100) * rr)) - ((1 - winRate) * (currentEquity * (riskPercent / 100)));
            if (expectedGainPerTrade <= 0) return { rr, trades: Infinity, days: Infinity };
            while (currentEquity < target && tradeCount < 5000) {
                currentEquity += (winRate * (currentEquity * (riskPercent / 100) * rr)) - ((1 - winRate) * (currentEquity * (riskPercent / 100)));
                tradeCount++;
            }
            return { rr, trades: tradeCount >= 5000 ? Infinity : tradeCount, days: avgTradesPerDay > 0 ? Math.ceil(tradeCount / avgTradesPerDay) : Infinity };
        });
        setResults(scenarios);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Initial Equity ($)</label><input name="equity" type="number" value={inputs.equity} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Target Equity ($)</label><input name="target" type="number" value={inputs.target} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Risk per Trade (%)</label><input name="risk" type="number" value={inputs.risk} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
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
        setCurrentSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave({
            startingEquity: Number(currentSettings.startingEquity),
            dailyProfitTarget: Number(currentSettings.dailyProfitTarget),
            dailyLossLimit: Number(currentSettings.dailyLossLimit),
            maxTradesPerDay: Number(currentSettings.maxTradesPerDay),
        });
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
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Daily Profit Target (%)</label>
                        <input type="number" name="dailyProfitTarget" value={currentSettings.dailyProfitTarget} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Daily Loss Limit (%)</label>
                        <input type="number" name="dailyLossLimit" value={currentSettings.dailyLossLimit} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
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

const ConsistencyTracker = ({ dailyStats, settings }) => {
    const { pnl, tradeCount, profitTargetHit, lossLimitHit, maxTradesHit } = dailyStats;
    const { dailyProfitTarget, dailyLossLimit, startingEquity } = settings;

    const profitTargetValue = (startingEquity * dailyProfitTarget) / 100;
    const lossLimitValue = -Math.abs((startingEquity * dailyLossLimit) / 100);

    const profitProgress = profitTargetValue > 0 ? Math.min((pnl / profitTargetValue) * 100, 100) : 0;
    const lossProgress = lossLimitValue < 0 ? Math.min((pnl / lossLimitValue) * 100, 100) : 0;
    
    const limitReached = profitTargetHit || lossLimitHit || maxTradesHit;
    let alertMessage = '';
    if (profitTargetHit) alertMessage = 'Profit Target Reached!';
    else if (lossLimitHit) alertMessage = 'Loss Limit Reached!';
    else if (maxTradesHit) alertMessage = 'Max Trades Reached!';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
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
                        <span className="font-semibold text-gray-600 dark:text-gray-300">Profit Target ({formatCurrency(profitTargetValue)})</span>
                        <span className="font-semibold text-green-500">{profitProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{width: `${profitProgress}%`}}></div></div>
                </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">Loss Limit ({formatCurrency(lossLimitValue)})</span>
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

const TradeConfirmationModal = ({ onCancel }) => {
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState({});
    const [recommendation, setRecommendation] = useState(null);

    const handleAnswer = (question, answer) => {
        const newAnswers = { ...answers, [question]: answer };
        setAnswers(newAnswers);

        // --- Decision Tree Logic ---
        if (step === 1) {
            if (answer === 'yes') setStep(1.1);
            else setStep(2);
        } else if (step === 1.1) {
            if (answer === 'yes') {
                setStep(2);
            } else {
                setRecommendation({ text: "Use SNR (Support and Resistance)", color: "text-yellow-500" });
            }
        } else if (step === 2) {
            setStep(answer === 'choch' ? 3.1 : 3.2);
        } else if (step === 3.1) {
            if (answer === 'yes') setRecommendation({ text: "Enter on OTE (Optimal Trade Entry)", color: "text-green-500" });
            else setRecommendation({ text: "Enter on Golden Zone", color: "text-green-500" });
        } else if (step === 3.2) {
            if (answer === 'yes') setRecommendation({ text: "Proceed with Trade", color: "text-green-500" });
            else setRecommendation({ text: "Do Not Enter Trade", color: "text-red-500" });
        }
    };

    const reset = () => {
        setStep(1);
        setAnswers({});
        setRecommendation(null);
    };

    const renderStep = () => {
        if (recommendation) {
            return (
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Recommendation</h3>
                    <p className={`text-2xl font-bold ${recommendation.color}`}>{recommendation.text}</p>
                    <button onClick={reset} className="mt-6 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-md transition">Start Over</button>
                </div>
            );
        }

        switch (step) {
            case 1:
                return (<Question title="1. Is there any major news today/tomorrow?" onAnswer={(answer) => handleAnswer(1, answer)} options={['Yes', 'No']} />);
            case 1.1:
                return (<Question title="Is the market structure good?" onAnswer={(answer) => handleAnswer(1.1, answer)} options={['Yes', 'No']} />);
            case 2:
                return (<Question title="2. Why are you taking this trade?" onAnswer={(answer) => handleAnswer(2, answer)} options={[{label: 'Change of Character', value: 'choch'}, {label: 'Imbalance/FVG', value: 'ifvg'}]} />);
            case 3.1:
                return (<Question title="For Choch: Did price sweep any liquidity?" onAnswer={(answer) => handleAnswer(3.1, answer)} options={['Yes', 'No']} />);
            case 3.2:
                return (<Question title="For iFVG: Did price sweep liquidity?" onAnswer={(answer) => handleAnswer(3.2, answer)} options={['Yes', 'No']} />);
            default:
                return null;
        }
    };

    const Question = ({ title, onAnswer, options }) => (
        <div>
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <div className="flex justify-center space-x-4">
                {options.map(opt => {
                    const value = typeof opt === 'object' ? opt.value : opt.toLowerCase();
                    const label = typeof opt === 'object' ? opt.label : opt;
                    return <button key={value} onClick={() => onAnswer(value)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition">{label}</button>
                })}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Trade Confirmation</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                {renderStep()}
            </div>
        </div>
    );
};

const DailyBiasSetter = ({ todayBias, onSaveBias }) => {
    const [reason, setReason] = useState(todayBias.reason || '');

    useEffect(() => {
        setReason(todayBias.reason || '');
    }, [todayBias.reason]);

    const handleSave = () => {
        onSaveBias({ ...todayBias, reason });
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-4">Daily Bias Setter</h3>
            <div className="space-y-4">
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
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reason for Bias</label>
                    <textarea 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)}
                        onBlur={handleSave} // Save when user clicks away
                        rows="3" 
                        placeholder="Why this bias?" 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
};

// --- Main Trading Journal Component (Refactored from App) ---
function TradingJournal({ user, handleLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [dailyJournals, setDailyJournals] = useState({});
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('themeV12') || 'dark' : 'dark');
  const [settings, setSettings] = useState({
      startingEquity: 10000,
      dailyProfitTarget: 2, // in percent
      dailyLossLimit: 1, // in percent
      maxTradesPerDay: 5,
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [viewingTrade, setViewingTrade] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const TRADES_PER_PAGE = 10;
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Effect to fetch user-specific data from Firebase
  useEffect(() => {
    if (!user) return; // Don't fetch if no user is logged in
    
    setLoading(true);
    
    // User-specific collection paths
    const tradesCollectionPath = `users/${user.uid}/trades`;
    const journalsCollectionPath = `users/${user.uid}/dailyJournals`;

    const q = query(collection(db, tradesCollectionPath), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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

    return () => {
        unsubscribe();
        unsubJournals();
    };
  }, [user]); // Rerun effect if user changes

  // Effect to handle theme changes
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('themeV12', theme);
  }, [theme]);
  
  // Function to save settings to localStorage
  const saveSettings = (newSettings) => {
      setSettings(newSettings);
      // Could also save settings to Firestore under the user's profile
      setIsSettingsModalOpen(false);
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
  
  const { trades, dashboardStats, advancedStats, dailyStats, consistencyByDay } = useMemo(() => {
    const tradesOnly = transactions.filter(tx => tx.type === 'Buy' || tx.type === 'Sell');
    const deposits = transactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.pnl, 0);
    const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.pnl, 0);
    
    const chronoSortedTransactions = [...transactions].sort((a,b) => a.date.toDate() - b.date.toDate());
    
    let currentEquity = 0;
    chronoSortedTransactions.forEach(tx => { currentEquity += tx.pnl; });

    const todayStr = new Date().toDateString();
    const todaysTrades = transactions.filter(tx => (tx.type === 'Buy' || tx.type === 'Sell') && tx.date.toDate().toDateString() === todayStr);
    const todaysPnl = todaysTrades.reduce((sum, tx) => sum + tx.pnl, 0);
    const profitTargetValue = (settings.startingEquity * settings.dailyProfitTarget) / 100;
    const lossLimitValue = -Math.abs((settings.startingEquity * settings.dailyLossLimit) / 100);

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
        const profitTarget = (settings.startingEquity * settings.dailyProfitTarget) / 100;
        const lossLimit = -Math.abs((settings.startingEquity * settings.dailyLossLimit) / 100);

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

    const totalPnl = tradesOnly.reduce((sum, t) => sum + t.pnl, 0);
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
    let maxWinStreak = 0, currentWinStreak = 0, maxLossStreak = 0, currentLossStreak = 0;
    chronoSortedTransactions.filter(tx => tx.type === 'Buy' || tx.type === 'Sell').forEach(trade => { if (trade.status === 'Win') { currentWinStreak++; currentLossStreak = 0; if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak; } else { currentLossStreak++; currentWinStreak = 0; if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak; } });
    const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / (winningTrades.length || 1);
    const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / (losingTrades.length || 1));
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayPerformance = dayNames.reduce((acc, day) => ({...acc, [day]: {pnl: 0, count: 0}}), {});
    tradesOnly.forEach(trade => { const day = dayNames[trade.date.toDate().getDay()]; dayPerformance[day].pnl += trade.pnl; dayPerformance[day].count++; });
    const pnlByRating1 = tradesOnly.filter(t => t.rating === 1).reduce((sum, t) => sum + t.pnl, 0);
    const pnlByRating5 = tradesOnly.filter(t => t.rating === 5).reduce((sum, t) => sum + t.pnl, 0);
    let peakEquity = 0, maxDrawdownValue = 0, currentDrawdownDuration = 0, longestDrawdownDuration = 0, inDrawdown = false, cumulativeEquity = 0;
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
        trades: tradesOnly,
        dashboardStats: { totalPnl, currentEquity, totalDeposits: deposits, totalWithdrawals: withdrawals, winRate, totalTrades: tradesOnly.length },
        advancedStats: { tagPerformance: { top3, bottom3 }, streaks: { maxWinStreak, maxLossStreak }, dayPerformance, avgWinLossRatio, ratingPerformance: { pnlByRating1, pnlByRating5 }, drawdown: { maxDrawdownValue, maxDrawdownPercent, longestDrawdownDuration }, expectancy: { expectancyValue, breakEvenRRR, suggestion }, winRate, avgTradesPerDay },
        dailyStats,
        consistencyByDay
    };
  }, [transactions, settings, dailyJournals]);

  const filteredAndSortedTransactions = useMemo(() => {
    return [...transactions]
      .filter(tx => (filterType === 'all' || tx.type === filterType) && ((tx.type !== 'Buy' && tx.type !== 'Sell') || filterStatus === 'all' || tx.status === filterStatus))
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
    const monthTrades = trades.filter(t => { const d = t.date.toDate(); return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth(); });
    const total = monthTrades.length;
    const wins = monthTrades.filter(t => t.status === 'Win').length;
    const losses = total - wins;
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
  }, [trades, currentDate, dailyJournals, consistencyByDay]);

  const isTradingDisabled = dailyStats.profitTargetHit || dailyStats.lossLimitHit || dailyStats.maxTradesHit;
  
  const todayString = new Date().toISOString().split('T')[0];
  const todayBias = dailyJournals[todayString] || {};

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Trading Journal</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"><SettingsIcon className="w-6 h-6" /></button>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">{theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}</button>
            <button onClick={handleLogout} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"><LogOutIcon className="w-6 h-6" /></button>
          </div>
        </header>

        <main>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <DashboardCard title="Current Equity" value={formatCurrency(dashboardStats.currentEquity)} valueColor="text-blue-500" icon={<TargetIcon className="w-6 h-6 text-blue-500" />} />
                    <DashboardCard title="Total P&L (Trades Only)" value={formatCurrency(dashboardStats.totalPnl)} valueColor={dashboardStats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'} icon={<DollarSignIcon className="w-6 h-6 text-green-500" />} />
                    <DashboardCard title="Win Rate" value={`${(dashboardStats.winRate * 100).toFixed(1)}%`} valueColor="text-indigo-500" icon={<PercentIcon className="w-6 h-6 text-indigo-500" />} subValue={`${dashboardStats.totalTrades} trades`} />
                    <DashboardCard title="Total Deposits" value={formatCurrency(dashboardStats.totalDeposits)} valueColor="text-yellow-500" icon={<PlusCircleIcon className="w-6 h-6 text-yellow-500" />} />
                    <DashboardCard title="Total Withdrawals" value={formatCurrency(dashboardStats.totalWithdrawals)} valueColor="text-orange-500" icon={<MinusCircleIcon className="w-6 h-6 text-orange-500" />} />
                    <DailyBiasSetter todayBias={todayBias} onSaveBias={(biasData) => saveDailyJournal(todayString, biasData)} />
                </div>
                <ConsistencyTracker dailyStats={dailyStats} settings={settings} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Equity Curve</h2>
                    <div className="h-64">
                       <EquityCurveChart transactions={transactions} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Monthly Stats</h2>
                    <div className="w-40 h-40 mx-auto mb-4"><DonutChart data={[{ label: 'Profit', value: monthlyStats.totalProfit, color: '#48bb78' }, { label: 'Loss', value: Math.abs(monthlyStats.totalLoss), color: '#f56565' }]}/></div>
                    <div className="space-y-3 text-sm">
                        <p className="flex justify-between"><span>Profit:</span> <span className="font-semibold text-green-500">{formatCurrency(monthlyStats.totalProfit)}</span></p>
                        <p className="flex justify-between"><span>Loss:</span> <span className="font-semibold text-red-500">{formatCurrency(monthlyStats.totalLoss)}</span></p>
                        <p className="flex justify-between font-bold border-t pt-2"><span>Net P&L:</span> <span className={monthlyStats.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(monthlyStats.netPnl)}</span></p>
                    </div>
                    <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                    <div className="space-y-3 text-sm">
                        <p className="flex justify-between"><span>Total Trades:</span> <span className="font-semibold">{monthlyStats.total}</span></p>
                        <p className="flex justify-between"><span>Winning Trades:</span> <span className="font-semibold">{monthlyStats.wins}</span></p>
                        <p className="flex justify-between"><span>Losing Trades:</span> <span className="font-semibold">{monthlyStats.losses}</span></p>
                        <p className="flex justify-between"><span>Win Rate:</span> <span className="font-semibold">{monthlyStats.winRate.toFixed(1)}%</span></p>
                    </div>
                    <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                    <div className="space-y-3 text-sm">
                        <p className="flex justify-between"><span>Bias Correct:</span> <span className="font-semibold text-green-500">{monthlyStats.biasCorrect}</span></p>
                        <p className="flex justify-between"><span>Bias Incorrect:</span> <span className="font-semibold text-red-500">{monthlyStats.biasIncorrect}</span></p>
                    </div>
                    <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                    <div className="space-y-3 text-sm">
                        <p className="flex justify-between"><span>Disciplined Days:</span> <span className="font-semibold text-green-500">{monthlyStats.disciplinedDays}</span></p>
                        <p className="flex justify-between"><span>Overtraded Days:</span> <span className="font-semibold text-yellow-500">{monthlyStats.overtradedDays}</span></p>
                        <p className="flex justify-between"><span>Loss Exceeded Days:</span> <span className="font-semibold text-red-500">{monthlyStats.lossExceededDays}</span></p>
                    </div>
                </div>
            </div>
            
            <div className="mb-8">
                <TradingCalendar transactions={transactions} currentDate={currentDate} setCurrentDate={setCurrentDate} onDayClick={handleDayClick} dailyJournals={dailyJournals} consistencyByDay={consistencyByDay} />
            </div>
            
            <div className="mb-8">
               <PerformanceByDayChart dayPerformance={advancedStats.dayPerformance} />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
                <button onClick={() => setIsConfirmationModalOpen(true)} className="w-full p-4 flex justify-between items-center text-left text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div className="flex items-center space-x-3">
                        <ClipboardCheckIcon className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Should You Take The Trade?</h2>
                    </div>
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
                <button onClick={() => setIsAdvancedVisible(!isAdvancedVisible)} className="w-full p-4 flex justify-between items-center text-left"><h2 className="text-xl font-bold">Show Advanced Analytics</h2><ChevronDownIcon className={`w-6 h-6 transition-transform ${isAdvancedVisible ? 'rotate-180' : ''}`} /></button>
                {isAdvancedVisible && <div className="border-t border-gray-200 dark:border-gray-700"><AdvancedAnalyticsDashboard stats={advancedStats} /></div>}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
                <button onClick={() => setIsCalculatorVisible(!isCalculatorVisible)} className="w-full p-4 flex justify-between items-center text-left"><h2 className="text-xl font-bold">Trading Projection Calculator</h2><ChevronDownIcon className={`w-6 h-6 transition-transform ${isCalculatorVisible ? 'rotate-180' : ''}`} /></button>
                {isCalculatorVisible && <div className="border-t border-gray-200 dark:border-gray-700"><TradeCalculator winRate={advancedStats.winRate} avgTradesPerDay={advancedStats.avgTradesPerDay} /></div>}
            </div>

            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="p-6 flex justify-between items-center"><h2 className="text-xl font-bold">Add New Transaction</h2><button onClick={() => setIsFormVisible(!isFormVisible)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">{isFormVisible ? <MinusCircleIcon className="w-6 h-6"/> : <PlusCircleIcon className="w-6 h-6"/>}</button></div>
                    {isFormVisible && <div className="border-t border-gray-200 dark:border-gray-700"><AddTransactionForm onAddTransaction={addTransaction} disabled={isTradingDisabled} /></div>}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4"><h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Transaction History ({filteredAndSortedTransactions.length})</h2><div className="flex items-center space-x-4"><select onChange={(e) => setFilterStatus(e.target.value)} value={filterStatus} className="bg-gray-50 dark:bg-gray-700 border rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="all">All Statuses</option><option value="Win">Win</option><option value="Loss">Loss</option></select><select onChange={(e) => setFilterType(e.target.value)} value={filterType} className="bg-gray-50 dark:bg-gray-700 border rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="all">All Types</option><option value="Buy">Buy</option><option value="Sell">Sell</option><option value="Deposit">Deposit</option><option value="Withdrawal">Withdrawal</option></select></div></div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-200 dark:border-gray-700"><th className="p-3 text-sm font-semibold">Details</th><th className="p-3 text-sm font-semibold cursor-pointer" onClick={() => requestSort('date')}>Date ⇅</th><th className="p-3 text-sm font-semibold">Type</th><th className="p-3 text-sm font-semibold">Status</th><th className="p-3 text-sm font-semibold cursor-pointer" onClick={() => requestSort('pnl')}>Amount ⇅</th><th className="p-3 text-sm font-semibold">Actions</th></tr></thead>
                        <tbody>
                        {loading ? ( <tr><td colSpan="6" className="text-center p-8">Loading data...</td></tr> ) : paginatedTransactions.length > 0 ? (
                            paginatedTransactions.map(tx => (
                            <tr key={tx.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setViewingTrade(tx)}>
                                <td className="p-3 text-center">{ (tx.notes || (tx.tags && tx.tags.length > 0) || tx.rating > 0 || tx.imageUrl) && <NoteIcon className="w-5 h-5 text-blue-500 mx-auto"/> }</td>
                                <td className="p-3">{tx.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                <td className={`p-3 font-semibold ${tx.type === 'Buy' ? 'text-green-500' : tx.type === 'Sell' ? 'text-red-500' : tx.type === 'Deposit' ? 'text-blue-500' : 'text-orange-500'}`}>{tx.type}</td>
                                <td className={`p-3 font-semibold ${tx.status === 'Win' ? 'text-green-500' : tx.status === 'Loss' ? 'text-red-500' : ''}`}>{tx.status || '-'}</td>
                                <td className={`p-3 font-semibold ${tx.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(tx.pnl)}</td>
                                <td className="p-3"><button onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id, tx.imageUrl); }} className="text-gray-500 hover:text-red-500 transition"><TrashIcon className="w-5 h-5" /></button></td>
                            </tr>
                            ))
                        ) : (<tr><td colSpan="6" className="text-center p-8">No matching data found.</td></tr>)}
                        </tbody>
                    </table>
                    </div>
                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </div>
            </div>
        </main>
        
        {viewingTrade && <TradeDetailModal trade={viewingTrade} user={user} onSave={saveTransactionDetails} onCancel={() => setViewingTrade(null)} />}
        {selectedCalendarDate && <DailyDetailModal date={selectedCalendarDate} transactions={transactions} dailyJournals={dailyJournals} onSaveJournal={saveDailyJournal} onClose={() => setSelectedCalendarDate(null)} onTradeClick={handleOpenTradeFromCalendar} />}
        {isSettingsModalOpen && <SettingsModal settings={settings} onSave={saveSettings} onCancel={() => setIsSettingsModalOpen(false)} />}
        {isConfirmationModalOpen && <TradeConfirmationModal onCancel={() => setIsConfirmationModalOpen(false)} />}
      </div>
    </div>
  );
}

// --- Authentication Page Component ---
function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
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

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isLogin ? 'Sign in' : 'Register'}
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        {isLogin ? 'Need an account? Register' : 'Have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}


// --- Top-Level App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    if (loadingAuth) {
        return (
            <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
        );
    }

    return user ? <TradingJournal user={user} handleLogout={handleLogout} /> : <AuthPage />;
}
