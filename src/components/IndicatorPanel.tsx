import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { TechnicalIndicator, SignalType } from '../utils/signalEngine';

interface IndicatorPanelProps {
  indicators: TechnicalIndicator[];
}

function getSignalIcon(type: SignalType) {
  switch (type) {
    case 'BUY': return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'SELL': return <XCircle className="w-4 h-4 text-red-400" />;
    default: return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  }
}

function getSignalBadgeColor(type: SignalType) {
  switch (type) {
    case 'BUY': return 'bg-green-500/15 text-green-400 border-green-500/30';
    case 'SELL': return 'bg-red-500/15 text-red-400 border-red-500/30';
    default: return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  }
}

export default function IndicatorPanel({ indicators }: IndicatorPanelProps) {
  const buyCount = indicators.filter(i => i.signal === 'BUY').length;
  const sellCount = indicators.filter(i => i.signal === 'SELL').length;
  const holdCount = indicators.filter(i => i.signal === 'HOLD').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#111827] rounded-xl p-6 mb-6 border border-gray-800"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Technical Indicators
        </h3>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            Buy: {buyCount}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            Sell: {sellCount}
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            Hold: {holdCount}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {indicators.map((indicator, index) => (
          <motion.div
            key={indicator.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-[#1a2332] rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">{indicator.name}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSignalBadgeColor(indicator.signal)}`}>
                {indicator.signal}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {getSignalIcon(indicator.signal)}
              <span className="text-sm text-gray-400">{indicator.value}</span>
            </div>
            <p className="text-xs text-gray-500">{indicator.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Summary Bar */}
      <div className="mt-5 pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">Overall Market Sentiment</span>
        </div>
        <div className="h-3 bg-[#1a2332] rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(buyCount / indicators.length) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-full bg-green-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(holdCount / indicators.length) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="h-full bg-yellow-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(sellCount / indicators.length) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="h-full bg-red-500"
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Bullish</span>
          <span>Neutral</span>
          <span>Bearish</span>
        </div>
      </div>
    </motion.div>
  );
}
