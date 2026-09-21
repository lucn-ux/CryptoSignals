import { motion } from 'framer-motion';
import { History, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import type { TradingSignal, SignalType } from '../utils/signalEngine';

interface SignalHistoryProps {
  signals: TradingSignal[];
}

function getSignalIcon(type: SignalType) {
  switch (type) {
    case 'BUY': return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
    case 'SELL': return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    default: return <Minus className="w-3.5 h-3.5 text-yellow-400" />;
  }
}

function getSignalColor(type: SignalType) {
  switch (type) {
    case 'BUY': return 'text-green-400';
    case 'SELL': return 'text-red-400';
    default: return 'text-yellow-400';
  }
}

function getSignalDotColor(type: SignalType) {
  switch (type) {
    case 'BUY': return 'bg-green-400';
    case 'SELL': return 'bg-red-400';
    default: return 'bg-yellow-400';
  }
}

export default function SignalHistory({ signals }: SignalHistoryProps) {
  if (signals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-[#111827] rounded-xl p-6 border border-gray-800"
    >
      <div className="flex items-center gap-2 mb-5">
        <History className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-200">Signal History</h3>
        <span className="text-xs text-gray-500 ml-auto">{signals.length} recent signals</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Signal</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Strength</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal, index) => (
              <motion.tr
                key={signal.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="border-b border-gray-800/50 hover:bg-[#1a2332]/50 transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {signal.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="text-xs font-medium text-gray-300">
                    {signal.pair === 'BTCUSD' ? '₿ BTC' : 'Ξ ETH'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-xs text-gray-500 capitalize">
                    {signal.timeframe}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-1.5">
                    {getSignalIcon(signal.type)}
                    <span className={`text-xs font-bold ${getSignalColor(signal.type)}`}>
                      {signal.type}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    signal.strength === 'Strong' ? 'bg-green-500/15 text-green-400' :
                    signal.strength === 'Moderate' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-yellow-500/15 text-yellow-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${getSignalDotColor(signal.type)}`} />
                    {signal.strength}
                  </span>
                </td>
                <td className="py-3 px-2 text-xs text-gray-300">
                  ${signal.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="py-3 px-2 text-xs text-green-400">
                  ${signal.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#1a2332] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          signal.confidence > 75 ? 'bg-green-500' :
                          signal.confidence > 50 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{signal.confidence}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
