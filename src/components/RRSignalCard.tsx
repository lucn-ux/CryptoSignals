import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus,
  Target, Shield, BarChart3, Gauge, Percent
} from 'lucide-react';
import type { TradingSignal, SignalType } from '../utils/signalEngine';

interface RRSignalCardProps {
  signal: TradingSignal;
}

function getSignalColor(type: SignalType) {
  switch (type) {
    case 'BUY': return 'text-green-400';
    case 'SELL': return 'text-red-400';
    default: return 'text-yellow-400';
  }
}

function getSignalBg(type: SignalType) {
  switch (type) {
    case 'BUY': return 'bg-green-500/10 border-green-500/30';
    case 'SELL': return 'bg-red-500/10 border-red-500/30';
    default: return 'bg-yellow-500/10 border-yellow-500/30';
  }
}

function getSignalIcon(type: SignalType) {
  switch (type) {
    case 'BUY': return <TrendingUp className="w-6 h-6" />;
    case 'SELL': return <TrendingDown className="w-6 h-6" />;
    default: return <Minus className="w-6 h-6" />;
  }
}

function getRRBadgeColor(multiple: number) {
  switch (multiple) {
    case 2: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 3: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 4: return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function getRRLabel(multiple: number) {
  switch (multiple) {
    case 2: return 'Conservative';
    case 3: return 'Balanced';
    case 4: return 'Aggressive';
    default: return 'Standard';
  }
}

export default function RRSignalCard({ signal }: RRSignalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl p-6 border ${getSignalBg(signal.type)} signal-card`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {signal.timeframe === 'intraday' ? '⚡ Intraday' : '📈 Swing'}
        </span>
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getRRBadgeColor(signal.rrMultiple)}`}>
          R:R {signal.riskRewardRatio} • {getRRLabel(signal.rrMultiple)}
        </span>
      </div>
      
      {/* Signal Direction */}
      <div className="flex items-center gap-3 mb-5">
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
            {signal.pair === 'BTCUSD' ? 'Bitcoin' : 'Ethereum'}
          </p>
        </div>
      </div>

      {/* Confidence & Probability */}
      <div className="space-y-3 mb-5">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3" /> Confidence
            </span>
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
        
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Percent className="w-3 h-3" /> Win Probability
            </span>
            <span className={`font-medium ${
              signal.probability > 60 ? 'text-green-400' :
              signal.probability > 45 ? 'text-yellow-400' :
              'text-red-400'
            }`}>{signal.probability}%</span>
          </div>
          <div className="h-2 bg-[#1a2332] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${signal.probability}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              className={`h-full rounded-full ${
                signal.probability > 60 ? 'bg-green-500' :
                signal.probability > 45 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Trade Levels */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400">
            <Target className="w-4 h-4" />
            <span className="text-sm">Entry</span>
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
          <div className="text-right">
            <span className="font-medium text-green-400">
              ${signal.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-green-400/70 ml-2">+{signal.potentialProfit.toFixed(2)}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-sm">Stop Loss</span>
          </div>
          <div className="text-right">
            <span className="font-medium text-red-400">
              ${signal.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-red-400/70 ml-2">-{signal.potentialLoss.toFixed(2)}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-gray-400">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Risk/Reward</span>
          </div>
          <span className="font-bold text-lg text-blue-400">{signal.riskRewardRatio}</span>
        </div>
      </div>

      {/* Strength Badge */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Signal Strength</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            signal.strength === 'Strong' ? 'bg-green-500/20 text-green-400' :
            signal.strength === 'Moderate' ? 'bg-blue-500/20 text-blue-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {signal.strength}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
