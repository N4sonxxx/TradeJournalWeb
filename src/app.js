import React, { useState, useEffect, useMemo } from 'react';
// Import lengkap dari Firebase, termasuk storage
import { db } from './firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";


// --- Helper Functions & Icons ---
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
const DollarSignIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const TrendingUpIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const TrendingDownIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SunIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const TargetIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const ScaleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 16.5l4-4-4-4"></path><path d="M8 7.5l-4 4 4 4"></path><path d="M2 12h20"></path><path d="M12 2v20"></path></svg>;
const NoteIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path></svg>;
const StarIcon = ({ className, filled }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const CloseIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ChevronDownIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>;
const PlusCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const MinusCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ImageIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const ChevronLeftIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>;

// --- Components ---

const AddTradeForm = ({ onAddTrade }) => {
  const [type, setType] = useState('Buy');
  const [pnl, setPnl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const pnlValue = parseFloat(pnl);
    if (!pnl || isNaN(pnlValue) || pnlValue === 0) {
      setError('P&L harus berupa angka dan tidak boleh nol.');
      return;
    }
    setError('');
    onAddTrade({ type, pnl: pnlValue });
    setPnl('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tipe</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option>Buy</option>
            <option>Sell</option>
          </select>
        </div>
        <div>
          <label htmlFor="pnl" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Profit / Loss ($)</label>
          <input id="pnl" type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="Contoh: 150 atau -75" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
          Simpan Trade
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

const TradeDetailModal = ({ trade, onSave, onCancel }) => {
    const [date, setDate] = useState(new Date(trade.date.toDate()).toISOString().split('T')[0]);
    const [type, setType] = useState(trade.type);
    const [pnl, setPnl] = useState(trade.pnl);
    const [notes, setNotes] = useState(trade.notes || '');
    const [tags, setTags] = useState(trade.tags ? trade.tags.join(', ') : '');
    const [rating, setRating] = useState(trade.rating || 0);
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(trade.imageUrl || '');
    const fileInputRef = React.useRef(null);

    const handleSave = async () => {
        setIsUploading(true);
        let finalImageUrl = imageUrl;

        if (imageFile) {
            const storage = getStorage();
            const storageRef = ref(storage, `screenshots/${trade.id}/${imageFile.name}`);
            try {
                const snapshot = await uploadBytes(storageRef, imageFile);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error("Error uploading image: ", error);
                alert("Gagal mengunggah gambar.");
                setIsUploading(false);
                return;
            }
        }

        const pnlValue = parseFloat(pnl);
        const status = pnlValue > 0 ? 'Win' : 'Loss';
        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        onSave({ ...trade, date: new Date(date), type, pnl: pnlValue, status, notes, tags: tagsArray, rating, imageUrl: finalImageUrl });
        setIsUploading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Detail & Edit Trade</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="space-y-6">
                    {/* Edit Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="edit-date" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Tanggal</label>
                            <input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="edit-type" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Tipe</label>
                            <select id="edit-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option>Buy</option>
                                <option>Sell</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-pnl" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">P&L ($)</label>
                            <input id="edit-pnl" type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                    </div>
                    <hr className="border-gray-200 dark:border-gray-700"/>
                    {/* Screenshot Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Screenshot Chart</label>
                        <div className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                            {imageUrl && !imageFile && <img src={imageUrl} alt="Trade Screenshot" className="max-h-64 mx-auto rounded-md"/>}
                            {imageFile && <img src={URL.createObjectURL(imageFile)} alt="Preview" className="max-h-64 mx-auto rounded-md"/>}
                            {!imageUrl && !imageFile && <div className="text-gray-400 flex flex-col items-center justify-center h-48"><ImageIcon className="w-16 h-16 mb-2"/><p>Belum ada gambar</p></div>}
                            <button onClick={() => fileInputRef.current.click()} className="mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-md transition">
                                {imageUrl ? 'Ganti Gambar' : 'Pilih Gambar'}
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => setImageFile(e.target.files[0])} className="hidden"/>
                        </div>
                    </div>
                    {/* Notes, Tags, Rating */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Catatan & Alasan Trade</label>
                        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="5" placeholder="Tuliskan analisis Anda, alasan masuk, dan pelajaran yang didapat..." className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Tags (pisahkan dengan koma)</label>
                        <input id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Contoh: breakout, fomo, disiplin" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Penilaian Eksekusi</label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRating(star)} className="text-yellow-400 hover:text-yellow-500 transition">
                                    <StarIcon className="w-8 h-8" filled={star <= rating} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50">
                        {isUploading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center space-x-2 mt-6">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                &laquo;
            </button>
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    {number}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                &raquo;
            </button>
        </div>
    );
};

const AdvancedAnalyticsDashboard = ({ stats }) => {
    const { tagPerformance, streaks, dayPerformance, avgWinLossRatio, ratingPerformance, drawdown, expectancy } = stats;

    const Bar = ({ label, value, maxValue, color }) => {
        const heightPercentage = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
        return (
            <div className="flex flex-col items-center">
                <div className="w-full h-32 flex items-end justify-center">
                    <div
                        className={`w-10 rounded-t-md transition-all duration-500 ${color}`}
                        style={{ height: `${heightPercentage}%` }}
                    ></div>
                </div>
                <span className="text-xs mt-1">{label}</span>
            </div>
        );
    };

    const maxDayPnl = Math.max(...Object.values(dayPerformance).map(d => Math.abs(d.pnl)));

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-center">Dasbor Analisis Lanjutan</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Tag Performance */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-lg mb-4">Analisis Performa "Tags"</h3>
                    <div>
                        <h4 className="font-semibold text-green-500 mb-2">Strategi Terbaik (Top 3)</h4>
                        <ul className="space-y-2 text-sm">
                            {tagPerformance.top3.map(tag => (
                                <li key={tag.name} className="flex justify-between">
                                    <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">{tag.name}</span>
                                    <span className="font-mono">{formatCurrency(tag.pnl)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                    <div>
                        <h4 className="font-semibold text-red-500 mb-2">Kesalahan Terbesar (Top 3)</h4>
                        <ul className="space-y-2 text-sm">
                            {tagPerformance.bottom3.map(tag => (
                                <li key={tag.name} className="flex justify-between">
                                    <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">{tag.name}</span>
                                    <span className="font-mono">{formatCurrency(tag.pnl)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {/* Risk & Psychology */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                     <h3 className="font-bold text-lg mb-4">Analisis Risiko & Psikologi</h3>
                     <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                            <span>Rentetan Kemenangan Maks.</span>
                            <span className="font-bold text-2xl text-green-500">{streaks.maxWinStreak}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Rentetan Kekalahan Maks.</span>
                            <span className="font-bold text-2xl text-red-500">{streaks.maxLossStreak}</span>
                        </div>
                        <hr className="my-2 border-gray-200 dark:border-gray-700"/>
                        <div className="flex justify-between items-center">
                            <span>Rasio Rata-rata Profit/Loss</span>
                            <span className={`font-bold text-2xl ${avgWinLossRatio >= 1.5 ? 'text-green-500' : 'text-yellow-500'}`}>{avgWinLossRatio.toFixed(2)} : 1</span>
                        </div>
                     </div>
                </div>
                {/* Execution & Drawdown */}
                 <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                     <h3 className="font-bold text-lg mb-4">Eksekusi & Drawdown</h3>
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span>P&L Trade Bintang 5</span>
                            <span className={`font-semibold ${ratingPerformance.pnlByRating5 >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(ratingPerformance.pnlByRating5)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>P&L Trade Bintang 1</span>
                            <span className={`font-semibold ${ratingPerformance.pnlByRating1 >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(ratingPerformance.pnlByRating1)}</span>
                        </div>
                        <hr className="my-2 border-gray-200 dark:border-gray-700"/>
                        <div className="flex justify-between items-center">
                            <span>Maksimum Drawdown</span>
                            <span className="font-semibold text-red-500">{formatCurrency(drawdown.maxDrawdownValue)}</span>
                        </div>
                         <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <span></span>
                            <span>({drawdown.maxDrawdownPercent.toFixed(2)}%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Periode Drawdown Terpanjang</span>
                            <span className="font-semibold">{drawdown.longestDrawdownDuration} trades</span>
                        </div>
                     </div>
                </div>
                {/* Day Performance */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-lg mb-4">Performa Berdasarkan Hari</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {Object.entries(dayPerformance).map(([day, data]) => (
                           <Bar key={day} label={day.substring(0,3)} value={data.pnl} maxValue={maxDayPnl} color={data.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}/>
                        ))}
                    </div>
                </div>
                {/* Expectancy & RRR Suggestion */}
                <div className="lg:col-span-2 xl:col-span-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-lg mb-4">Analisis Ekspektasi & Saran RRR</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ekspektasi per Trade</p>
                            <p className={`font-bold text-2xl ${expectancy.expectancyValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(expectancy.expectancyValue)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">RRR Impas (Min.)</p>
                            <p className="font-bold text-2xl">1 : {expectancy.breakEvenRRR.toFixed(2)}</p>
                        </div>
                        <div className="md:col-span-3 xl:col-span-1 bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Saran</p>
                            <p className="text-xs mt-1 text-blue-700 dark:text-blue-400">
                                {expectancy.suggestion}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


// --- Main App Component ---

export default function App() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingCapital, setStartingCapital] = useState(() => { try { const savedCapital = localStorage.getItem('startingCapitalV8'); return savedCapital ? parseFloat(savedCapital) : 10000; } catch (error) { return 10000; } });
  const [theme, setTheme] = useState(() => localStorage.getItem('themeV8') || 'dark');
  const [viewingTrade, setViewingTrade] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const TRADES_PER_PAGE = 10;
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "trades"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tradesData = [];
      querySnapshot.forEach((doc) => {
        tradesData.push({ ...doc.data(), id: doc.id });
      });
      setTrades(tradesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { localStorage.setItem('startingCapitalV8', startingCapital); }, [startingCapital]);
  useEffect(() => { if (theme === 'dark') { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } localStorage.setItem('themeV8', theme); }, [theme]);

  const addTrade = async (trade) => {
    const newTrade = { ...trade, date: new Date(), status: trade.pnl > 0 ? 'Win' : 'Loss', notes: '', tags: [], rating: 0, imageUrl: '' };
    await addDoc(collection(db, "trades"), newTrade);
  };

  const deleteTrade = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus trade ini?')) {
        await deleteDoc(doc(db, "trades", id));
    }
  };
  
  const saveTradeDetails = async (updatedTrade) => {
    const tradeRef = doc(db, "trades", updatedTrade.id);
    const { id, ...dataToSave } = updatedTrade;
    await updateDoc(tradeRef, dataToSave);
    setViewingTrade(null);
  };
  
  const filteredAndSortedTrades = useMemo(() => {
    let sortableTrades = [...trades];
    
    // Filtering
    sortableTrades = sortableTrades.filter(trade => {
        const statusMatch = filterStatus === 'all' || trade.status === filterStatus;
        const typeMatch = filterType === 'all' || trade.type === filterType;
        return statusMatch && typeMatch;
    });

    // Sorting
    sortableTrades.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'date') {
            aValue = a.date.toDate();
            bValue = b.date.toDate();
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });
    return sortableTrades;
  }, [trades, filterStatus, filterType, sortConfig]);
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType]);

  const totalPages = Math.ceil(filteredAndSortedTrades.length / TRADES_PER_PAGE);
  const paginatedTrades = filteredAndSortedTrades.slice(
    (currentPage - 1) * TRADES_PER_PAGE,
    currentPage * TRADES_PER_PAGE
  );

  const dashboardStats = useMemo(() => {
    const calculateStats = (filteredTrades) => { const total = filteredTrades.length; const wins = filteredTrades.filter(t => t.status === 'Win').length; const losses = total - wins; const pnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0); const winRate = total > 0 ? (wins / total) * 100 : 0; return { total, wins, losses, pnl, winRate }; };
    const buyTrades = trades.filter(t => t.type === 'Buy');
    const sellTrades = trades.filter(t => t.type === 'Sell');
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = trades.length > 0 ? (trades.filter(t => t.status === 'Win').length / trades.length) * 100 : 0;
    return {
      buyStats: calculateStats(buyTrades),
      sellStats: calculateStats(sellTrades),
      totalPnl,
      currentEquity: startingCapital + totalPnl,
      winRate
    };
  }, [trades, startingCapital]);

  const advancedStats = useMemo(() => {
    if (trades.length === 0) {
        return {
            tagPerformance: { top3: [], bottom3: [] },
            streaks: { maxWinStreak: 0, maxLossStreak: 0 },
            avgWinLossRatio: 0,
            dayPerformance: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].reduce((acc, day) => ({...acc, [day]: {pnl: 0, count: 0}}), {}),
            ratingPerformance: { pnlByRating1: 0, pnlByRating5: 0 },
            drawdown: { maxDrawdownValue: 0, maxDrawdownPercent: 0, longestDrawdownDuration: 0 },
            expectancy: { expectancyValue: 0, breakEvenRRR: 0, suggestion: "Data tidak cukup untuk memberikan saran." }
        };
    }

    const chronoSortedTrades = [...trades].sort((a,b) => a.date.toDate() - b.date.toDate());
    
    // Tag Performance
    const tagMap = {};
    trades.forEach(trade => {
        (trade.tags || []).forEach(tag => {
            if (!tagMap[tag]) {
                tagMap[tag] = { pnl: 0, count: 0 };
            }
            tagMap[tag].pnl += trade.pnl;
            tagMap[tag].count++;
        });
    });
    const tagPerformanceArray = Object.entries(tagMap).map(([name, data]) => ({ name, ...data }));
    tagPerformanceArray.sort((a, b) => b.pnl - a.pnl);
    const top3 = tagPerformanceArray.filter(t => t.pnl > 0).slice(0, 3);
    const bottom3 = tagPerformanceArray.filter(t => t.pnl < 0).slice(-3).reverse();

    // Streaks
    let maxWinStreak = 0, currentWinStreak = 0;
    let maxLossStreak = 0, currentLossStreak = 0;
    chronoSortedTrades.forEach(trade => {
        if (trade.status === 'Win') {
            currentWinStreak++;
            currentLossStreak = 0;
            if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
        } else {
            currentLossStreak++;
            currentWinStreak = 0;
            if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
        }
    });

    // Avg Win/Loss Ratio
    const winningTrades = trades.filter(t => t.status === 'Win');
    const losingTrades = trades.filter(t => t.status === 'Loss');
    const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / (winningTrades.length || 1);
    const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / (losingTrades.length || 1));
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Day Performance
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayPerformance = dayNames.reduce((acc, day) => ({...acc, [day]: {pnl: 0, count: 0}}), {});
    trades.forEach(trade => {
        const day = dayNames[new Date(trade.date.toDate()).getDay()];
        dayPerformance[day].pnl += trade.pnl;
        dayPerformance[day].count++;
    });

    // Rating Performance
    const pnlByRating1 = trades.filter(t => t.rating === 1).reduce((sum, t) => sum + t.pnl, 0);
    const pnlByRating5 = trades.filter(t => t.rating === 5).reduce((sum, t) => sum + t.pnl, 0);
    
    // Drawdown
    let peakEquity = startingCapital;
    let maxDrawdownValue = 0;
    let currentDrawdownDuration = 0;
    let longestDrawdownDuration = 0;
    let inDrawdown = false;
    let cumulativePnl = 0;
    
    chronoSortedTrades.forEach(trade => {
        cumulativePnl += trade.pnl;
        const currentEquity = startingCapital + cumulativePnl;

        if (currentEquity > peakEquity) {
            peakEquity = currentEquity;
            if (inDrawdown) {
                if (currentDrawdownDuration > longestDrawdownDuration) {
                    longestDrawdownDuration = currentDrawdownDuration;
                }
                currentDrawdownDuration = 0;
                inDrawdown = false;
            }
        } else {
            const drawdown = peakEquity - currentEquity;
            if (drawdown > maxDrawdownValue) {
                maxDrawdownValue = drawdown;
            }
            inDrawdown = true;
            currentDrawdownDuration++;
        }
    });
    if (inDrawdown && currentDrawdownDuration > longestDrawdownDuration) {
        longestDrawdownDuration = currentDrawdownDuration;
    }
    const maxDrawdownPercent = peakEquity > 0 ? (maxDrawdownValue / peakEquity) * 100 : 0;

    // Expectancy
    const winRateDecimal = dashboardStats.winRate / 100;
    const lossRateDecimal = 1 - winRateDecimal;
    const expectancyValue = (winRateDecimal * avgWin) - (lossRateDecimal * avgLoss);
    const breakEvenRRR = winRateDecimal > 0 ? (1 / winRateDecimal) - 1 : 0;
    let suggestion = "Data tidak cukup untuk memberikan saran.";
    if (trades.length >= 10) {
        if (expectancyValue > 0) {
            suggestion = `Sistem Anda profitabel. Untuk memaksimalkan profit, carilah trade dengan RRR di atas 1:${(breakEvenRRR + 0.5).toFixed(2)}.`
        } else {
            suggestion = `Sistem Anda belum profitabel. Fokus untuk meningkatkan Win Rate atau mencari trade dengan RRR di atas 1:${(breakEvenRRR + 0.5).toFixed(2)}.`
        }
    }


    return {
        tagPerformance: { top3, bottom3 },
        streaks: { maxWinStreak, maxLossStreak },
        avgWinLossRatio,
        dayPerformance,
        ratingPerformance: { pnlByRating1, pnlByRating5 },
        drawdown: { maxDrawdownValue, maxDrawdownPercent, longestDrawdownDuration },
        expectancy: { expectancyValue, breakEvenRRR, suggestion }
    };
  }, [trades, startingCapital, dashboardStats.winRate]);

  const sortedTradesForChart = useMemo(() => {
    return [...trades].sort((a, b) => new Date(a.date.toDate()) - new Date(b.date.toDate()));
  }, [trades]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Jurnal Trading v8.0</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Analisis Ekspektasi & Saran RRR.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
          </div>
        </header>

        <main>
           {/* Top Section: Quick Stats & Equity Curve */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DashboardCard title="Ekuitas Saat Ini" value={formatCurrency(dashboardStats.currentEquity)} valueColor="text-blue-500" icon={<TargetIcon className="w-6 h-6 text-blue-500" />} />
                    <DashboardCard title="Total P&L" value={formatCurrency(dashboardStats.totalPnl)} valueColor={dashboardStats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'} icon={<DollarSignIcon className="w-6 h-6 text-green-500" />} />
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <label htmlFor="startingCapital" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Modal Awal</label>
                        <input id="startingCapital" type="number" value={startingCapital} onChange={(e) => setStartingCapital(parseFloat(e.target.value) || 0)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-2">Kurva Pertumbuhan Ekuitas</h3>
                    <div className="h-48">
                        {loading ? <p className="text-center">Memuat data grafik...</p> : <EquityCurveChart trades={sortedTradesForChart} startingCapital={startingCapital} />}
                    </div>
                </div>
            </div>

            {/* Collapsible Advanced Analytics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
                <button onClick={() => setIsAdvancedVisible(!isAdvancedVisible)} className="w-full p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Tampilkan Analisis Lanjutan</h2>
                    <ChevronDownIcon className={`w-6 h-6 transition-transform ${isAdvancedVisible ? 'rotate-180' : ''}`} />
                </button>
                {isAdvancedVisible && <AdvancedAnalyticsDashboard stats={advancedStats} />}
            </div>

            {/* Main Content: Form & Table */}
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="p-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Tambah Trade Baru</h2>
                        <button onClick={() => setIsFormVisible(!isFormVisible)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                            {isFormVisible ? <MinusCircleIcon className="w-6 h-6"/> : <PlusCircleIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                    {isFormVisible && <div className="border-t border-gray-200 dark:border-gray-700"><AddTradeForm onAddTrade={addTrade} /></div>}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Riwayat Trading ({filteredAndSortedTrades.length})</h2>
                        <div className="flex items-center space-x-4">
                            <select onChange={(e) => setFilterStatus(e.target.value)} value={filterStatus} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="all">Semua Status</option>
                                <option value="Win">Win</option>
                                <option value="Loss">Loss</option>
                            </select>
                            <select onChange={(e) => setFilterType(e.target.value)} value={filterType} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="all">Semua Tipe</option>
                                <option value="Buy">Buy</option>
                                <option value="Sell">Sell</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Detail</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => requestSort('date')}>Tanggal ⇅</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Tipe</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Status</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => requestSort('pnl')}>P&L ⇅</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Aksi</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? ( <tr><td colSpan="6" className="text-center p-8 text-gray-500">Memuat data trading...</td></tr> ) : paginatedTrades.length > 0 ? (
                            paginatedTrades.map(trade => (
                            <tr key={trade.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setViewingTrade(trade)}>
                                <td className="p-3 text-center">
                                    { (trade.notes || (trade.tags && trade.tags.length > 0) || trade.rating > 0 || trade.imageUrl) && <NoteIcon className="w-5 h-5 text-blue-500 mx-auto"/> }
                                </td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{trade.date.toDate().toLocaleDateString('id-ID')}</td>
                                <td className={`p-3 font-semibold ${trade.type === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>{trade.type}</td>
                                <td className={`p-3 font-semibold ${trade.status === 'Win' ? 'text-green-500' : 'text-red-500'}`}>{trade.status}</td>
                                <td className={`p-3 font-semibold ${trade.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(trade.pnl)}</td>
                                <td className="p-3">
                                <button onClick={(e) => { e.stopPropagation(); deleteTrade(trade.id); }} className="text-gray-500 hover:text-red-500 transition"><TrashIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="text-center p-8 text-gray-500">Tidak ada data yang cocok.</td></tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </div>
            </div>
        </main>
        
        {viewingTrade && <TradeDetailModal trade={viewingTrade} onSave={saveTradeDetails} onCancel={() => setViewingTrade(null)} />}
      </div>
    </div>
  );
}
