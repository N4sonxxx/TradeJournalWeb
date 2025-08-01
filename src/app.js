import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Functions & Icons ---

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// SVG Icons
const DollarSignIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const TrendingUpIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const TrendingDownIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>;
const PercentIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const EditIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SunIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const DownloadIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;

// --- Components ---

const DashboardCard = ({ title, value, icon, valueColor }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center transition-colors duration-300">
    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  </div>
);

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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 transition-colors duration-300">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Tambah Trade Baru</h2>
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

const EditTradeModal = ({ trade, onSave, onCancel }) => {
    const [type, setType] = useState(trade.type);
    const [pnl, setPnl] = useState(trade.pnl);

    const handleSave = () => {
        const pnlValue = parseFloat(pnl);
        if (!pnl || isNaN(pnlValue) || pnlValue === 0) {
            alert('P&L harus berupa angka dan tidak boleh nol.');
            return;
        }
        onSave({ ...trade, type, pnl: pnlValue });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Edit Trade</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="edit-type" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tipe</label>
                        <select id="edit-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option>Buy</option>
                            <option>Sell</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-pnl" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Profit / Loss ($)</label>
                        <input id="edit-pnl" type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-md transition">Batal</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition">Simpan</button>
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

    return (
        <div className="flex justify-center items-center space-x-2 mt-4">
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

// --- Main App Component ---

export default function App() {
  const [trades, setTrades] = useState(() => {
    try {
      const savedTrades = localStorage.getItem('tradesV2');
      return savedTrades ? JSON.parse(savedTrades) : [
        { id: 1, date: '2025-08-01T10:00:00Z', type: 'Buy', pnl: 150, status: 'Win' },
        { id: 2, date: '2025-08-01T11:30:00Z', type: 'Sell', pnl: 50, status: 'Win' },
        { id: 3, date: '2025-08-02T14:00:00Z', type: 'Buy', pnl: -20, status: 'Loss' },
        { id: 4, date: '2025-08-03T09:00:00Z', type: 'Buy', pnl: 200, status: 'Win' },
        { id: 5, date: '2025-08-04T16:45:00Z', type: 'Sell', pnl: -75, status: 'Loss' },
        { id: 6, date: '2025-08-05T11:00:00Z', type: 'Buy', pnl: 120, status: 'Win' },
        { id: 7, date: '2025-08-05T15:20:00Z', type: 'Buy', pnl: -45, status: 'Loss' },
        { id: 8, date: '2025-08-06T10:15:00Z', type: 'Sell', pnl: 300, status: 'Win' },
        { id: 9, date: '2025-08-07T13:00:00Z', type: 'Sell', pnl: -100, status: 'Loss' },
        { id: 10, date: '2025-08-08T17:00:00Z', type: 'Buy', pnl: 25, status: 'Win' },
      ];
    } catch (error) {
      return [];
    }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('themeV2') || 'dark');
  const [editingTrade, setEditingTrade] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const TRADES_PER_PAGE = 5;

  useEffect(() => {
    localStorage.setItem('tradesV2', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('themeV2', theme);
  }, [theme]);

  const addTrade = (trade) => {
    const newTrade = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...trade,
      status: trade.pnl > 0 ? 'Win' : 'Loss',
    };
    setTrades(prevTrades => [newTrade, ...prevTrades]);
  };

  const deleteTrade = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus trade ini?')) {
        setTrades(prevTrades => prevTrades.filter(trade => trade.id !== id));
    }
  };
  
  const saveEditedTrade = (updatedTrade) => {
    const newStatus = updatedTrade.pnl > 0 ? 'Win' : 'Loss';
    setTrades(trades.map(t => t.id === updatedTrade.id ? {...updatedTrade, status: newStatus} : t));
    setEditingTrade(null);
  };

  const dashboardStats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter(trade => trade.status === 'Win').length;
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    return {
      totalTrades,
      wins,
      losses: totalTrades - wins,
      winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
      totalPnl,
    };
  }, [trades]);

  const filteredAndSortedTrades = useMemo(() => {
    let sortableTrades = [...trades];
    if (filterStatus !== 'all') {
        sortableTrades = sortableTrades.filter(trade => trade.status.toLowerCase() === filterStatus);
    }
    sortableTrades.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });
    return sortableTrades;
  }, [trades, filterStatus, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = 'Trade No.,Tanggal,Tipe,Status,P&L ($)\n';
    const rows = trades.map((trade, index) => 
        `${trades.length - index},${new Date(trade.date).toLocaleString('id-ID')},${trade.type},${trade.status},${trade.pnl}`
    ).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "jurnal_trading.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedTrades.length / TRADES_PER_PAGE);
  const paginatedTrades = filteredAndSortedTrades.slice(
    (currentPage - 1) * TRADES_PER_PAGE,
    currentPage * TRADES_PER_PAGE
  );
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Jurnal Trading v2.0</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Analisis performa Anda dengan fitur lengkap.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={exportToCSV} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                <DownloadIcon className="w-6 h-6"/>
            </button>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
          </div>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard title="Total P&L" value={formatCurrency(dashboardStats.totalPnl)} valueColor={dashboardStats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'} icon={<DollarSignIcon className="w-6 h-6 text-blue-500" />} />
            <DashboardCard title="Win Rate" value={`${dashboardStats.winRate.toFixed(1)}%`} valueColor="text-gray-800 dark:text-white" icon={<PercentIcon className="w-6 h-6 text-purple-500" />} />
            <DashboardCard title="Total Wins" value={dashboardStats.wins} valueColor="text-green-500" icon={<TrendingUpIcon className="w-6 h-6 text-green-500" />} />
            <DashboardCard title="Total Losses" value={dashboardStats.losses} valueColor="text-red-500" icon={<TrendingDownIcon className="w-6 h-6 text-red-500" />} />
          </div>

          <AddTradeForm onAddTrade={addTrade} />

          {/* Trade Table Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Riwayat Trading</h2>
                <div className="flex items-center space-x-4">
                    <select onChange={(e) => setFilterStatus(e.target.value)} value={filterStatus} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option value="all">Semua Status</option>
                        <option value="win">Win</option>
                        <option value="loss">Loss</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => requestSort('date')}>Tanggal ⇅</th>
                    <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Tipe</th>
                    <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Status</th>
                    <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => requestSort('pnl')}>P&L ⇅</th>
                    <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrades.length > 0 ? (
                    paginatedTrades.map(trade => (
                      <tr key={trade.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="p-3 text-gray-600 dark:text-gray-300">{new Date(trade.date).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{trade.type}</td>
                        <td className={`p-3 font-semibold ${trade.status === 'Win' ? 'text-green-500' : 'text-red-500'}`}>{trade.status}</td>
                        <td className={`p-3 font-semibold ${trade.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(trade.pnl)}</td>
                        <td className="p-3 flex space-x-3">
                          <button onClick={() => setEditingTrade(trade)} className="text-gray-500 hover:text-blue-500 transition"><EditIcon className="w-5 h-5" /></button>
                          <button onClick={() => deleteTrade(trade.id)} className="text-gray-500 hover:text-red-500 transition"><TrashIcon className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center p-8 text-gray-500">Tidak ada data yang cocok.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
          </div>
        </main>
        
        {editingTrade && <EditTradeModal trade={editingTrade} onSave={saveEditedTrade} onCancel={() => setEditingTrade(null)} />}
      </div>
    </div>
  );
}
