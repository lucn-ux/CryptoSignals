import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Clock,
  Activity, Zap, AlertTriangle,
  ArrowUpRight, ArrowDownRight, WifiOff, Layers
} from 'lucide-react';
import {
  fetchAndGenerateSignals,
  type TradingSignal, type Pair, type TimeFrame, type SignalType
} from './utils/signalEngine';
import { fetchTicker, type TickerData } from './utils/cryptoApi';
import PriceChart from './components/PriceChart';
import IndicatorPanel from './components/IndicatorPanel';
import SignalHistory from './components/SignalHistory';
import RRSignalCard from './components/RRSignalCard';

function App() {
  const [activePair, setActivePair] = useState<Pair>('BTCUSD');
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>('intraday');
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [selectedRR, setSelectedRR] = useState<number>(3); // Default to 1:3
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

  const generateNewSignals = useCallback(async () => {
    setIsGenerating(true);
    setApiError(null);
    
    try {
      const newSignals = await fetchAndGenerateSignals(activePair, activeTimeframe);
      setSignals(newSignals);
      
      // Add the currently selected signal to history
      const selected = newSignals.find(s => s.rrMultiple === selectedRR) || newSignals[0];
      if (selected && selected.entryPrice > 0) {
        setSignalHistory(prev => [selected, ...prev].slice(0, 20));
      }
      
      setLastUpdate(new Date());
      await updateTicker();
    } catch (error) {
      setApiError('Failed to generate signals. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [activePair, activeTimeframe, selectedRR, updateTicker]);

  // Initial load and when pair/timeframe changes
  useEffect(() => {
    generateNewSignals();
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

  const selectedSignal = signals.find(s => s.rrMultiple === selectedRR) || signals[0];
  const isHoldSignal = selectedSignal?.type === 'HOLD';

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
              <p className="text-xs text-gray-500">Real-Time Signals • Multiple R:R Ratios</p>
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
              onClick={generateNewSignals}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
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
                  {tickerData ? `$${tickerData.highPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '---'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">24h Low</p>
                <p className="text-sm font-medium text-red-400">
                  {tickerData ? `$${tickerData.lowPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '---'}
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

        {/* R:R Ratio Selector */}
        {!isGenerating && signals.length > 0 && !isHoldSignal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-300">Select Risk:Reward Ratio</h3>
              <span className="text-xs text-gray-500 ml-auto">Higher R:R = Greater potential reward, lower probability</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {signals.filter(s => s.rrMultiple > 0).map((signal) => (
                <button
                  key={signal.id}
                  onClick={() => setSelectedRR(signal.rrMultiple)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    selectedRR === signal.rrMultiple
                      ? signal.type === 'BUY'
                        ? 'bg-green-500/10 border-green-500/50 ring-1 ring-green-500/30'
                        : 'bg-red-500/10 border-red-500/50 ring-1 ring-red-500/30'
                      : 'bg-[#111827] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white">R:R {signal.riskRewardRatio}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      signal.rrMultiple === 2 ? 'bg-blue-500/20 text-blue-400' :
                      signal.rrMultiple === 3 ? 'bg-purple-500/20 text-purple-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {signal.rrMultiple === 2 ? 'Conservative' : signal.rrMultiple === 3 ? 'Balanced' : 'Aggressive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Win Probability</span>
                    <span className={`font-medium ${
                      signal.probability > 60 ? 'text-green-400' :
                      signal.probability > 45 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>{signal.probability}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-400">Potential Reward</span>
                    <span className="text-green-400 font-medium">+{signal.potentialProfit.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-400">Max Risk</span>
                    <span className="text-red-400 font-medium">-{signal.potentialLoss.toFixed(2)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Signal Display */}
        <AnimatePresence mode="wait">
          {selectedSignal && !isGenerating && selectedSignal.entryPrice > 0 && !isHoldSignal && (
            <motion.div
              key={`${selectedSignal.id}-${selectedRR}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
            >
              {/* Main Signal Card */}
              <RRSignalCard signal={selectedSignal} />

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
                
                {/* Price Levels Overlay */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Stop Loss</p>
                      <p className="text-sm font-bold text-red-400">
                        ${selectedSignal.stopLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-red-400/70">-{selectedSignal.potentialLoss.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Entry Price</p>
                      <p className="text-sm font-bold text-white">
                        ${selectedSignal.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-400">Current</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Take Profit</p>
                      <p className="text-sm font-bold text-green-400">
                        ${selectedSignal.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-green-400/70">+{selectedSignal.potentialProfit.toFixed(2)}%</p>
                    </div>
                  </div>
                  
                  {/* Visual R:R Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Stop Loss</span>
                      <span className="font-medium text-white">R:R {selectedSignal.riskRewardRatio}</span>
                      <span>Take Profit</span>
                    </div>
                    <div className="h-3 bg-[#1a2332] rounded-full overflow-hidden flex relative">
                      <div 
                        className="h-full bg-red-500/60"
                        style={{ width: `${(1 / (1 + selectedSignal.rrMultiple)) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-green-500/60"
                        style={{ width: `${(selectedSignal.rrMultiple / (1 + selectedSignal.rrMultiple)) * 100}%` }}
                      />
                      <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/50" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HOLD Signal State */}
        {isHoldSignal && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111827] rounded-xl p-8 mb-6 border border-yellow-500/30 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Minus className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">HOLD - No Clear Signal</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Market conditions are neutral. Technical indicators show mixed signals. 
              Wait for a clearer directional bias before entering positions.
            </p>
          </motion.div>
        )}

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
              <p className="text-xs text-gray-600 mt-1">Generating signals for 1:2, 1:3, and 1:4 R:R ratios</p>
            </div>
          </motion.div>
        )}

        {/* Signal Reasoning */}
        {selectedSignal && !isGenerating && selectedSignal.entryPrice > 0 && !isHoldSignal && (
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
            <p className="text-sm text-gray-400 leading-relaxed">{selectedSignal.reasoning}</p>
          </motion.div>
        )}

        {/* Technical Indicators */}
        {selectedSignal && !isGenerating && selectedSignal.indicators.length > 0 && (
          <IndicatorPanel indicators={selectedSignal.indicators} />
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
              Multiple R:R ratios are provided to suit different risk appetites. Higher R:R ratios offer greater potential reward but lower win probability. 
              Cryptocurrency trading involves significant risk of loss. Always do your own research and never invest more than you can afford to lose. 
              This is not financial advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
