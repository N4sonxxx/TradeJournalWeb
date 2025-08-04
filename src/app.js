import React, { useState, useEffect, useMemo } from 'react';

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
const ChevronLeftIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>;

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
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const chartRef = React.useRef(null);
  
    useEffect(() => {
      if (chartRef.current) {
        setWidth(chartRef.current.clientWidth);
        setHeight(chartRef.current.clientHeight);
      }
      const handleResize = () => {
        if (chartRef.current) {
          setWidth(chartRef.current.clientWidth);
          setHeight(chartRef.current.clientHeight);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    const equityValues = useMemo(() => {
        if (transactions.length === 0) return [];
        
        let cumulativeEquity = 0;
        const values = [];
        
        transactions.forEach(tx => {
            cumulativeEquity += tx.pnl;
            values.push(cumulativeEquity);
        });
        
        const firstDepositIndex = transactions.findIndex(tx => tx.type === 'Deposit');
        if(firstDepositIndex !== -1) {
            const firstDepositAmount = transactions[firstDepositIndex].pnl;
            return values.map(v => v + (firstDepositAmount > 0 ? 0 : firstDepositAmount));
        }
        
        return values;
    }, [transactions]);

    if (transactions.length < 2) {
      return (
        <div ref={chartRef} className="w-full h-full flex items-center justify-center text-gray-500">
          Butuh minimal 2 transaksi untuk menampilkan grafik
        </div>
      );
    }
  
    const margin = { top: 5, right: 5, bottom: 20, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
  
    const maxEquity = Math.max(...equityValues);
    const minEquity = Math.min(...equityValues);
    const range = maxEquity - minEquity;
  
    const xScale = (index) => (index / (equityValues.length - 1)) * innerWidth;
    const yScale = (value) => innerHeight - ((value - minEquity) / (range || 1)) * innerHeight;
  
    const points = equityValues.map((equity, index) => `${xScale(index)},${yScale(equity)}`).join(' ');
  
    const themeColor = document.documentElement.classList.contains('dark') ? "#4a5568" : "#cbd5e1";
    const textColor = document.documentElement.classList.contains('dark') ? "#a0aec0" : "#4a5568";
    
    return (
      <div ref={chartRef} className="w-full h-full">
        <svg width="100%" height="100%">
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <g className="axis y-axis">
              <line x1="0" y1={yScale(maxEquity)} x2={innerWidth} y2={yScale(maxEquity)} stroke={themeColor} strokeDasharray="2,2" />
              <text x={-10} y={yScale(maxEquity)} dy="0.32em" textAnchor="end" fill={textColor} className="text-xs">{formatCurrency(maxEquity)}</text>
              <line x1="0" y1={yScale(minEquity)} x2={innerWidth} y2={yScale(minEquity)} stroke={themeColor} strokeDasharray="2,2" />
              <text x={-10} y={yScale(minEquity)} dy="0.32em" textAnchor="end" fill={textColor} className="text-xs">{formatCurrency(minEquity)}</text>
            </g>
            <polyline fill="none" stroke="#4299e1" strokeWidth="2" points={points} />
          </g>
        </svg>
      </div>
    );
};

const AddTransactionForm = ({ onAddTransaction }) => {
  const [type, setType] = useState('Buy');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let pnlValue = parseFloat(amount);
    if (!amount || isNaN(pnlValue)) {
      setError('Jumlah harus berupa angka.');
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tipe Transaksi</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option>Buy</option>
            <option>Sell</option>
            <option>Deposit</option>
            <option>Withdrawal</option>
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{isTrade ? 'Profit / Loss ($)' : 'Jumlah ($)'}</label>
          <input id="amount" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={isTrade ? "Contoh: 150 atau -75" : "Contoh: 1000"} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
          Simpan Transaksi
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

const TradeDetailModal = ({ trade, onSave, onCancel }) => {
    const [date, setDate] = useState(new Date(trade.date).toISOString().split('T')[0]);
    const [type, setType] = useState(trade.type);
    const [pnl, setPnl] = useState(trade.pnl);
    const [notes, setNotes] = useState(trade.notes || '');
    const [tags, setTags] = useState(trade.tags ? trade.tags.join(', ') : '');
    const [rating, setRating] = useState(trade.rating || 0);

    const isTrade = type === 'Buy' || type === 'Sell';

    const handleSave = () => {
        let pnlValue = parseFloat(pnl);
        if (isNaN(pnlValue)) {
            alert('Jumlah/P&L harus berupa angka.');
            return;
        }
        if (!date) {
            alert('Tanggal tidak boleh kosong.');
            return;
        }
        
        if (type === 'Withdrawal') {
            pnlValue = -Math.abs(pnlValue);
        } else if (type === 'Deposit') {
            pnlValue = Math.abs(pnlValue);
        }

        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        const status = isTrade ? (pnlValue > 0 ? 'Win' : 'Loss') : null;
        onSave({ ...trade, date: new Date(date).toISOString(), type, pnl: pnlValue, status, notes, tags: tagsArray, rating });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Detail & Edit Transaksi</h2>
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
                                <option>Deposit</option>
                                <option>Withdrawal</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-pnl" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">{isTrade ? 'P&L ($)' : 'Jumlah ($)'}</label>
                            <input id="edit-pnl" type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                    </div>
                    
                    {isTrade && (
                        <>
                            <hr className="border-gray-200 dark:border-gray-700"/>
                            {/* Journaling Section */}
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
                        </>
                    )}
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition">Simpan Perubahan</button>
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
                    <circle
                        key={item.label}
                        cx="50" cy="50" r={radius}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        transform={`rotate(${(offset / total) * 360} 50 50)`}
                    />
                );
                offset += item.value;
                return segment;
            })}
        </svg>
    );
};

const TradingCalendar = ({ transactions, currentDate, setCurrentDate, onDayClick, dailyJournals }) => {
    const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const tradesByDay = useMemo(() => {
        const map = {};
        transactions.forEach(tx => {
            if (tx.type === 'Buy' || tx.type === 'Sell') {
                const tradeDate = new Date(tx.date);
                if (tradeDate.getFullYear() === year && tradeDate.getMonth() === month) {
                    const day = tradeDate.getDate();
                    if (!map[day]) {
                        map[day] = { pnl: 0, count: 0 };
                    }
                    map[day].pnl += tx.pnl;
                    map[day].count++;
                }
            }
        });
        return map;
    }, [transactions, year, month]);

    const changeMonth = (offset) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    const calendarGrid = useMemo(() => {
        const grid = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push({ type: 'empty' });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            grid.push({ type: 'day', day });
        }
        return grid;
    }, [firstDayOfMonth, daysInMonth]);

    const weeks = useMemo(() => {
        const chunked = [];
        for (let i = 0; i < calendarGrid.length; i += 7) {
            chunked.push(calendarGrid.slice(i, i + 7));
        }
        return chunked;
    }, [calendarGrid]);

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
                        if (dayCell.type === 'day') {
                            const dayData = tradesByDay[dayCell.day];
                            return sum + (dayData ? dayData.pnl : 0);
                        }
                        return sum;
                    }, 0);

                    return (
                        <div className="grid grid-cols-7 gap-1" key={weekIndex}>
                            {week.map((dayCell, dayIndex) => {
                                if (dayCell.type === 'empty') {
                                    return <div key={`empty-${dayIndex}`}></div>;
                                }
                                const dayNumber = dayCell.day;
                                const dayData = tradesByDay[dayNumber];
                                const isToday = new Date().getDate() === dayNumber && new Date().getMonth() === month && new Date().getFullYear() === year;
                                let bgColor = 'bg-transparent';
                                let clickable = 'cursor-pointer'; // Make all days clickable
                                if (dayData) {
                                    bgColor = dayData.pnl >= 0 ? 'bg-green-500/20 hover:bg-green-500/30' : 'bg-red-500/20 hover:bg-red-500/30';
                                }

                                if (dayIndex === 6) { // Saturday
                                    const hasDays = week.some(d => d.type === 'day');
                                    if (!hasDays) return <div key={`recap-empty-${dayIndex}`}></div>;
        
                                    return (
                                        <div key={`recap-${weekIndex}`} className={`p-1 rounded-lg text-center h-20 flex flex-col justify-center items-center ${weeklyPnl >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Weekly</span>
                                            <span className={`mt-1 text-sm font-bold ${weeklyPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {formatCurrency(weeklyPnl)}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={dayNumber} className={`p-1 rounded-lg text-center h-20 flex flex-col justify-start items-center transition-colors ${bgColor} ${clickable}`} onClick={() => onDayClick(dayNumber)}>
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-blue-600 text-white' : ''}`}>{dayNumber}</span>
                                        {dayData && (
                                            <span className={`mt-1 text-xs font-bold ${dayData.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {formatCurrency(dayData.pnl).replace(/\..*/, '')}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
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

const DailyJournalModal = ({ date, trades, dailyJournal, onSave, onCancel }) => {
    const [notes, setNotes] = useState(dailyJournal.notes || '');
    const [rating, setRating] = useState(dailyJournal.rating || 0);

    const dailyPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);

    const handleSave = () => {
        onSave({ notes, rating });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Jurnal Harian: {date.toLocaleDateString('id-ID')}</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Ringkasan Hari Ini</h3>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 text-sm">
                            <p className="flex justify-between"><span>Total Trade:</span> <span className="font-semibold">{trades.length}</span></p>
                            <p className="flex justify-between"><span>P&L Harian:</span> <span className={`font-semibold ${dailyPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(dailyPnl)}</span></p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-2">Trade Individual</h3>
                        <ul className="space-y-2 text-sm max-h-40 overflow-y-auto">
                            {trades.map(trade => (
                                <li key={trade.id} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <span>{trade.type}</span>
                                    <span className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(trade.pnl)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700"/>
                    
                    <div>
                        <label htmlFor="daily-notes" className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Catatan Harian</label>
                        <textarea id="daily-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="5" placeholder="Apa yang terjadi di pasar hari ini? Bagaimana perasaan Anda?" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Rating Performa Hari Ini</label>
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
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition">Simpan Jurnal Harian</button>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [dailyJournals, setDailyJournals] = useState({});
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('themeV12') || 'dark');
  const [viewingTrade, setViewingTrade] = useState(null);
  const [viewingDay, setViewingDay] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const TRADES_PER_PAGE = 10;
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ ...doc.data(), id: doc.id });
      });
      setTransactions(transactionsData);
      setLoading(false);
    });

    const journalsQuery = query(collection(db, "dailyJournals"));
    const unsubJournals = onSnapshot(journalsQuery, (querySnapshot) => {
        const journalsData = {};
        querySnapshot.forEach((doc) => {
            journalsData[doc.id] = doc.data();
        });
        setDailyJournals(journalsData);
    });

    return () => {
        unsubscribe();
        unsubJournals();
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('themeV12', theme);
  }, [theme]);

  const addTransaction = async (tx) => {
    let status = null;
    if (tx.type === 'Buy' || tx.type === 'Sell') {
        status = tx.pnl > 0 ? 'Win' : 'Loss';
    }
    const newTx = {
      date: new Date(),
      ...tx,
      status,
      notes: '', 
      tags: [], 
      rating: 0,
      imageUrl: ''
    };
    await addDoc(collection(db, "transactions"), newTx);
  };

  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, "transactions", id));
  };
  
  const saveTransactionDetails = async (updatedTx) => {
    const txRef = doc(db, "transactions", updatedTx.id);
    const { id, ...dataToSave } = updatedTx;
    await updateDoc(txRef, dataToSave);
    setViewingTrade(null);
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setViewingDay(clickedDate);
  };

  const saveDailyJournal = async (journalData) => {
    const dateString = viewingDay.toISOString().split('T')[0]; // YYYY-MM-DD
    const journalRef = doc(db, "dailyJournals", dateString);
    await setDoc(journalRef, journalData);
    setViewingDay(null);
  };
  
  const { trades, dashboardStats, advancedStats, sortedTradesForChart } = useMemo(() => {
    const tradesOnly = transactions.filter(tx => tx.type === 'Buy' || tx.type === 'Sell');
    const deposits = transactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.pnl, 0);
    const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.pnl, 0);
    const startingCapital = deposits;
    
    const totalPnl = tradesOnly.reduce((sum, t) => sum + t.pnl, 0);
    const currentEquity = startingCapital + totalPnl + withdrawals;

    const chronoSortedTransactions = [...transactions].sort((a,b) => a.date.toDate() - b.date.toDate());
    const chronoSortedTrades = chronoSortedTransactions.filter(tx => tx.type === 'Buy' || tx.type === 'Sell');
    
    const winningTrades = tradesOnly.filter(t => t.status === 'Win');
    const losingTrades = tradesOnly.filter(t => t.status === 'Loss');
    const winRate = tradesOnly.length > 0 ? winningTrades.length / tradesOnly.length : 0;
    
    const tagMap = {};
    tradesOnly.forEach(trade => {
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

    const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / (winningTrades.length || 1);
    const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / (losingTrades.length || 1));
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayPerformance = dayNames.reduce((acc, day) => ({...acc, [day]: {pnl: 0, count: 0}}), {});
    tradesOnly.forEach(trade => {
        const day = dayNames[new Date(trade.date.toDate()).getDay()];
        dayPerformance[day].pnl += trade.pnl;
        dayPerformance[day].count++;
    });

    const pnlByRating1 = tradesOnly.filter(t => t.rating === 1).reduce((sum, t) => sum + t.pnl, 0);
    const pnlByRating5 = tradesOnly.filter(t => t.rating === 5).reduce((sum, t) => sum + t.pnl, 0);
    
    let peakEquity = startingCapital;
    let maxDrawdownValue = 0;
    let currentDrawdownDuration = 0;
    let longestDrawdownDuration = 0;
    let inDrawdown = false;
    let cumulativePnl = 0;
    
    chronoSortedTrades.forEach(trade => {
        cumulativePnl += trade.pnl;
        const currentEquityValue = startingCapital + cumulativePnl;

        if (currentEquityValue > peakEquity) {
            peakEquity = currentEquityValue;
            if (inDrawdown) {
                if (currentDrawdownDuration > longestDrawdownDuration) {
                    longestDrawdownDuration = currentDrawdownDuration;
                }
                currentDrawdownDuration = 0;
                inDrawdown = false;
            }
        } else {
            const drawdown = peakEquity - currentEquityValue;
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

    const lossRate = 1 - winRate;
    const expectancyValue = (winRate * avgWin) - (lossRate * avgLoss);
    const breakEvenRRR = winRate > 0 ? (1 / winRate) - 1 : 0;
    let suggestion = "Data tidak cukup untuk memberikan saran.";
    if (tradesOnly.length >= 10) {
        if (expectancyValue > 0) {
            suggestion = `Sistem Anda profitabel. Untuk memaksimalkan profit, carilah trade dengan RRR di atas 1:${(breakEvenRRR + 0.5).toFixed(2)}.`
        } else {
            suggestion = `Sistem Anda belum profitabel. Fokus untuk meningkatkan Win Rate atau mencari trade dengan RRR di atas 1:${(breakEvenRRR + 0.5).toFixed(2)}.`
        }
    }

    return {
        trades: tradesOnly,
        dashboardStats: {
            totalPnl,
            currentEquity,
            totalDeposits: deposits
        },
        advancedStats: {
            tagPerformance: { top3, bottom3 },
            streaks: { maxWinStreak, maxLossStreak },
            avgWinLossRatio,
            dayPerformance,
            ratingPerformance: { pnlByRating1, pnlByRating5 },
            drawdown: { maxDrawdownValue, maxDrawdownPercent, longestDrawdownDuration },
            expectancy: { expectancyValue, breakEvenRRR, suggestion }
        },
        sortedTradesForChart: chronoSortedTrades
    };
  }, [transactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    let sortable = [...transactions];
    sortable.sort((a, b) => new Date(b.date.toDate()) - new Date(a.date.toDate()));
    return sortable;
  }, [transactions]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / TRADES_PER_PAGE);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * TRADES_PER_PAGE,
    currentPage * TRADES_PER_PAGE
  );

  const monthlyStats = useMemo(() => {
    const monthTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.date.toDate());
        return tradeDate.getFullYear() === currentDate.getFullYear() && tradeDate.getMonth() === currentDate.getMonth();
    });
    const total = monthTrades.length;
    const wins = monthTrades.filter(t => t.status === 'Win').length;
    const losses = total - wins;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const totalProfit = monthTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = monthTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0);
    const netPnl = totalProfit + totalLoss;
    return { total, wins, losses, winRate, totalProfit, totalLoss, netPnl };
  }, [trades, currentDate]);


  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Jurnal Trading v11.0</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Versi Final dengan Ekuitas Dinamis.</p>
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
                    <DashboardCard title="Total P&L (Hanya Trade)" value={formatCurrency(dashboardStats.totalPnl)} valueColor={dashboardStats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'} icon={<DollarSignIcon className="w-6 h-6 text-green-500" />} />
                    <DashboardCard title="Total Deposit" value={formatCurrency(dashboardStats.totalDeposits)} valueColor="text-gray-800 dark:text-white" icon={<ScaleIcon className="w-6 h-6 text-yellow-500" />} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-2">Kurva Pertumbuhan Ekuitas</h3>
                    <div className="h-48">
                        {loading ? <p className="text-center">Memuat data grafik...</p> : <EquityCurveChart transactions={transactions.sort((a,b) => new Date(a.date.toDate()) - new Date(b.date.toDate()))} />}
                    </div>
                </div>
            </div>

            {/* Calendar & Monthly Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                    <TradingCalendar transactions={transactions} currentDate={currentDate} setCurrentDate={setCurrentDate} onDayClick={handleDayClick} dailyJournals={dailyJournals} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Statistik Bulanan</h2>
                    <div className="w-40 h-40 mx-auto mb-4">
                        <DonutChart data={[
                            { label: 'Profit', value: monthlyStats.totalProfit, color: '#48bb78' },
                            { label: 'Loss', value: Math.abs(monthlyStats.totalLoss), color: '#f56565' }
                        ]}/>
                    </div>
                    <div className="space-y-3 text-sm">
                        <p className="flex justify-between"><span>Profit:</span> <span className="font-semibold text-green-500">{formatCurrency(monthlyStats.totalProfit)}</span></p>
                        <p className="flex justify-between"><span>Loss:</span> <span className="font-semibold text-red-500">{formatCurrency(monthlyStats.totalLoss)}</span></p>
                        <p className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2"><span>P&L Bersih:</span> <span className={monthlyStats.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(monthlyStats.netPnl)}</span></p>
                    </div>
                    <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                    <div className="space-y-3 text-sm">
                        <p className="flex justify-between"><span>Total Trade:</span> <span className="font-semibold">{monthlyStats.total}</span></p>
                        <p className="flex justify-between"><span>Trade Profit:</span> <span className="font-semibold">{monthlyStats.wins}</span></p>
                        <p className="flex justify-between"><span>Trade Loss:</span> <span className="font-semibold">{monthlyStats.losses}</span></p>
                        <p className="flex justify-between"><span>Win Rate:</span> <span className="font-semibold">{monthlyStats.winRate.toFixed(1)}%</span></p>
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
                        <h2 className="text-xl font-bold">Tambah Transaksi Baru</h2>
                        <button onClick={() => setIsFormVisible(!isFormVisible)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                            {isFormVisible ? <MinusCircleIcon className="w-6 h-6"/> : <PlusCircleIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                    {isFormVisible && <div className="border-t border-gray-200 dark:border-gray-700"><AddTransactionForm onAddTransaction={addTransaction} /></div>}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Riwayat Transaksi ({filteredAndSortedTransactions.length})</h2>
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
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => requestSort('pnl')}>Jumlah ⇅</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Aksi</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? ( <tr><td colSpan="6" className="text-center p-8 text-gray-500">Memuat data trading...</td></tr> ) : paginatedTransactions.length > 0 ? (
                            paginatedTransactions.map(tx => (
                            <tr key={tx.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setViewingTrade(tx)}>
                                <td className="p-3 text-center">
                                    { (tx.notes || (tx.tags && tx.tags.length > 0) || tx.rating > 0 || tx.imageUrl) && <NoteIcon className="w-5 h-5 text-blue-500 mx-auto"/> }
                                </td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{tx.date.toDate().toLocaleDateString('id-ID')}</td>
                                <td className={`p-3 font-semibold ${tx.type === 'Buy' ? 'text-green-500' : tx.type === 'Sell' ? 'text-red-500' : tx.type === 'Deposit' ? 'text-blue-500' : 'text-orange-500'}`}>{tx.type}</td>
                                <td className={`p-3 font-semibold ${tx.status === 'Win' ? 'text-green-500' : tx.status === 'Loss' ? 'text-red-500' : ''}`}>{tx.status || '-'}</td>
                                <td className={`p-3 font-semibold ${tx.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(tx.pnl)}</td>
                                <td className="p-3">
                                <button onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }} className="text-gray-500 hover:text-red-500 transition"><TrashIcon className="w-5 h-5" /></button>
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
        
        {viewingTrade && <TradeDetailModal trade={viewingTrade} onSave={saveTransactionDetails} onCancel={() => setViewingTrade(null)} />}
        
        {viewingDay && (
            <DailyJournalModal 
                date={viewingDay}
                trades={transactions.filter(tx => new Date(tx.date.toDate()).toDateString() === viewingDay.toDateString() && (tx.type === 'Buy' || tx.type === 'Sell'))}
                dailyJournal={dailyJournals[viewingDay.toISOString().split('T')[0]] || {}}
                onSave={saveDailyJournal}
                onCancel={() => setViewingDay(null)}
            />
        )}
      </div>
    </div>
  );
}
