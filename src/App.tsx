import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Clock,
  Target, Shield, BarChart3, Activity, Zap, AlertTriangle,
  ArrowUpRight, ArrowDownRight, WifiOff
} from 'lucide-react';
import {
  fetchAndGenerateSignal,
  type TradingSignal, type Pair, type TimeFrame, type SignalType
} from './utils/signalEngine';
import { fetchTicker, type TickerData } from './utils/cryptoApi';
import PriceChart from './components/PriceChart';
import IndicatorPanel from './components/IndicatorPanel';
import SignalHistory from './components/SignalHistory';

function App() {
  const [activePair, setActivePair] = useState<Pair>('BTCUSD');
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>('intraday');
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [signalHistory, setSignalHistory] = useState<TradingSignal[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [apiError, setApiError] = useState<string | null>(null);

  const updateTicker = useCallback(async () => {
    const data = await fetchTicker(activePair);
    if (data) {
      setTickerData(data);
      setApiError(null);
    } else {
      setApiError('Unable to fetch live market data. Check your connection.');
    }
  }, [activePair]);

  const generateNewSignal = useCallback(async () => {
    setIsGenerating(true);
    setApiError(null);
    
    try {
      const newSignal = await fetchAndGenerateSignal(activePair, activeTimeframe);
      setSignal(newSignal);
      setSignalHistory(prev => [newSignal, ...prev].slice(0, 20));
      setLastUpdate(new Date());
      await updateTicker();
    } catch (error) {
      setApiError('Failed to generate signal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [activePair, activeTimeframe, updateTicker]);

  // Initial load and when pair/timeframe changes
  useEffect(() => {
    generateNewSignal();
  }, [activePair, activeTimeframe]);

  // Auto-refresh ticker every 10 seconds
  useEffect(() => {
    const interval = setInterval(updateTicker, 10000);
    return () => clearInterval(interval);
  }, [updateTicker]);

  const getSignalColor = (type: SignalType) => {
    switch (type) {
      case 'BUY': return 'text-green-400';
      case 'SELL': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSignalBg = (type: SignalType) => {
    switch (type) {
      case 'BUY': return 'bg-green-500/10 border-green-500/30';
      case 'SELL': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const getSignalIcon = (type: SignalType) => {
    switch (type) {
      case 'BUY': return <TrendingUp className="w-6 h-6" />;
      case 'SELL': return <TrendingDown className="w-6 h-6" />;
      default: return <Minus className="w-6 h-6" />;
    }
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#111827]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CryptoSignal Pro
              </h1>
              <p className="text-xs text-gray-500">Real-Time Trading Signals • Binance Data</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
              <div className={`w-2 h-2 rounded-full ${apiError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
              <Clock className="w-4 h-4" />
              <span>{lastUpdate.toLocaleTimeString()}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateNewSignal}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Signal</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* API Error Banner */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{apiError}</span>
          </motion.div>
        )}

        {/* Pair & Timeframe Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {(['BTCUSD', 'ETHUSD'] as Pair[]).map((pair) => (
              <button
                key={pair}
                onClick={() => setActivePair(pair)}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activePair === pair
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-[#1a2332] text-gray-400 hover:bg-[#243044] hover:text-gray-200'
                }`}
              >
                {pair === 'BTCUSD' ? '₿ BTC/USD' : 'Ξ ETH/USD'}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {(['intraday', 'swing'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTimeframe === tf
                    ? 'bg-[#243044] text-white border border-blue-500/50'
                    : 'bg-[#1a2332] text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {tf === 'intraday' ? '⚡ Intraday' : '📈 Swing'}
              </button>
            ))}
          </div>
        </div>

        {/* Price Display - Real Market Data */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111827] rounded-xl p-6 mb-6 border border-gray-800"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl font-bold">
                  {activePair === 'BTCUSD' ? '₿ Bitcoin' : 'Ξ Ethereum'}
                </span>
                <span className="text-xs text-gray-500 bg-[#1a2332] px-2 py-0.5 rounded flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  LIVE • Binance
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white">
                  {tickerData 
                    ? `$${tickerData.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'Loading...'
                  }
                </span>
                {tickerData && (
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    tickerData.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tickerData.priceChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {tickerData.priceChange >= 0 ? '+' : ''}{tickerData.priceChange.toFixed(2)} ({tickerData.priceChangePercent.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">24h High</p>
                <p className="text-sm font-medium text-green-400">
                  {tickerData 
                    ? `$${tickerData.highPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : '---'
                  }
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">24h Low</p>
                <p className="text-sm font-medium text-red-400">
                  {tickerData 
                    ? `$${tickerData.lowPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : '---'
                  }
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">24h Volume</p>
                <p className="text-sm font-medium text-gray-300">
                  {tickerData ? formatVolume(tickerData.quoteVolume) : '---'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Signal Display */}
        <AnimatePresence mode="wait">
          {signal && !isGenerating && signal.entryPrice > 0 && (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
            >
              {/* Main Signal Card */}
              <div className={`lg:col-span-1 rounded-xl p-6 border ${getSignalBg(signal.type)} signal-card`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {signal.timeframe === 'intraday' ? '⚡ Intraday Signal' : '📈 Swing Signal'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    signal.strength === 'Strong' ? 'bg-green-500/20 text-green-400' :
                    signal.strength === 'Moderate' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {signal.strength}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    signal.type === 'BUY' ? 'bg-green-500/20 pulse-green' :
                    signal.type === 'SELL' ? 'bg-red-500/20 pulse-red' :
                    'bg-yellow-500/20'
                  }`}>
                    <span className={getSignalColor(signal.type)}>
                      {getSignalIcon(signal.type)}
                    </span>
                  </div>
                  <div>
                    <h2 className={`text-3xl font-bold ${getSignalColor(signal.type)}`}>
                      {signal.type}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Confidence: {signal.confidence}%
                    </p>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Confidence Level</span>
                    <span>{signal.confidence}%</span>
                  </div>
                  <div className="h-2 bg-[#1a2332] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${signal.confidence}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className={`h-full rounded-full ${
                        signal.confidence > 75 ? 'bg-green-500' :
                        signal.confidence > 50 ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Trade Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">Entry Price</span>
                    </div>
                    <span className="font-medium text-white">
                      ${signal.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Target</span>
                    </div>
                    <span className="font-medium text-green-400">
                      ${signal.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-sm">Stop Loss</span>
                    </div>
                    <span className="font-medium text-red-400">
                      ${signal.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">Risk/Reward</span>
                    </div>
                    <span className="font-medium text-blue-400">{signal.riskRewardRatio}</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="lg:col-span-2 bg-[#111827] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">
                    Real Price Chart - {activeTimeframe === 'intraday' ? '24H (30m candles)' : '30D (Daily candles)'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
                <PriceChart pair={activePair} timeframe={activeTimeframe} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-center">
              <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Fetching real market data from Binance...</p>
              <p className="text-xs text-gray-600 mt-1">Analyzing technical indicators</p>
            </div>
          </motion.div>
        )}

        {/* Signal Reasoning */}
        {signal && !isGenerating && signal.entryPrice > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111827] rounded-xl p-6 mb-6 border border-gray-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-medium text-gray-300">Signal Analysis</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{signal.reasoning}</p>
          </motion.div>
        )}

        {/* Technical Indicators */}
        {signal && !isGenerating && signal.indicators.length > 0 && (
          <IndicatorPanel indicators={signal.indicators} />
        )}

        {/* Signal History */}
        {signalHistory.length > 0 && (
          <SignalHistory signals={signalHistory} />
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              <strong>Disclaimer:</strong> These signals are generated using technical analysis on real-time market data from Binance. 
              They are for educational and informational purposes only. Cryptocurrency trading involves significant risk of loss. 
              Past performance does not guarantee future results. Always do your own research and never invest more than you can afford to lose. 
              This is not financial advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
