import React, { useState, useEffect, useMemo } from 'react';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// --- SVG Icons ---
const DollarSignIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const TrendingUpIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const TrendingDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

const PercentIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="19" y1="5" x2="5" y2="19"></line>
    <circle cx="6.5" cy="6.5" r="2.5"></circle>
    <circle cx="17.5" cy="17.5" r="2.5"></circle>
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// --- Chart Components ---
const PieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Belum ada data untuk ditampilkan
      </div>
    );
  }

  let cumulative = 0;
  const paths = data.map(item => {
    const percentage = item.value / total;
    const startAngle = (cumulative / total) * 360;
    cumulative += item.value;
    const endAngle = (cumulative / total) * 360;

    const largeArcFlag = percentage > 0.5 ? 1 : 0;
    const x1 = 50 + 40 * Math.cos(Math.PI * startAngle / 180);
    const y1 = 50 + 40 * Math.sin(Math.PI * startAngle / 180);
    const x2 = 50 + 40 * Math.cos(Math.PI * endAngle / 180);
    const y2 = 50 + 40 * Math.sin(Math.PI * endAngle / 180);

    return (
      <path
        key={item.label}
        d={`M 50,50 L ${x1},${y1} A 40,40 0 ${largeArcFlag},1 ${x2},${y2} Z`}
        fill={item.color}
      />
    );
  });

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 100 100" className="w-full h-full">{paths}</svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-800 rounded-full"></div>
      </div>
    </div>
  );
};

const EquityCurveChart = ({ trades }) => {
  if (trades.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Butuh minimal 2 trade untuk menampilkan grafik
      </div>
    );
  }

  const cumulativePnl = trades.reduce((acc, trade) => {
    const lastPnl = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(lastPnl + trade.pnl);
    return acc;
  }, []);
  
  const pnlValues = [0, ...cumulativePnl];
  const maxPnl = Math.max(...pnlValues, 0);
  const minPnl = Math.min(...pnlValues, 0);
  const range = maxPnl - minPnl;

  const points = pnlValues.map((pnl, index) => {
    const x = (index / (pnlValues.length - 1)) * 100;
    const y = 100 - ((pnl - minPnl) / (range || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <line x1="0" y1="100" x2="100" y2="100" stroke="#4a5568" strokeWidth="0.5" />
      <line x1="0" y1="0" x2="0" y2="100" stroke="#4a5568" strokeWidth="0.5" />
      <polyline
        fill="none"
        stroke="#4299e1"
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
};


// --- Main App Components ---
const DashboardCard = ({ title, value, icon, valueColor }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
    <div className="p-3 bg-gray-700 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
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
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4 text-white">Tambah Trade Baru</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-400 mb-1">Tipe</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option>Buy</option>
            <option>Sell</option>
          </select>
        </div>
        <div>
          <label htmlFor="pnl" className="block text-sm font-medium text-gray-400 mb-1">Profit / Loss ($)</label>
          <input
            id="pnl"
            type="number"
            step="any"
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            placeholder="Contoh: 150 atau -75"
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          Simpan Trade
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

const TradeTable = ({ trades, onDeleteTrade }) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
    <h2 className="text-xl font-bold mb-4 text-white">Riwayat Trading</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-3 text-sm font-semibold text-gray-400">No.</th>
            <th className="p-3 text-sm font-semibold text-gray-400">Tipe</th>
            <th className="p-3 text-sm font-semibold text-gray-400">Status</th>
            <th className="p-3 text-sm font-semibold text-gray-400">P&L</th>
            <th className="p-3 text-sm font-semibold text-gray-400">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {trades.length > 0 ? (
            trades.map((trade, index) => (
              <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="p-3 text-gray-300">{trades.length - index}</td>
                <td className="p-3 text-gray-300">{trade.type}</td>
                <td className={`p-3 font-semibold ${trade.status === 'Win' ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.status}
                </td>
                <td className={`p-3 font-semibold ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(trade.pnl)}
                </td>
                <td className="p-3">
                  <button onClick={() => onDeleteTrade(trade.id)} className="text-gray-500 hover:text-red-500 transition">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center p-8 text-gray-500">
                Belum ada data trading. Silakan tambahkan trade baru.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);


export default function App() {
  const [trades, setTrades] = useState(() => {
    try {
      const savedTrades = localStorage.getItem('trades');
      return savedTrades ? JSON.parse(savedTrades) : [
        { id: 1669852800001, type: 'Buy', status: 'Win', pnl: 150 },
        { id: 1669852800002, type: 'Sell', status: 'Win', pnl: 50 },
        { id: 1669852800003, type: 'Buy', status: 'Loss', pnl: -20 },
        { id: 1669852800004, type: 'Buy', status: 'Win', pnl: 200 },
        { id: 1669852800005, type: 'Sell', status: 'Loss', pnl: -75 },
      ];
    } catch (error) {
      console.error("Error loading trades from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('trades', JSON.stringify(trades));
    } catch (error) {
      console.error("Error saving trades to localStorage", error);
    }
  }, [trades]);

  const addTrade = (trade) => {
    const newTrade = {
      id: Date.now(),
      ...trade,
      status: trade.pnl > 0 ? 'Win' : 'Loss',
    };
    setTrades(prevTrades => [newTrade, ...prevTrades]);
  };

  const deleteTrade = (id) => {
    setTrades(prevTrades => prevTrades.filter(trade => trade.id !== id));
  };

  const dashboardStats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter(trade => trade.status === 'Win').length;
    const losses = totalTrades - wins;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    return { totalTrades, wins, losses, winRate, totalPnl };
  }, [trades]);

  const pieChartData = [
    { label: 'Win', value: dashboardStats.wins, color: '#48bb78' },
    { label: 'Loss', value: dashboardStats.losses, color: '#f56565' },
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white">Jurnal Trading Anda</h1>
          <p className="text-gray-400 mt-1">Analisis performa Anda untuk menjadi trader yang lebih baik.</p>
        </header>

        <main>
          {/* Dashboard Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="Total P&L"
              value={formatCurrency(dashboardStats.totalPnl)}
              valueColor={dashboardStats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
              icon={<DollarSignIcon className="w-6 h-6 text-blue-400" />}
            />
            <DashboardCard
              title="Win Rate"
              value={`${dashboardStats.winRate.toFixed(1)}%`}
              valueColor="text-white"
              icon={<PercentIcon className="w-6 h-6 text-purple-400" />}
            />
            <DashboardCard
              title="Total Wins"
              value={dashboardStats.wins}
              valueColor="text-green-400"
              icon={<TrendingUpIcon className="w-6 h-6 text-green-400" />}
            />
            <DashboardCard
              title="Total Losses"
              value={dashboardStats.losses}
              valueColor="text-red-400"
              icon={<TrendingDownIcon className="w-6 h-6 text-red-400" />}
            />
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Kurva Pertumbuhan (Equity Curve)</h3>
              <div className="h-64">
                <EquityCurveChart trades={[...trades].reverse()} />
              </div>
            </div>
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Perbandingan Win / Loss</h3>
              <div className="h-64 flex items-center justify-center">
                 <div className="w-full max-w-[250px] aspect-square">
                    <PieChart data={pieChartData} />
                 </div>
              </div>
            </div>
          </div>


          <AddTradeForm onAddTrade={addTrade} />

          <TradeTable trades={trades} onDeleteTrade={deleteTrade} />
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Dibuat untuk membantu perjalanan trading Anda.</p>
        </footer>
      </div>
    </div>
  );
}
